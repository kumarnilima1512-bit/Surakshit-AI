<!--
  pages/welfare/high-risk-cases/index.vue
  URL: /welfare/high-risk-cases
  Nuxt 3 + Composition API + Tailwind, same visual language as the rest
  of the Welfare Officer section.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Home,
  Users,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  BarChart2,
  FileText,
  User,
  LogOut,
  Menu,
  Search,
  Bell as BellIcon,
  Moon,
  ChevronDown,
  Filter,
  RotateCw,
  ChevronRight,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/welfare/high-risk-cases                      -> HighRiskCasesData
   POST /api/welfare/high-risk-cases/:id/start-intervention -> { ok: true }
   ====================================================================== */

type RiskLevel = 'Elevated' | 'High'
type CaseStatus = 'New' | 'In Review' | 'Intervention Active' | 'Resolved'
type StatusFilter = 'All' | CaseStatus

interface OfficerHeader {
  name: string
  role: string
  avatarUrl: string | null
}

interface CaseSummary {
  label: string
  value: number
  icon: 'total' | 'new' | 'review' | 'active' | 'resolved'
}

interface HighRiskCase {
  id: string
  name: string
  unit: string
  riskLevel: RiskLevel
  score: number
  caseStatus: CaseStatus
  assignedTo: string
  flaggedDate: string
  lastAction: string
}

interface HighRiskCasesData {
  officer: OfficerHeader
  summary: CaseSummary[]
  cases: HighRiskCase[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchCases } =
  await useFetch<HighRiskCasesData>('/api/welfare/high-risk-cases')

/* ---------------- Sidebar / header (identical shell to the rest of the section) ---------------- */
const route = useRoute()
interface NavItem { label: string; to: string; icon: LucideIcon }
const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/welfare/dashboard', icon: Home },
  { label: 'Personnel', to: '/welfare/personnel', icon: Users },
  { label: 'High-Risk Cases', to: '/welfare/high-risk-cases', icon: AlertTriangle },
  { label: 'Interventions', to: '/welfare/interventions', icon: ShieldCheck },
  { label: 'Follow-ups', to: '/welfare/follow-ups', icon: ClipboardList },
  { label: 'Analytics', to: '/welfare/analytics', icon: BarChart2 },
  { label: 'Reports', to: '/welfare/reports', icon: FileText },
]
function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}
async function logout() {
  await useFetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}
const topSearchQuery = ref('')
function submitTopSearch() {
  const q = topSearchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/welfare/search', query: { q } })
}
const profileOpen = ref(false)
function toggleProfile() { profileOpen.value = !profileOpen.value }
async function handleProfileAction(action: 'Profile' | 'Settings' | 'Logout') {
  profileOpen.value = false
  if (action === 'Logout') return logout()
  await navigateTo(`/welfare/${action.toLowerCase()}`)
}
function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) profileOpen.value = false
}
onMounted(() => window.addEventListener('click', handleOutsideClick))
onUnmounted(() => window.removeEventListener('click', handleOutsideClick))

