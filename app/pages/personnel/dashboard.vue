<!--
  pages/personnel/dashboard.vue
  Nuxt 3 + Composition API + Tailwind rewrite.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Home,
  FileText,
  BarChart2,
  CheckCircle2,
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
  AlertTriangle,
  Calendar,
  Zap,
  TrendingUp,
  Moon as SleepIcon,
  Activity,
  Briefcase,
  Users,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/personnel/dashboard -> DashboardData
   No hardcoded/sample values are rendered - everything comes from data.
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

interface ProfileSummary {
  serviceId: string
  name: string
  rank: string
  status: 'Active' | 'On Leave' | 'Inactive'
  unit: string
  joinedDate: string
  avatarUrl: string | null
}

interface StressPoint {
  dateLabel: string
  score: number
}

interface RecommendationCard {
  title: string
  description: string
  icon: 'sleep' | 'activity' | 'workload' | 'social'
}

interface RecentAssessmentRow {
  dateTime: string
  score: number
  riskLevel: RiskLevel
}

interface NotificationItem {
  id: string
  title: string
  timeLabel: string
  read: boolean
}

interface DashboardData {
  profile: ProfileSummary
  currentStressScore: number
  maxStressScore: number
  riskLevel: RiskLevel
  riskLevelNote: string
  lastAssessmentDate: string
  lastAssessmentTime: string
  nextFollowUpDate: string
  nextFollowUpRelative: string
  stressTrend: StressPoint[]
  trendRangeLabel: string
  recommendations: RecommendationCard[]
  recentAssessments: RecentAssessmentRow[]
  notifications: NotificationItem[]
}

/* ---------------- Data fetching (Composition API: useFetch) ---------------- */
const { data, pending: loading, error, refresh: fetchDashboard } =
  await useFetch<DashboardData>('/api/personnel/dashboard')

const unreadNotifications = computed(
  () => data.value?.notifications.filter((n) => !n.read).length ?? 0
)

/* ---------------- Sidebar nav (route-aware) ---------------- */
const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/personnel/dashboard', icon: Home },
  { label: 'My Assessment', to: '/personnel/assessment', icon: FileText },
  { label: 'My Stress History', to: '/personnel/history', icon: BarChart2 },
  { label: 'My Recommendations', to: '/personnel/recommendations', icon: CheckCircle2 },
  { label: 'My Profile', to: '/personnel/profile', icon: User },
  { label: 'Security', to: '/personnel/security', icon: ShieldCheck },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function logout() {
  await useFetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

/* ---------------- Dark mode (real toggle, persisted) ---------------- */
const darkModeCookie = useCookie<'dark' | 'light'>('surakshit-theme', { default: () => 'dark' })
const darkMode = ref(darkModeCookie.value === 'dark')

useHead(() => ({
  htmlAttrs: { class: darkMode.value ? 'dark' : '' },
}))

function toggleDarkMode() {
  darkMode.value = !darkMode.value
  darkModeCookie.value = darkMode.value ? 'dark' : 'light'
}

/* ---------------- Search ---------------- */
const searchQuery = ref('')
function submitSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/personnel/search', query: { q } })
}

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

const riskLevelGuide: { level: RiskLevel; range: string; note: string }[] = [
  { level: 'Low', range: '1 – 3', note: 'Healthy & Stable' },
  { level: 'Moderate', range: '3 – 5', note: 'Take Preventive Care' },
  { level: 'Elevated', range: '5 – 7', note: 'Monitor & Support' },
  { level: 'High', range: '7 – 10', note: 'Immediate Attention' },
]

/* ---------------- Gauge (circular stress score) ---------------- */
function gaugeDashArray(score: number, max: number) {
  const r = 68
  const circumference = 2 * Math.PI * r
  const pct = Math.min(Math.max(score / max, 0), 1)
  const dash = pct * circumference
  return `${dash} ${circumference - dash}`
}

/* ---------------- Trend chart geometry ---------------- */
const chartW = 760
const chartH = 220
const chartMax = 10

