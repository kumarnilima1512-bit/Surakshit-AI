<!--
  pages/commander/dashboard.vue
  Nuxt 3 + Composition API + Tailwind rewrite.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Home,
  Users,
  ClipboardList,
  AlertTriangle,
  CalendarClock,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  Calendar,
  TrendingUp,
  RotateCw,
  Building2,
  CheckCircle2,
  Filter,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/commander/dashboard -> DashboardData
   Scope: everything returned is limited to the commander's own unit(s).
   No hardcoded/sample values are rendered - everything comes from data.
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

interface CommanderProfile {
  serviceId: string
  name: string
  rank: string
  unit: string
  avatarUrl: string | null
}

interface StatCard {
  label: string
  value: string | number
  deltaPct: number | null
  goodDirection: 'up' | 'down'
  icon: 'users' | 'alert' | 'clock' | 'check'
}

interface TrendPoint {
  label: string
  value: number
}

interface RiskSegment {
  label: string
  pct: number
  count: number
  color: string
}

interface SubUnitBar {
  name: string
  low: number
  moderate: number
  elevated: number
  high: number
}

interface PersonnelRow {
  id: string
  name: string
  subUnit: string
  level: RiskLevel
  score: number
  lastAssessment: string
}

interface FollowUpItem {
  personnelName: string
  personnelId: string
  dueDate: string
  reason: string
  status: 'Pending' | 'Overdue' | 'Scheduled'
}

interface ActivityItem {
  text: string
  by: string
  time: string
}

interface NotificationItem {
  id: string
  title: string
  timeLabel: string
  read: boolean
}

interface DashboardData {
  commander: CommanderProfile
  statCards: StatCard[]
  stressTrend: TrendPoint[]
  avgStressScore: number
  avgStressDeltaPct: number | null
  riskDistribution: RiskSegment[]
  totalPersonnelForDonut: number
  subUnitBars: SubUnitBar[]
  personnel: PersonnelRow[]
  followUps: FollowUpItem[]
  recentActivity: ActivityItem[]
  notifications: NotificationItem[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchDashboard } =
  await useFetch<DashboardData>('/api/commander/dashboard')

const unreadNotifications = computed(
  () => data.value?.notifications.filter((n) => !n.read).length ?? 0
)

/* ---------------- Sidebar nav ---------------- */
const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/commander/dashboard', icon: Home },
  { label: 'My Personnel', to: '/commander/personnel', icon: Users },
  { label: 'Risk Alerts', to: '/commander/alerts', icon: AlertTriangle },
  { label: 'Follow-ups', to: '/commander/follow-ups', icon: CalendarClock },
  { label: 'Unit Reports', to: '/commander/reports', icon: ClipboardList },
  { label: 'My Profile', to: '/commander/profile', icon: User },
  { label: 'Security', to: '/commander/security', icon: ShieldCheck },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function logout() {
  await useFetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

/* ---------------- Dark mode (persisted) ---------------- */
const darkModeCookie = useCookie<'dark' | 'light'>('surakshit-theme', { default: () => 'dark' })
const darkMode = ref(darkModeCookie.value === 'dark')

useHead(() => ({
  htmlAttrs: { class: darkMode.value ? 'dark' : '' },
}))

function toggleDarkMode() {
  darkMode.value = !darkMode.value
  darkModeCookie.value = darkMode.value ? 'dark' : 'light'
}

/* ---------------- Search (top bar, global) ---------------- */
const searchQuery = ref('')
function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/commander/search', query: { q } })
}

/* ---------------- Personnel table filters ---------------- */
const tableQuery = ref('')
const levelFilter = ref<RiskLevel | 'All'>('All')
const levelFilterOptions: (RiskLevel | 'All')[] = ['All', 'Low', 'Moderate', 'Elevated', 'High']

const filteredPersonnel = computed<PersonnelRow[]>(() => {
  const list = data.value?.personnel ?? []
  const q = tableQuery.value.trim().toLowerCase()
  return list.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.subUnit.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    const matchesLevel = levelFilter.value === 'All' || p.level === levelFilter.value
    return matchesQuery && matchesLevel
  })
})

