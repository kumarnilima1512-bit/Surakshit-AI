<!--
  pages/commander/alerts/index.vue
  URL: /commander/alerts  (sidebar label: "Risk Alerts")
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
  Check,
  RotateCw,
  ArrowLeft,
  X,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/commander/alerts
   POST /api/commander/alerts/:id/acknowledge
   ====================================================================== */

type Severity = 'Critical' | 'Warning' | 'Info'
type SeverityFilter = 'All' | Severity

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface AlertRecord {
  id: string
  title: string
  detail: string
  severity: Severity
  personnelId: string | null
  subUnit: string
  time: string
  acknowledged: boolean
}

interface AlertsPageData {
  commander: CommanderHeader
  alerts: AlertRecord[]
}

/* ---------------- Data fetching ---------------- */
const {
  data,
  pending: loading,
  error,
  refresh: fetchAlerts,
} = await useFetch<AlertsPageData>('/api/commander/alerts')

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

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
  },
)

/* ---------------- Navigation ---------------- */
function goBack() {
  navigateTo('/commander/dashboard')
}

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

/* ---------------- Severity tone tokens ---------------- */
const severityTone: Record<
  Severity,
  {
    badge: string
    iconBg: string
  }
> = {
  Critical: {
    badge: 'bg-red-500/15 text-red-400',
    iconBg: 'bg-red-500/15 text-red-400',
  },
  Warning: {
    badge: 'bg-amber-500/15 text-amber-400',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  Info: {
    badge: 'bg-blue-500/15 text-blue-400',
    iconBg: 'bg-blue-500/15 text-blue-400',
  },
}

/* ---------------- Filters ---------------- */
const search = ref('')
const severityFilter = ref<SeverityFilter>('All')

const severityOptions: SeverityFilter[] = [
  'All',
  'Critical',
  'Warning',
  'Info',
]

const showAcknowledged = ref(true)

const filteredAlerts = computed<AlertRecord[]>(() => {
  const list = data.value?.alerts ?? []
  const q = search.value.trim().toLowerCase()

  return list.filter((a) => {
    const matchesQuery =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q) ||
      a.subUnit.toLowerCase().includes(q)

    const matchesSeverity =
      severityFilter.value === 'All' ||
      a.severity === severityFilter.value

    const matchesAck =
      showAcknowledged.value || !a.acknowledged

    return matchesQuery && matchesSeverity && matchesAck
  })
})

/* ---------------- Acknowledge ---------------- */
const acknowledgingId = ref<string | null>(null)

