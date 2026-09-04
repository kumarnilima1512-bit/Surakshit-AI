<!--
  pages/welfare/dashboard.vue
  Nuxt 3 + Composition API + Tailwind, styled to match the provided
  Welfare Officer dashboard mockup (Assigned Unit card, Intervention
  Status donut, Welfare Recommendations, labeled stress trend line).
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
  Leaf,
  Moon as SleepIcon,
  Briefcase,
  Activity,
  Users as SocialIcon,
  Settings,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/welfare/dashboard -> DashboardData
   No hardcoded/sample values are rendered - everything comes from data.
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type FooterTone = 'positive' | 'negative' | 'neutral'

interface WelfareProfile {
  name: string
  role: string
  unitName: string
  unitCode: string
  lastLoginLabel: string
  avatarUrl: string | null
}

interface StatCard {
  label: string
  value: number | string
  icon: 'users' | 'shield' | 'user' | 'alertCircle' | 'alertTriangle'
  footerValue: string     // e.g. "+4%" or "44.4% of total"
  footerText: string      // e.g. "vs. last month" (blank when footerValue already reads complete)
  footerTone: FooterTone
  urgentText?: string     // e.g. "2 urgent" shown in red beneath the footer
}

interface Segment {
  label: string
  pct: number
  count: number
  color: string
}

interface StressTrend {
  labels: string[]
  values: number[]
}

interface HighRiskRow {
  id: string
  name: string
  unit: string
  score: number
  riskLevel: RiskLevel
  lastAssessment: string
}

interface RecentAssessmentRow {
  dateTime: string
  personnelId: string
  score: number
  riskLevel: RiskLevel
}

interface WelfareRecommendation {
  title: string
  description: string
  priority: RiskLevel
  icon: 'sleep' | 'activity' | 'workload' | 'social'
}

interface AlertItem {
  title: string
  detail: string
  time: string
  tone: 'red' | 'amber' | 'violet' | 'blue'
}

interface NotificationItem {
  id: string
  title: string
  timeLabel: string
  read: boolean
}

interface DashboardData {
  officer: WelfareProfile
  statCards: StatCard[]
  riskDistribution: Segment[]
  totalPersonnelForDonut: number
  riskDistributionScopeLabel: string
  stressTrend: StressTrend
  trendRangeLabel: string
  highRiskPersonnel: HighRiskRow[]
  interventionStatus: Segment[]
  totalInterventions: number
  recentAssessments: RecentAssessmentRow[]
  welfareRecommendations: WelfareRecommendation[]
  recentAlerts: AlertItem[]
  notifications: NotificationItem[]
}

/* ---------------- Data fetching (Composition API: useFetch) ---------------- */
const { data, pending: loading, error, refresh: fetchDashboard } =
  await useFetch<DashboardData>('/api/welfare/dashboard')

const unreadNotifications = computed(
  () => data.value?.notifications.filter((n) => !n.read).length ?? 0
)

/* ---------------- Sidebar nav (route-aware) ---------------- */
const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  badgeKey?: 'highRisk' | 'followUps'
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/welfare/dashboard', icon: Home },
  { label: 'Personnel', to: '/welfare/personnel', icon: Users },
  { label: 'High-Risk Cases', to: '/welfare/high-risk-cases', icon: AlertTriangle, badgeKey: 'highRisk' },
  { label: 'Interventions', to: '/welfare/interventions', icon: ShieldCheck },
  { label: 'Follow-ups', to: '/welfare/follow-ups', icon: ClipboardList, badgeKey: 'followUps' },
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

/* ---------------- Notifications dropdown ---------------- */
const notificationsOpen = ref(false)
function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value
  profileOpen.value = false
}

/* ---------------- Profile dropdown ---------------- */
const profileOpen = ref(false)
function toggleProfile() {
  profileOpen.value = !profileOpen.value
  notificationsOpen.value = false
}
async function handleProfileAction(action: 'Profile' | 'Settings' | 'Logout') {
  profileOpen.value = false
  if (action === 'Logout') return logout()
  await navigateTo(`/welfare/${action.toLowerCase()}`)
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) {
    notificationsOpen.value = false
    profileOpen.value = false
  }
}
onMounted(() => window.addEventListener('click', handleOutsideClick))
onUnmounted(() => window.removeEventListener('click', handleOutsideClick))

