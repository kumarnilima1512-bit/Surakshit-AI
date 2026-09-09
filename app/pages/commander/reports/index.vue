<!--
  pages/commander/reports/index.vue
  URL: /commander/reports  (sidebar label: "Unit Reports")
  Nuxt 3 + Composition API + Tailwind, same visual language as the
  Commander dashboard.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'

import {
  Home,
  Users,
  AlertTriangle,
  ClipboardList,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  Search,
  Bell as BellIcon,
  Moon,
  ChevronDown,
  Download,
  RotateCw,
  X,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/commander/reports
        -> ReportsData

   POST /api/commander/reports/generate
        { type, from, to }
        -> ReportRecord
   ====================================================================== */

type ReportType =
  | 'Unit Risk Summary'
  | 'Personnel Readiness Report'
  | 'Risk Alert Log'
  | 'Monthly Command Report'

interface CommanderHeader {
  name: string
  rank: string
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
  commander: CommanderHeader
  reports: ReportRecord[]
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchReports,
} = await useFetch<ReportsData>(
  '/api/commander/reports',
)

/* ---------------- Sidebar / header shell ---------------- */

const route = useRoute()

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function goBack() {
  navigateTo('/commander/dashboard')
}

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/commander/dashboard',
    icon: Home,
  },
  {
    label: 'My Personnel',
    to: '/commander/personnel',
    icon: Users,
  },
  {
    label: 'Risk Alerts',
    to: '/commander/alerts',
    icon: AlertTriangle,
  },
  {
    label: 'Follow-ups',
    to: '/commander/follow-ups',
    icon: ClipboardList,
  },
  {
    label: 'Unit Reports',
    to: '/commander/reports',
    icon: FileText,
  },
  {
    label: 'My Profile',
    to: '/commander/profile',
    icon: User,
  },
  {
    label: 'Security',
    to: '/commander/security',
    icon: ShieldCheck,
  },
]

function isActive(to: string) {
  return (
    route.path === to ||
    route.path.startsWith(`${to}/`)
  )
}

async function logout() {
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

  navigateTo({
    path: '/commander/search',
    query: { q },
  })
}

/* ---------------- Profile dropdown ---------------- */

const profileOpen = ref(false)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

async function handleProfileAction(
  action: 'Profile' | 'Security' | 'Logout',
) {
  profileOpen.value = false

  if (action === 'Logout') {
    return logout()
  }

  await navigateTo(
    `/commander/${action.toLowerCase()}`,
  )
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (
    !target.closest('[data-dropdown-root]')
  ) {
    profileOpen.value = false
  }
}

/* Close mobile sidebar when route changes */
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    profileOpen.value = false
  },
)

onMounted(() => {
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
})

/* ---------------- Generate report form ---------------- */

const reportTypes: ReportType[] = [
  'Unit Risk Summary',
  'Personnel Readiness Report',
  'Risk Alert Log',
  'Monthly Command Report',
]

const selectedType =
  ref<ReportType>('Unit Risk Summary')

const fromDate = ref('')
const toDate = ref('')
const generating = ref(false)
const generateError = ref<string | null>(null)

async function generateReport() {
  if (
    !fromDate.value ||
    !toDate.value ||
    !data.value
  ) {
    return
  }

  generating.value = true
  generateError.value = null

  try {
    const created =
      await $fetch<ReportRecord>(
        '/api/commander/reports/generate',
        {
          method: 'POST',
          body: {
            type: selectedType.value,
            from: fromDate.value,
            to: toDate.value,
          },
        },
      )

    data.value.reports = [
      created,
      ...data.value.reports,
    ]
  } catch {
    generateError.value =
      'Could not generate the report. Please try again.'
  } finally {
    generating.value = false
  }
}

const typeBadge: Record<
  ReportType,
  string
> = {
  'Unit Risk Summary':
    'bg-blue-500/15 text-blue-400',

  'Personnel Readiness Report':
    'bg-emerald-500/15 text-emerald-400',

  'Risk Alert Log':
    'bg-red-500/15 text-red-400',

  'Monthly Command Report':
    'bg-violet-500/15 text-violet-400',
}

const ICON_SIZE = 16
</script>

