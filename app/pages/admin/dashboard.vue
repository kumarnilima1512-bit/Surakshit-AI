<script setup lang="ts">
import { ref, onMounted } from 'vue'

const DASHBOARD_API_URL = '/api/admin/dashboard'

interface StatCard {
  label: string
  value: string | number
  deltaPct: number | null   // e.g. 5 for +5%, -12 for -12%, delta will be null if no previous period to compare to
  goodDirection: 'up' | 'down' // "up" = good at increasing (Total Personnel), "down" = good at decreasing (High Risk)
  icon: 'users' | 'user' | 'shield' | 'building' | 'alert' | 'triangle' | 'doc'
}

interface TrendPoint {
  label: string   // date/day label
  value: number   // stress score
}

interface RiskSegment {
  label: string
  pct: number
  count: number
  color: string
}

interface UnitBar {
  unit: string
  low: number
  moderate: number
  elevated: number
  high: number
}

interface ActivityItem {
  text: string
  by: string
  time: string
  tone: 'blue' | 'amber' | 'green'
}

interface HighRiskPerson {
  id: string
  name: string
  unit: string
  level: 'High' | 'Elevated'
  score: number
}

interface OverviewItem {
  label: string
  value: string | number
  deltaPct: number | null
}

interface MonthlyStat {
  month: string
  total: number
  highRisk: number
}

interface HealthService {
  name: string
  status: 'Online' | 'Degraded' | 'Offline'
}

interface DashboardData {
  adminName: string
  statCards: StatCard[]
  stressTrend: TrendPoint[]
  avgStressScore: number
  avgStressDeltaPct: number | null
  riskDistribution: RiskSegment[]
  totalPersonnelForDonut: number
  unitBars: UnitBar[]
  recentActivity: ActivityItem[]
  highRiskPersonnel: HighRiskPerson[]
  systemOverview: OverviewItem[]
  monthlyStats: MonthlyStat[]
  systemHealth: HealthService[]
}

const data = ref<DashboardData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchDashboard() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(DASHBOARD_API_URL)
    if (!res.ok) throw new Error(`Server returned ${res.status}`)
    data.value = (await res.json()) as DashboardData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchDashboard)

/* ---------------- Sidebar navigation (static, not data-driven) ---------------- */
const navSections = [
  { label: 'Users', icon: 'users', items: ['All Users', 'Create User', 'Roles & Permissions'] },
  { label: 'Units', icon: 'building', items: ['All Units', 'Assign Personnel'] },
  { label: 'Analytics', icon: 'chart', items: ['System Analytics', 'Risk Trends', 'Reports'] },
  { label: 'Security', icon: 'shield', items: ['Audit Logs', 'Login History', 'Failed Attempts', '2FA Management'] },
  { label: 'System Settings', icon: 'gear', items: ['General Settings', 'ML Model Settings'] },
]
const openSections = ref<Record<string, boolean>>({
  Users: true, Units: true, Analytics: true, Security: true, 'System Settings': true,
})
function toggleSection(label: string) {
  openSections.value[label] = !openSections.value[label]
}

/* ---------------- Chart geometry helpers (pure, no data of their own) ---------------- */
const chartW = 640
const chartH = 220
const maxStressVal = 10