/* ---------------- Tone tokens ---------------- */
const riskTone: Record<RiskLevel, { text: string; badgeBg: string; dot: string }> = {
  Elevated: { text: 'text-amber-400', badgeBg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  High: { text: 'text-red-400', badgeBg: 'bg-red-500/15', dot: 'bg-red-400' },
}
const statusTone: Record<CaseStatus, string> = {
  'New': 'bg-blue-500/15 text-blue-400',
  'In Review': 'bg-amber-500/15 text-amber-400',
  'Intervention Active': 'bg-violet-500/15 text-violet-400',
  'Resolved': 'bg-emerald-500/15 text-emerald-400',
}
const summaryIconMap: Record<CaseSummary['icon'], LucideIcon> = {
  total: AlertTriangle,
  new: Users,
  review: ClipboardList,
  active: ShieldCheck,
  resolved: BarChart2,
}
const summaryIconBg: Record<CaseSummary['icon'], string> = {
  total: 'bg-red-500/15 text-red-400',
  new: 'bg-blue-500/15 text-blue-400',
  review: 'bg-amber-500/15 text-amber-400',
  active: 'bg-violet-500/15 text-violet-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
}

/* ---------------- Filters ---------------- */
const search = ref('')
const statusFilter = ref<StatusFilter>('All')
const statusOptions: StatusFilter[] = ['All', 'New', 'In Review', 'Intervention Active', 'Resolved']

const filteredCases = computed<HighRiskCase[]>(() => {
  const list = data.value?.cases ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((c) => {
    const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.unit.toLowerCase().includes(q)
    const matchesStatus = statusFilter.value === 'All' || c.caseStatus === statusFilter.value
    return matchesQuery && matchesStatus
  })
})

/* ---------------- Start intervention (real action) ---------------- */
const startingId = ref<string | null>(null)
async function startIntervention(id: string) {
  if (!data.value) return
  startingId.value = id
  try {
    await $fetch(`/api/welfare/high-risk-cases/${id}/start-intervention`, { method: 'POST' })
    const target = data.value.cases.find((c) => c.id === id)
    if (target) target.caseStatus = 'Intervention Active'
  } catch {
    // Leave status unchanged; the button re-enables so the officer can retry.
  } finally {
    startingId.value = null
  }
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
                <img v-if="data?.officer.avatarUrl" :src="data.officer.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">{{ data?.officer.name ?? '—' }}</p>
                <p class="text-[11px] text-slate-400">{{ data?.officer.role ?? '' }}</p>
              </div>
              <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="{ 'rotate-180': profileOpen }" />
            </button>
            <div v-if="profileOpen" class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl">
              <button v-for="action in (['Profile', 'Settings', 'Logout'] as const)" :key="action" type="button" @click="handleProfileAction(action)" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">{{ action }}</button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-4 p-6">
        <div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">High-Risk Cases</h1>
          <p class="mt-0.5 text-xs text-slate-400">Personnel flagged Elevated or High, tracked through to resolution</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading cases…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load high-risk cases</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/high-risk-cases</code></p>
          <button type="button" @click="fetchCases()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <!-- Summary cards -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div v-for="s in data.summary" :key="s.label" class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="summaryIconBg[s.icon]">
                <component :is="summaryIconMap[s.icon]" :size="16" :stroke-width="1.5" />
              </div>
              <p class="mt-3 text-xs font-medium text-slate-400">{{ s.label }}</p>
              <p class="mt-1 text-2xl font-extrabold text-white">{{ s.value }}</p>
            </div>
          </div>

          <!-- Table -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="relative">
                <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input v-model="search" type="text" placeholder="Search cases..." class="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <Filter :size="12" class="mr-1 text-slate-500" />
                <button
                  v-for="opt in statusOptions" :key="opt" type="button" @click="statusFilter = opt"
                  class="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                  :class="statusFilter === opt ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
                >{{ opt }}</button>
              </div>
            </div>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[820px] text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">ID</th>
                    <th class="pb-2 font-medium">Name</th>
                    <th class="pb-2 font-medium">Unit</th>
                    <th class="pb-2 font-medium">Score</th>
                    <th class="pb-2 font-medium">Risk</th>
                    <th class="pb-2 font-medium">Status</th>
                    <th class="pb-2 font-medium">Assigned To</th>
                    <th class="pb-2 font-medium">Flagged</th>
                    <th class="pb-2 font-medium">Last Action</th>
                    <th class="pb-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!filteredCases.length">
                    <td colspan="10" class="py-6 text-center text-slate-500">
                      {{ search || statusFilter !== 'All' ? 'No cases match your filters.' : 'No high-risk cases right now.' }}
                    </td>
                  </tr>
                  <tr v-for="c in filteredCases" :key="c.id" class="border-t border-white/5">
                    <td class="py-2.5 font-medium text-emerald-400">{{ c.id }}</td>
                    <td class="py-2.5 text-slate-200">{{ c.name }}</td>
                    <td class="py-2.5 text-slate-400">{{ c.unit }}</td>
                    <td class="py-2.5 font-semibold text-slate-200">{{ c.score }}</td>
                    <td class="py-2.5">
                      <span class="flex items-center gap-1.5 font-semibold" :class="riskTone[c.riskLevel].text">
                        <span class="h-1.5 w-1.5 rounded-full" :class="riskTone[c.riskLevel].dot"></span>{{ c.riskLevel }}
                      </span>
                    </td>
                    <td class="py-2.5">
                      <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="statusTone[c.caseStatus]">{{ c.caseStatus }}</span>
                    </td>
                    <td class="py-2.5 text-slate-400">{{ c.assignedTo }}</td>
                    <td class="py-2.5 text-slate-500">{{ c.flaggedDate }}</td>
                    <td class="py-2.5 text-slate-400">{{ c.lastAction }}</td>
                    <td class="py-2.5 text-right">
                      <div class="flex items-center justify-end gap-3">
                        <button
                          v-if="c.caseStatus === 'New' || c.caseStatus === 'In Review'"
                          type="button" :disabled="startingId === c.id" @click="startIntervention(c.id)"
                          class="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                        >{{ startingId === c.id ? 'Starting…' : 'Start Intervention' }}</button>
                        <NuxtLink :to="`/welfare/personnel/${c.id}`" class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline">
                          Profile <ChevronRight :size="12" />
                        </NuxtLink>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>