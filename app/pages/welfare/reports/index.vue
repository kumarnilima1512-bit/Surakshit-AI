<!--
  pages/welfare/reports/index.vue
  URL: /welfare/reports
  Nuxt 3 + Composition API + Tailwind, same visual language as the rest
  of the Welfare Officer section.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
  Download,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/welfare/reports            -> ReportsData
   POST /api/welfare/reports/generate    { type, from, to } -> ReportRecord
   ====================================================================== */

type ReportType = 'Unit Risk Summary' | 'High-Risk Case Log' | 'Intervention Outcomes' | 'Monthly Welfare Report'

interface OfficerHeader {
  name: string
  role: string
  avatarUrl: string | null
}

interface ReportRecord {
  id: string
  name: string
  type: ReportType
  dateRangeLabel: string
  generatedBy: string
  generatedOnLabel: string
  downloadUrl: string
}

interface ReportsData {
  officer: OfficerHeader
  reports: ReportRecord[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchReports } =
  await useFetch<ReportsData>('/api/welfare/reports')

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

/* ---------------- Generate report form (real action) ---------------- */
const reportTypes: ReportType[] = ['Unit Risk Summary', 'High-Risk Case Log', 'Intervention Outcomes', 'Monthly Welfare Report']
const selectedType = ref<ReportType>('Unit Risk Summary')
const fromDate = ref('')
const toDate = ref('')
const generating = ref(false)
const generateError = ref<string | null>(null)

async function generateReport() {
  if (!fromDate.value || !toDate.value || !data.value) return
  generating.value = true
  generateError.value = null
  try {
    const created = await $fetch<ReportRecord>('/api/welfare/reports/generate', {
      method: 'POST',
      body: { type: selectedType.value, from: fromDate.value, to: toDate.value },
    })
    data.value.reports = [created, ...data.value.reports]
  } catch {
    generateError.value = 'Could not generate the report. Please try again.'
  } finally {
    generating.value = false
  }
}

const typeBadge: Record<ReportType, string> = {
  'Unit Risk Summary': 'bg-blue-500/15 text-blue-400',
  'High-Risk Case Log': 'bg-red-500/15 text-red-400',
  'Intervention Outcomes': 'bg-violet-500/15 text-violet-400',
  'Monthly Welfare Report': 'bg-emerald-500/15 text-emerald-400',
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
          <h1 class="text-xl font-extrabold tracking-tight text-white">Reports</h1>
          <p class="mt-0.5 text-xs text-slate-400">Generate and download welfare reports for your unit</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading reports…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load reports</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/reports</code></p>
          <button type="button" @click="fetchReports()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <!-- Generate new report -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <h3 class="text-sm font-bold text-white">Generate New Report</h3>
            <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <select v-model="selectedType" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
                <option v-for="t in reportTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input v-model="fromDate" type="date" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
              <input v-model="toDate" type="date" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50">
              <button type="button" :disabled="!fromDate || !toDate || generating" @click="generateReport" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {{ generating ? 'Generating…' : 'Generate' }}
              </button>
            </div>
            <p v-if="generateError" class="mt-2 text-[11px] text-red-400">{{ generateError }}</p>
          </div>

          <!-- Report history -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <h3 class="text-sm font-bold text-white">Report History</h3>
            <div class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">Name</th>
                    <th class="pb-2 font-medium">Type</th>
                    <th class="pb-2 font-medium">Date Range</th>
                    <th class="pb-2 font-medium">Generated By</th>
                    <th class="pb-2 font-medium">Generated On</th>
                    <th class="pb-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!data.reports.length">
                    <td colspan="6" class="py-6 text-center text-slate-500">No reports generated yet.</td>
                  </tr>
                  <tr v-for="r in data.reports" :key="r.id" class="border-t border-white/5">
                    <td class="py-2.5 font-medium text-slate-200">{{ r.name }}</td>
                    <td class="py-2.5"><span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="typeBadge[r.type]">{{ r.type }}</span></td>
                    <td class="py-2.5 text-slate-400">{{ r.dateRangeLabel }}</td>
                    <td class="py-2.5 text-slate-400">{{ r.generatedBy }}</td>
                    <td class="py-2.5 text-slate-500">{{ r.generatedOnLabel }}</td>
                    <td class="py-2.5 text-right">
                      <a :href="r.downloadUrl" download class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline">
                        <Download :size="12" /> Download
                      </a>
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