function buildStressPath(points: TrendPoint[]) {
  if (!points.length) return ''
  const stepX = chartW / Math.max(points.length - 1, 1)
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${chartH - (p.value / maxStressVal) * chartH}`)
    .join(' ')
}
function buildStressAreaPath(points: TrendPoint[]) {
  const line = buildStressPath(points)
  if (!line) return ''
  return `${line} L ${chartW} ${chartH} L 0 ${chartH} Z`
}

function buildDonutSegments(segments: RiskSegment[]) {
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

function unitBarMax(bars: UnitBar[]) {
  return Math.max(1, ...bars.flatMap((b) => [b.low, b.moderate, b.elevated, b.high]))
}
function monthlyMax(stats: MonthlyStat[]) {
  return Math.max(1, ...stats.flatMap((m) => [m.total, m.highRisk]))
}

function levelClasses(level: string) {
  return level === 'High' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
}
function deltaClass(pct: number | null, goodDirection: 'up' | 'down' = 'up') {
  if (pct === null) return 'text-slate-500'
  const isGood = goodDirection === 'up' ? pct >= 0 : pct <= 0
  return isGood ? 'text-emerald-400' : 'text-red-400'
}
function formatDelta(pct: number | null) {
  if (pct === null) return '—'
  return `${pct > 0 ? '+' : ''}${pct}%`
}

const now = new Date()
const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const formattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <!-- ================= Sidebar ================= -->
    <aside class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.5 12l1.8 1.8L14.5 10" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-white">Surakshit AI</p>
          <p class="text-[10px] leading-tight text-slate-400">Personnel Stress &amp; Welfare Monitoring System</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        <a href="#" class="flex items-center gap-3 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"></path>
          </svg>
          Dashboard
        </a>

        <div v-for="section in navSections" :key="section.label" class="pt-1">
          <button
            @click="toggleSection(section.label)"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5"
          >
            <span class="flex items-center gap-3">
              <svg v-if="section.icon === 'users'" class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"></path>
              </svg>
              <svg v-else-if="section.icon === 'building'" class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21h18M5 21V6a1 1 0 011-1h4a1 1 0 011 1v15M13 21V10a1 1 0 011-1h4a1 1 0 011 1v11M9 8h.01M9 12h.01M9 16h.01"></path>
              </svg>
              <svg v-else-if="section.icon === 'chart'" class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l7 7-7 6zM4 5v14"></path>
              </svg>
              <svg v-else-if="section.icon === 'shield'" class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
              </svg>
              <svg v-else class="h-4.5 w-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {{ section.label }}
            </span>
            <svg class="h-4 w-4 text-slate-500 transition-transform" :class="{ 'rotate-180': openSections[section.label] }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          <div v-show="openSections[section.label]" class="ml-6 mt-1 space-y-0.5 border-l border-white/5 pl-4">
            <a v-for="item in section.items" :key="item" href="#" class="block rounded-md px-2 py-1.5 text-[13px] text-slate-400 hover:bg-white/5 hover:text-slate-200">
              {{ item }}
            </a>
          </div>
        </div>
      </nav>

      <div class="mx-3 mb-3 rounded-xl border border-white/5 bg-white/5 p-4">
        <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"></path>
        </svg>
        <p class="mt-2 text-xs font-semibold text-slate-200">Safer Personnel</p>
        <p class="text-xs font-semibold text-slate-200">Stronger Forces</p>
        <p class="mt-1 text-[11px] text-slate-400">A Healthier Tomorrow</p>
      </div>
      <p class="pb-4 pl-5 text-[11px] text-slate-600">v1.0.0</p>
    </aside>

    <!-- ================= Main ================= -->
    <div class="flex min-h-screen flex-1 flex-col">
      <!-- Top bar -->
      <header class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5">
        <div class="relative max-w-md flex-1">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path>
          </svg>
          <input type="text" placeholder="Search users, units, personnel..." class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50">
        </div>

        <div class="ml-auto flex items-center gap-4">
          <button class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
          </button>

          <span class="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
            </svg>
            2FA Enabled
          </span>

          <div class="flex items-center gap-2.5 border-l border-white/10 pl-4">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700">
              <svg class="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-white">{{ data?.adminName ?? 'Admin' }}</p>
              <p class="text-[11px] text-slate-400">Administrator</p>
            </div>
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-6 p-6">
        <!-- Title row -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-white">Admin Dashboard</h1>
            <p class="mt-1 text-sm text-slate-400">Overview of system, personnel, and welfare monitoring status</p>
          </div>
          <span class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300">
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            {{ formattedDate }} &middot; {{ formattedTime }}
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm">Loading dashboard data…</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"></path>
          </svg>
          <p class="text-sm font-semibold text-red-300">Couldn't load dashboard data</p>
          <p class="text-xs text-slate-400">{{ error }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">{{ DASHBOARD_API_URL }}</code></p>
          <button @click="fetchDashboard" class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Retry</button>
        </div>

        <!-- Dashboard content (only renders once real data has arrived) -->
        <template v-else-if="data">
          <!-- Stat cards -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <div v-for="card in data.statCards" :key="card.label" class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <p class="mt-3 text-xs font-medium text-slate-400">{{ card.label }}</p>
              <p class="mt-1 text-2xl font-extrabold text-white">{{ card.value }}</p>
              <p class="mt-1 text-[11px] font-semibold" :class="deltaClass(card.deltaPct, card.goodDirection)">
                {{ formatDelta(card.deltaPct) }} <span class="font-normal text-slate-500">vs. last month</span>
              </p>
            </div>
          </div>

          <!-- Trend + Donut -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1.3fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Stress Level Trend (System Wide)</h3>
              <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="h-48 w-full flex-1">
                  <defs>
                    <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35" />
                      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <line v-for="g in 5" :key="g" x1="0" :x2="chartW" :y1="(chartH / 5) * g" :y2="(chartH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                  <path :d="buildStressAreaPath(data.stressTrend)" fill="url(#stressFill)" />
                  <path :d="buildStressPath(data.stressTrend)" fill="none" stroke="#22d3ee" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="shrink-0 sm:w-36">
                  <p class="text-xs font-medium text-slate-400">Avg. Stress Score</p>
                  <p class="mt-1 text-3xl font-extrabold text-white">{{ data.avgStressScore }}</p>
                  <p class="mt-1 text-xs font-semibold" :class="deltaClass(data.avgStressDeltaPct, 'down')">
                    {{ formatDelta(data.avgStressDeltaPct) }} <span class="font-normal text-slate-500">vs. previous period</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Risk Distribution</h3>
              <div class="relative mt-4 flex items-center justify-center">
                <svg viewBox="0 0 180 180" class="h-40 w-40 -rotate-90">
                  <circle v-for="seg in buildDonutSegments(data.riskDistribution)" :key="seg.label" cx="90" cy="90" r="70" fill="none" :stroke="seg.color" stroke-width="20" :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset" />
                </svg>
                <div class="absolute text-center">
                  <p class="text-2xl font-extrabold text-white">{{ data.totalPersonnelForDonut }}</p>
                  <p class="text-[11px] text-slate-400">Total Personnel</p>
                </div>
              </div>
              <div class="mt-3 space-y-2">
                <div v-for="seg in data.riskDistribution" :key="seg.label" class="flex items-center justify-between text-xs">
                  <span class="flex items-center gap-2 text-slate-300">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>{{ seg.label }}
                  </span>
                  <span class="flex items-center gap-2 font-semibold text-slate-400">{{ seg.pct }}% <span class="text-slate-500">{{ seg.count }}</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Unit bars + Activity + High risk table -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.2fr_1.2fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Risk Level Distribution by Unit</h3>
              <div class="mt-5 flex h-56 items-end gap-3">
                <div v-for="bar in data.unitBars" :key="bar.unit" class="flex flex-1 flex-col items-center gap-1.5">
                  <div class="flex h-44 w-full items-end justify-center gap-0.5">
                    <div class="w-1/4 rounded-t bg-emerald-400" :style="{ height: (bar.low / unitBarMax(data.unitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-amber-400" :style="{ height: (bar.moderate / unitBarMax(data.unitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-orange-400" :style="{ height: (bar.elevated / unitBarMax(data.unitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-red-400" :style="{ height: (bar.high / unitBarMax(data.unitBars)) * 100 + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ bar.unit }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Recent Activity</h3>
              <div class="mt-4 space-y-4">
                <div v-if="!data.recentActivity.length" class="text-xs text-slate-500">No recent activity.</div>
                <div v-for="(item, i) in data.recentActivity" :key="i" class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-slate-200">{{ item.text }}</p>
                    <p class="mt-0.5 text-[11px] text-slate-500">{{ item.by }} &middot; {{ item.time }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">High Risk Personnel</h3>
              <table class="mt-4 w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">ID</th>
                    <th class="pb-2 font-medium">Name</th>
                    <th class="pb-2 font-medium">Unit</th>
                    <th class="pb-2 font-medium">Level</th>
                    <th class="pb-2 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!data.highRiskPersonnel.length">
                    <td colspan="5" class="py-4 text-center text-slate-500">No high risk personnel.</td>
                  </tr>
                  <tr v-for="p in data.highRiskPersonnel" :key="p.id" class="border-t border-white/5">
                    <td class="py-2 font-medium text-blue-400">{{ p.id }}</td>
                    <td class="py-2 text-slate-200">{{ p.name }}</td>
                    <td class="py-2 text-slate-400">{{ p.unit }}</td>
                    <td class="py-2"><span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelClasses(p.level)">{{ p.level }}</span></td>
                    <td class="py-2 text-right font-semibold text-slate-200">{{ p.score }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- System overview + Monthly stats + System health -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1.4fr_1fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">System Overview</h3>
              <div class="mt-4 grid grid-cols-2 gap-4">
                <div v-for="item in data.systemOverview" :key="item.label">
                  <p class="text-[11px] font-medium text-slate-400">{{ item.label }}</p>
                  <p class="text-lg font-extrabold text-white">{{ item.value }}</p>
                  <p class="text-[10px] font-semibold" :class="deltaClass(item.deltaPct)">{{ formatDelta(item.deltaPct) }} <span class="font-normal text-slate-500">vs. last month</span></p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Monthly Assessment Statistics</h3>
              <div class="mt-5 flex h-48 items-end gap-4">
                <div v-for="m in data.monthlyStats" :key="m.month" class="flex flex-1 flex-col items-center gap-1.5">
                  <div class="flex h-36 w-full items-end justify-center gap-1">
                    <div class="w-2/5 rounded-t bg-blue-500" :style="{ height: (m.total / monthlyMax(data.monthlyStats)) * 100 + '%' }"></div>
                    <div class="w-2/5 rounded-t bg-red-400" :style="{ height: (m.highRisk / monthlyMax(data.monthlyStats)) * 100 + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ m.month }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">System Health</h3>
              <div class="mt-4 space-y-3">
                <div v-for="svc in data.systemHealth" :key="svc.name" class="flex items-center justify-between text-xs">
                  <span class="text-slate-300">{{ svc.name }}</span>
                  <span
                    class="font-semibold"
                    :class="{
                      'text-emerald-400': svc.status === 'Online',
                      'text-amber-400': svc.status === 'Degraded',
                      'text-red-400': svc.status === 'Offline',
                    }"
                  >{{ svc.status }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>