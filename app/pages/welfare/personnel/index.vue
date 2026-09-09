<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
  Filter,
  ChevronRight,
  RotateCw,
  ArrowLeft,
  X,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/welfare/personnel
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type RiskFilter = 'All' | RiskLevel

interface PersonnelListItem {
  id: number
  name: string
  rank: string
  unit: string
  risk: RiskLevel | 'Not Assessed'
  score: number | null
  lastAssessment: string | null
  followUp: string | null

  // Assessment visibility status for Welfare Officer
  seen: boolean
  seenStatus: 'Seen' | 'Not Seen' | 'No Assessment'
  unseenAssessments: number
}

interface OfficerHeader {
  id: number
  role: string
  name?: string
  avatarUrl?: string | null
}

interface PersonnelPageData {
  success: boolean
  officer: OfficerHeader
  personnel: PersonnelListItem[]
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchPersonnel,
} = await useFetch<PersonnelPageData>('/api/welfare/personnel')

/* ---------------- Route ---------------- */

const route = useRoute()

/* ---------------- Sidebar nav ---------------- */

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

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function goBack() {
  navigateTo('/welfare/dashboard')
}

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    profileOpen.value = false
  },
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

/* ---------------- Search ---------------- */

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

/* ---------------- Notifications / profile dropdown ---------------- */

const profileOpen = ref(false)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

async function handleProfileAction(
  action: 'Profile' | 'Settings' | 'Logout',
) {
  profileOpen.value = false
  sidebarOpen.value = false

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

/* ---------------- Risk tone tokens ---------------- */

const riskTone: Record<
  RiskLevel,
  { text: string; badgeBg: string; dot: string }
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

const followUpToneClass: Record<
  'None' | 'Scheduled' | 'Overdue',
  string
> = {
  None: 'text-slate-500',
  Scheduled: 'text-blue-400',
  Overdue: 'text-red-400',
}

/* ---------------- Roster search + risk filter ---------------- */

const rosterSearch = ref('')
const riskFilter = ref<RiskFilter>('All')

const riskFilterOptions: RiskFilter[] = [
  'All',
  'High',
  'Elevated',
  'Moderate',
  'Low',
]

const initialRisk = route.query.risk

if (
  typeof initialRisk === 'string' &&
  riskFilterOptions.includes(initialRisk as RiskFilter)
) {
  riskFilter.value = initialRisk as RiskFilter
}

const filteredPersonnel = computed<PersonnelListItem[]>(() => {
  const list = data.value?.personnel ?? []

  const q = rosterSearch.value.trim().toLowerCase()

  return list.filter((p) => {
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      String(p.id).toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q)

    const matchesRisk =
      riskFilter.value === 'All' ||
      p.risk === riskFilter.value

    return matchesQuery && matchesRisk
  })
})

/* ---------------- Row navigation ---------------- */