async function acknowledgeAlert(id: string) {
  if (!data.value) return

  acknowledgingId.value = id

  try {
    await $fetch(
      `/api/commander/alerts/${id}/acknowledge`,
      {
        method: 'POST',
      },
    )

    const target = data.value.alerts.find(
      (a) => a.id === id,
    )

    if (target) {
      target.acknowledged = true
    }
  } catch {
    // Leave state unchanged so commander can retry.
  } finally {
    acknowledgingId.value = null
  }
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">

    <!-- ================================================================
         DESKTOP SIDEBAR
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
         MOBILE SIDEBAR OVERLAY
         ================================================================ -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- ================================================================
         MOBILE SIDEBAR DRAWER
         ================================================================ -->
    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1526] shadow-2xl lg:hidden"
      >
        <!-- Mobile sidebar header -->
        <div
          class="flex items-center justify-between border-b border-white/5 px-4 py-4"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15"
            >
              <img
                src="/logos/surakshit-ai.png"
                alt="Surakshit AI"
                class="h-9 w-9 object-contain"
              />
            </div>

            <div class="min-w-0">
              <p class="truncate text-sm font-bold text-white">
                Surakshit AI
              </p>

              <p class="truncate text-[10px] text-slate-400">
                Personnel Welfare Monitoring
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

        <!-- Mobile nav -->
        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
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
            class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <LogOut
              :size="16"
              :stroke-width="1.5"
            />

            Logout
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ================================================================
         MAIN APP
         ================================================================ -->
    <div class="flex min-h-screen min-w-0 flex-1 flex-col">

      <!-- ================================================================
           TOP HEADER
           ================================================================ -->
      <header
        class="flex min-w-0 items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3 sm:gap-4 sm:px-5 lg:px-6"
      >
        <!-- Mobile menu -->
        <button
          type="button"
          @click="toggleSidebar"
          class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Desktop menu spacer -->
        <div class="hidden w-1 lg:block" />

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
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 sm:pr-4 sm:text-sm"
          />
        </form>

        <!-- Header actions -->
        <div class="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">

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

              <div class="hidden text-left leading-tight md:block">
                <p class="max-w-[150px] truncate text-sm font-semibold text-white">
                  {{ data?.commander.rank }}
                  {{ data?.commander.name }}
                </p>

                <p class="text-[11px] text-slate-400">
                  Commander
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="hidden text-slate-500 transition-transform md:block"
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
      <main class="min-w-0 flex-1 space-y-4 p-4 sm:p-5 lg:p-6">

        <!-- Page heading -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="goBack"
                class="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft :size="14" />
                <span>Back</span>
              </button>

              <div class="h-4 w-px bg-white/10" />

              <h1
                class="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl"
              >
                Risk Alerts
              </h1>
            </div>

            <p class="mt-1 text-xs text-slate-400">
              Automated alerts flagged across your unit
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
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw
              :size="22"
              class="animate-spin"
            />

            <p class="text-sm">
              Loading alerts…
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
            Couldn't load alerts
          </p>

          <p class="max-w-xl text-xs leading-relaxed text-slate-400">
            {{ error.message }} — expected data from
            <code class="rounded bg-white/5 px-1.5 py-0.5">
              /api/commander/alerts
            </code>
          </p>

          <button
            type="button"
            @click="fetchAlerts()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <!-- ============================================================
             ALERTS CONTENT
             ============================================================ -->
        <div
          v-else-if="data"
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >

          <!-- Filters -->
          <div
            class="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
          >

            <!-- Search -->
            <div class="relative w-full xl:w-72">
              <Search
                :size="14"
                class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                v-model="search"
                type="text"
                placeholder="Search alerts..."
                class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
              />
            </div>

            <!-- Filter controls -->
            <div
              class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
            >

              <!-- Severity -->
              <div
                class="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
              >
                <Filter
                  :size="12"
                  class="mr-1 shrink-0 text-slate-500"
                />

                <button
                  v-for="opt in severityOptions"
                  :key="opt"
                  type="button"
                  @click="severityFilter = opt"
                  class="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
                  :class="
                    severityFilter === opt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  "
                >
                  {{ opt }}
                </button>
              </div>

              <!-- Acknowledged -->
              <label
                class="flex shrink-0 items-center gap-1.5 text-[11px] text-slate-400"
              >
                <input
                  v-model="showAcknowledged"
                  type="checkbox"
                  class="rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50"
                />

                Show acknowledged
              </label>
            </div>
          </div>

          <!-- ==========================================================
               ALERT LIST
               ========================================================== -->
          <div class="mt-4 space-y-2">

            <!-- Empty -->
            <div
              v-if="!filteredAlerts.length"
              class="py-10 text-center text-xs text-slate-500"
            >
              {{
                search || severityFilter !== 'All'
                  ? 'No alerts match your filters.'
                  : 'No alerts right now.'
              }}
            </div>

            <!-- Alert -->
            <div
              v-for="a in filteredAlerts"
              :key="a.id"
              class="flex min-w-0 flex-col gap-3 rounded-xl border border-white/5 p-3.5 transition-colors sm:flex-row sm:items-start"
              :class="a.acknowledged ? 'opacity-60' : ''"
            >

              <!-- Icon -->
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg"
                :class="severityTone[a.severity].iconBg"
              >
                <AlertTriangle
                  :size="15"
                  :stroke-width="1.5"
                />
              </div>

              <!-- Alert information -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p
                    class="break-words text-xs font-semibold text-slate-200"
                  >
                    {{ a.title }}
                  </p>

                  <span
                    class="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold"
                    :class="severityTone[a.severity].badge"
                  >
                    {{ a.severity }}
                  </span>
                </div>

                <p
                  class="mt-1 break-words text-[11px] leading-relaxed text-slate-400"
                >
                  {{ a.detail }}
                </p>

                <p class="mt-1 text-[10px] text-slate-500">
                  {{ a.subUnit }}
                  &middot;
                  {{ a.time }}
                </p>
              </div>

              <!-- Actions -->
              <div
                class="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/5 pt-3 sm:border-0 sm:pt-0"
              >
                <NuxtLink
                  v-if="a.personnelId"
                  :to="`/commander/personnel/${a.personnelId}`"
                  class="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 hover:underline"
                >
                  Profile
                </NuxtLink>

                <button
                  v-if="!a.acknowledged"
                  type="button"
                  :disabled="acknowledgingId === a.id"
                  @click="acknowledgeAlert(a.id)"
                  class="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                  <Check :size="11" />

                  {{
                    acknowledgingId === a.id
                      ? 'Saving…'
                      : 'Acknowledge'
                  }}
                </button>

                <span
                  v-else
                  class="text-[11px] font-medium text-slate-500"
                >
                  Acknowledged
                </span>
              </div>
            </div>
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
</style>