<!--
  pages/commander/personnel/index.vue
  URL: /commander/personnel
  Nuxt 4 + Composition API + Tailwind
  Commander section — responsive layout
-->

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
   GET /api/commander/personnel -> PersonnelPageData
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'
type RiskFilter = 'All' | RiskLevel

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface PersonnelListItem {
  id: string
  name: string
  rank: string
  subUnit: string
  riskLevel: RiskLevel
  score: number
  lastAssessment: string
  followUpStatus: 'None' | 'Scheduled' | 'Overdue'
}

interface PersonnelPageData {
  commander: CommanderHeader
  personnel: PersonnelListItem[]
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchPersonnel,
} = await useFetch<PersonnelPageData>('/api/commander/personnel')

/* ---------------- Sidebar / header shell ---------------- */

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
  { label: 'Follow-ups', to: '/commander/follow-ups', icon: ClipboardList },
  { label: 'Unit Reports', to: '/commander/reports', icon: FileText },
  { label: 'My Profile', to: '/commander/profile', icon: User },
  { label: 'Security', to: '/commander/security', icon: ShieldCheck },
]

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

/* ---------------- Mobile sidebar ---------------- */

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function goBack() {
  navigateTo('/commander/dashboard')
}

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
  },
)

/* ---------------- Logout ---------------- */

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

  await navigateTo(`/commander/${action.toLowerCase()}`)
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
  {
    text: string
    dot: string
  }
> = {
  Low: {
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  Moderate: {
    text: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  Elevated: {
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  High: {
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
}

const followUpToneClass: Record<
  PersonnelListItem['followUpStatus'],
  string
> = {
  None: 'text-slate-500',
  Scheduled: 'text-blue-400',
  Overdue: 'text-red-400',
}

/* ---------------- Search + filter ---------------- */

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
      p.id.toLowerCase().includes(q) ||
      p.subUnit.toLowerCase().includes(q)

    const matchesRisk =
      riskFilter.value === 'All' ||
      p.riskLevel === riskFilter.value

    return matchesQuery && matchesRisk
  })
})

