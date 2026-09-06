<script setup lang="ts">
import { computed } from 'vue'
import {
  Home,
  FileText,
  BarChart2,
  CheckCircle2,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  RotateCw,
} from 'lucide-vue-next'

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

interface Assessment {
  id: number
  date: string
  time: string
  dateTime: string
  stressScore: number
  riskLevel: RiskLevel
}

interface HistoryResponse {
  success: boolean
  assessments: Assessment[]
}

const route = useRoute()

const { data, pending: loading, error, refresh } =
  await useFetch<HistoryResponse>('/api/personnel/history')

const assessments = computed(() => data.value?.assessments ?? [])

const darkModeCookie = useCookie<'dark' | 'light'>('surakshit-theme', {
  default: () => 'dark',
})

const darkMode = computed(() => darkModeCookie.value === 'dark')

useHead(() => ({
  htmlAttrs: {
    class: darkMode.value ? 'dark' : '',
  },
}))

function toggleDarkMode() {
  darkModeCookie.value = darkMode.value ? 'light' : 'dark'
}

async function logout() {
  await $fetch('/api/auth/logout', {
    method: 'POST',
  })

  await navigateTo('/login')
}

interface NavItem {
  label: string
  to: string
  icon: typeof Home
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/personnel/dashboard',
    icon: Home,
  },
  {
    label: 'My Assessment',
    to: '/personnel/assessment',
    icon: FileText,
  },
  {
    label: 'My Stress History',
    to: '/personnel/history',
    icon: BarChart2,
  },
  {
    label: 'My Recommendations',
    to: '/personnel/recommendations',
    icon: CheckCircle2,
  },
  {
    label: 'My Profile',
    to: '/personnel/profile',
    icon: User,
  },
  {
    label: 'Security',
    to: '/personnel/security',
    icon: ShieldCheck,
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

const riskTone: Record<
  RiskLevel,
  {
    text: string
    badgeBg: string
    dot: string
  }
> = {
  Low: {
    text: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    dot: 'bg-emerald-400',
  },
  Moderate: {
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500/15',
    dot: 'bg-blue-400',
  },
  Elevated: {
    text: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    dot: 'bg-amber-400',
  },
  High: {
    text: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    dot: 'bg-red-400',
  },
}

const averageStress = computed(() => {
  if (!assessments.value.length) return null

  const total = assessments.value.reduce(
    (sum, assessment) => sum + assessment.stressScore,
    0,
  )

  return Number((total / assessments.value.length).toFixed(2))
})

const highestStress = computed(() => {
  if (!assessments.value.length) return null

  return Math.max(
    ...assessments.value.map((assessment) => assessment.stressScore),
  )
})

const lowestStress = computed(() => {
  if (!assessments.value.length) return null

  return Math.min(
    ...assessments.value.map((assessment) => assessment.stressScore),
  )
})
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <!-- Sidebar -->
    <aside
      class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]"
    >
      <div class="flex items-center gap-3 px-5 py-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400"
        >
          <ShieldCheck :size="20" :stroke-width="1.5" />
        </div>

