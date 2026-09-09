<!--
  pages/welfare/reports/index.vue
  URL: /welfare/reports
  Nuxt 3 + Composition API + Tailwind
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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
  ArrowLeft,
  X,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/welfare/reports
   POST /api/welfare/reports/generate { type, from, to }
   ====================================================================== */

type ReportType =
  | 'Unit Risk Summary'
  | 'High-Risk Case Log'
  | 'Intervention Outcomes'
  | 'Monthly Welfare Report'

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

const {
  data,
  pending: loading,
  error,
  refresh: fetchReports,
} = await useFetch<ReportsData>('/api/welfare/reports')

/* ---------------- Sidebar / header shell ---------------- */

const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/welfare/dashboard', icon: Home },
  { label: 'Personnel', to: '/welfare/personnel', icon: Users },
  {
    label: 'High-Risk Cases',
    to: '/welfare/high-risk-cases',
    icon: AlertTriangle,
  },
  {
    label: 'Interventions',
    to: '/welfare/interventions',
    icon: ShieldCheck,
  },
  {
    label: 'Follow-ups',
    to: '/welfare/follow-ups',
    icon: ClipboardList,
  },
  {
    label: 'Analytics',
    to: '/welfare/analytics',
    icon: BarChart2,
  },
  {
    label: 'Reports',
    to: '/welfare/reports',
    icon: FileText,
  },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

/* ---------------- Mobile sidebar ---------------- */

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
  profileOpen.value = false
}

function goBack() {
  navigateTo('/welfare/dashboard')
}

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    profileOpen.value = false
  }
)

/* ---------------- Logout ---------------- */

async function logout() {
  sidebarOpen.value = false
  profileOpen.value = false

  await useFetch('/api/auth/logout', {
    method: 'POST',
  })

  await navigateTo('/login')
}

/* ---------------- Top search ---------------- */

const topSearchQuery = ref('')

function submitTopSearch() {
  const q = topSearchQuery.value.trim()

  if (!q) return

  sidebarOpen.value = false

  navigateTo({
    path: '/welfare/search',
    query: { q },
  })
}

/* ---------------- Profile dropdown ---------------- */

const profileOpen = ref(false)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

async function handleProfileAction(
  action: 'Profile' | 'Settings' | 'Logout'
) {
  profileOpen.value = false

  if (action === 'Logout') {
    return logout()
  }

  await navigateTo(`/welfare/${action.toLowerCase()}`)
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (!target.closest('[data-dropdown-root]')) {
    profileOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
})

/* ---------------- Generate report form ---------------- */

