<!--
  pages/commander/personnel/index.vue
  URL: /commander/personnel  (sidebar label: "My Personnel")
  Nuxt 3 + Composition API + Tailwind, same visual language as the
  Commander dashboard (emerald accent).
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Home,
  Users,
  AlertTriangle,
  ClipboardList,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  Search,
  Bell as BellIcon,
  Moon,
  ChevronDown,
  Filter,
  ChevronRight,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/commander/personnel -> PersonnelPageData
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type RiskFilter = 'All' | RiskLevel

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface PersonnelListItem {
  id: string
  name: string
  rank: string
  subUnit: string
  riskLevel: RiskLevel
  score: number
  lastAssessment: string
  followUpStatus: 'None' | 'Scheduled' | 'Overdue'
}

interface PersonnelPageData {
  commander: CommanderHeader
  personnel: PersonnelListItem[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchPersonnel } =
  await useFetch<PersonnelPageData>('/api/commander/personnel')

/* ---------------- Sidebar / header shell (shared across the Commander section) ---------------- */
const route = useRoute()
interface NavItem { label: string; to: string; icon: LucideIcon }
const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/commander/dashboard', icon: Home },
  { label: 'My Personnel', to: '/commander/personnel', icon: Users },
  { label: 'Risk Alerts', to: '/commander/alerts', icon: AlertTriangle },
  { label: 'Follow-ups', to: '/commander/follow-ups', icon: ClipboardList },
  { label: 'Unit Reports', to: '/commander/reports', icon: FileText },
  { label: 'My Profile', to: '/commander/profile', icon: User },
  { label: 'Security', to: '/commander/security', icon: ShieldCheck },
]
function isActive(to: string) { return route.path === to || route.path.startsWith(`${to}/`) }
async function logout() { await useFetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/login') }
const topSearchQuery = ref('')
function submitTopSearch() {
  const q = topSearchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/commander/search', query: { q } })
}
const profileOpen = ref(false)
function toggleProfile() { profileOpen.value = !profileOpen.value }
async function handleProfileAction(action: 'Profile' | 'Security' | 'Logout') {
  profileOpen.value = false
  if (action === 'Logout') return logout()
  await navigateTo(`/commander/${action.toLowerCase()}`)
}
function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) profileOpen.value = false
}
onMounted(() => window.addEventListener('click', handleOutsideClick))
onUnmounted(() => window.removeEventListener('click', handleOutsideClick))

/* ---------------- Risk tone tokens ---------------- */
const riskTone: Record<RiskLevel, { text: string; dot: string }> = {
  Low: { text: 'text-emerald-400', dot: 'bg-emerald-400' },
  Moderate: { text: 'text-blue-400', dot: 'bg-blue-400' },
  Elevated: { text: 'text-amber-400', dot: 'bg-amber-400' },
  High: { text: 'text-red-400', dot: 'bg-red-400' },
}
const followUpToneClass: Record<PersonnelListItem['followUpStatus'], string> = {
  None: 'text-slate-500',
  Scheduled: 'text-blue-400',
  Overdue: 'text-red-400',
}

/* ---------------- Search + filter ---------------- */
const rosterSearch = ref('')
const riskFilter = ref<RiskFilter>('All')
const riskFilterOptions: RiskFilter[] = ['All', 'High', 'Elevated', 'Moderate', 'Low']

const initialRisk = route.query.risk
if (typeof initialRisk === 'string' && riskFilterOptions.includes(initialRisk as RiskFilter)) {
  riskFilter.value = initialRisk as RiskFilter
}

const filteredPersonnel = computed<PersonnelListItem[]>(() => {
  const list = data.value?.personnel ?? []
  const q = rosterSearch.value.trim().toLowerCase()
  return list.filter((p) => {
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.subUnit.toLowerCase().includes(q)
    const matchesRisk = riskFilter.value === 'All' || p.riskLevel === riskFilter.value
    return matchesQuery && matchesRisk
  })
})

