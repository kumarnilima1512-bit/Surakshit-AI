<!--
  pages/welfare/interventions/index.vue
  URL: /welfare/interventions
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
  Plus,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/welfare/interventions                    -> InterventionsData
   POST /api/welfare/interventions                     { personnelId, type, targetDate } -> Intervention
   POST /api/welfare/interventions/:id/complete        -> { ok: true }
   ====================================================================== */

type InterventionStatus = 'Pending' | 'In Progress' | 'Completed'
type InterventionType = 'Counseling' | 'Medical Referral' | 'Leave Recommendation' | 'Peer Support' | 'Command Notification'
type StatusFilter = 'All' | InterventionStatus

interface OfficerHeader {
  name: string
  role: string
  avatarUrl: string | null
}

interface Segment {
  label: string
  pct: number
  count: number
  color: string
}

interface Intervention {
  id: string
  personnelId: string
  personnelName: string
  type: InterventionType
  status: InterventionStatus
  assignedOfficer: string
  startedDate: string
  targetDate: string
}

interface InterventionsData {
  officer: OfficerHeader
  statusBreakdown: Segment[]
  totalInterventions: number
  interventions: Intervention[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchInterventions } =
  await useFetch<InterventionsData>('/api/welfare/interventions')

/* ---------------- Sidebar / header shell ---------------- */
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
function isActive(to: string) { return route.path === to || route.path.startsWith(`${to}/`) }
async function logout() { await useFetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/login') }
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
const statusTone: Record<InterventionStatus, string> = {
  'Pending': 'bg-amber-500/15 text-amber-400',
  'In Progress': 'bg-blue-500/15 text-blue-400',
  'Completed': 'bg-emerald-500/15 text-emerald-400',
}

/* ---------------- Donut geometry ---------------- */
function buildDonutSegments(segments: Segment[]) {
  const r = 70
  const circumference = 2 * Math.PI * r
  let offset = 0
  return segments.map((seg) => {
    const dash = (seg.pct / 100) * circumference
    const out = { ...seg, dasharray: `${dash} ${circumference - dash}`, dashoffset: -offset }
    offset += dash
    return out
  })
}

/* ---------------- Filters ---------------- */
const search = ref('')
const statusFilter = ref<StatusFilter>('All')
const statusOptions: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Completed']

const filteredInterventions = computed<Intervention[]>(() => {
  const list = data.value?.interventions ?? []
  const q = search.value.trim().toLowerCase()
  return list.filter((iv) => {
    const matchesQuery = !q || iv.personnelName.toLowerCase().includes(q) || iv.personnelId.toLowerCase().includes(q) || iv.id.toLowerCase().includes(q)
    const matchesStatus = statusFilter.value === 'All' || iv.status === statusFilter.value
    return matchesQuery && matchesStatus
  })
})

/* ---------------- Mark complete (real action) ---------------- */
const completingId = ref<string | null>(null)
async function markComplete(id: string) {
  if (!data.value) return
  completingId.value = id
  try {
    await $fetch(`/api/welfare/interventions/${id}/complete`, { method: 'POST' })
    const target = data.value.interventions.find((iv) => iv.id === id)
    if (target) target.status = 'Completed'
  } catch {
    // Leave status unchanged; button re-enables so the officer can retry.
  } finally {
    completingId.value = null
  }
}

/* ---------------- New intervention form (real action) ---------------- */
const showNewForm = ref(false)
const newPersonnelId = ref('')
const newType = ref<InterventionType>('Counseling')
const newTargetDate = ref('')
const interventionTypes: InterventionType[] = ['Counseling', 'Medical Referral', 'Leave Recommendation', 'Peer Support', 'Command Notification']
const creating = ref(false)
const createError = ref<string | null>(null)

async function createIntervention() {
  if (!newPersonnelId.value.trim() || !newTargetDate.value || !data.value) return
  creating.value = true
  createError.value = null
  try {
    const created = await $fetch<Intervention>('/api/welfare/interventions', {
      method: 'POST',
      body: { personnelId: newPersonnelId.value.trim(), type: newType.value, targetDate: newTargetDate.value },
    })
    data.value.interventions = [created, ...data.value.interventions]
    newPersonnelId.value = ''
    newTargetDate.value = ''
    newType.value = 'Counseling'
    showNewForm.value = false
  } catch {
    createError.value = 'Could not create the intervention. Please try again.'
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
          <ShieldCheck :size="19" :stroke-width="1.5" />
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
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-white">Interventions</h1>
            <p class="mt-0.5 text-xs text-slate-400">Track welfare interventions from assignment to completion</p>
          </div>
          <button type="button" @click="showNewForm = !showNewForm" class="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500">
            <Plus :size="14" /> New Intervention
          </button>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading interventions…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load interventions</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/interventions</code></p>
          <button type="button" @click="fetchInterventions()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <!-- New intervention form -->
          <div v-if="showNewForm" class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <h3 class="text-sm font-bold text-white">New Intervention</h3>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input v-model="newPersonnelId" type="text" placeholder="Personnel ID (e.g. P-1024)" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
              <select v-model="newType" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
                <option v-for="t in interventionTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="newTargetDate" type="date" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
              <button type="button" :disabled="!newPersonnelId.trim() || !newTargetDate || creating" @click="createIntervention" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {{ creating ? 'Creating…' : 'Create' }}
              </button>
            </div>
            <p v-if="createError" class="mt-2 text-[11px] text-red-400">{{ createError }}</p>
          </div>

          <!-- Status donut + table -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2.2fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Status Breakdown</h3>
              <div class="relative mt-4 flex items-center justify-center">
                <svg viewBox="0 0 180 180" class="h-36 w-36 -rotate-90">
                  <circle v-for="seg in buildDonutSegments(data.statusBreakdown)" :key="seg.label" cx="90" cy="90" r="70" fill="none" :stroke="seg.color" stroke-width="20" :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset" />
                </svg>
                <div class="absolute text-center">
                  <p class="text-2xl font-extrabold text-white">{{ data.totalInterventions }}</p>
                  <p class="text-[11px] text-slate-400">Total Interventions</p>
                </div>
              </div>
              <div class="mt-4 space-y-2">
                <div v-for="seg in data.statusBreakdown" :key="seg.label" class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>{{ seg.label }}
                  </span>
                  <span class="flex items-center gap-2 font-semibold text-slate-400">{{ seg.count }} <span class="text-slate-500">({{ seg.pct }}%)</span></span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="relative">
                  <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input v-model="search" type="text" placeholder="Search interventions..." class="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
                </div>
                <div class="flex items-center gap-1.5">
                  <Filter :size="12" class="mr-1 text-slate-500" />
                  <button v-for="opt in statusOptions" :key="opt" type="button" @click="statusFilter = opt" class="rounded-md px-2.5 py-1 text-[11px] font-semibold" :class="statusFilter === opt ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'">{{ opt }}</button>
                </div>
              </div>

              <div class="mt-4 overflow-x-auto">
                <table class="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr class="text-slate-500">
                      <th class="pb-2 font-medium">ID</th>
                      <th class="pb-2 font-medium">Personnel</th>
                      <th class="pb-2 font-medium">Type</th>
                      <th class="pb-2 font-medium">Status</th>
                      <th class="pb-2 font-medium">Assigned</th>
                      <th class="pb-2 font-medium">Target Date</th>
                      <th class="pb-2 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!filteredInterventions.length">
                      <td colspan="7" class="py-6 text-center text-slate-500">
                        {{ search || statusFilter !== 'All' ? 'No interventions match your filters.' : 'No interventions yet.' }}
                      </td>
                    </tr>
                    <tr v-for="iv in filteredInterventions" :key="iv.id" class="border-t border-white/5">
                      <td class="py-2.5 font-medium text-emerald-400">{{ iv.id }}</td>
                      <td class="py-2.5 text-slate-200">{{ iv.personnelName }} <span class="text-slate-500">({{ iv.personnelId }})</span></td>
                      <td class="py-2.5 text-slate-400">{{ iv.type }}</td>
                      <td class="py-2.5"><span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="statusTone[iv.status]">{{ iv.status }}</span></td>
                      <td class="py-2.5 text-slate-400">{{ iv.assignedOfficer }}</td>
                      <td class="py-2.5 text-slate-500">{{ iv.targetDate }}</td>
                      <td class="py-2.5 text-right">
                        <button
                          v-if="iv.status !== 'Completed'"
                          type="button" :disabled="completingId === iv.id" @click="markComplete(iv.id)"
                          class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                        >{{ completingId === iv.id ? 'Saving…' : 'Mark Complete' }}</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>