```
    <div>
      <p class="text-sm font-bold leading-tight text-white">
        Surakshit AI
      </p>
      <p class="text-[10px] leading-tight text-slate-400">
        Personnel Stress &amp; Welfare Monitoring
      </p>
    </div>
  </div>

  <nav class="flex-1 space-y-1 px-3 pb-4">
    <NuxtLink
      v-for="item in navItems"
      :key="item.label"
      :to="item.to"
      class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
      :class="
        isActive(item.to)
          ? 'bg-emerald-600/90 text-white shadow-sm'
          : 'text-slate-300 hover:bg-white/5'
      "
    >
      <component
        :is="item.icon"
        :size="18"
        :stroke-width="1.5"
      />
      {{ item.label }}
    </NuxtLink>
  </nav>

  <div class="px-5 pb-2">
    <p class="text-sm italic leading-snug text-blue-300/80">
      Stronger Minds
    </p>
    <p class="text-sm italic leading-snug text-blue-300/80">
      Build a Safer Tomorrow
    </p>
  </div>

  <div class="border-t border-white/5 px-3 py-3">
    <button
      type="button"
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
      @click="logout"
    >
      <LogOut :size="18" :stroke-width="1.5" />
      Logout
    </button>
  </div>
</aside>

<!-- Main -->
<div class="flex min-h-screen flex-1 flex-col">
  <!-- Header -->
  <header
    class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5"
  >
    <button
      type="button"
      class="rounded-lg p-2 text-slate-400 hover:bg-white/5"
      aria-label="Toggle menu"
    >
      <Menu :size="20" />
    </button>

    <div>
      <p class="text-sm font-bold text-white">
        My Stress History
      </p>
      <p class="text-[11px] text-slate-500">
        Track your previous stress assessments
      </p>
    </div>

    <div class="ml-auto flex items-center gap-4">
      <button
        type="button"
        class="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
        aria-label="Notifications"
      >
        <Bell :size="20" :stroke-width="1.5" />
      </button>

      <button
        type="button"
        class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
        :aria-label="
          darkMode
            ? 'Switch to light mode'
            : 'Switch to dark mode'
        "
        @click="toggleDarkMode"
      >
        <Sun
          v-if="darkMode"
          :size="20"
          :stroke-width="1.5"
        />
        <Moon
          v-else
          :size="20"
          :stroke-width="1.5"
        />
      </button>

      <NuxtLink
        to="/personnel/profile"
        class="flex items-center gap-2.5 border-l border-white/10 pl-4"
      >
        <div
          class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700"
        >
          <User
            :size="18"
            :stroke-width="1.5"
            class="text-slate-300"
          />
        </div>

        <div class="leading-tight">
          <p class="text-sm font-semibold text-white">
            Personnel
          </p>
          <p class="text-[11px] text-slate-400">
            My Profile
          </p>
        </div>

        <ChevronDown
          :size="16"
          class="text-slate-500"
        />
      </NuxtLink>
    </div>
  </header>

  <main class="flex-1 space-y-6 p-6">
    <!-- Page heading -->
    <div>
      <h1 class="text-2xl font-extrabold text-white">
        Stress History
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        Review your previous stress assessments and track changes
        over time.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16"
    >
      <div
        class="flex flex-col items-center gap-3 text-slate-400"
      >
        <RotateCw
          :size="22"
          class="animate-spin"
        />
        <p class="text-sm">
          Loading your stress history…
        </p>
      </div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center"
    >
      <AlertTriangle
        :size="28"
        class="text-red-400"
        :stroke-width="1.5"
      />

      <p class="text-sm font-semibold text-red-300">
        Couldn't load your stress history
      </p>

      <p class="text-xs text-slate-400">
        {{ error.message }}
      </p>

      <button
        type="button"
        class="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
        @click="refresh()"
      >
        Retry
      </button>
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div
        class="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div
          class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
            >
              <BarChart2
                :size="18"
                :stroke-width="1.5"
              />
            </div>

            <p class="text-xs font-semibold text-slate-400">
              Total Assessments
            </p>
          </div>

          <p class="mt-4 text-3xl font-extrabold text-white">
            {{ assessments.length }}
          </p>
        </div>

        <div
          class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"
            >
              <TrendingUp
                :size="18"
                :stroke-width="1.5"
              />
            </div>

            <p class="text-xs font-semibold text-slate-400">
              Average Stress
            </p>
          </div>

          <p class="mt-4 text-3xl font-extrabold text-white">
            {{ averageStress ?? '—' }}
            <span class="text-sm font-medium text-slate-500">
              / 10
            </span>
          </p>
        </div>

        <div
          class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"
            >
              <TrendingUp
                :size="18"
                :stroke-width="1.5"
              />
            </div>

            <p class="text-xs font-semibold text-slate-400">
              Score Range
            </p>
          </div>

          <p class="mt-4 text-2xl font-extrabold text-white">
            {{ lowestStress ?? '—' }}
            <span class="text-slate-600">–</span>
            {{ highestStress ?? '—' }}
          </p>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="!assessments.length"
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-16 text-center"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"
        >
          <BarChart2
            :size="24"
            :stroke-width="1.5"
          />
        </div>

        <h2
          class="mt-4 text-sm font-bold text-white"
        >
          No assessment history yet
        </h2>

        <p
          class="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500"
        >
          Complete your first stress assessment to start
          tracking your wellbeing history.
        </p>

        <NuxtLink
          to="/personnel/assessment/new"
          class="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          Take Assessment
          <ChevronRight :size="14" />
        </NuxtLink>
      </div>

      <!-- History table -->
      <div
        v-else
        class="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526]"
      >
        <div
          class="flex items-center justify-between border-b border-white/5 px-5 py-4"
        >
          <div>
            <h2 class="text-sm font-bold text-white">
              Assessment History
            </h2>

            <p class="mt-0.5 text-[11px] text-slate-500">
              Your recorded stress assessment results
            </p>
          </div>

          <NuxtLink
            to="/personnel/assessment/new"
            class="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
          >
            New Assessment
          </NuxtLink>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr
                class="border-b border-white/5 text-slate-500"
              >
                <th class="px-5 py-3 font-medium">
                  Date &amp; Time
                </th>

                <th class="px-5 py-3 font-medium">
                  Stress Score
                </th>

                <th class="px-5 py-3 font-medium">
                  Risk Level
                </th>

                <th class="px-5 py-3 text-right font-medium">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="assessment in assessments"
                :key="assessment.id"
                class="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
              >
                <td class="px-5 py-4">
                  <p class="font-semibold text-slate-200">
                    {{ assessment.date }}
                  </p>
                  <p class="mt-0.5 text-[10px] text-slate-500">
                    {{ assessment.time }}
                  </p>
                </td>

                <td class="px-5 py-4">
                  <span
                    class="font-bold text-white"
                  >
                    {{ assessment.stressScore }}
                  </span>
                  <span class="text-slate-600">
                    / 10
                  </span>
                </td>

                <td class="px-5 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-semibold"
                    :class="[
                      riskTone[assessment.riskLevel].badgeBg,
                      riskTone[assessment.riskLevel].text,
                    ]"
                  >
                    <span
                      class="h-1.5 w-1.5 rounded-full"
                      :class="
                        riskTone[
                          assessment.riskLevel
                        ].dot
                      "
                    ></span>

                    {{ assessment.riskLevel }}
                  </span>
                </td>

                <td class="px-5 py-4 text-right">
                  <NuxtLink
                    :to="`/personnel/history/${assessment.id}`"
                    class="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    View Details
                    <ChevronRight :size="13" />
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </main>

  <footer
    class="flex items-center justify-between border-t border-white/5 px-6 py-4 text-[11px] text-slate-500"
  >
    <span>
      Surakshit AI &nbsp;|&nbsp; Personnel Stress &amp; Welfare
      Monitoring System
    </span>

    <span>
      Healthy Personnel &nbsp;|&nbsp; Stronger Forces
      &nbsp;|&nbsp; Safer Nation
    </span>
  </footer>
</div>
```

  </div>
</template>