function openPersonnel(id: string) {
  navigateTo(`/commander/personnel/${id}`)
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
          <p class="text-sm font-bold leading-tight text-white">
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

          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div class="border-t border-white/5 px-3 py-3">
        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
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
         MOBILE SIDEBAR OVERLAY
         ================================================================ -->

    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        @click="closeSidebar"
      ></div>
    </Transition>

    <!-- ================================================================
         MOBILE SIDEBAR DRAWER
         ================================================================ -->

    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1526] shadow-2xl lg:hidden"
      >
        <!-- Drawer header -->
        <div
          class="flex items-center justify-between border-b border-white/5 px-5 py-5"
        >
          <div class="flex min-w-0 items-center gap-3">
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
              <p class="text-sm font-bold leading-tight text-white">
                Surakshit AI
              </p>

              <p
                class="truncate text-[10px] leading-tight text-slate-400"
              >
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

        <!-- Mobile navigation -->
        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NuxtLink
            v-for="item in navItems"
            :key="`mobile-${item.label}`"
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

        <!-- Mobile logout -->
        <div class="border-t border-white/5 px-3 py-3">
          <button
            type="button"
            @click="logout"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
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
         MAIN CONTENT
         ================================================================ -->

    <div class="flex min-h-screen min-w-0 flex-1 flex-col">
      <!-- ============================================================
           TOP HEADER
           ============================================================ -->

      <header
        class="sticky top-0 z-30 flex min-w-0 items-center gap-2 border-b border-white/5 bg-[#0d1526]/95 px-3 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-3.5"
      >
        <!-- Mobile menu -->
        <button
          type="button"
          @click="sidebarOpen = true"
          class="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Desktop spacer -->
        <div class="hidden lg:block lg:w-0"></div>

        <!-- Global search -->
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
            class="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-emerald-500/50 sm:pr-4 sm:text-sm"
          />
        </form>

        <!-- Header actions -->
        <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
          <!-- Notifications -->
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
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
            class="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 sm:block"
            aria-label="Toggle theme"
          >
            <Moon
              :size="20"
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
              aria-label="Open profile menu"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700"
              >
                <img
                  v-if="data?.commander.avatarUrl"
                  :src="data.commander.avatarUrl"
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

              <div class="hidden text-left leading-tight sm:block">
                <p class="max-w-40 truncate text-sm font-semibold text-white">
                  {{ data?.commander.rank }} {{ data?.commander.name }}
                </p>

                <p class="text-[11px] text-slate-400">
                  Commander
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
              class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in (['Profile', 'Security', 'Logout'] as const)"
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

      <!-- ============================================================
           PAGE CONTENT
           ============================================================ -->

      <main class="min-w-0 flex-1 space-y-4 p-4 sm:p-5 lg:p-6">
        <!-- Page heading -->
        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex min-w-0 items-center gap-3">
            <!-- Back button -->
            <button
              type="button"
              @click="goBack"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft
                :size="17"
                :stroke-width="1.7"
              />
            </button>

            <div class="min-w-0">
              <h1
                class="truncate text-lg font-extrabold tracking-tight text-white sm:text-xl"
              >
                My Personnel
              </h1>

              <p class="mt-0.5 text-xs text-slate-400">
                Full roster for your unit
              </p>
            </div>
          </div>

          <p
            class="self-start text-xs text-slate-500 sm:self-auto"
          >
            {{ filteredPersonnel.length }} of
            {{ data?.personnel.length ?? 0 }} shown
          </p>
        </div>

        <!-- ============================================================
             LOADING
             ============================================================ -->

        <div
          v-if="loading"
          class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-12 sm:p-16"
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
            Couldn't load the roster
          </p>

          <p class="max-w-xl text-xs leading-5 text-slate-400">
            {{ error.message }} — expected data from
            <code
              class="break-all rounded bg-white/5 px-1.5 py-0.5"
            >
              /api/commander/personnel
            </code>
          </p>

          <button
            type="button"
            @click="fetchPersonnel()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <!-- ============================================================
             PERSONNEL ROSTER
             ============================================================ -->

        <div
          v-else-if="data"
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >
          <!-- Filters -->
          <div
            class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
          >
            <!-- Roster search -->
            <div class="relative w-full sm:max-w-sm xl:w-56">
              <Search
                :size="14"
                class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                v-model="rosterSearch"
                type="text"
                placeholder="Search roster..."
                class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>

            <!-- Risk filters -->
            <div
              class="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0"
            >
              <Filter
                :size="12"
                class="mr-1 shrink-0 text-slate-500"
              />

              <button
                v-for="opt in riskFilterOptions"
                :key="opt"
                type="button"
                @click="riskFilter = opt"
                class="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
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

          <!-- ==========================================================
               TABLE
               ========================================================== -->

          <div
            class="mt-4 overflow-x-auto rounded-xl border border-white/5"
          >
            <table
              class="w-full min-w-[760px] text-left text-xs"
            >
              <thead class="bg-white/[0.02]">
                <tr class="text-slate-500">
                  <th class="px-3 py-3 font-medium">
                    ID
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Name
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Rank
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Sub-Unit
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Risk
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Score
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Last Assessment
                  </th>

                  <th class="px-3 py-3 font-medium">
                    Follow-up
                  </th>

                  <th class="px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                <!-- Empty state -->
                <tr v-if="!filteredPersonnel.length">
                  <td
                    colspan="9"
                    class="px-4 py-8 text-center text-slate-500"
                  >
                    {{
                      rosterSearch || riskFilter !== 'All'
                        ? 'No personnel match your filters.'
                        : 'No personnel in this unit.'
                    }}
                  </td>
                </tr>

                <!-- Personnel rows -->
                <tr
                  v-for="p in filteredPersonnel"
                  :key="p.id"
                  class="cursor-pointer border-t border-white/5 transition-colors hover:bg-white/5"
                  @click="openPersonnel(p.id)"
                >
                  <td
                    class="whitespace-nowrap px-3 py-3 font-medium text-emerald-400"
                  >
                    {{ p.id }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 text-slate-200"
                  >
                    {{ p.name }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 text-slate-400"
                  >
                    {{ p.rank }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 text-slate-400"
                  >
                    {{ p.subUnit }}
                  </td>

                  <td class="px-3 py-3">
                    <span
                      class="flex items-center gap-1.5 whitespace-nowrap font-semibold"
                      :class="riskTone[p.riskLevel].text"
                    >
                      <span
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="riskTone[p.riskLevel].dot"
                      ></span>

                      {{ p.riskLevel }}
                    </span>
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 font-semibold text-slate-200"
                  >
                    {{ p.score }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 text-slate-500"
                  >
                    {{ p.lastAssessment }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 font-medium"
                    :class="followUpToneClass[p.followUpStatus]"
                  >
                    {{ p.followUpStatus }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-3 text-right"
                  >
                    <NuxtLink
                      :to="`/commander/personnel/${p.id}`"
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

          <!-- Mobile table hint -->
          <p
            v-if="filteredPersonnel.length"
            class="mt-2 text-[10px] text-slate-600 sm:hidden"
          >
            Swipe horizontally to view all personnel details.
          </p>
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
</style>