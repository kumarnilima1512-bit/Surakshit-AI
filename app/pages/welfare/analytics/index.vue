<!--
  pages/welfare/analytics/index.vue
  URL: /welfare/analytics
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
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/welfare/analytics -> AnalyticsData
   ====================================================================== */

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

interface MonthlyStressTrend {
  labels: string[]
  values: number[]
}

interface MonthlyRiskTrend {
  labels: string[]
  low: number[]
  moderate: number[]
  elevated: number[]
  high: number[]
}

interface UnitComparisonPoint {
  unit: string
  avgStress: number
}

interface AnalyticsData {
  officer: OfficerHeader
  rangeLabel: string
  stressTrendMonthly: MonthlyStressTrend
  riskTrendMonthly: MonthlyRiskTrend
  unitComparison: UnitComparisonPoint[]
  interventionOutcomes: Segment[]
  totalInterventions: number
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchAnalytics } =
  await useFetch<AnalyticsData>('/api/welfare/analytics')

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

/* ---------------- Stress trend geometry ---------------- */
const trendW = 640
const trendH = 200
const trendMax = 10
function trendPath(values: number[]) {
  if (!values.length) return ''
  const stepX = trendW / Math.max(values.length - 1, 1)
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${trendH - (v / trendMax) * trendH}`).join(' ')
}
function pointXY(values: number[], i: number) {
  const stepX = trendW / Math.max(values.length - 1, 1)
  return { x: i * stepX, y: trendH - (values[i] / trendMax) * trendH }
}

/* ---------------- Stacked risk-trend bar geometry ---------------- */
const barChartH = 180
function stackedTotal(t: MonthlyRiskTrend, i: number) {
  return t.low[i] + t.moderate[i] + t.elevated[i] + t.high[i]
}
function stackedMax(t: MonthlyRiskTrend) {
  return Math.max(1, ...t.labels.map((_, i) => stackedTotal(t, i)))
}
function segmentHeight(count: number, max: number) {
  return (count / max) * 100
}

/* ---------------- Unit comparison bar geometry ---------------- */
function comparisonMax(points: UnitComparisonPoint[]) {
  return Math.max(10, ...points.map((p) => p.avgStress))
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
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-white">Analytics</h1>
            <p class="mt-0.5 text-xs text-slate-400">Longer-range trends across your unit</p>
          </div>
          <span v-if="data" class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">{{ data.rangeLabel }}</span>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading analytics…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load analytics</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/analytics</code></p>
          <button type="button" @click="fetchAnalytics()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <!-- Monthly stress trend -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <h3 class="text-sm font-bold text-white">Average Stress Trend</h3>
            <svg :viewBox="`0 0 ${trendW} ${trendH + 26}`" class="mt-4 h-52 w-full">
              <defs>
                <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#34d399" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line v-for="g in 5" :key="g" x1="0" :x2="trendW" :y1="(trendH / 5) * g" :y2="(trendH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
              <path :d="`${trendPath(data.stressTrendMonthly.values)} L ${trendW} ${trendH} L 0 ${trendH} Z`" fill="url(#analyticsTrendFill)" />
              <path :d="trendPath(data.stressTrendMonthly.values)" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              <g v-for="(v, i) in data.stressTrendMonthly.values" :key="i">
                <circle :cx="pointXY(data.stressTrendMonthly.values, i).x" :cy="pointXY(data.stressTrendMonthly.values, i).y" r="3.5" fill="#34d399" />
                <text :x="pointXY(data.stressTrendMonthly.values, i).x" :y="pointXY(data.stressTrendMonthly.values, i).y - 10" text-anchor="middle" font-size="11" fill="#cbd5e1">{{ v }}</text>
                <text :x="pointXY(data.stressTrendMonthly.values, i).x" :y="trendH + 20" text-anchor="middle" font-size="11" fill="#64748b">{{ data.stressTrendMonthly.labels[i] }}</text>
              </g>
            </svg>
          </div>

          <!-- Risk-level trend (stacked) + Unit comparison -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Risk Level Trend by Month</h3>
              <div class="mt-5 flex h-52 items-end gap-3">
                <div v-for="(lbl, i) in data.riskTrendMonthly.labels" :key="lbl" class="flex flex-1 flex-col items-center gap-1.5">
                  <div class="flex w-full flex-1 flex-col-reverse overflow-hidden rounded-t" :style="{ height: `${barChartH}px` }">
                    <div class="w-full bg-emerald-400" :style="{ height: segmentHeight(data.riskTrendMonthly.low[i], stackedMax(data.riskTrendMonthly)) + '%' }"></div>
                    <div class="w-full bg-blue-400" :style="{ height: segmentHeight(data.riskTrendMonthly.moderate[i], stackedMax(data.riskTrendMonthly)) + '%' }"></div>
                    <div class="w-full bg-amber-400" :style="{ height: segmentHeight(data.riskTrendMonthly.elevated[i], stackedMax(data.riskTrendMonthly)) + '%' }"></div>
                    <div class="w-full bg-red-400" :style="{ height: segmentHeight(data.riskTrendMonthly.high[i], stackedMax(data.riskTrendMonthly)) + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ lbl }}</span>
                </div>
              </div>
              <div class="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-400"></span>Low</span>
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-blue-400"></span>Moderate</span>
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-400"></span>Elevated</span>
                <span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-red-400"></span>High</span>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Average Stress by Unit</h3>
              <div class="mt-5 flex h-52 items-end gap-3">
                <div v-for="pt in data.unitComparison" :key="pt.unit" class="flex flex-1 flex-col items-center gap-1.5">
                  <span class="text-[10px] font-semibold text-slate-300">{{ pt.avgStress }}</span>
                  <div class="flex h-40 w-full items-end">
                    <div class="w-full rounded-t bg-gradient-to-t from-emerald-500 to-cyan-400" :style="{ height: (pt.avgStress / comparisonMax(data.unitComparison)) * 100 + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ pt.unit }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Intervention outcomes -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5 lg:w-1/2">
            <h3 class="text-sm font-bold text-white">Intervention Outcomes</h3>
            <div class="mt-4 flex flex-col items-center gap-6 sm:flex-row">
              <div class="relative flex items-center justify-center">
                <svg viewBox="0 0 180 180" class="h-36 w-36 -rotate-90">
                  <circle v-for="seg in buildDonutSegments(data.interventionOutcomes)" :key="seg.label" cx="90" cy="90" r="70" fill="none" :stroke="seg.color" stroke-width="20" :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset" />
                </svg>
                <div class="absolute text-center">
                  <p class="text-2xl font-extrabold text-white">{{ data.totalInterventions }}</p>
                  <p class="text-[11px] text-slate-400">Total</p>
                </div>
              </div>
              <div class="flex-1 space-y-2">
                <div v-for="seg in data.interventionOutcomes" :key="seg.label" class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>{{ seg.label }}
                  </span>
                  <span class="flex items-center gap-2 font-semibold text-slate-400">{{ seg.count }} <span class="text-slate-500">({{ seg.pct }}%)</span></span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>