<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   This page fetches all its data from a single endpoint:
     GET /api/personnel/dashboard

 The response must match the DashboardData interface
   defined further down. As with the admin dashboard, there are no
   hardcoded/sample values here - every field is rendered from data.value.
   ====================================================================== */

const DASHBOARD_API_URL = '/api/personnel/dashboard'

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
  unreadNotifications: number
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

/* ---------------- Sidebar nav (static, not data-driven) ---------------- */
const navItems = [
  { label: 'Dashboard', icon: 'home', active: true },
  { label: 'My Assessment', icon: 'doc' },
  { label: 'My Stress History', icon: 'chart' },
  { label: 'My Recommendations', icon: 'check' },
  { label: 'My Profile', icon: 'user' },
  { label: 'Security', icon: 'shield' },
]

const darkMode = ref(true)

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

function recIcon(icon: RecommendationCard['icon']) {
  return icon
}

const quickActions = [
  { title: 'Take New Assessment', sub: 'Update your current stress level', icon: 'bolt', tone: 'green' },
  { title: 'View My History', sub: 'Check past assessments', icon: 'chart', tone: 'blue' },
  { title: 'View Recommendations', sub: 'Get personalized suggestions', icon: 'doc', tone: 'violet' },
  { title: 'Update Profile', sub: 'Manage your account details', icon: 'user', tone: 'slate' },
]
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
          <p class="text-[10px] leading-tight text-slate-400">Personnel Stress &amp; Welfare Monitoring</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 pb-4">
        <a
          v-for="item in navItems" :key="item.label" href="#"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="item.active ? 'bg-emerald-600/90 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <svg v-if="item.icon === 'home'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"></path>
          </svg>
          <svg v-else-if="item.icon === 'doc'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <svg v-else-if="item.icon === 'chart'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l7 7-7 6zM4 5v14"></path>
          </svg>
          <svg v-else-if="item.icon === 'check'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
          </svg>
          <svg v-else-if="item.icon === 'user'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <svg v-else class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
          </svg>
          {{ item.label }}
        </a>
      </nav>

      <div class="px-5 pb-2">
        <p class="text-sm italic leading-snug text-blue-300/80">Stronger Minds</p>
        <p class="text-sm italic leading-snug text-blue-300/80">Build a Safer Tomorrow</p>
      </div>
      <div class="border-t border-white/5 px-3 py-3">
        <button class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200">
          <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Logout
        </button>
      </div>
    </aside>

    <!-- ================= Main ================= -->
    <div class="flex min-h-screen flex-1 flex-col">
      <!-- Top bar -->
      <header class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5">
        <button class="rounded-lg p-2 text-slate-400 hover:bg-white/5">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <div class="relative max-w-md flex-1">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"></path>
          </svg>
          <input type="text" placeholder="Search anything..." class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50">
        </div>

        <div class="ml-auto flex items-center gap-4">
          <button class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <span v-if="data?.unreadNotifications" class="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{{ data.unreadNotifications }}</span>
          </button>

          <button @click="darkMode = !darkMode" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z"></path>
            </svg>
          </button>

          <div class="flex items-center gap-2.5 border-l border-white/10 pl-4">
            <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-700">
              <img v-if="data?.profile.avatarUrl" :src="data.profile.avatarUrl" class="h-full w-full object-cover" alt="">
              <svg v-else class="h-5 w-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-white">{{ data?.profile.serviceId ?? '—' }}</p>
              <p class="text-[11px] text-slate-400">{{ data?.profile.rank ?? '' }}</p>
            </div>
            <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-6 p-6">
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <svg class="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <p class="text-sm">Loading your dashboard…</p>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"></path>
          </svg>
          <p class="text-sm font-semibold text-red-300">Couldn't load your dashboard</p>
          <p class="text-xs text-slate-400">{{ error }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">{{ DASHBOARD_API_URL }}</code></p>
          <button @click="fetchDashboard" class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500">Retry</button>
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
                  <svg v-else class="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
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

              <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit Profile
              </button>
            </div>
          </div>

          <!-- Stat cards -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <!-- Current stress score gauge -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 12h4.5l2.25-6 3 12 2.25-6h4.5"></path>
                  </svg>
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
                  <svg class="h-4.5 w-4.5" :class="riskTone[data.riskLevel].text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78A1.5 1.5 0 0022.18 18L13.71 3.86a1.5 1.5 0 00-2.42 0z"></path>
                  </svg>
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
                  <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-white">Last Assessment</h3>
              </div>
              <p class="mt-4 text-xl font-extrabold text-white">{{ data.lastAssessmentDate }}</p>
              <p class="text-xs text-slate-400">{{ data.lastAssessmentTime }}</p>
              <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
                View Details
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>

            <!-- Next follow-up -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                  <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-sm font-bold text-white">Next Follow-up</h3>
              </div>
              <p class="mt-4 text-xl font-extrabold text-white">{{ data.nextFollowUpDate }}</p>
              <p class="text-xs text-slate-400">{{ data.nextFollowUpRelative }}</p>
              <button class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
                View Schedule
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Trend + Risk guide + Quick actions -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1.1fr_1fr]">
            <!-- Stress trend -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="h-4.5 w-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l7 7-7 6zM4 5v14"></path>
                  </svg>
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
                <svg class="h-4.5 w-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
                </svg>
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
                <svg class="h-4.5 w-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <h3 class="text-sm font-bold text-white">Quick Actions</h3>
              </div>
              <div class="mt-4 space-y-2">
                <button v-for="action in quickActions" :key="action.title" class="flex w-full items-center gap-3 rounded-xl border border-white/5 p-3 text-left hover:bg-white/5">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg"
                    :class="{
                      'bg-emerald-500/15 text-emerald-400': action.tone === 'green',
                      'bg-blue-500/15 text-blue-400': action.tone === 'blue',
                      'bg-violet-500/15 text-violet-400': action.tone === 'violet',
                      'bg-slate-500/15 text-slate-300': action.tone === 'slate',
                    }"
                  >
                    <svg class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"></path>
                    </svg>
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-semibold text-white">{{ action.title }}</p>
                    <p class="text-[11px] text-slate-500">{{ action.sub }}</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Recommendations + Recent assessments -->
          <div class="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1.2fr]">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <svg class="h-4.5 w-4.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 18h6m-5 3h4m-2-14a6 6 0 00-3.5 10.9V19h7v-1.1A6 6 0 0012 7z"></path>
                </svg>
                <div>
                  <h3 class="text-sm font-bold text-white">Your Personalized Recommendations</h3>
                  <p class="text-[11px] text-slate-500">Based on your current stress level and wellbeing indicators</p>
                </div>
              </div>

              <div v-if="!data.recommendations.length" class="mt-4 text-xs text-slate-500">No recommendations available right now.</div>
              <div v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div v-for="rec in data.recommendations" :key="rec.title" class="rounded-xl border border-white/5 p-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                    <svg v-if="recIcon(rec.icon) === 'sleep'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 1020.354 15.354z"></path>
                    </svg>
                    <svg v-else-if="recIcon(rec.icon) === 'activity'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    <svg v-else-if="recIcon(rec.icon) === 'workload'" class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <svg v-else class="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"></path>
                    </svg>
                  </div>
                  <p class="mt-2.5 text-xs font-bold text-white">{{ rec.title }}</p>
                  <p class="mt-1 text-[11px] leading-relaxed text-slate-400">{{ rec.description }}</p>
                  <a href="#" class="mt-2 flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:underline">
                    Learn More
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <!-- Recent assessments -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="h-4.5 w-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 class="text-sm font-bold text-white">Recent Assessments</h3>
                </div>
                <a href="#" class="text-xs font-semibold text-blue-400 hover:underline">View All</a>
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