/* ---------------- Search ---------------- */
const searchQuery = ref('')
function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/welfare/search', query: { q } })
}

/* ---------------- Risk level visual tokens ---------------- */
const riskTone: Record<RiskLevel, { text: string; badgeBg: string; dot: string }> = {
  Low: { text: 'text-emerald-400', badgeBg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  Moderate: { text: 'text-blue-400', badgeBg: 'bg-blue-500/15', dot: 'bg-blue-400' },
  Elevated: { text: 'text-amber-400', badgeBg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  High: { text: 'text-red-400', badgeBg: 'bg-red-500/15', dot: 'bg-red-400' },
}

/* ---------------- Stat card icon + tone tokens ---------------- */
const statIconMap: Record<StatCard['icon'], LucideIcon> = {
  users: Users,
  shield: ShieldCheck,
  user: User,
  alertCircle: AlertTriangle,
  alertTriangle: AlertTriangle,
}
const statIconBg: Record<StatCard['icon'], string> = {
  users: 'bg-blue-500/15 text-blue-400',
  shield: 'bg-emerald-500/15 text-emerald-400',
  user: 'bg-amber-500/15 text-amber-400',
  alertCircle: 'bg-orange-500/15 text-orange-400',
  alertTriangle: 'bg-red-500/15 text-red-400',
}
const footerToneClass: Record<FooterTone, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-slate-300',
}

/* ---------------- Alert tone tokens ---------------- */
const alertToneClasses: Record<AlertItem['tone'], string> = {
  red: 'bg-red-500/15 text-red-400',
  amber: 'bg-amber-500/15 text-amber-400',
  violet: 'bg-violet-500/15 text-violet-400',
  blue: 'bg-blue-500/15 text-blue-400',
}

/* ---------------- Welfare recommendation priority + icon tokens ---------------- */
const priorityBadgeClasses: Record<RiskLevel, string> = {
  Low: 'bg-emerald-500/15 text-emerald-400',
  Moderate: 'bg-blue-500/15 text-blue-400',
  Elevated: 'bg-amber-500/15 text-amber-400',
  High: 'bg-red-500/15 text-red-400',
}
const recommendationIconMap: Record<WelfareRecommendation['icon'], LucideIcon> = {
  sleep: SleepIcon,
  activity: Activity,
  workload: Briefcase,
  social: SocialIcon,
}

/* ---------------- Donut geometry (shared by Risk Distribution + Intervention Status) ---------------- */
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

/* ---------------- Stress trend geometry (single labeled line) ---------------- */
const trendW = 640
const trendH = 200
const trendMax = 10

function trendPath(values: number[]) {
  if (!values.length) return ''
  const stepX = trendW / Math.max(values.length - 1, 1)
  return values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${trendH - (v / trendMax) * trendH}`)
    .join(' ')
}
function pointXY(values: number[], i: number) {
  const stepX = trendW / Math.max(values.length - 1, 1)
  return { x: i * stepX, y: trendH - (values[i] / trendMax) * trendH }
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <!-- ================= Sidebar ================= -->
    <aside class="relative flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]">
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
          class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="isActive(item.to) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <span class="flex items-center gap-3">
            <component :is="item.icon" :size="ICON_SIZE" :stroke-width="1.5" />
            {{ item.label }}
          </span>
          <span
            v-if="item.badgeKey === 'highRisk' && data?.highRiskPersonnel.length"
            class="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >{{ data.highRiskPersonnel.length }}</span>
        </NuxtLink>
      </nav>

      <!-- Care / wellbeing panel -->
      <div class="mx-3 mb-3 rounded-xl border border-white/5 bg-emerald-500/5 p-4">
        <Leaf :size="20" class="text-emerald-400" :stroke-width="1.5" />
        <p class="mt-2 text-sm font-bold leading-snug text-emerald-300">Care Today</p>
        <p class="text-sm font-bold leading-snug text-emerald-300">Stronger Tomorrow</p>
        <p class="mt-2 text-[11px] leading-relaxed text-slate-400">Mental well-being builds a stronger force.</p>
      </div>

      <div class="border-t border-white/5 px-3 py-3">
        <NuxtLink to="/welfare/profile" class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
          <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
            <img v-if="data?.officer.avatarUrl" :src="data.officer.avatarUrl" class="h-full w-full object-cover" alt="">
            <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
          </div>
          <div class="flex-1 leading-tight">
            <p class="text-xs font-semibold text-white">{{ data?.officer.name }}</p>
            <p class="text-[11px] text-slate-400">{{ data?.officer.role }}</p>
          </div>
        </NuxtLink>
        <button
          type="button" @click="logout"
          class="mt-1 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut :size="14" :stroke-width="1.5" />
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
            v-model="searchQuery" type="text" placeholder="Search personnel, unit, or ID..."
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
          >
        </form>

        <div class="ml-auto flex items-center gap-4">
          <div class="relative" data-dropdown-root>
            <button
              type="button" @click.stop="toggleNotifications"
              class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
              aria-label="Notifications"
            >
              <BellIcon :size="20" :stroke-width="1.5" />
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
                v-for="n in data?.notifications" :key="n.id" to="/welfare/notifications"
                class="flex items-start gap-2 rounded-lg px-2 py-2 text-xs hover:bg-white/5"
              >
                <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" :class="n.read ? 'bg-transparent' : 'bg-emerald-400'"></span>
                <span>
                  <span class="block font-medium text-slate-200">{{ n.title }}</span>
                  <span class="text-[10px] text-slate-500">{{ n.timeLabel }}</span>
                </span>
              </NuxtLink>
            </div>
          </div>

          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Toggle theme">
            <Moon :size="20" :stroke-width="1.5" />
          </button>

          <div class="relative border-l border-white/10 pl-4" data-dropdown-root>
            <button type="button" @click.stop="toggleProfile" class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                <img v-if="data?.officer.avatarUrl" :src="data.officer.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">{{ data?.officer.name }}</p>
                <p class="text-[11px] text-slate-400">{{ data?.officer.role }}</p>
              </div>
              <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="{ 'rotate-180': profileOpen }" />
            </button>

            <div
              v-if="profileOpen"
              class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in (['Profile', 'Settings', 'Logout'] as const)" :key="action"
                type="button" @click="handleProfileAction(action)"
                class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-6">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading welfare dashboard…</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load the welfare dashboard</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/dashboard</code></p>
          <button type="button" @click="fetchDashboard()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <!-- Content: main (left) + rail (right) -->
        <div v-else-if="data" class="flex flex-col gap-4 xl:flex-row xl:items-start">
          <!-- ============ Left / main column ============ -->
          <div class="min-w-0 flex-1 space-y-4">
            <!-- Welcome banner -->
            <div class="relative flex items-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-slate-800 to-slate-900 p-6">
              <svg class="pointer-events-none absolute inset-y-0 right-0 h-full w-64 opacity-25" viewBox="0 0 260 160" preserveAspectRatio="xMaxYMax slice">
                <path d="M0 160 L60 70 L90 120 L140 40 L180 110 L220 60 L260 120 L260 160 Z" fill="#1e293b" />
                <circle cx="200" cy="55" r="10" fill="#1e293b" />
              </svg>
              <div class="relative z-10 flex items-center gap-4">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <User :size="22" :stroke-width="1.5" />
                </div>
                <div>
                  <p class="text-lg font-bold text-white">Welcome, {{ data.officer.name }}</p>
                  <p class="mt-0.5 text-sm text-slate-300">Your support makes a difference.</p>
                  <p class="text-sm text-slate-300">Together for a healthier and stronger force.</p>
                </div>
              </div>
              <p class="relative z-10 ml-auto max-w-[11rem] shrink-0 text-right text-sm italic text-slate-300">
                "A healthy mind<br>is a stronger force."
              </p>
            </div>

            <!-- Stat cards -->
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div v-for="card in data.statCards" :key="card.label" class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="statIconBg[card.icon]">
                  <component :is="statIconMap[card.icon]" :size="16" :stroke-width="1.5" />
                </div>
                <p class="mt-3 text-xs font-medium text-slate-400">{{ card.label }}</p>
                <p class="mt-1 text-2xl font-extrabold text-white">{{ card.value }}</p>
                <p class="mt-1 text-[11px] font-semibold" :class="footerToneClass[card.footerTone]">
                  {{ card.footerValue }} <span class="font-normal text-slate-500">{{ card.footerText }}</span>
                </p>
                <p v-if="card.urgentText" class="mt-0.5 text-[11px] font-semibold text-red-400">→ {{ card.urgentText }}</p>
              </div>
            </div>

            <!-- Risk Level Distribution + Average Stress Trend -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Risk Level Distribution</h3>
                  <span class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    {{ data.riskDistributionScopeLabel }}
                    <ChevronDown :size="12" />
                  </span>
                </div>
                <div class="relative mt-4 flex items-center justify-center">
                  <svg viewBox="0 0 180 180" class="h-36 w-36 -rotate-90">
                    <circle v-for="seg in buildDonutSegments(data.riskDistribution)" :key="seg.label" cx="90" cy="90" r="70" fill="none" :stroke="seg.color" stroke-width="20" :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset" />
                  </svg>
                  <div class="absolute text-center">
                    <p class="text-2xl font-extrabold text-white">{{ data.totalPersonnelForDonut }}</p>
                    <p class="text-[11px] text-slate-400">Total Personnel</p>
                  </div>
                </div>
                <div class="mt-4 space-y-2">
                  <div v-for="seg in data.riskDistribution" :key="seg.label" class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2 text-slate-300">
                      <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>{{ seg.label }}
                    </span>
                    <span class="flex items-center gap-2 font-semibold text-slate-400">{{ seg.count }} <span class="text-slate-500">{{ seg.pct }}%</span></span>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Average Stress Trend</h3>
                  <span class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    {{ data.trendRangeLabel }}
                    <ChevronDown :size="12" />
                  </span>
                </div>
                <svg :viewBox="`0 0 ${trendW} ${trendH + 26}`" class="mt-4 h-48 w-full">
                  <line v-for="g in 5" :key="g" x1="0" :x2="trendW" :y1="(trendH / 5) * g" :y2="(trendH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                  <path :d="trendPath(data.stressTrend.values)" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                  <g v-for="(v, i) in data.stressTrend.values" :key="i">
                    <circle :cx="pointXY(data.stressTrend.values, i).x" :cy="pointXY(data.stressTrend.values, i).y" r="3.5" fill="#34d399" />
                    <text :x="pointXY(data.stressTrend.values, i).x" :y="pointXY(data.stressTrend.values, i).y - 10" text-anchor="middle" font-size="11" fill="#cbd5e1">{{ v }}</text>
                    <text :x="pointXY(data.stressTrend.values, i).x" :y="trendH + 20" text-anchor="middle" font-size="11" fill="#64748b">{{ data.stressTrend.labels[i] }}</text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- High-Risk Personnel + Intervention Status -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">High-Risk Personnel</h3>
                  <NuxtLink to="/welfare/high-risk-cases" class="text-xs font-semibold text-emerald-400 hover:underline">View All →</NuxtLink>
                </div>
                <div class="mt-3 overflow-x-auto">
                  <table class="w-full min-w-[520px] text-left text-xs">
                    <thead>
                      <tr class="text-slate-500">
                        <th class="pb-2 font-medium">ID</th>
                        <th class="pb-2 font-medium">Name</th>
                        <th class="pb-2 font-medium">Unit</th>
                        <th class="pb-2 font-medium">Score</th>
                        <th class="pb-2 font-medium">Risk</th>
                        <th class="pb-2 font-medium">Last Assessment</th>
                        <th class="pb-2 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!data.highRiskPersonnel.length">
                        <td colspan="7" class="py-4 text-center text-slate-500">No high-risk personnel.</td>
                      </tr>
                      <tr v-for="p in data.highRiskPersonnel" :key="p.id" class="border-t border-white/5">
                        <td class="py-2 font-medium text-emerald-400">{{ p.id }}</td>
                        <td class="py-2 text-slate-200">{{ p.name }}</td>
                        <td class="py-2 text-slate-400">{{ p.unit }}</td>
                        <td class="py-2 font-semibold text-slate-200">{{ p.score }}</td>
                        <td class="py-2">
                          <span class="rounded-md px-2 py-0.5 text-[10px] font-bold" :class="[riskTone[p.riskLevel].badgeBg, riskTone[p.riskLevel].text]">{{ p.riskLevel }}</span>
                        </td>
                        <td class="py-2 text-slate-500">{{ p.lastAssessment }}</td>
                        <td class="py-2 text-right">
                          <NuxtLink :to="`/welfare/personnel/${p.id}`" class="text-[11px] font-semibold text-emerald-400 hover:underline">View</NuxtLink>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <h3 class="text-sm font-bold text-white">Intervention Status</h3>
                <div class="relative mt-4 flex items-center justify-center">
                  <svg viewBox="0 0 180 180" class="h-36 w-36 -rotate-90">
                    <circle v-for="seg in buildDonutSegments(data.interventionStatus)" :key="seg.label" cx="90" cy="90" r="70" fill="none" :stroke="seg.color" stroke-width="20" :stroke-dasharray="seg.dasharray" :stroke-dashoffset="seg.dashoffset" />
                  </svg>
                  <div class="absolute text-center">
                    <p class="text-2xl font-extrabold text-white">{{ data.totalInterventions }}</p>
                    <p class="text-[11px] text-slate-400">Total Interventions</p>
                  </div>
                </div>
                <div class="mt-4 space-y-2">
                  <div v-for="seg in data.interventionStatus" :key="seg.label" class="flex items-center justify-between text-xs">
                    <span class="flex items-center gap-2 text-slate-300">
                      <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seg.color }"></span>{{ seg.label }}
                    </span>
                    <span class="flex items-center gap-2 font-semibold text-slate-400">{{ seg.count }} <span class="text-slate-500">({{ seg.pct }}%)</span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Assessments + Welfare Recommendations -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Recent Assessments</h3>
                  <NuxtLink to="/welfare/analytics" class="text-xs font-semibold text-emerald-400 hover:underline">View All →</NuxtLink>
                </div>
                <div class="mt-3 overflow-x-auto">
                  <table class="w-full min-w-[360px] text-left text-xs">
                    <thead>
                      <tr class="text-slate-500">
                        <th class="pb-2 font-medium">Date &amp; Time</th>
                        <th class="pb-2 font-medium">Personnel ID</th>
                        <th class="pb-2 font-medium">Stress Score</th>
                        <th class="pb-2 text-right font-medium">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="!data.recentAssessments.length">
                        <td colspan="4" class="py-4 text-center text-slate-500">No recent assessments.</td>
                      </tr>
                      <tr v-for="(row, i) in data.recentAssessments" :key="i" class="border-t border-white/5">
                        <td class="py-2 text-slate-400">{{ row.dateTime }}</td>
                        <td class="py-2 font-medium text-emerald-400">{{ row.personnelId }}</td>
                        <td class="py-2 font-semibold text-slate-200">{{ row.score }}</td>
                        <td class="py-2 text-right">
                          <span class="font-semibold" :class="riskTone[row.riskLevel].text">{{ row.riskLevel }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-bold text-white">Welfare Recommendations (Top 5)</h3>
                  <NuxtLink to="/welfare/interventions" class="text-xs font-semibold text-emerald-400 hover:underline">View All →</NuxtLink>
                </div>
                <div class="mt-3 space-y-3">
                  <div v-if="!data.welfareRecommendations.length" class="text-xs text-slate-500">No recommendations right now.</div>
                  <div v-for="rec in data.welfareRecommendations" :key="rec.title" class="flex items-center gap-3">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      <component :is="recommendationIconMap[rec.icon]" :size="15" :stroke-width="1.5" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-xs font-semibold text-white">{{ rec.title }}</p>
                      <p class="truncate text-[11px] text-slate-400">{{ rec.description }}</p>
                    </div>
                    <span class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold" :class="priorityBadgeClasses[rec.priority]">{{ rec.priority }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ Right rail ============ -->
          <div class="w-full shrink-0 space-y-4 xl:w-[300px]">
            <!-- Assigned unit -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex items-start gap-3">
                <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck :size="16" :stroke-width="1.5" />
                </div>
                <div class="flex-1">
                  <p class="text-[11px] text-slate-400">Assigned Unit</p>
                  <p class="text-sm font-bold text-white">{{ data.officer.unitName }}</p>
                  <p class="text-[11px] text-slate-500">Unit Code: {{ data.officer.unitCode }}</p>
                </div>
              </div>
              <NuxtLink to="/welfare/unit" class="mt-3 block text-[11px] font-semibold text-emerald-400 hover:underline">View Unit Details →</NuxtLink>
            </div>

            <!-- Recent alerts -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold text-white">Recent Alerts</h3>
                <NuxtLink to="/welfare/high-risk-cases" class="text-[11px] font-semibold text-emerald-400 hover:underline">View All →</NuxtLink>
              </div>
              <div class="mt-3 space-y-3.5">
                <div v-if="!data.recentAlerts.length" class="text-xs text-slate-500">No recent alerts.</div>
                <div v-for="(a, i) in data.recentAlerts" :key="i" class="flex items-start gap-2.5">
                  <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" :class="alertToneClasses[a.tone]">
                    <AlertTriangle :size="13" :stroke-width="1.5" />
                  </div>
                  <div>
                    <p class="text-xs font-medium text-slate-200">{{ a.title }}</p>
                    <p class="mt-0.5 text-[11px] text-slate-400">{{ a.detail }}</p>
                    <p class="mt-0.5 text-[10px] text-slate-500">{{ a.time }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <h3 class="text-xs font-bold text-white">Quick Actions</h3>
              <div class="mt-3 space-y-2">
                <NuxtLink to="/welfare/high-risk-cases" class="flex items-center gap-3 rounded-xl bg-emerald-600/15 p-3 text-left hover:bg-emerald-600/25">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/25 text-emerald-300"><Users :size="15" :stroke-width="1.5" /></span>
                  <span class="text-xs font-semibold text-slate-100">View High-Risk Cases</span>
                </NuxtLink>
                <NuxtLink to="/welfare/follow-ups/new" class="flex items-center gap-3 rounded-xl bg-blue-600/15 p-3 text-left hover:bg-blue-600/25">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/25 text-blue-300"><ClipboardList :size="15" :stroke-width="1.5" /></span>
                  <span class="text-xs font-semibold text-slate-100">Schedule Follow-up</span>
                </NuxtLink>
                <NuxtLink to="/welfare/notes/new" class="flex items-center gap-3 rounded-xl bg-violet-600/15 p-3 text-left hover:bg-violet-600/25">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/25 text-violet-300"><FileText :size="15" :stroke-width="1.5" /></span>
                  <span class="text-xs font-semibold text-slate-100">Add Welfare Note</span>
                </NuxtLink>
                <NuxtLink to="/welfare/reports/new" class="flex items-center gap-3 rounded-xl bg-slate-600/15 p-3 text-left hover:bg-slate-600/25">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-500/25 text-slate-300"><BarChart2 :size="15" :stroke-width="1.5" /></span>
                  <span class="text-xs font-semibold text-slate-100">Generate Unit Report</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Profile summary -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                  <img v-if="data.officer.avatarUrl" :src="data.officer.avatarUrl" class="h-full w-full object-cover" alt="">
                  <User v-else :size="20" :stroke-width="1.5" class="text-slate-300" />
                </div>
                <div>
                  <p class="text-sm font-bold text-white">{{ data.officer.name }}</p>
                  <p class="text-[11px] text-slate-400">{{ data.officer.role }}</p>
                </div>
              </div>
              <div class="mt-3 space-y-1.5 border-t border-white/5 pt-3 text-[11px]">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Unit</span>
                  <span class="font-semibold text-slate-200">{{ data.officer.unitName }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Role</span>
                  <span class="font-semibold text-slate-200">{{ data.officer.role }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Last Login</span>
                  <span class="font-semibold text-slate-200">{{ data.officer.lastLoginLabel }}</span>
                </div>
              </div>
              <div class="mt-3 flex items-center gap-2">
                <NuxtLink
                  to="/welfare/profile/edit"
                  class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                >
                  Edit Profile
                </NuxtLink>
                <NuxtLink
                  to="/welfare/settings"
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  aria-label="Settings"
                >
                  <Settings :size="14" :stroke-width="1.5" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>