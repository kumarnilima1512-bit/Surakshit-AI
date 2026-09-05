<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const DASHBOARD_API_URL = '/api/admin/dashboard'

interface StatCard {
  label: string
  value: string | number
  deltaPct: number | null
  goodDirection: 'up' | 'down'
  icon: 'users' | 'user' | 'shield' | 'building' | 'alert' | 'triangle' | 'doc'
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

/* =========================================================
   DASHBOARD STATE
========================================================= */

const data = ref<DashboardData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const mobileSidebarOpen = ref(false)

function toggleMobileSidebar() {
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}

/* =========================================================
   DASHBOARD API
========================================================= */

async function fetchDashboard() {
  loading.value = true
  error.value = null

  try {
    const res = await fetch(DASHBOARD_API_URL, {
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`)
    }

    const response = await res.json()

    console.log('DASHBOARD RESPONSE:', response)

    data.value = {
      adminName:
        response.adminName ??
        response.user?.name ??
        'System Administrator',

      statCards: Array.isArray(response.statCards)
        ? response.statCards
        : [],

      stressTrend: Array.isArray(response.stressTrend)
        ? response.stressTrend
        : [],

      avgStressScore:
        typeof response.avgStressScore === 'number' &&
        Number.isFinite(response.avgStressScore)
          ? response.avgStressScore
          : 0,

      avgStressDeltaPct:
        typeof response.avgStressDeltaPct === 'number' &&
        Number.isFinite(response.avgStressDeltaPct)
          ? response.avgStressDeltaPct
          : null,

      riskDistribution: Array.isArray(response.riskDistribution)
        ? response.riskDistribution
        : [],

      totalPersonnelForDonut:
        typeof response.totalPersonnelForDonut === 'number'
          ? response.totalPersonnelForDonut
          : 0,

      unitBars: Array.isArray(response.unitBars)
        ? response.unitBars
        : [],

      recentActivity: Array.isArray(response.recentActivity)
        ? response.recentActivity
        : [],

      highRiskPersonnel: Array.isArray(response.highRiskPersonnel)
        ? response.highRiskPersonnel
        : [],

      systemOverview: Array.isArray(response.systemOverview)
        ? response.systemOverview
        : [],

      monthlyStats: Array.isArray(response.monthlyStats)
        ? response.monthlyStats
        : [],

      systemHealth: Array.isArray(response.systemHealth)
        ? response.systemHealth
        : [],
    }
  } catch (e) {
    error.value =
      e instanceof Error
        ? e.message
        : 'Failed to load dashboard data'

    data.value = null
  } finally {
    loading.value = false
  }
}

/* =========================================================
   NAVIGATION
========================================================= */

const navSections = [
  {
    label: 'Users',
    icon: 'users',
    items: ['All Users', 'Create User', 'Roles & Permissions'],
  },
  {
    label: 'Units',
    icon: 'building',
    items: ['All Units', 'Assign Personnel'],
  },
  {
    label: 'Analytics',
    icon: 'chart',
    items: ['System Analytics', 'Risk Trends', 'Reports'],
  },
  {
    label: 'Security',
    icon: 'shield',
    items: ['Audit Logs', 'Login History', 'Failed Attempts', '2FA Management'],
  },
  {
    label: 'System Settings',
    icon: 'gear',
    items: ['General Settings', 'ML Model Settings'],
  },
]

/* =========================================================
   NAV -> ROUTE MAP
========================================================= */

const routeMap: Record<string, string> = {
  'Dashboard': '/admin/dashboard',

  // Users
  'All Users': '/admin/users/all-users',
  'Create User': '/admin/users/create-user',
  'Roles & Permissions': '/admin/users/roles-permissions',

  // Units
  'All Units': '/admin/units/all-units',
  'Assign Personnel': '/admin/units/assign-personnel',

  // Analytics
  'System Analytics': '/admin/analytics/system-analytics',
  'Risk Trends': '/admin/analytics/risk-trends',
  'Reports': '/admin/analytics/reports',

  // Security
  'Audit Logs': '/admin/security/audit-logs',
  'Login History': '/admin/security/login-history',
  'Failed Attempts': '/admin/security/failed-attempts',
  '2FA Management': '/admin/security/2fa-management',

  // System Settings
  'General Settings': '/admin/settings/general-settings',
  'ML Model Settings': '/admin/settings/ml-model-settings',
}

const openSections = ref<Record<string, boolean>>({
  Users: true,
  Units: true,
  Analytics: true,
  Security: true,
  'System Settings': true,
})

function toggleSection(label: string) {
  openSections.value[label] = !openSections.value[label]
}

const activeNavItem = ref('Dashboard')

const toastMessage = ref<string | null>(null)

let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(message: string) {
  toastMessage.value = message

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 2500)
}

function selectNav(label: string) {
  activeNavItem.value = label

  closeDropdowns()
  closeMobileSidebar()

  const path = routeMap[label]

  if (path) {
    router.push(path)
  } else {
    showToast(`"${label}" এর জন্য কোনো route পাওয়া যায়নি`)
  }
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

const showNotifications = ref(false)

const notifications = [
  {
    text: 'New high-risk personnel flagged in Unit Alpha',
    time: '5m ago',
  },
  {
    text: 'Weekly welfare report generated',
    time: '1h ago',
  },
  {
    text: 'ML model retraining completed',
    time: '3h ago',
  },
]

function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  showProfileMenu.value = false
}

/* =========================================================
   PROFILE
========================================================= */

const showProfileMenu = ref(false)

function toggleProfileMenu() {
  showProfileMenu.value = !showProfileMenu.value
  showNotifications.value = false
}

function handleProfileAction(action: string) {
  closeDropdowns()

  showToast(
    action === 'Logout'
      ? 'Logged out successfully'
      : `Opening ${action}...`,
  )
}

function closeDropdowns() {
  showNotifications.value = false
  showProfileMenu.value = false
}

/* =========================================================
   OUTSIDE CLICK
========================================================= */

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (!target.closest('[data-dropdown-root]')) {
    closeDropdowns()
  }
}

/* =========================================================
   SEARCH
========================================================= */

const searchQuery = ref('')

const filteredHighRiskPersonnel = computed<HighRiskPerson[]>(() => {
  const list = data.value?.highRiskPersonnel ?? []

  const q = searchQuery.value.trim().toLowerCase()

  if (!q) {
    return list
  }

  return list.filter(
    (p) =>
      String(p.name ?? '').toLowerCase().includes(q) ||
      String(p.unit ?? '').toLowerCase().includes(q) ||
      String(p.id ?? '').toLowerCase().includes(q),
  )
})

/* =========================================================
   RETRY
========================================================= */

function retryFetch() {
  showToast('Retrying...')
  fetchDashboard()
}

/* =========================================================
   CHART HELPERS
========================================================= */

const chartW = 640
const chartH = 220
const maxStressVal = 10

function buildStressPath(points: TrendPoint[] = []) {
  if (!Array.isArray(points) || points.length === 0) {
    return ''
  }

  const stepX = chartW / Math.max(points.length - 1, 1)

  return points
    .map((p, i) => {
      const value =
        typeof p.value === 'number' && Number.isFinite(p.value)
          ? p.value
          : 0

      const y =
        chartH -
        (Math.max(0, Math.min(value, maxStressVal)) / maxStressVal) *
          chartH

      return `${i === 0 ? 'M' : 'L'} ${i * stepX} ${y}`
    })
    .join(' ')
}

function buildStressAreaPath(points: TrendPoint[] = []) {
  const line = buildStressPath(points)

  if (!line) {
    return ''
  }

  return `${line} L ${chartW} ${chartH} L 0 ${chartH} Z`
}

function buildDonutSegments(segments: RiskSegment[] = []) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return []
  }

  const r = 70
  const circumference = 2 * Math.PI * r

  let offset = 0

  return segments.map((seg) => {
    const pct =
      typeof seg.pct === 'number' && Number.isFinite(seg.pct)
        ? Math.max(0, seg.pct)
        : 0

    const dash = (pct / 100) * circumference

    const out = {
      ...seg,
      dasharray: `${dash} ${Math.max(
        0,
        circumference - dash,
      )}`,
      dashoffset: -offset,
    }

    offset += dash

    return out
  })
}

function unitBarMax(bars: UnitBar[] = []) {
  if (!Array.isArray(bars) || bars.length === 0) {
    return 1
  }

  return Math.max(
    1,
    ...bars.flatMap((b) => [
      Number(b.low) || 0,
      Number(b.moderate) || 0,
      Number(b.elevated) || 0,
      Number(b.high) || 0,
    ]),
  )
}

function monthlyMax(stats: MonthlyStat[] = []) {
  if (!Array.isArray(stats) || stats.length === 0) {
    return 1
  }

  return Math.max(
    1,
    ...stats.flatMap((m) => [
      Number(m.total) || 0,
      Number(m.highRisk) || 0,
    ]),
  )
}

/* =========================================================
   STYLING HELPERS
========================================================= */

function levelClasses(level: string) {
  return level === 'High'
    ? 'bg-red-500/15 text-red-400'
    : 'bg-amber-500/15 text-amber-400'
}

function deltaClass(
  pct: number | null,
  goodDirection: 'up' | 'down' = 'up',
) {
  if (
    pct === null ||
    typeof pct !== 'number' ||
    !Number.isFinite(pct)
  ) {
    return 'text-slate-500'
  }

  const isGood =
    goodDirection === 'up'
      ? pct >= 0
      : pct <= 0

  return isGood
    ? 'text-emerald-400'
    : 'text-red-400'
}

function formatDelta(pct: number | null) {
  if (
    pct === null ||
    typeof pct !== 'number' ||
    !Number.isFinite(pct)
  ) {
    return '—'
  }

  return `${pct > 0 ? '+' : ''}${pct}%`
}

function formatStressScore(score: number) {
  if (
    typeof score !== 'number' ||
    !Number.isFinite(score)
  ) {
    return '0.0'
  }

  return score.toFixed(1)
}

/* =========================================================
   DATE
========================================================= */

const now = new Date()

const formattedDate = now.toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

const formattedTime = now.toLocaleTimeString('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

/* =========================================================
   LIFECYCLE
========================================================= */

onMounted(() => {
  fetchDashboard()

  window.addEventListener(
    'click',
    handleOutsideClick,
  )
})

onUnmounted(() => {
  window.removeEventListener(
    'click',
    handleOutsideClick,
  )

  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>

<template>
  <div
    class="min-h-screen w-full overflow-x-hidden bg-[#0b1220] text-slate-100"
  >
    <!-- =====================================================
         MOBILE OVERLAY
    ====================================================== -->

    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-[1px] lg:hidden"
      @click="closeMobileSidebar"
    ></div>

    <!-- =====================================================
         MAIN APPLICATION LAYOUT
    ====================================================== -->

    <div class="flex min-h-screen w-full">

      <!-- ===================================================
           SIDEBAR
      ==================================================== -->

      <aside
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[88vw]
        shrink-0 -translate-x-full flex-col
        border-r border-white/5 bg-[#0d1526]
        transition-transform duration-300
        lg:static lg:z-auto lg:w-64 lg:translate-x-0"
        :class="{
          'translate-x-0': mobileSidebarOpen,
        }"
      >
        <!-- Logo -->

        <div
          class="flex min-h-[72px] items-center gap-3 border-b border-white/5 px-5"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400"
          >
            <svg
              class="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9.5 12l1.8 1.8L14.5 10"
              />
            </svg>
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold leading-tight text-white">
              Surakshit AI
            </p>

            <p
              class="mt-0.5 text-[10px] leading-tight text-slate-400"
            >
              Personnel Stress &amp; Welfare Monitoring System
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            @click="closeMobileSidebar"
          >
            <svg
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>

        <!-- Navigation -->

        <nav
          class="flex-1 overflow-y-auto px-3 py-3"
        >
          <!-- Dashboard -->

          <a
            href="#"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold"
            :class="
              activeNavItem === 'Dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-white/5'
            "
            @click.prevent="selectNav('Dashboard')"
          >
            <svg
              class="h-3.5 w-3.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
              />
            </svg>

            Dashboard
          </a>

          <!-- Sections -->

          <div
            v-for="section in navSections"
            :key="section.label"
            class="pt-1"
          >
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5"
              @click="toggleSection(section.label)"
            >
              <span
                class="flex min-w-0 items-center gap-3"
              >
                <!-- Users -->

                <svg
                  v-if="section.icon === 'users'"
                  class="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"
                  />
                </svg>

                <!-- Building -->

                <svg
                  v-else-if="section.icon === 'building'"
                  class="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M3 21h18M5 21V6a1 1 0 011-1h4a1 1 0 011 1v15M13 21V10a1 1 0 011-1h4a1 1 0 011 1v11M9 8h.01M9 12h.01M9 16h.01"
                  />
                </svg>

                <!-- Chart -->

                <svg
                  v-else-if="section.icon === 'chart'"
                  class="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 19V6l7 7-7 6zM4 5v14"
                  />
                </svg>

                <!-- Shield -->

                <svg
                  v-else-if="section.icon === 'shield'"
                  class="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"
                  />
                </svg>

                <!-- Gear -->

                <svg
                  v-else
                  class="h-3.5 w-3.5 shrink-0 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-.826-0.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>

                <span class="truncate">
                  {{ section.label }}
                </span>
              </span>

              <svg
                class="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200"
                :class="{
                  'rotate-180':
                    openSections[section.label],
                }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              v-show="openSections[section.label]"
              class="ml-6 mt-1 space-y-0.5 border-l border-white/5 pl-4"
            >
              <a
                v-for="item in section.items"
                :key="item"
                href="#"
                class="block rounded-md px-2 py-1.5 text-[13px]"
                :class="
                  activeNavItem === item
                    ? 'bg-white/5 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                "
                @click.prevent="selectNav(item)"
              >
                {{ item }}
              </a>
            </div>
          </div>
        </nav>

        <!-- Sidebar footer -->

        <div class="shrink-0 px-3 pb-2">
          <div
            class="rounded-xl border border-white/5 bg-white/5 p-4"
          >
            <svg
              class="h-5 w-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"
              />
            </svg>

            <p
              class="mt-2 text-xs font-semibold text-slate-200"
            >
              Safer Personnel
            </p>

            <p
              class="text-xs font-semibold text-slate-200"
            >
              Stronger Forces
            </p>

            <p
              class="mt-1 text-[11px] text-slate-400"
            >
              A Healthier Tomorrow
            </p>
          </div>

          <p
            class="pb-2 pt-3 text-[11px] text-slate-600"
          >
            v1.0.0
          </p>
        </div>
      </aside>

      <!-- ===================================================
           MAIN CONTENT
      ==================================================== -->

      <div class="min-w-0 flex-1 bg-[#0b1220]">

        <!-- =================================================
             TOP BAR
        ================================================== -->

        <header
          class="sticky top-0 z-30 border-b border-white/5 bg-[#0d1526]/95 px-3 py-3 backdrop-blur sm:px-5 lg:px-6"
        >
          <div
            class="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <!-- Hamburger -->

            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 lg:hidden"
              @click="toggleMobileSidebar"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <!-- Search -->

            <div
              class="order-last w-full sm:order-none sm:min-w-0 sm:max-w-md sm:flex-1"
            >
              <div class="relative">
                <svg
                  class="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>

                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search users, units, personnel..."
                  class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-blue-500/50"
                >
              </div>
            </div>

            <!-- Actions -->

            <div
              class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3"
            >
              <!-- Notifications -->

              <div
                class="relative"
                data-dropdown-root
              >
                <button
                  type="button"
                  class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  @click.stop="toggleNotifications"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>

                  <span
                    v-if="notifications.length"
                    class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500"
                  ></span>
                </button>

                <div
                  v-if="showNotifications"
                  class="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-white/10 bg-[#0d1526] p-2 shadow-xl"
                >
                  <p
                    class="px-2 py-1.5 text-xs font-semibold text-slate-300"
                  >
                    Notifications
                  </p>

                  <div
                    v-for="(n, i) in notifications"
                    :key="i"
                    class="rounded-lg px-2 py-2 text-xs text-slate-300 hover:bg-white/5"
                  >
                    <p>{{ n.text }}</p>

                    <p
                      class="mt-0.5 text-[10px] text-slate-500"
                    >
                      {{ n.time }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- 2FA -->

              <span
                class="hidden items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 md:flex"
              >
                <svg
                  class="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"
                  />
                </svg>

                2FA Enabled
              </span>

              <!-- Profile -->

              <div
                class="relative border-l border-white/10 pl-1.5 sm:pl-3"
                data-dropdown-root
              >
                <button
                  type="button"
                  class="flex items-center gap-2"
                  @click.stop="toggleProfileMenu"
                >
                  <div
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700"
                  >
                    <svg
                      class="h-4 w-4 text-slate-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>

                  <div
                    class="hidden text-left leading-tight sm:block"
                  >
                    <p
                      class="max-w-32 truncate text-sm font-semibold text-white"
                    >
                      {{ data?.adminName ?? 'Admin' }}
                    </p>

                    <p
                      class="text-[11px] text-slate-400"
                    >
                      Administrator
                    </p>
                  </div>

                  <svg
                    class="hidden h-3.5 w-3.5 text-slate-500 transition-transform sm:block"
                    :class="{
                      'rotate-180': showProfileMenu,
                    }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  v-if="showProfileMenu"
                  class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#0d1526] p-1.5 shadow-xl"
                >
                  <button
                    v-for="action in [
                      'Profile',
                      'Account Settings',
                      'Logout',
                    ]"
                    :key="action"
                    type="button"
                    class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
                    @click="handleProfileAction(action)"
                  >
                    {{ action }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- =================================================
             CONTENT
        ================================================== -->

        <main
          class="w-full space-y-5 p-3 sm:space-y-6 sm:p-5 lg:p-6"
        >
          <!-- Title -->

          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div class="min-w-0">
              <h1
                class="text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Admin Dashboard
              </h1>

              <p
                class="mt-1 max-w-2xl text-sm text-slate-400"
              >
                Overview of system, personnel, and welfare monitoring status
              </p>
            </div>

            <span
              class="flex w-fit max-w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300"
            >
              <svg
                class="h-3.5 w-3.5 shrink-0 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

              <span class="truncate">
                {{ formattedDate }} &middot; {{ formattedTime }}
              </span>
            </span>
          </div>

          <!-- Loading -->

          <div
            v-if="loading"
            class="flex min-h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-10"
          >
            <div
              class="flex flex-col items-center gap-3 text-slate-400"
            >
              <svg
                class="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />

                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>

              <p class="text-sm">
                Loading dashboard data…
              </p>
            </div>
          </div>

          <!-- Error -->

          <div
            v-else-if="error"
            class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center"
          >
            <svg
              class="h-6 w-6 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"
              />
            </svg>

            <p
              class="text-sm font-semibold text-red-300"
            >
              Couldn't load dashboard data
            </p>

            <p class="max-w-md text-xs text-slate-400">
              {{ error }}
            </p>

            <button
              type="button"
              class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
              @click="retryFetch"
            >
              Retry
            </button>
          </div>

          <!-- =================================================
               DASHBOARD
          ================================================== -->

          <template v-else-if="data">

            <!-- =================================================
                 STAT CARDS
            ================================================== -->

            <div
              class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
            >
              <div
                v-for="card in data.statCards"
                :key="card.label"
                class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 transition hover:border-white/10"
              >
                <div
                  class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
                >
                  <svg
                    class="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>

                <p
                  class="mt-3 min-h-8 text-xs font-medium text-slate-400"
                >
                  {{ card.label }}
                </p>

                <p
                  class="mt-1 break-words text-2xl font-extrabold text-white"
                >
                  {{ card.value }}
                </p>

                <p
                  class="mt-1 text-[11px] font-semibold"
                  :class="
                    deltaClass(
                      card.deltaPct,
                      card.goodDirection,
                    )
                  "
                >
                  {{ formatDelta(card.deltaPct) }}

                  <span
                    class="font-normal text-slate-500"
                  >
                    vs. last month
                  </span>
                </p>
              </div>
            </div>

            <!-- =================================================
                 TREND + DONUT
            ================================================== -->

            <div
              class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[2fr_1.3fr]"
            >
              <!-- Stress Trend -->

              <div
                class="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  Stress Level Trend (System Wide)
                </h3>

                <div
                  class="mt-4 grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_9rem]"
                >
                  <div
                    class="min-w-0 overflow-hidden"
                  >
                    <svg
                      :viewBox="`0 0 ${chartW} ${chartH}`"
                      preserveAspectRatio="none"
                      class="h-44 w-full sm:h-48"
                    >
                      <defs>
                        <linearGradient
                          id="stressFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stop-color="#22d3ee"
                            stop-opacity="0.35"
                          />

                          <stop
                            offset="100%"
                            stop-color="#22d3ee"
                            stop-opacity="0"
                          />
                        </linearGradient>
                      </defs>

                      <line
                        v-for="g in 5"
                        :key="g"
                        x1="0"
                        :x2="chartW"
                        :y1="(chartH / 5) * g"
                        :y2="(chartH / 5) * g"
                        stroke="rgba(255,255,255,0.06)"
                        stroke-width="1"
                      />

                      <path
                        v-if="data.stressTrend.length"
                        :d="
                          buildStressAreaPath(
                            data.stressTrend,
                          )
                        "
                        fill="url(#stressFill)"
                      />

                      <path
                        v-if="data.stressTrend.length"
                        :d="
                          buildStressPath(
                            data.stressTrend,
                          )
                        "
                        fill="none"
                        stroke="#22d3ee"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>

                    <p
                      v-if="!data.stressTrend.length"
                      class="mt-2 text-center text-xs text-slate-500"
                    >
                      No stress trend data available.
                    </p>
                  </div>

                  <div
                    class="border-t border-white/5 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0"
                  >
                    <p
                      class="text-xs font-medium text-slate-400"
                    >
                      Avg. Stress Score
                    </p>

                    <p
                      class="mt-1 text-3xl font-extrabold text-white"
                    >
                      {{
                        formatStressScore(
                          data.avgStressScore,
                        )
                      }}
                    </p>

                    <p
                      class="mt-1 text-xs font-semibold"
                      :class="
                        deltaClass(
                          data.avgStressDeltaPct,
                          'down',
                        )
                      "
                    >
                      {{
                        formatDelta(
                          data.avgStressDeltaPct,
                        )
                      }}

                      <span
                        class="font-normal text-slate-500"
                      >
                        vs. previous period
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Risk Distribution -->

              <div
                class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  Risk Distribution
                </h3>

                <div
                  class="relative mt-4 flex items-center justify-center"
                >
                  <svg
                    viewBox="0 0 180 180"
                    class="h-36 w-36 -rotate-90 sm:h-40 sm:w-40"
                  >
                    <circle
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      stroke-width="20"
                    />

                    <circle
                      v-for="seg in buildDonutSegments(
                        data.riskDistribution,
                      )"
                      :key="seg.label"
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      :stroke="seg.color"
                      stroke-width="20"
                      :stroke-dasharray="seg.dasharray"
                      :stroke-dashoffset="seg.dashoffset"
                    />
                  </svg>

                  <div
                    class="absolute text-center"
                  >
                    <p
                      class="text-2xl font-extrabold text-white"
                    >
                      {{ data.totalPersonnelForDonut }}
                    </p>

                    <p
                      class="text-[11px] text-slate-400"
                    >
                      Total Personnel
                    </p>
                  </div>
                </div>

                <div class="mt-3 space-y-2">
                  <div
                    v-for="seg in data.riskDistribution"
                    :key="seg.label"
                    class="flex items-center justify-between gap-3 text-xs"
                  >
                    <span
                      class="flex min-w-0 items-center gap-2 text-slate-300"
                    >
                      <span
                        class="h-2.5 w-2.5 shrink-0 rounded-full"
                        :style="{
                          backgroundColor:
                            seg.color,
                        }"
                      ></span>

                      <span class="truncate">
                        {{ seg.label }}
                      </span>
                    </span>

                    <span
                      class="flex shrink-0 items-center gap-2 font-semibold text-slate-400"
                    >
                      {{ seg.pct }}%

                      <span
                        class="text-slate-500"
                      >
                        {{ seg.count }}
                      </span>
                    </span>
                  </div>

                  <p
                    v-if="!data.riskDistribution.length"
                    class="text-xs text-slate-500"
                  >
                    No risk distribution data.
                  </p>
                </div>
              </div>
            </div>

            <!-- =================================================
                 UNIT + ACTIVITY + HIGH RISK
            ================================================== -->

            <div
              class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.2fr_1.2fr]"
            >
              <!-- Unit bars -->

              <div
                class="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  Risk Level Distribution by Unit
                </h3>

                <div
                  v-if="data.unitBars.length"
                  class="mt-5 flex h-56 min-w-0 items-end gap-3 overflow-x-auto pb-1"
                >
                  <div
                    v-for="bar in data.unitBars"
                    :key="bar.unit"
                    class="flex min-w-14 flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      class="flex h-44 w-full min-w-10 items-end justify-center gap-0.5"
                    >
                      <div
                        class="w-1/4 rounded-t bg-emerald-400"
                        :style="{
                          height:
                            ((bar.low || 0) /
                              unitBarMax(
                                data.unitBars,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>

                      <div
                        class="w-1/4 rounded-t bg-amber-400"
                        :style="{
                          height:
                            ((bar.moderate || 0) /
                              unitBarMax(
                                data.unitBars,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>

                      <div
                        class="w-1/4 rounded-t bg-orange-400"
                        :style="{
                          height:
                            ((bar.elevated || 0) /
                              unitBarMax(
                                data.unitBars,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>

                      <div
                        class="w-1/4 rounded-t bg-red-400"
                        :style="{
                          height:
                            ((bar.high || 0) /
                              unitBarMax(
                                data.unitBars,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>
                    </div>

                    <span
                      class="max-w-16 truncate text-[10px] text-slate-500"
                    >
                      {{ bar.unit }}
                    </span>
                  </div>
                </div>

                <p
                  v-else
                  class="mt-6 text-xs text-slate-500"
                >
                  No unit data available.
                </p>
              </div>

              <!-- Recent Activity -->

              <div
                class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  Recent Activity
                </h3>

                <div class="mt-4 space-y-4">
                  <div
                    v-if="!data.recentActivity.length"
                    class="text-xs text-slate-500"
                  >
                    No recent activity.
                  </div>

                  <div
                    v-for="(item, i) in data.recentActivity"
                    :key="i"
                    class="flex min-w-0 items-start gap-3"
                  >
                    <div
                      class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
                    >
                      <svg
                        class="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>

                    <div class="min-w-0">
                      <p
                        class="break-words text-xs font-medium text-slate-200"
                      >
                        {{ item.text }}
                      </p>

                      <p
                        class="mt-0.5 text-[11px] text-slate-500"
                      >
                        {{ item.by }} &middot;
                        {{ item.time }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- High Risk -->

              <div
                class="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  High Risk Personnel
                </h3>

                <div class="mt-4 overflow-x-auto">
                  <table
                    class="w-full min-w-[520px] text-left text-xs"
                  >
                    <thead>
                      <tr class="text-slate-500">
                        <th class="pb-2 font-medium">
                          ID
                        </th>

                        <th class="pb-2 font-medium">
                          Name
                        </th>

                        <th class="pb-2 font-medium">
                          Unit
                        </th>

                        <th class="pb-2 font-medium">
                          Level
                        </th>

                        <th
                          class="pb-2 text-right font-medium"
                        >
                          Score
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-if="
                          !filteredHighRiskPersonnel.length
                        "
                      >
                        <td
                          colspan="5"
                          class="py-4 text-center text-slate-500"
                        >
                          {{
                            searchQuery
                              ? 'No personnel match your search.'
                              : 'No high risk personnel.'
                          }}
                        </td>
                      </tr>

                      <tr
                        v-for="p in filteredHighRiskPersonnel"
                        :key="p.id"
                        class="border-t border-white/5"
                      >
                        <td
                          class="py-2 font-medium text-blue-400"
                        >
                          {{ p.id }}
                        </td>

                        <td
                          class="py-2 text-slate-200"
                        >
                          {{ p.name }}
                        </td>

                        <td
                          class="py-2 text-slate-400"
                        >
                          {{ p.unit }}
                        </td>

                        <td class="py-2">
                          <span
                            class="rounded-md px-2 py-0.5 text-[10px] font-bold"
                            :class="
                              levelClasses(
                                p.level,
                              )
                            "
                          >
                            {{ p.level }}
                          </span>
                        </td>

                        <td
                          class="py-2 text-right font-semibold text-slate-200"
                        >
                          {{ p.score }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- =================================================
                 OVERVIEW + MONTHLY + HEALTH
            ================================================== -->

            <div
              class="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1.4fr_1fr]"
            >
              <!-- System Overview -->

              <div
                class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  System Overview
                </h3>

                <div
                  v-if="data.systemOverview.length"
                  class="mt-4 grid grid-cols-2 gap-x-4 gap-y-5"
                >
                  <div
                    v-for="item in data.systemOverview"
                    :key="item.label"
                    class="min-w-0"
                  >
                    <p
                      class="truncate text-[11px] font-medium text-slate-400"
                    >
                      {{ item.label }}
                    </p>

                    <p
                      class="mt-0.5 text-lg font-extrabold text-white"
                    >
                      {{ item.value }}
                    </p>

                    <p
                      class="text-[10px] font-semibold"
                      :class="
                        deltaClass(item.deltaPct)
                      "
                    >
                      {{ formatDelta(item.deltaPct) }}

                      <span
                        class="font-normal text-slate-500"
                      >
                        vs. last month
                      </span>
                    </p>
                  </div>
                </div>

                <p
                  v-else
                  class="mt-4 text-xs text-slate-500"
                >
                  No overview data available.
                </p>
              </div>

              <!-- Monthly -->

              <div
                class="min-w-0 overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  Monthly Assessment Statistics
                </h3>

                <div
                  v-if="data.monthlyStats.length"
                  class="mt-5 flex h-48 min-w-0 items-end gap-3 overflow-x-auto pb-1 sm:gap-4"
                >
                  <div
                    v-for="m in data.monthlyStats"
                    :key="m.month"
                    class="flex min-w-14 flex-1 flex-col items-center gap-1.5"
                  >
                    <div
                      class="flex h-36 w-full items-end justify-center gap-1"
                    >
                      <div
                        class="w-2/5 rounded-t bg-blue-500"
                        :style="{
                          height:
                            ((m.total || 0) /
                              monthlyMax(
                                data.monthlyStats,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>

                      <div
                        class="w-2/5 rounded-t bg-red-400"
                        :style="{
                          height:
                            ((m.highRisk || 0) /
                              monthlyMax(
                                data.monthlyStats,
                              )) *
                              100 +
                            '%',
                        }"
                      ></div>
                    </div>

                    <span
                      class="text-[10px] text-slate-500"
                    >
                      {{ m.month }}
                    </span>
                  </div>
                </div>

                <p
                  v-else
                  class="mt-6 text-xs text-slate-500"
                >
                  No monthly statistics available.
                </p>
              </div>

              <!-- System Health -->

              <div
                class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
              >
                <h3 class="text-sm font-bold text-white">
                  System Health
                </h3>

                <div class="mt-4 space-y-3">
                  <div
                    v-if="!data.systemHealth.length"
                    class="text-xs text-slate-500"
                  >
                    No health information available.
                  </div>

                  <div
                    v-for="svc in data.systemHealth"
                    :key="svc.name"
                    class="flex items-center justify-between gap-3 text-xs"
                  >
                    <span
                      class="min-w-0 truncate text-slate-300"
                    >
                      {{ svc.name }}
                    </span>

                    <span
                      class="shrink-0 font-semibold"
                      :class="{
                        'text-emerald-400':
                          svc.status === 'Online',

                        'text-amber-400':
                          svc.status === 'Degraded',

                        'text-red-400':
                          svc.status === 'Offline',
                      }"
                    >
                      {{ svc.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </main>
      </div>
    </div>

    <!-- =====================================================
         TOAST
    ====================================================== -->

    <div
      v-if="toastMessage"
      class="fixed bottom-4 left-3 right-3 z-[100] rounded-lg border border-white/10 bg-[#0d1526] px-4 py-2.5 text-center text-xs font-medium text-slate-200 shadow-xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto"
    >
      {{ toastMessage }}
    </div>
  </div>
</template>