function openPersonnel(id: string) {
  navigateTo(`/commander/personnel/${id}`)
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <aside class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <img
  src="/logos/surakshit-ai.png"
  alt="Surakshit AI"
  class="h-10 w-10 object-contain"
/>
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-white">Surakshit AI</p>
          <p class="text-[10px] leading-tight text-slate-400">Personnel Stress &amp; Welfare Monitoring</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <NuxtLink
          v-for="item in navItems" :key="item.label" :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="isActive(item.to) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <component :is="item.icon" :size="ICON_SIZE" :stroke-width="1.5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-white/5 px-3 py-3">
        <button type="button" @click="logout" class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200">
          <LogOut :size="14" :stroke-width="1.5" />
          Logout
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-1 flex-col">
      <header class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5">
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Toggle menu"><Menu :size="20" /></button>
        <form class="relative max-w-md flex-1" @submit.prevent="submitTopSearch">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input v-model="topSearchQuery" type="text" placeholder="Search personnel, unit, or ID..." class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
        </form>
        <div class="ml-auto flex items-center gap-4">
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Notifications"><BellIcon :size="20" :stroke-width="1.5" /></button>
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Toggle theme"><Moon :size="20" :stroke-width="1.5" /></button>
          <div class="relative border-l border-white/10 pl-4" data-dropdown-root>
            <button type="button" @click.stop="toggleProfile" class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                <img v-if="data?.commander.avatarUrl" :src="data.commander.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">{{ data?.commander.rank }} {{ data?.commander.name }}</p>
                <p class="text-[11px] text-slate-400">Commander</p>
              </div>
              <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="{ 'rotate-180': profileOpen }" />
            </button>
            <div v-if="profileOpen" class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl">
              <button v-for="action in (['Profile', 'Security', 'Logout'] as const)" :key="action" type="button" @click="handleProfileAction(action)" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">{{ action }}</button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-4 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-white">My Personnel</h1>
            <p class="mt-0.5 text-xs text-slate-400">Full roster for your unit</p>
          </div>
          <p class="text-xs text-slate-500">{{ filteredPersonnel.length }} of {{ data?.personnel.length ?? 0 }} shown</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading roster…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load the roster</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/commander/personnel</code></p>
          <button type="button" @click="fetchPersonnel()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <div v-else-if="data" class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="relative">
              <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input v-model="rosterSearch" type="text" placeholder="Search roster..." class="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
            </div>
            <div class="flex items-center gap-1.5">
              <Filter :size="12" class="mr-1 text-slate-500" />
              <button
                v-for="opt in riskFilterOptions" :key="opt" type="button" @click="riskFilter = opt"
                class="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                :class="riskFilter === opt ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
              >{{ opt }}</button>
            </div>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr class="text-slate-500">
                  <th class="pb-2 font-medium">ID</th>
                  <th class="pb-2 font-medium">Name</th>
                  <th class="pb-2 font-medium">Rank</th>
                  <th class="pb-2 font-medium">Sub-Unit</th>
                  <th class="pb-2 font-medium">Risk</th>
                  <th class="pb-2 font-medium">Score</th>
                  <th class="pb-2 font-medium">Last Assessment</th>
                  <th class="pb-2 font-medium">Follow-up</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredPersonnel.length">
                  <td colspan="9" class="py-6 text-center text-slate-500">
                    {{ rosterSearch || riskFilter !== 'All' ? 'No personnel match your filters.' : 'No personnel in this unit.' }}
                  </td>
                </tr>
                <tr
                  v-for="p in filteredPersonnel" :key="p.id"
                  class="cursor-pointer border-t border-white/5 hover:bg-white/5"
                  @click="openPersonnel(p.id)"
                >
                  <td class="py-2.5 font-medium text-emerald-400">{{ p.id }}</td>
                  <td class="py-2.5 text-slate-200">{{ p.name }}</td>
                  <td class="py-2.5 text-slate-400">{{ p.rank }}</td>
                  <td class="py-2.5 text-slate-400">{{ p.subUnit }}</td>
                  <td class="py-2.5">
                    <span class="flex items-center gap-1.5 font-semibold" :class="riskTone[p.riskLevel].text">
                      <span class="h-1.5 w-1.5 rounded-full" :class="riskTone[p.riskLevel].dot"></span>{{ p.riskLevel }}
                    </span>
                  </td>
                  <td class="py-2.5 font-semibold text-slate-200">{{ p.score }}</td>
                  <td class="py-2.5 text-slate-500">{{ p.lastAssessment }}</td>
                  <td class="py-2.5 font-medium" :class="followUpToneClass[p.followUpStatus]">{{ p.followUpStatus }}</td>
                  <td class="py-2.5 text-right">
                    <NuxtLink :to="`/commander/personnel/${p.id}`" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline" @click.stop>
                      View <ChevronRight :size="12" />
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>