function trendPath(points: StressPoint[]) {
  if (!points.length) return ''
  const stepX = chartW / Math.max(points.length - 1, 1)
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${chartH - (p.score / chartMax) * chartH}`)
    .join(' ')
}
function trendPointXY(points: StressPoint[], i: number) {
  const stepX = chartW / Math.max(points.length - 1, 1)
  const p = points[i]
  if (!p) return { x: i * stepX, y: chartH }
  return { x: i * stepX, y: chartH - (p.score / chartMax) * chartH }
}

/* ---------------- Recommendation icon map ---------------- */
const recIconMap: Record<RecommendationCard['icon'], LucideIcon> = {
  sleep: SleepIcon,
  activity: Activity,
  workload: Briefcase,
  social: Users,
}

/* ---------------- Quick actions (now functional) ---------------- */
interface QuickAction {
  title: string
  sub: string
  icon: LucideIcon
  tone: 'green' | 'blue' | 'violet' | 'slate'
  to: string
}

const quickActions: QuickAction[] = [
  { title: 'Take New Assessment', sub: 'Update your current stress level', icon: Zap, tone: 'green', to: '/personnel/assessment' },
  { title: 'View My History', sub: 'Check past assessments', icon: BarChart2, tone: 'blue', to: '/personnel/history' },
  { title: 'View Recommendations', sub: 'Get personalized suggestions', icon: FileText, tone: 'violet', to: '/personnel/recommendations' },
  { title: 'Update Profile', sub: 'Manage your account details', icon: User, tone: 'slate', to: '/personnel/profile' },
]

const toneClasses: Record<QuickAction['tone'], string> = {
  green: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-400',
  violet: 'bg-violet-500/15 text-violet-400',
  slate: 'bg-slate-500/15 text-slate-300',
}

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
          :class="isActive(item.to) ? 'bg-emerald-600/90 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <component :is="item.icon" :size="ICON_SIZE" :stroke-width="1.5" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-5 pb-2">
        <p class="text-sm italic leading-snug text-blue-300/80">Stronger Minds</p>
        <p class="text-sm italic leading-snug text-blue-300/80">Build a Safer Tomorrow</p>
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
            v-model="searchQuery" type="text" placeholder="Search anything..."
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
                v-for="n in data?.notifications" :key="n.id" to="/personnel/notifications"
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

          <NuxtLink to="/personnel/profile" class="flex items-center gap-2.5 border-l border-white/10 pl-4">
            <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-700">
              <img v-if="data?.profile.avatarUrl" :src="data.profile.avatarUrl" class="h-full w-full object-cover" alt="">
              <User v-else :size="18" :stroke-width="1.5" class="text-slate-300" />
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-white">{{ data?.profile.serviceId ?? '—' }}</p>
              <p class="text-[11px] text-slate-400">{{ data?.profile.rank ?? '' }}</p>
            </div>
            <ChevronDown :size="16" class="text-slate-500" />
          </NuxtLink>
        </div>
      </header>

      <main class="flex-1 space-y-6 p-6">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading your dashboard…</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load your dashboard</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/personnel/dashboard</code></p>
          <button type="button" @click="fetchDashboard()" class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Retry</button>
        </div>

        <!-- Content -->
        <template v-else-if="data">
          <!-- Welcome banner + profile card -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[2.4fr_1fr]">
            <div class="relative flex items-center overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-slate-800 to-slate-900 p-6">
              <div class="relative z-10">
                <p class="flex items-center gap-2 text-lg font-bold text-white">
                  <span>👋</span> Welcome Back, {{ data.profile.serviceId }}
                </p>
                <p class="mt-1 text-sm text-slate-300">Your well-being matters. Stay strong, stay supported.</p>
              </div>
              <p class="relative z-10 ml-auto max-w-xs text-right text-sm italic text-slate-300">
                "A healthy mind<br>is a stronger force."
              </p>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-3">
                <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                  <img v-if="data.profile.avatarUrl" :src="data.profile.avatarUrl" class="h-full w-full object-cover" alt="">
                  <User v-else :size="26" :stroke-width="1.5" class="text-slate-300" />
                </div>
                <div>
                  <p class="text-sm font-bold text-white">{{ data.profile.serviceId }}</p>
                  <p class="text-xs text-slate-400">{{ data.profile.rank }}</p>
                  <p class="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{{ data.profile.status }}
                  </p>
                </div>
              </div>

              <div class="mt-4 space-y-2.5 border-t border-white/5 pt-4 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Unit</span>
                  <span class="font-semibold text-slate-200">{{ data.profile.unit }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Service ID</span>
                  <span class="font-semibold text-slate-200">{{ data.profile.serviceId }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-slate-400">Joined</span>
                  <span class="font-semibold text-slate-200">{{ data.profile.joinedDate }}</span>
                </div>
              </div>

              <NuxtLink
                to="/personnel/profile/edit"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                <FileText :size="ICON_SIZE_SM" />
                Edit Profile
              </NuxtLink>
            </div>
          </div>

          <!-- Stat cards -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <!-- Current stress score gauge -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <TrendingUp :size="ICON_SIZE" :stroke-width="1.5" />
                </div>
                <h3 class="text-sm font-bold text-white">Current Stress Score</h3>
              </div>
              <div class="relative mx-auto mt-3 flex h-36 w-36 items-center justify-center">
                <svg viewBox="0 0 160 160" class="h-36 w-36 -rotate-90">
                  <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" />
                  <circle
                    cx="80" cy="80" r="68" fill="none"
                    :stroke="riskTone[data.riskLevel].ring" stroke-width="12" stroke-linecap="round"
                    :stroke-dasharray="gaugeDashArray(data.currentStressScore, data.maxStressScore)"
                  />
                </svg>
                <div class="absolute text-center">
                  <p class="text-3xl font-extrabold text-white">{{ data.currentStressScore }}</p>
                  <p class="text-[11px] text-slate-500">/ {{ data.maxStressScore }}</p>
                </div>
              </div>
              <div class="mt-2 flex justify-center">
                <span class="rounded-md px-2.5 py-1 text-[11px] font-bold" :class="[riskTone[data.riskLevel].badgeBg, riskTone[data.riskLevel].text]">{{ data.riskLevel }}</span>
              </div>
            </div>

            <!-- Risk level -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg" :class="riskTone[data.riskLevel].badgeBg">
                  <AlertTriangle :size="ICON_SIZE" :stroke-width="1.5" :class="riskTone[data.riskLevel].text" />
                </div>
                <h3 class="text-sm font-bold text-white">Risk Level</h3>
              </div>
              <p class="mt-4 text-2xl font-extrabold" :class="riskTone[data.riskLevel].text">{{ data.riskLevel }}</p>
              <p class="mt-2 text-xs leading-relaxed text-slate-400">{{ data.riskLevelNote }}</p>
            </div>

            <!-- Last assessment -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <Calendar :size="ICON_SIZE" :stroke-width="1.5" />
                </div>
                <h3 class="text-sm font-bold text-white">Last Assessment</h3>
              </div>
              <p class="mt-4 text-xl font-extrabold text-white">{{ data.lastAssessmentDate }}</p>
              <p class="text-xs text-slate-400">{{ data.lastAssessmentTime }}</p>
              <NuxtLink
                to="/personnel/history"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                View Details
                <ChevronRight :size="ICON_SIZE_SM" />
              </NuxtLink>
            </div>

            <!-- Next follow-up -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <Calendar :size="ICON_SIZE" :stroke-width="1.5" />
                </div>
                <h3 class="text-sm font-bold text-white">Next Follow-up</h3>
              </div>
              <p class="mt-4 text-xl font-extrabold text-white">{{ data.nextFollowUpDate }}</p>
              <p class="text-xs text-slate-400">{{ data.nextFollowUpRelative }}</p>
              <NuxtLink
                to="/personnel/schedule"
                class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
              >
                View Schedule
                <ChevronRight :size="ICON_SIZE_SM" />
              </NuxtLink>
            </div>
          </div>

          <!-- Trend + Risk guide + Quick actions -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1.1fr_1fr]">
            <!-- Stress trend -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <BarChart2 :size="ICON_SIZE" :stroke-width="1.5" class="text-emerald-400" />
                  <div>
                    <h3 class="text-sm font-bold text-white">Stress Trend</h3>
                    <p class="text-[11px] text-slate-500">Your stress level over the last {{ data.stressTrend.length }} assessments</p>
                  </div>
                </div>
                <span class="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">{{ data.trendRangeLabel }}</span>
              </div>

              <svg v-if="data.stressTrend.length" :viewBox="`0 0 ${chartW} ${chartH + 30}`" class="mt-4 h-56 w-full">
                <defs>
                  <linearGradient id="jawanTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.3" />
                    <stop offset="100%" stop-color="#fbbf24" stop-opacity="0" />
                  </linearGradient>
                  <linearGradient id="jawanTrendLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#a3e635" />
                    <stop offset="100%" stop-color="#fb923c" />
                  </linearGradient>
                </defs>
                <line v-for="g in 5" :key="g" x1="0" :x2="chartW" :y1="(chartH / 5) * g" :y2="(chartH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
                <path :d="`${trendPath(data.stressTrend)} L ${chartW} ${chartH} L 0 ${chartH} Z`" fill="url(#jawanTrendFill)" />
                <path :d="trendPath(data.stressTrend)" fill="none" stroke="url(#jawanTrendLine)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <g v-for="(p, i) in data.stressTrend" :key="i">
                  <circle :cx="trendPointXY(data.stressTrend, i).x" :cy="trendPointXY(data.stressTrend, i).y" r="3.5" fill="#fbbf24" />
                  <text :x="trendPointXY(data.stressTrend, i).x" :y="trendPointXY(data.stressTrend, i).y - 10" text-anchor="middle" font-size="11" fill="#cbd5e1">{{ p.score }}</text>
                  <text :x="trendPointXY(data.stressTrend, i).x" :y="chartH + 20" text-anchor="middle" font-size="11" fill="#64748b">{{ p.dateLabel }}</text>
                </g>
              </svg>
              <div v-else class="mt-4 flex h-56 items-center justify-center text-xs text-slate-500">No assessment history yet.</div>
            </div>

            <!-- Risk level guide -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <CheckCircle2 :size="ICON_SIZE" :stroke-width="1.5" class="text-emerald-400" />
                <h3 class="text-sm font-bold text-white">Risk Level Guide</h3>
              </div>
              <div class="mt-4 space-y-2.5">
                <div v-for="g in riskLevelGuide" :key="g.level" class="flex items-center gap-3 rounded-xl border border-white/5 p-3" :class="riskTone[g.level].badgeBg">
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="riskTone[g.level].badgeBg">
                    <span class="h-2.5 w-2.5 rounded-full" :class="riskTone[g.level].dot"></span>
                  </span>
                  <div class="flex-1">
                    <p class="text-xs font-bold" :class="riskTone[g.level].text">{{ g.level }}</p>
                    <p class="text-[11px] text-slate-400">{{ g.note }}</p>
                  </div>
                  <span class="text-[11px] font-semibold text-slate-400">{{ g.range }}</span>
                </div>
              </div>
            </div>

            <!-- Quick actions -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <Zap :size="ICON_SIZE" :stroke-width="1.5" class="text-amber-400" />
                <h3 class="text-sm font-bold text-white">Quick Actions</h3>
              </div>
              <div class="mt-4 space-y-2">
                <NuxtLink
                  v-for="action in quickActions" :key="action.title" :to="action.to"
                  class="flex w-full items-center gap-3 rounded-xl border border-white/5 p-3 text-left hover:bg-white/5"
                >
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="toneClasses[action.tone]">
                    <component :is="action.icon" :size="ICON_SIZE" :stroke-width="1.5" />
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-white">{{ action.title }}</p>
                    <p class="text-[11px] text-slate-500">{{ action.sub }}</p>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Recommendations + Recent assessments -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.2fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <Activity :size="ICON_SIZE" :stroke-width="1.5" class="text-amber-400" />
                <div>
                  <h3 class="text-sm font-bold text-white">Your Personalized Recommendations</h3>
                  <p class="text-[11px] text-slate-500">Based on your current stress level and wellbeing indicators</p>
                </div>
              </div>

              <div v-if="!data.recommendations.length" class="mt-4 text-xs text-slate-500">No recommendations available right now.</div>
              <div v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="rec in data.recommendations" :key="rec.title" class="rounded-xl border border-white/5 p-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <component :is="recIconMap[rec.icon]" :size="ICON_SIZE" :stroke-width="1.5" />
                  </div>
                  <p class="mt-2.5 text-xs font-bold text-white">{{ rec.title }}</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-slate-400">{{ rec.description }}</p>
                  <NuxtLink
                    :to="`/personnel/recommendations/${rec.icon}`"
                    class="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:underline"
                  >
                    Learn More
                    <ChevronRight :size="12" />
                  </NuxtLink>
                </div>
              </div>
            </div>

            <!-- Recent assessments -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Calendar :size="ICON_SIZE" :stroke-width="1.5" class="text-blue-400" />
                  <h3 class="text-sm font-bold text-white">Recent Assessments</h3>
                </div>
                <NuxtLink to="/personnel/history" class="text-xs font-semibold text-blue-400 hover:underline">View All</NuxtLink>
              </div>

              <table class="mt-4 w-full text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">Date &amp; Time</th>
                    <th class="pb-2 font-medium">Stress Score</th>
                    <th class="pb-2 font-medium">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!data.recentAssessments.length">
                    <td colspan="3" class="py-4 text-center text-slate-500">No assessments yet.</td>
                  </tr>
                  <tr v-for="(row, i) in data.recentAssessments" :key="i" class="border-t border-white/5">
                    <td class="py-2.5 text-slate-300">{{ row.dateTime }}</td>
                    <td class="py-2.5 font-semibold text-slate-200">{{ row.score }}</td>
                    <td class="py-2.5">
                      <span class="flex items-center gap-1.5 font-semibold" :class="riskTone[row.riskLevel].text">
                        <span class="h-1.5 w-1.5 rounded-full" :class="riskTone[row.riskLevel].dot"></span>{{ row.riskLevel }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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