/* ---------------- Notifications dropdown ---------------- */
const notificationsOpen = ref(false)
function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
}

/* ---------------- Risk level visual tokens ---------------- */
const riskTone: Record<RiskLevel, { text: string; ring: string; badgeBg: string; dot: string }> = {
  Low: { text: 'text-emerald-400', ring: '#34d399', badgeBg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  Moderate: { text: 'text-blue-400', ring: '#60a5fa', badgeBg: 'bg-blue-500/15', dot: 'bg-blue-400' },
  Elevated: { text: 'text-amber-400', ring: '#fbbf24', badgeBg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  High: { text: 'text-red-400', ring: '#f87171', badgeBg: 'bg-red-500/15', dot: 'bg-red-400' },
}

const statIconMap: Record<StatCard['icon'], LucideIcon> = {
  users: Users,
  alert: AlertTriangle,
  clock: CalendarClock,
  check: CheckCircle2,
}

const followUpStatusTone: Record<FollowUpItem['status'], string> = {
  Pending: 'bg-amber-500/15 text-amber-400',
  Overdue: 'bg-red-500/15 text-red-400',
  Scheduled: 'bg-blue-500/15 text-blue-400',
}

/* ---------------- Chart geometry helpers ---------------- */
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

function subUnitBarMax(bars: SubUnitBar[]) {
  return Math.max(1, ...bars.flatMap((b) => [b.low, b.moderate, b.elevated, b.high]))
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

function levelClasses(level: RiskLevel) {
  return `${riskTone[level].badgeBg} ${riskTone[level].text}`
}

const now = new Date()
const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
const formattedTime = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

const ICON_SIZE = 18
const ICON_SIZE_SM = 15
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <!-- ================= Sidebar ================= -->
    <aside class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
          <ShieldCheck :size="20" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-white">Surakshit AI</p>
          <p class="text-[10px] leading-tight text-slate-400">Personnel Stress &amp; Welfare Monitoring</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 pb-4">
        <NuxtLink
          v-for="item in navItems" :key="item.label" :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="isActive(item.to) ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <component :is="item.icon" :size="ICON_SIZE" :stroke-width="1.5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mx-3 mb-3 rounded-xl border border-white/5 bg-white/5 p-4">
        <Building2 :size="18" :stroke-width="1.5" class="text-blue-400" />
        <p class="mt-2 text-xs font-semibold text-slate-200">{{ data?.commander.unit ?? 'Your Unit' }}</p>
        <p class="mt-1 text-[11px] text-slate-400">Command Overview</p>
      </div>

      <div class="border-t border-white/5 px-3 py-3">
        <button
          type="button" @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut :size="ICON_SIZE" :stroke-width="1.5" />
          Logout
        </button>
      </div>
    </aside>

    <!-- ================= Main ================= -->
    <div class="flex min-h-screen flex-1 flex-col">
      <!-- Top bar -->
      <header class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5">
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Toggle menu">
          <Menu :size="20" />
        </button>

        <form class="relative max-w-md flex-1" @submit.prevent="submitSearch">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            v-model="searchQuery" type="text" placeholder="Search personnel, sub-units..."
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
          >
        </form>

        <div class="ml-auto flex items-center gap-4">
          <!-- Notifications -->
          <div class="relative">
            <button
              type="button" @click="toggleNotifications"
              class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label="Notifications"
            >
              <Bell :size="20" :stroke-width="1.5" />
              <span
                v-if="unreadNotifications"
                class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              >{{ unreadNotifications }}</span>
            </button>

            <div
              v-if="notificationsOpen"
              class="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-white/10 bg-[#111a2e] p-2 shadow-xl"
            >
              <p class="px-2 py-1.5 text-xs font-bold text-white">Notifications</p>
              <div v-if="!data?.notifications.length" class="px-2 py-4 text-center text-xs text-slate-500">
                You're all caught up.
              </div>
              <NuxtLink
                v-for="n in data?.notifications" :key="n.id" to="/commander/notifications"
                class="flex items-start gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/5"
              >
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :class="n.read ? 'bg-transparent' : 'bg-blue-400'"></span>
                <span>
                  <span class="block font-medium text-slate-200">{{ n.title }}</span>
                  <span class="text-[10px] text-slate-500">{{ n.timeLabel }}</span>
                </span>
              </NuxtLink>
            </div>
          </div>

          <button
            type="button" @click="toggleDarkMode"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <Sun v-if="darkMode" :size="20" :stroke-width="1.5" />
            <Moon v-else :size="20" :stroke-width="1.5" />
          </button>

          <NuxtLink to="/commander/profile" class="flex items-center gap-2.5 border-l border-white/10 pl-4">
            <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-700">
              <img v-if="data?.commander.avatarUrl" :src="data.commander.avatarUrl" class="h-full w-full object-cover" alt="">
              <User v-else :size="18" :stroke-width="1.5" class="text-slate-300" />
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-white">{{ data?.commander.name ?? '—' }}</p>
              <p class="text-[11px] text-slate-400">{{ data?.commander.rank ?? '' }}</p>
            </div>
            <ChevronDown :size="16" class="text-slate-500" />
          </NuxtLink>
        </div>
      </header>

      <main class="flex-1 space-y-6 p-6">
        <!-- Title row -->
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-extrabold tracking-tight text-white">Command Dashboard</h1>
            <p class="mt-1 text-sm text-slate-400">Welfare and stress overview for {{ data?.commander.unit ?? 'your unit' }}</p>
          </div>
          <span class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300">
            <Calendar :size="14" :stroke-width="1.5" class="text-slate-400" />
            {{ formattedDate }} &middot; {{ formattedTime }}
          </span>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading unit dashboard…</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load unit dashboard</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/commander/dashboard</code></p>
          <button type="button" @click="fetchDashboard()" class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Retry</button>
        </div>

        <!-- Content -->
        <template v-else-if="data">
          <!-- Stat cards -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <div v-for="card in data.statCards" :key="card.label" class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <component :is="statIconMap[card.icon]" :size="15" :stroke-width="1.5" />
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
              <div class="flex items-center gap-2">
                <TrendingUp :size="ICON_SIZE" :stroke-width="1.5" class="text-blue-400" />
                <h3 class="text-sm font-bold text-white">Unit Stress Level Trend</h3>
              </div>
              <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="h-48 w-full flex-1">
                  <defs>
                    <linearGradient id="cmdStressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.35" />
                      <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <line v-for="g in 5" :key="g" x1="0" :x2="chartW" :y1="(chartH / 5) * g" :y2="(chartH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                  <path :d="buildStressAreaPath(data.stressTrend)" fill="url(#cmdStressFill)" />
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
              <h3 class="text-sm font-bold text-white">Unit Risk Distribution</h3>
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

          <!-- Sub-unit bars + Follow-ups + Recent activity -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.2fr_1.2fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Risk Level by Sub-Unit</h3>
              <div class="mt-5 flex h-56 items-end gap-3">
                <div v-for="bar in data.subUnitBars" :key="bar.name" class="flex flex-1 flex-col items-center gap-1.5">
                  <div class="flex h-44 w-full items-end justify-center gap-0.5">
                    <div class="w-1/4 rounded-t bg-emerald-400" :style="{ height: (bar.low / subUnitBarMax(data.subUnitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-amber-400" :style="{ height: (bar.moderate / subUnitBarMax(data.subUnitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-orange-400" :style="{ height: (bar.elevated / subUnitBarMax(data.subUnitBars)) * 100 + '%' }"></div>
                    <div class="w-1/4 rounded-t bg-red-400" :style="{ height: (bar.high / subUnitBarMax(data.subUnitBars)) * 100 + '%' }"></div>
                  </div>
                  <span class="text-[10px] text-slate-500">{{ bar.name }}</span>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CalendarClock :size="ICON_SIZE" :stroke-width="1.5" class="text-amber-400" />
                  <h3 class="text-sm font-bold text-white">Follow-ups</h3>
                </div>
                <NuxtLink to="/commander/follow-ups" class="text-xs font-semibold text-blue-400 hover:underline">View All</NuxtLink>
              </div>
              <div class="mt-4 space-y-3">
                <div v-if="!data.followUps.length" class="text-xs text-slate-500">No pending follow-ups.</div>
                <div v-for="(f, i) in data.followUps" :key="i" class="rounded-xl border border-white/5 p-3">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-xs font-semibold text-white">{{ f.personnelName }}</p>
                      <p class="text-[11px] text-slate-500">{{ f.personnelId }} &middot; {{ f.reason }}</p>
                    </div>
                    <span class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold" :class="followUpStatusTone[f.status]">{{ f.status }}</span>
                  </div>
                  <p class="mt-2 text-[11px] text-slate-400">Due {{ f.dueDate }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <h3 class="text-sm font-bold text-white">Recent Activity</h3>
              <div class="mt-4 space-y-4">
                <div v-if="!data.recentActivity.length" class="text-xs text-slate-500">No recent activity.</div>
                <div v-for="(item, i) in data.recentActivity" :key="i" class="flex items-start gap-3">
                  <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <ChevronRight :size="12" :stroke-width="2" />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-slate-200">{{ item.text }}</p>
                    <p class="mt-0.5 text-[11px] text-slate-500">{{ item.by }} &middot; {{ item.time }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Personnel table -->
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Users :size="ICON_SIZE" :stroke-width="1.5" class="text-blue-400" />
                <h3 class="text-sm font-bold text-white">Unit Personnel</h3>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="relative">
                  <Search :size="14" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    v-model="tableQuery" type="text" placeholder="Filter by name, ID, sub-unit..."
                    class="w-56 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50"
                  >
                </div>
                <div class="relative">
                  <Filter :size="13" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    v-model="levelFilter"
                    class="appearance-none rounded-lg border border-white/10 bg-white/5 py-1.5 pl-7 pr-7 text-xs text-slate-200 outline-none focus:border-blue-500/50"
                  >
                    <option v-for="opt in levelFilterOptions" :key="opt" :value="opt">{{ opt === 'All' ? 'All Levels' : opt }}</option>
                  </select>
                </div>
              </div>
            </div>

            <table class="mt-4 w-full text-left text-xs">
              <thead>
                <tr class="text-slate-500">
                  <th class="pb-2 font-medium">ID</th>
                  <th class="pb-2 font-medium">Name</th>
                  <th class="pb-2 font-medium">Sub-Unit</th>
                  <th class="pb-2 font-medium">Level</th>
                  <th class="pb-2 font-medium">Score</th>
                  <th class="pb-2 font-medium">Last Assessment</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!filteredPersonnel.length">
                  <td colspan="6" class="py-4 text-center text-slate-500">
                    {{ tableQuery || levelFilter !== 'All' ? 'No personnel match your filters.' : 'No personnel on record.' }}
                  </td>
                </tr>
                <tr v-for="p in filteredPersonnel" :key="p.id" class="border-t border-white/5">
                  <td class="py-2 font-medium text-blue-400">{{ p.id }}</td>
                  <td class="py-2 text-slate-200">{{ p.name }}</td>
                  <td class="py-2 text-slate-400">{{ p.subUnit }}</td>
                  <td class="py-2"><span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="levelClasses(p.level)">{{ p.level }}</span></td>
                  <td class="py-2 font-semibold text-slate-200">{{ p.score }}</td>
                  <td class="py-2 text-slate-400">{{ p.lastAssessment }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </main>

      <footer class="flex items-center justify-between border-t border-white/5 px-6 py-4 text-[11px] text-slate-500">
        <span>Surakshit AI &nbsp;|&nbsp; Personnel Stress &amp; Welfare Monitoring System</span>
        <span class="flex items-center gap-3">Healthy Personnel &nbsp;|&nbsp; Stronger Forces &nbsp;|&nbsp; Safer Nation</span>
      </footer>
    </div>
  </div>
</template>