const reportTypes: ReportType[] = [
  'Unit Risk Summary',
  'High-Risk Case Log',
  'Intervention Outcomes',
  'Monthly Welfare Report',
]

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
    const created = await $fetch<ReportRecord>(
      '/api/welfare/reports/generate',
      {
        method: 'POST',
        body: {
          type: selectedType.value,
          from: fromDate.value,
          to: toDate.value,
        },
      }
    )

    data.value.reports = [created, ...data.value.reports]
  } catch {
    generateError.value =
      'Could not generate the report. Please try again.'
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
  <div class="flex min-h-screen min-w-0 bg-[#0b1220] text-slate-100">

    <!-- ================================================================
         DESKTOP SIDEBAR
         ================================================================ -->

    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526] lg:flex"
    >
      <div class="flex items-center gap-3 px-5 py-5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
        >
          <img
            src="/logos/surakshit-ai.png"
            alt="Surakshit AI"
            class="h-10 w-10 object-contain"
          />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-bold leading-tight text-white">
            Surakshit AI
          </p>
          <p class="text-[10px] leading-tight text-slate-400">
            Personnel Stress &amp; Welfare Monitoring
          </p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-white/5'
          "
        >
          <component
            :is="item.icon"
            :size="ICON_SIZE"
            :stroke-width="1.5"
          />

          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-white/5 px-3 py-3">
        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut :size="14" :stroke-width="1.5" />
          Logout
        </button>
      </div>
    </aside>

    <!-- ================================================================
         MOBILE SIDEBAR OVERLAY
         ================================================================ -->

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
      @click="closeSidebar"
    />

    <!-- ================================================================
         MOBILE SIDEBAR DRAWER
         ================================================================ -->

    <aside
      v-if="sidebarOpen"
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1526] shadow-2xl lg:hidden"
    >
      <div class="flex items-center justify-between border-b border-white/5 px-5 py-5">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
          >
            <img
              src="/logos/surakshit-ai.png"
              alt="Surakshit AI"
              class="h-10 w-10 object-contain"
            />
          </div>

          <div class="min-w-0">
            <p class="text-sm font-bold leading-tight text-white">
              Surakshit AI
            </p>

            <p class="text-[10px] leading-tight text-slate-400">
              Personnel Stress &amp; Welfare Monitoring
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="closeSidebar"
          class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Close menu"
        >
          <X :size="20" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-white/5'
          "
        >
          <component
            :is="item.icon"
            :size="ICON_SIZE"
            :stroke-width="1.5"
          />

          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="border-t border-white/5 px-3 py-3">
        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut :size="14" :stroke-width="1.5" />
          Logout
        </button>
      </div>
    </aside>

    <!-- ================================================================
         MAIN APPLICATION
         ================================================================ -->

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">

      <!-- ================================================================
           HEADER
           ================================================================ -->

      <header
        class="flex min-w-0 items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3 sm:gap-4 sm:px-6 sm:py-3.5"
      >

        <!-- Mobile menu -->
        <button
          type="button"
          @click="sidebarOpen = true"
          class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Desktop menu button -->
        <button
          type="button"
          @click="sidebarOpen = true"
          class="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:inline-flex"
          aria-label="Toggle menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Search -->
        <form
          class="relative hidden max-w-md flex-1 sm:block"
          @submit.prevent="submitTopSearch"
        >
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            v-model="topSearchQuery"
            type="text"
            placeholder="Search personnel, unit, or ID..."
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </form>

        <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-4">

          <!-- Notifications -->
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Notifications"
          >
            <BellIcon :size="20" :stroke-width="1.5" />
          </button>

          <!-- Theme -->
          <button
            type="button"
            class="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 sm:inline-flex"
            aria-label="Toggle theme"
          >
            <Moon :size="20" :stroke-width="1.5" />
          </button>

          <!-- Profile -->
          <div
            class="relative border-l border-white/10 pl-2 sm:pl-4"
            data-dropdown-root
          >
            <button
              type="button"
              @click.stop="toggleProfile"
              class="flex items-center gap-2"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700"
              >
                <img
                  v-if="data?.officer.avatarUrl"
                  :src="data.officer.avatarUrl"
                  class="h-full w-full object-cover"
                  alt=""
                />

                <User
                  v-else
                  :size="16"
                  :stroke-width="1.5"
                  class="text-slate-300"
                />
              </div>

              <div class="hidden max-w-[130px] text-left leading-tight sm:block">
                <p class="truncate text-sm font-semibold text-white">
                  {{ data?.officer.name ?? '—' }}
                </p>

                <p class="truncate text-[11px] text-slate-400">
                  {{ data?.officer.role ?? '' }}
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="text-slate-500 transition-transform"
                :class="{ 'rotate-180': profileOpen }"
              />
            </button>

            <!-- Profile dropdown -->
            <div
              v-if="profileOpen"
              class="absolute right-0 z-30 mt-2 w-44 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in (['Profile', 'Settings', 'Logout'] as const)"
                :key="action"
                type="button"
                @click="handleProfileAction(action)"
                class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ================================================================
           PAGE CONTENT
           ================================================================ -->

      <main
        class="min-w-0 flex-1 space-y-4 p-4 sm:p-6"
      >

        <!-- Page heading -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="goBack"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft :size="14" />
                Back
              </button>

              <h1 class="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Reports
              </h1>
            </div>

            <p class="mt-1 text-xs text-slate-400 sm:ml-[76px]">
              Generate and download welfare reports for your unit
            </p>
          </div>
        </div>

        <!-- ============================================================
             LOADING
             ============================================================ -->

        <div
          v-if="loading"
          class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-10 sm:p-16"
        >
          <div class="flex flex-col items-center gap-3 text-center text-slate-400">
            <RotateCw
              :size="22"
              class="animate-spin"
            />

            <p class="text-sm">
              Loading reports…
            </p>
          </div>
        </div>

        <!-- ============================================================
             ERROR
             ============================================================ -->

        <div
          v-else-if="error"
          class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center sm:p-16"
        >
          <AlertTriangle
            :size="28"
            class="text-red-400"
            :stroke-width="1.5"
          />

          <p class="text-sm font-semibold text-red-300">
            Couldn't load reports
          </p>

          <p class="max-w-xl break-words text-xs text-slate-400">
            {{ error.message }} — expected data from
            <code class="rounded bg-white/5 px-1.5 py-0.5">
              /api/welfare/reports
            </code>
          </p>

          <button
            type="button"
            @click="fetchReports()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <!-- ============================================================
             DATA
             ============================================================ -->

        <template v-else-if="data">

          <!-- ==========================================================
               GENERATE NEW REPORT
               ========================================================== -->

          <div
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <h3 class="text-sm font-bold text-white">
              Generate New Report
            </h3>

            <div
              class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <!-- Report type -->
              <select
                v-model="selectedType"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              >
                <option
                  v-for="t in reportTypes"
                  :key="t"
                  :value="t"
                >
                  {{ t }}
                </option>
              </select>

              <!-- From date -->
              <input
                v-model="fromDate"
                type="date"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              />

              <!-- To date -->
              <input
                v-model="toDate"
                type="date"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              />

              <!-- Generate -->
              <button
                type="button"
                :disabled="!fromDate || !toDate || generating"
                @click="generateReport"
                class="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ generating ? 'Generating…' : 'Generate' }}
              </button>
            </div>

            <p
              v-if="generateError"
              class="mt-2 text-[11px] text-red-400"
            >
              {{ generateError }}
            </p>
          </div>

          <!-- ==========================================================
               REPORT HISTORY
               ========================================================== -->

          <div
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-bold text-white">
                Report History
              </h3>

              <span
                v-if="data.reports.length"
                class="text-[10px] text-slate-500"
              >
                {{ data.reports.length }} report{{ data.reports.length === 1 ? '' : 's' }}
              </span>
            </div>

            <!-- Mobile swipe hint -->
            <p
              v-if="data.reports.length"
              class="mt-2 text-[10px] text-slate-500 sm:hidden"
            >
              Swipe horizontally to view the complete table →
            </p>

            <div class="mt-3 overflow-x-auto">
              <table class="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr class="text-slate-500">
                    <th class="pb-2 font-medium">
                      Name
                    </th>

                    <th class="pb-2 font-medium">
                      Type
                    </th>

                    <th class="pb-2 font-medium">
                      Date Range
                    </th>

                    <th class="pb-2 font-medium">
                      Generated By
                    </th>

                    <th class="pb-2 font-medium">
                      Generated On
                    </th>

                    <th class="pb-2 text-right font-medium">
                    </th>
                  </tr>
                </thead>

                <tbody>

                  <!-- Empty -->
                  <tr v-if="!data.reports.length">
                    <td
                      colspan="6"
                      class="py-8 text-center text-slate-500"
                    >
                      No reports generated yet.
                    </td>
                  </tr>

                  <!-- Reports -->
                  <tr
                    v-for="r in data.reports"
                    :key="r.id"
                    class="border-t border-white/5"
                  >
                    <td class="py-3 pr-4 font-medium text-slate-200">
                      {{ r.name }}
                    </td>

                    <td class="py-3 pr-4">
                      <span
                        class="inline-block rounded-md px-2 py-0.5 text-[10px] font-bold"
                        :class="typeBadge[r.type]"
                      >
                        {{ r.type }}
                      </span>
                    </td>

                    <td class="py-3 pr-4 text-slate-400">
                      {{ r.dateRangeLabel }}
                    </td>

                    <td class="py-3 pr-4 text-slate-400">
                      {{ r.generatedBy }}
                    </td>

                    <td class="py-3 pr-4 text-slate-500">
                      {{ r.generatedOnLabel }}
                    </td>

                    <td class="py-3 text-right">
                      <a
                        :href="r.downloadUrl"
                        download
                        class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-emerald-400 transition hover:bg-emerald-500/10 hover:underline"
                      >
                        <Download :size="12" />
                        Download
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

<style scoped>
/* Smooth mobile sidebar/content feel */
button,
a,
input,
select {
  -webkit-tap-highlight-color: transparent;
}

/* Better date input rendering on dark UI */
input[type='date'] {
  color-scheme: dark;
}
</style>