<template>
  <div
    class="relative flex min-h-screen overflow-x-hidden bg-[#0b1220] text-slate-100"
  >

    <!-- ================================================================
         Desktop Sidebar
         ================================================================ -->

    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526] lg:flex"
    >

      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5">
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
          <p
            class="text-sm font-bold leading-tight text-white"
          >
            Surakshit AI
          </p>

          <p
            class="text-[10px] leading-tight text-slate-400"
          >
            Personnel Stress &amp; Welfare Monitoring
          </p>
        </div>
      </div>

      <!-- Navigation -->
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

          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div
        class="border-t border-white/5 px-3 py-3"
      >
        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut
            :size="14"
            :stroke-width="1.5"
          />

          Logout
        </button>
      </div>
    </aside>

    <!-- ================================================================
         Mobile Sidebar Overlay
         ================================================================ -->

    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/60 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- ================================================================
         Mobile Sidebar Drawer
         ================================================================ -->

    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col border-r border-white/5 bg-[#0d1526] shadow-2xl lg:hidden"
      >

        <!-- Mobile Logo -->
        <div
          class="flex items-center justify-between border-b border-white/5 px-4 py-4"
        >
          <div
            class="flex min-w-0 items-center gap-3"
          >
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15"
            >
              <img
                src="/logos/surakshit-ai.png"
                alt="Surakshit AI"
                class="h-10 w-10 object-contain"
              />
            </div>

            <div class="min-w-0">
              <p
                class="text-sm font-bold leading-tight text-white"
              >
                Surakshit AI
              </p>

              <p
                class="text-[10px] leading-tight text-slate-400"
              >
                Personnel Stress &amp; Welfare Monitoring
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="closeSidebar"
            class="ml-2 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav
          class="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
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

            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Mobile Logout -->
        <div
          class="border-t border-white/5 px-3 py-3"
        >
          <button
            type="button"
            @click="logout"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <LogOut
              :size="14"
              :stroke-width="1.5"
            />

            Logout
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ================================================================
         Main Area
         ================================================================ -->

    <div
      class="flex min-h-screen min-w-0 flex-1 flex-col"
    >

      <!-- ==============================================================
           Header
           ============================================================== -->

      <header
        class="flex min-w-0 items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3.5 sm:gap-4 sm:px-6"
      >

        <!-- Mobile Menu -->
        <button
          type="button"
          @click="sidebarOpen = true"
          class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Search -->
        <form
          class="relative min-w-0 max-w-md flex-1"
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
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 sm:pr-4"
          />
        </form>

        <!-- Header Right -->
        <div
          class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4"
        >

          <!-- Notifications -->
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Notifications"
          >
            <BellIcon
              :size="20"
              :stroke-width="1.5"
            />
          </button>

          <!-- Theme -->
          <button
            type="button"
            class="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 sm:block"
            aria-label="Toggle theme"
          >
            <Moon
              :size="20"
              :stroke-width="1.5"
            />
          </button>

          <!-- Profile -->
          <div
            class="relative border-l border-white/10 pl-2 sm:pl-3 lg:pl-4"
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
                  v-if="
                    data?.commander.avatarUrl
                  "
                  :src="
                    data.commander.avatarUrl
                  "
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

              <div
                class="hidden text-left leading-tight md:block"
              >
                <p
                  class="max-w-[150px] truncate text-sm font-semibold text-white"
                >
                  {{ data?.commander.rank }}
                  {{ data?.commander.name }}
                </p>

                <p
                  class="text-[11px] text-slate-400"
                >
                  Commander
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="hidden text-slate-500 transition-transform sm:block"
                :class="{
                  'rotate-180': profileOpen,
                }"
              />
            </button>

            <!-- Profile Dropdown -->
            <div
              v-if="profileOpen"
              class="absolute right-0 z-30 mt-2 w-44 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in ([
                  'Profile',
                  'Security',
                  'Logout',
                ] as const)"
                :key="action"
                type="button"
                @click="
                  handleProfileAction(action)
                "
                class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ==============================================================
           Main Content
           ============================================================== -->

      <main
        class="min-w-0 flex-1 space-y-4 p-4 sm:p-6"
      >

        <!-- Page Heading -->
        <div
          class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">

            <!-- Back Button -->
            <button
              type="button"
              @click="goBack"
              class="mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft :size="14" />
              Back
            </button>

            <h1
              class="text-xl font-extrabold tracking-tight text-white"
            >
              Unit Reports
            </h1>

            <p
              class="mt-0.5 text-xs text-slate-400"
            >
              Generate and download reports for your
              unit
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-10 sm:p-16"
        >
          <div
            class="flex flex-col items-center gap-3 text-slate-400"
          >
            <RotateCw
              :size="22"
              class="animate-spin"
            />

            <p class="text-sm">
              Loading reports…
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center sm:p-16"
        >
          <AlertTriangle
            :size="28"
            class="text-red-400"
            :stroke-width="1.5"
          />

          <p
            class="text-sm font-semibold text-red-300"
          >
            Couldn't load reports
          </p>

          <p
            class="max-w-xl break-words text-xs leading-relaxed text-slate-400"
          >
            {{ error.message }} — expected data from
            <code
              class="rounded bg-white/5 px-1.5 py-0.5"
            >
              /api/commander/reports
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

        <!-- Main Data -->
        <template v-else-if="data">

          <!-- ==========================================================
               Generate New Report
               ========================================================== -->

          <div
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <h3
              class="text-sm font-bold text-white"
            >
              Generate New Report
            </h3>

            <div
              class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >

              <!-- Report Type -->
              <select
                v-model="selectedType"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              >
                <option
                  v-for="t in reportTypes"
                  :key="t"
                  :value="t"
                >
                  {{ t }}
                </option>
              </select>

              <!-- From -->
              <input
                v-model="fromDate"
                type="date"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              />

              <!-- To -->
              <input
                v-model="toDate"
                type="date"
                class="min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              />

              <!-- Generate -->
              <button
                type="button"
                :disabled="
                  !fromDate ||
                  !toDate ||
                  generating
                "
                @click="generateReport"
                class="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{
                  generating
                    ? 'Generating…'
                    : 'Generate'
                }}
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
               Report History
               ========================================================== -->

          <div
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <div
              class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
            >
              <h3
                class="text-sm font-bold text-white"
              >
                Report History
              </h3>

              <p
                class="text-[10px] text-slate-500 lg:hidden"
              >
                Swipe horizontally to view all
                columns
              </p>
            </div>

            <!-- Horizontal scroll on mobile -->
            <div
              class="mt-3 overflow-x-auto overscroll-x-contain"
            >
              <table
                class="w-full min-w-[720px] text-left text-xs"
              >
                <thead>
                  <tr
                    class="text-slate-500"
                  >
                    <th
                      class="pb-2 font-medium"
                    >
                      Name
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Type
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Date Range
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Generated By
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Generated On
                    </th>

                    <th
                      class="pb-2 text-right font-medium"
                    />
                  </tr>
                </thead>

                <tbody>

                  <!-- Empty -->
                  <tr
                    v-if="
                      !data.reports.length
                    "
                  >
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
                    <!-- Name -->
                    <td
                      class="max-w-[220px] py-2.5 font-medium text-slate-200"
                    >
                      {{ r.name }}
                    </td>

                    <!-- Type -->
                    <td class="py-2.5">
                      <span
                        class="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold"
                        :class="
                          typeBadge[r.type]
                        "
                      >
                        {{ r.type }}
                      </span>
                    </td>

                    <!-- Date Range -->
                    <td
                      class="whitespace-nowrap py-2.5 text-slate-400"
                    >
                      {{ r.dateRangeLabel }}
                    </td>

                    <!-- Generated By -->
                    <td
                      class="whitespace-nowrap py-2.5 text-slate-400"
                    >
                      {{ r.generatedBy }}
                    </td>

                    <!-- Generated On -->
                    <td
                      class="whitespace-nowrap py-2.5 text-slate-500"
                    >
                      {{ r.generatedOnLabel }}
                    </td>

                    <!-- Download -->
                    <td
                      class="py-2.5 text-right"
                    >
                      <a
                        :href="r.downloadUrl"
                        target="_blank"
                        rel="noopener"
                        class="inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-emerald-400 hover:underline"
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>