function openPersonnel(id: number) {
  sidebarOpen.value = false
  navigateTo(`/welfare/personnel/${id}`)
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen min-w-0 bg-[#0b1220] text-slate-100">

    <!-- ================================================================
         Desktop Sidebar
         ================================================================ -->

    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526] lg:flex"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
        >
          <img
            src="/logos/surakshit-ai.png"
            alt="Surakshit AI"
            class="h-10 w-10 object-contain"
          >
        </div>

        <div>
          <p class="text-sm font-bold leading-tight text-white">
            Surakshit AI
          </p>

          <p class="text-[10px] leading-tight text-slate-400">
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
      <div class="border-t border-white/5 px-3 py-3">
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
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        @click="closeSidebar"
      ></div>
    </Transition>

    <!-- ================================================================
         Mobile Sidebar Drawer
         ================================================================ -->

    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1526] shadow-2xl lg:hidden"
      >
        <!-- Mobile logo/header -->
        <div
          class="flex items-center justify-between border-b border-white/5 px-5 py-5"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
            >
              <img
                src="/logos/surakshit-ai.png"
                alt="Surakshit AI"
                class="h-10 w-10 object-contain"
              >
            </div>

            <div class="min-w-0">
              <p class="text-sm font-bold leading-tight text-white">
                Surakshit AI
              </p>

              <p class="truncate text-[10px] leading-tight text-slate-400">
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
            <X :size="20" />
          </button>
        </div>

        <!-- Mobile navigation -->
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

            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Mobile logout -->
        <div class="border-t border-white/5 px-3 py-3">
          <button
            type="button"
            @click="logout"
            class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
         Main
         ================================================================ -->

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">

      <!-- ================= Top Bar ================= -->

      <header
        class="flex min-h-[65px] items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3 sm:gap-4 sm:px-6"
      >
        <!-- Mobile menu -->
        <button
          type="button"
          @click="toggleSidebar"
          class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Desktop menu placeholder -->
        <div class="hidden w-2 lg:block"></div>

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
          >
        </form>

        <!-- Right controls -->
        <div class="ml-auto flex items-center gap-1 sm:gap-3">

          <!-- Notifications -->
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Notifications"
          >
            <BellIcon
              :size="19"
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
              :size="19"
              :stroke-width="1.5"
            />
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
                >

                <User
                  v-else
                  :size="16"
                  :stroke-width="1.5"
                  class="text-slate-300"
                />
              </div>

              <!-- Hide profile text on very small screens -->
              <div class="hidden text-left leading-tight sm:block">
                <p class="text-sm font-semibold text-white">
                  {{ data?.officer.name ?? '—' }}
                </p>

                <p class="text-[11px] text-slate-400">
                  {{ data?.officer.role ?? '' }}
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="hidden text-slate-500 transition-transform sm:block"
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
                class="block w-full rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ================= Main Content ================= -->

      <main class="min-w-0 flex-1 space-y-4 p-4 sm:p-6">

        <!-- Title row -->
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">

            <!-- Back button -->
            <button
              type="button"
              @click="goBack"
              class="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft :size="14" />
              Back
            </button>

            <h1 class="text-xl font-extrabold tracking-tight text-white">
              Personnel
            </h1>

            <p class="mt-0.5 text-xs text-slate-400">
              Full roster for your assigned unit
            </p>
          </div>

          <p class="text-xs text-slate-500 sm:text-right">
            {{ filteredPersonnel.length }} of
            {{ data?.personnel.length ?? 0 }} shown
          </p>
        </div>

        <!-- Loading state -->
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
              Loading roster…
            </p>
          </div>
        </div>

        <!-- Error state -->
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
            Couldn't load the roster
          </p>

          <p class="max-w-xl text-xs leading-5 text-slate-400">
            {{ error.message }} — expected data from
            <code class="rounded bg-white/5 px-1.5 py-0.5">
              /api/welfare/personnel
            </code>
          </p>

          <button
            type="button"
            @click="fetchPersonnel()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <!-- Roster table -->
        <div
          v-else-if="data"
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >

          <!-- Search + filters -->
          <div
            class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <!-- Roster search -->
            <div class="relative w-full sm:max-w-sm">
              <Search
                :size="14"
                class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                v-model="rosterSearch"
                type="text"
                placeholder="Search roster..."
                class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 sm:py-1.5"
              >
            </div>

            <!-- Risk filters -->
            <div class="flex min-w-0 items-center gap-1.5">
              <Filter
                :size="12"
                class="mr-1 shrink-0 text-slate-500"
              />

              <div
                class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
              >
                <button
                  v-for="opt in riskFilterOptions"
                  :key="opt"
                  type="button"
                  @click="riskFilter = opt"
                  class="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
                  :class="
                    riskFilter === opt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  "
                >
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <!-- Mobile swipe hint -->
          <p class="mt-3 text-[10px] text-slate-600 sm:hidden">
            Swipe horizontally to view all personnel details.
          </p>

          <!-- Table -->
          <div class="mt-3 overflow-x-auto sm:mt-4">
            <table class="w-full min-w-[820px] text-left text-xs">
              <thead>
                <tr class="text-slate-500">
                  <th class="pb-2 font-medium">ID</th>
                  <th class="pb-2 font-medium">Name</th>
                  <th class="pb-2 font-medium">Rank</th>
                  <th class="pb-2 font-medium">Unit</th>
                  <th class="pb-2 font-medium">Risk</th>
                  <th class="pb-2 font-medium">Score</th>
                  <th class="pb-2 font-medium">Last Assessment</th>
                  <th class="pb-2 font-medium">Follow-up</th>
                  <th class="pb-2 font-medium">Assessment</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="!filteredPersonnel.length">
                  <td
                    colspan="10"
                    class="py-8 text-center text-slate-500"
                  >
                    {{
                      rosterSearch || riskFilter !== 'All'
                        ? 'No personnel match your filters.'
                        : 'No personnel in this unit.'
                    }}
                  </td>
                </tr>

                <tr
                  v-for="p in filteredPersonnel"
                  :key="p.id"
                  class="cursor-pointer border-t border-white/5 hover:bg-white/5"
                  @click="openPersonnel(p.id)"
                >
                  <!-- ID -->
                  <td class="py-2.5 font-medium text-emerald-400">
                    {{ p.id }}
                  </td>

                  <!-- Name -->
                  <td class="py-2.5 text-slate-200">
                    {{ p.name }}
                  </td>

                  <!-- Rank -->
                  <td class="py-2.5 text-slate-400">
                    {{ p.rank }}
                  </td>

                  <!-- Unit -->
                  <td class="py-2.5 text-slate-400">
                    {{ p.unit }}
                  </td>

                  <!-- Risk -->
                  <td class="py-2.5">
                    <template v-if="p.risk !== 'Not Assessed'">
                      <span
                        class="flex items-center gap-1.5 font-semibold"
                        :class="riskTone[p.risk].text"
                      >
                        <span
                          class="h-1.5 w-1.5 rounded-full"
                          :class="riskTone[p.risk].dot"
                        ></span>

                        {{ p.risk }}
                      </span>
                    </template>

                    <span
                      v-else
                      class="text-slate-500"
                    >
                      Not Assessed
                    </span>
                  </td>

                  <!-- Score -->
                  <td class="py-2.5 font-semibold text-slate-200">
                    {{ p.score !== null ? p.score.toFixed(2) : '—' }}
                  </td>

                  <!-- Last Assessment -->
                  <td class="py-2.5 text-slate-500">
                    {{
                      p.lastAssessment
                        ? new Date(
                            p.lastAssessment,
                          ).toLocaleDateString(
                            'en-GB',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            },
                          )
                        : '—'
                    }}
                  </td>

                  <!-- Follow-up -->
                  <td class="py-2.5 font-medium">
                    <span
                      :class="
                        followUpToneClass[
                          p.followUp
                            ? (
                                p.followUp as
                                  | 'None'
                                  | 'Scheduled'
                                  | 'Overdue'
                              )
                            : 'None'
                        ]
                      "
                    >
                      {{ p.followUp ?? 'None' }}
                    </span>
                  </td>

                  <!-- Assessment Seen Status -->
                  <td class="py-2.5">
                    <span
                      v-if="p.seenStatus === 'Not Seen'"
                      class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold text-amber-400"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-amber-400"
                      ></span>

                      Not Seen
                    </span>

                    <span
                      v-else-if="p.seenStatus === 'Seen'"
                      class="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-400"
                    >
                      <span
                        class="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      ></span>

                      Seen
                    </span>

                    <span
                      v-else
                      class="text-slate-500"
                    >
                      No Assessment
                    </span>

                    <span
                      v-if="p.unseenAssessments > 1"
                      class="ml-1 text-[10px] text-slate-500"
                    >
                      +{{ p.unseenAssessments - 1 }} new
                    </span>
                  </td>

                  <!-- View -->
                  <td class="py-2.5 text-right">
                    <NuxtLink
                      :to="`/welfare/personnel/${p.id}`"
                      class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:underline"
                      @click.stop
                    >
                      View

                      <ChevronRight :size="12" />
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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

/* Hide scrollbar while preserving horizontal scrolling */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>