<!--
  pages/commander/follow-ups/index.vue
  URL: /commander/follow-ups
  Nuxt 3 + Composition API + Tailwind, same visual language as the
  Commander dashboard.
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
  Plus,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/commander/follow-ups               -> FollowUpsData
   POST /api/commander/follow-ups                { personnelId, type, dueDate } -> FollowUp
   POST /api/commander/follow-ups/:id/complete   -> { ok: true }
   ====================================================================== */

type FollowUpStatus = 'Upcoming' | 'Overdue' | 'Completed'
type TabFilter = 'All' | FollowUpStatus

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface FollowUp {
  id: string
  personnelId: string
  personnelName: string
  subUnit: string
  type: string
  dueDate: string
  status: FollowUpStatus
}

interface FollowUpsData {
  commander: CommanderHeader
  followUps: FollowUp[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchFollowUps } =
  await useFetch<FollowUpsData>('/api/commander/follow-ups')

/* ---------------- Sidebar / header shell ---------------- */
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

/* ---------------- Tone tokens ---------------- */
const statusTone: Record<FollowUpStatus, string> = {
  'Upcoming': 'bg-blue-500/15 text-blue-400',
  'Overdue': 'bg-red-500/15 text-red-400',
  'Completed': 'bg-emerald-500/15 text-emerald-400',
}

/* ---------------- Tabs ---------------- */
const activeTab = ref<TabFilter>('All')
const tabs: TabFilter[] = ['All', 'Upcoming', 'Overdue', 'Completed']
const search = ref('')

const tabCounts = computed(() => {
  const list = data.value?.followUps ?? []
  return {
    All: list.length,
    Upcoming: list.filter((f) => f.status === 'Upcoming').length,
    Overdue: list.filter((f) => f.status === 'Overdue').length,
    Completed: list.filter((f) => f.status === 'Completed').length,
  }
})

const filteredFollowUps = computed<FollowUp[]>(() => {
  const list = data.value?.followUps ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((f) => {
    const matchesQuery = !q || f.personnelName.toLowerCase().includes(q) || f.personnelId.toLowerCase().includes(q)
    const matchesTab = activeTab.value === 'All' || f.status === activeTab.value
    return matchesQuery && matchesTab
  })
})

/* ---------------- Mark complete (real action) ---------------- */
const completingId = ref<string | null>(null)
async function markComplete(id: string) {
  if (!data.value) return
  completingId.value = id
  try {
    await $fetch(`/api/commander/follow-ups/${id}/complete`, { method: 'POST' })
    const target = data.value.followUps.find((f) => f.id === id)
    if (target) target.status = 'Completed'
  } catch {
    // Leave status unchanged; button re-enables so the commander can retry.
  } finally {
    completingId.value = null
  }
}

/* ---------------- Schedule new follow-up (real action) ---------------- */
const showNewForm = ref(false)
const newPersonnelId = ref('')
const newType = ref('Welfare Check-in')
const newDueDate = ref('')
const followUpTypes = ['Welfare Check-in', 'Post-Incident Review', 'Risk Reassessment', 'Command Interview']
const creating = ref(false)
const createError = ref<string | null>(null)

async function scheduleFollowUp() {
  if (!newPersonnelId.value.trim() || !newDueDate.value || !data.value) return
  creating.value = true
  createError.value = null
  try {
    const created = await $fetch<FollowUp>('/api/commander/follow-ups', {
      method: 'POST',
      body: { personnelId: newPersonnelId.value.trim(), type: newType.value, dueDate: newDueDate.value },
    })
    data.value.followUps = [created, ...data.value.followUps]
    newPersonnelId.value = ''
    newDueDate.value = ''
    newType.value = 'Welfare Check-in'
    showNewForm.value = false
  } catch {
    createError.value = 'Could not schedule the follow-up. Please try again.'
  } finally {
    creating.value = false
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
            <h1 class="text-xl font-extrabold tracking-tight text-white">Follow-ups</h1>
            <p class="mt-0.5 text-xs text-slate-400">Scheduled welfare check-ins across your unit</p>
          </div>
          <button type="button" @click="showNewForm = !showNewForm" class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
            <Plus :size="14" /> Schedule Follow-up
          </button>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading follow-ups…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load follow-ups</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/commander/follow-ups</code></p>
          <button type="button" @click="fetchFollowUps()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <div v-if="showNewForm" class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <h3 class="text-sm font-bold text-white">Schedule Follow-up</h3>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input v-model="newPersonnelId" type="text" placeholder="Personnel ID (e.g. P-1024)" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
              <select v-model="newType" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
                <option v-for="t in followUpTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="newDueDate" type="date" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
              <button type="button" :disabled="!newPersonnelId.trim() || !newDueDate || creating" @click="scheduleFollowUp" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {{ creating ? 'Scheduling…' : 'Schedule' }}
              </button>
            </div>
            <p v-if="createError" class="mt-2 text-[11px] text-red-400">{{ createError }}</p>
          </div>

          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-1.5">
                <button
                  v-for="tab in tabs" :key="tab" type="button" @click="activeTab = tab"
                  class="rounded-md px-3 py-1.5 text-xs font-semibold"
                  :class="activeTab === tab ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'"
                >{{ tab }} <span class="ml-1 text-[10px] opacity-80">{{ tabCounts[tab] }}</span></button>
              </div>
              <div class="relative">
                <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input v-model="search" type="text" placeholder="Search follow-ups..." class="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
              </div>
            </div>

            <div class="mt-4 overflow-x-auto">
              <table class="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">Personnel</th>
                    <th class="pb-2 font-medium">Sub-Unit</th>
                    <th class="pb-2 font-medium">Type</th>
                    <th class="pb-2 font-medium">Due Date</th>
                    <th class="pb-2 font-medium">Status</th>
                    <th class="pb-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!filteredFollowUps.length">
                    <td colspan="6" class="py-6 text-center text-slate-500">
                      {{ search ? 'No follow-ups match your search.' : 'No follow-ups in this view.' }}
                    </td>
                  </tr>
                  <tr v-for="f in filteredFollowUps" :key="f.id" class="border-t border-white/5">
                    <td class="py-2.5 text-slate-200">{{ f.personnelName }} <span class="text-slate-500">({{ f.personnelId }})</span></td>
                    <td class="py-2.5 text-slate-400">{{ f.subUnit }}</td>
                    <td class="py-2.5 text-slate-400">{{ f.type }}</td>
                    <td class="py-2.5" :class="f.status === 'Overdue' ? 'font-semibold text-red-400' : 'text-slate-400'">{{ f.dueDate }}</td>
                    <td class="py-2.5"><span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="statusTone[f.status]">{{ f.status }}</span></td>
                    <td class="py-2.5 text-right">
                      <button
                        v-if="f.status !== 'Completed'"
                        type="button" :disabled="completingId === f.id" @click="markComplete(f.id)"
                        class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                      >{{ completingId === f.id ? 'Saving…' : 'Mark Complete' }}</button>
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