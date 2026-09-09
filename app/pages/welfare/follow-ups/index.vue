<!--
  pages/welfare/follow-ups/index.vue
  URL: /welfare/follow-ups
  Nuxt 3 + Composition API + Tailwind
-->

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'

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
  Plus,
  RotateCw,
  ArrowLeft,
  X,
  type LucideIcon,
} from 'lucide-vue-next'

type FollowUpStatus = 'Upcoming' | 'Overdue' | 'Completed'
type TabFilter = 'All' | FollowUpStatus

interface OfficerHeader {
  name: string
  role: string
  avatarUrl: string | null
}

interface FollowUp {
  id: string
  personnelId: string
  personnelName: string
  unit: string
  type: string
  dueDate: string
  status: FollowUpStatus
}

interface FollowUpsData {
  officer: OfficerHeader
  followUps: FollowUp[]
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchFollowUps,
} = await useFetch<FollowUpsData>(
  '/api/welfare/follow-ups',
)

/* ---------------- Sidebar / header shell ---------------- */

const route = useRoute()

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/welfare/dashboard',
    icon: Home,
  },
  {
    label: 'Personnel',
    to: '/welfare/personnel',
    icon: Users,
  },
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
  return (
    route.path === to ||
    route.path.startsWith(`${to}/`)
  )
}

/* ---------------- Mobile sidebar ---------------- */

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function goBack() {
  closeSidebar()
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
  closeSidebar()

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
  action: 'Profile' | 'Settings' | 'Logout',
) {
  profileOpen.value = false

  if (action === 'Logout') {
    return logout()
  }

  await navigateTo(
    `/welfare/${action.toLowerCase()}`,
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

/* ---------------- Tone tokens ---------------- */

const statusTone: Record<
  FollowUpStatus,
  string
> = {
  Upcoming:
    'bg-blue-500/15 text-blue-400',
  Overdue:
    'bg-red-500/15 text-red-400',
  Completed:
    'bg-emerald-500/15 text-emerald-400',
}

/* ---------------- Tabs ---------------- */

const activeTab = ref<TabFilter>('All')

const tabs: TabFilter[] = [
  'All',
  'Upcoming',
  'Overdue',
  'Completed',
]

const search = ref('')

const tabCounts = computed(() => {
  const list =
    data.value?.followUps ?? []

  return {
    All: list.length,

    Upcoming: list.filter(
      (f) => f.status === 'Upcoming',
    ).length,

    Overdue: list.filter(
      (f) => f.status === 'Overdue',
    ).length,

    Completed: list.filter(
      (f) => f.status === 'Completed',
    ).length,
  }
})

const filteredFollowUps =
  computed<FollowUp[]>(() => {
    const list =
      data.value?.followUps ?? []

    const q = search.value
      .trim()
      .toLowerCase()

    return list.filter((f) => {
      const matchesQuery =
        !q ||
        f.personnelName
          .toLowerCase()
          .includes(q) ||
        f.personnelId
          .toLowerCase()
          .includes(q)

      const matchesTab =
        activeTab.value === 'All' ||
        f.status === activeTab.value

      return matchesQuery && matchesTab
    })
  })

/* ---------------- Mark complete ---------------- */

const completingId =
  ref<string | null>(null)

async function markComplete(id: string) {
  if (!data.value) return

  completingId.value = id

  try {
    await $fetch(
      `/api/welfare/follow-ups/${id}/complete`,
      {
        method: 'POST',
      },
    )

    const target =
      data.value.followUps.find(
        (f) => f.id === id,
      )

    if (target) {
      target.status = 'Completed'
    }
  } catch (error) {
    console.error(
      'Complete follow-up error:',
      error,
    )
  } finally {
    completingId.value = null
  }
}

/* ---------------- Schedule new follow-up ---------------- */

const showNewForm = ref(false)
const newPersonnelId = ref('')
const newType =
  ref('Welfare Check-in')
const newDueDate = ref('')

const followUpTypes = [
  'Welfare Check-in',
  'Post-Intervention Review',
  'Risk Reassessment',
  'Command Coordination',
]

const creating = ref(false)
const createError =
  ref<string | null>(null)

async function scheduleFollowUp() {
  if (
    !newPersonnelId.value.trim() ||
    !newDueDate.value ||
    !data.value
  ) {
    return
  }

  creating.value = true
  createError.value = null

  try {
    const created =
      await $fetch<FollowUp>(
        '/api/welfare/follow-ups',
        {
          method: 'POST',
          body: {
            personnelId:
              newPersonnelId.value.trim(),
            type: newType.value,
            dueDate: newDueDate.value,
          },
        },
      )

    data.value.followUps = [
      created,
      ...data.value.followUps,
    ]

    newPersonnelId.value = ''
    newDueDate.value = ''
    newType.value =
      'Welfare Check-in'

    showNewForm.value = false
  } catch (error) {
    console.error(
      'Schedule follow-up error:',
      error,
    )

    createError.value =
      'Could not schedule the follow-up. Please try again.'
  } finally {
    creating.value = false
  }
}

/* ---------------- Edit follow-up ---------------- */

const editingFollowUp =
  ref<FollowUp | null>(null)

const editType = ref('')
const editDueDate = ref('')
const editError =
  ref<string | null>(null)

const savingEdit = ref(false)

function openEdit(
  followUp: FollowUp,
) {
  editingFollowUp.value =
    followUp

  editType.value =
    followUp.type

  editError.value = null

  const parsedDate =
    new Date(followUp.dueDate)

  if (
    !Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    const year =
      parsedDate.getFullYear()

    const month = String(
      parsedDate.getMonth() + 1,
    ).padStart(2, '0')

    const day = String(
      parsedDate.getDate(),
    ).padStart(2, '0')

    editDueDate.value =
      `${year}-${month}-${day}`
  } else {
    editDueDate.value = ''
  }
}

function closeEdit() {
  editingFollowUp.value = null
  editType.value = ''
  editDueDate.value = ''
  editError.value = null
}

async function saveEdit() {
  if (
    !editingFollowUp.value ||
    !editType.value.trim() ||
    !editDueDate.value
  ) {
    return
  }

  savingEdit.value = true
  editError.value = null

  try {
    const updated =
      await $fetch<FollowUp>(
        `/api/welfare/follow-ups/${editingFollowUp.value.id}/edit`,
        {
          method: 'PATCH',
          body: {
            type: editType.value.trim(),
            dueDate:
              editDueDate.value,
          },
        },
      )

    if (data.value) {
      const index =
        data.value.followUps.findIndex(
          (f) =>
            f.id === updated.id,
        )

      if (index >= 0) {
        data.value.followUps[index] =
          updated
      }
    }

    closeEdit()
  } catch (error) {
    console.error(
      'Edit follow-up error:',
      error,
    )

    editError.value =
      'Could not update the follow-up. Please try again.'
  } finally {
    savingEdit.value = false
  }
}

/* ---------------- Delete follow-up ---------------- */

const deletingId =
  ref<string | null>(null)

const deleteError =
  ref<string | null>(null)

async function deleteFollowUp(
  id: string,
) {
  if (!data.value) return

  const confirmed =
    window.confirm(
      'Are you sure you want to delete this follow-up?',
    )

  if (!confirmed) return

  deletingId.value = id
  deleteError.value = null

  try {
    await $fetch(
      `/api/welfare/follow-ups/${id}/delete`,
      {
        method: 'DELETE',
      },
    )

    data.value.followUps =
      data.value.followUps.filter(
        (followUp) =>
          followUp.id !== id,
      )

    await fetchFollowUps()
  } catch (error) {
    console.error(
      'Delete follow-up error:',
      error,
    )

    deleteError.value =
      'Could not delete the follow-up. Please try again.'
  } finally {
    deletingId.value = null
  }
}

const ICON_SIZE = 16
</script>

<template>
  <div
    class="flex min-h-screen overflow-x-hidden bg-[#0b1220] text-slate-100"
  >
    <!-- ================================================================
         MOBILE SIDEBAR OVERLAY
         ================================================================ -->

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/60 lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- ================================================================
         SIDEBAR
         ================================================================ -->

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] -translate-x-full flex-col border-r border-white/5 bg-[#0d1526] transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0"
      :class="{
        'translate-x-0':
          sidebarOpen,
      }"
    >
      <!-- Logo -->

      <div
        class="flex items-center justify-between gap-3 px-5 py-5"
      >
        <div
          class="flex min-w-0 items-center gap-3"
        >
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

        <!-- Mobile close -->

        <button
          type="button"
          class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Close menu"
          @click="closeSidebar"
        >
          <X :size="19" />
        </button>
      </div>

      <!-- Navigation -->

      <nav
        class="flex-1 space-y-1 overflow-y-auto px-3"
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
          @click="closeSidebar"
        >
          <component
            :is="item.icon"
            :size="ICON_SIZE"
            :stroke-width="1.5"
          />

          <span>
            {{ item.label }}
          </span>
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
         MAIN
         ================================================================ -->

    <div
      class="flex min-h-screen min-w-0 flex-1 flex-col"
    >
      <!-- ================================================================
           HEADER
           ================================================================ -->

      <header
        class="flex min-h-[65px] items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3 sm:gap-4 sm:px-6"
      >
        <!-- Menu -->

        <button
          type="button"
          class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Toggle menu"
          @click="toggleSidebar"
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
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 sm:pr-4 sm:text-sm"
          />
        </form>

        <!-- Right controls -->

        <div
          class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3"
        >
          <!-- Notifications -->

          <button
            type="button"
            class="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 sm:block"
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
            class="relative border-l border-white/10 pl-2 sm:pl-4"
            data-dropdown-root
          >
            <button
              type="button"
              @click.stop="toggleProfile"
              class="flex max-w-[180px] items-center gap-2"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700"
              >
                <img
                  v-if="data?.officer.avatarUrl"
                  :src="
                    data.officer.avatarUrl
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
                class="hidden min-w-0 text-left leading-tight sm:block"
              >
                <p
                  class="truncate text-sm font-semibold text-white"
                >
                  {{
                    data?.officer.name ??
                    '—'
                  }}
                </p>

                <p
                  class="truncate text-[11px] text-slate-400"
                >
                  {{
                    data?.officer.role ??
                    ''
                  }}
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="hidden shrink-0 text-slate-500 transition-transform sm:block"
                :class="{
                  'rotate-180':
                    profileOpen,
                }"
              />
            </button>

            <!-- Dropdown -->

            <div
              v-if="profileOpen"
              class="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in (['Profile', 'Settings', 'Logout'] as const)"
                :key="action"
                type="button"
                @click="
                  handleProfileAction(
                    action,
                  )
                "
                class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ================================================================
           CONTENT
           ================================================================ -->

      <main
        class="min-w-0 flex-1 space-y-4 p-4 sm:p-6"
      >
        <!-- Page title -->

        <div
          class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <!-- Back button -->

            <button
              type="button"
              @click="goBack"
              class="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft :size="14" />
              Back
            </button>

            <h1
              class="text-xl font-extrabold tracking-tight text-white"
            >
              Follow-ups
            </h1>

            <p
              class="mt-0.5 text-xs text-slate-400"
            >
              Scheduled welfare check-ins across your unit
            </p>
          </div>

          <button
            type="button"
            @click="
              showNewForm =
                !showNewForm
            "
            class="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 sm:w-auto"
          >
            <Plus :size="14" />

            Schedule Follow-up
          </button>
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
              Loading follow-ups…
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

          <p
            class="text-sm font-semibold text-red-300"
          >
            Couldn't load follow-ups
          </p>

          <p
            class="max-w-xl text-xs text-slate-400"
          >
            {{ error.message }} —
            expected data from
            <code
              class="rounded bg-white/5 px-1.5 py-0.5"
            >
              /api/welfare/follow-ups
            </code>
          </p>

          <button
            type="button"
            @click="fetchFollowUps()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <template
          v-else-if="data"
        >
          <!-- ==========================================================
               NEW FOLLOW-UP FORM
               ========================================================== -->

          <div
            v-if="showNewForm"
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <h3
              class="text-sm font-bold text-white"
            >
              Schedule Follow-up
            </h3>

            <div
              class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <input
                v-model="newPersonnelId"
                type="text"
                placeholder="Personnel ID (e.g. P-1024)"
                class="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
              />

              <select
                v-model="newType"
                class="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              >
                <option
                  v-for="t in followUpTypes"
                  :key="t"
                  :value="t"
                >
                  {{ t }}
                </option>
              </select>

              <input
                v-model="newDueDate"
                type="date"
                class="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
              />

              <button
                type="button"
                :disabled="
                  !newPersonnelId.trim() ||
                  !newDueDate ||
                  creating
                "
                @click="
                  scheduleFollowUp
                "
                class="w-full rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {{
                  creating
                    ? 'Scheduling…'
                    : 'Schedule'
                }}
              </button>
            </div>

            <p
              v-if="createError"
              class="mt-2 text-[11px] text-red-400"
            >
              {{ createError }}
            </p>
          </div>

          <!-- ==========================================================
               TABS + TABLE
               ========================================================== -->

          <div
            class="rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
          >
            <!-- Toolbar -->

            <div
              class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <!-- Tabs -->

              <div
                class="w-full overflow-x-auto pb-1 lg:w-auto"
              >
                <div
                  class="flex min-w-max items-center gap-1.5"
                >
                  <button
                    v-for="tab in tabs"
                    :key="tab"
                    type="button"
                    @click="
                      activeTab = tab
                    "
                    class="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold"
                    :class="
                      activeTab === tab
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    "
                  >
                    {{ tab }}

                    <span
                      class="ml-1 text-[10px] opacity-80"
                    >
                      {{ tabCounts[tab] }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Search -->

              <div
                class="relative w-full sm:max-w-xs lg:w-56"
              >
                <Search
                  :size="14"
                  class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  v-model="search"
                  type="text"
                  placeholder="Search follow-ups..."
                  class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            <!-- Delete error -->

            <p
              v-if="deleteError"
              class="mt-3 text-[11px] text-red-400"
            >
              {{ deleteError }}
            </p>

            <!-- Mobile table hint -->

            <p
              v-if="
                filteredFollowUps.length
              "
              class="mt-3 text-[10px] text-slate-500 sm:hidden"
            >
              Swipe horizontally to view all columns →
            </p>

            <!-- Table -->

            <div
              class="mt-3 overflow-x-auto sm:mt-4"
            >
              <table
                class="w-full min-w-[760px] text-left text-xs"
              >
                <thead>
                  <tr
                    class="text-slate-500"
                  >
                    <th
                      class="pb-2 font-medium"
                    >
                      Personnel
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Unit
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Type
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Due Date
                    </th>

                    <th
                      class="pb-2 font-medium"
                    >
                      Status
                    </th>

                    <th
                      class="pb-2 text-right font-medium"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <!-- Empty -->

                  <tr
                    v-if="
                      !filteredFollowUps.length
                    "
                  >
                    <td
                      colspan="6"
                      class="py-8 text-center text-slate-500"
                    >
                      {{
                        search
                          ? 'No follow-ups match your search.'
                          : 'No follow-ups in this view.'
                      }}
                    </td>
                  </tr>

                  <!-- Rows -->

                  <tr
                    v-for="f in filteredFollowUps"
                    :key="f.id"
                    class="border-t border-white/5"
                  >
                    <td
                      class="py-2.5 text-slate-200"
                    >
                      {{ f.personnelName }}

                      <span
                        class="text-slate-500"
                      >
                        ({{ f.personnelId }})
                      </span>
                    </td>

                    <td
                      class="py-2.5 text-slate-400"
                    >
                      {{ f.unit }}
                    </td>

                    <td
                      class="py-2.5 text-slate-400"
                    >
                      {{ f.type }}
                    </td>

                    <td
                      class="py-2.5"
                      :class="
                        f.status ===
                        'Overdue'
                          ? 'font-semibold text-red-400'
                          : 'text-slate-400'
                      "
                    >
                      {{ f.dueDate }}
                    </td>

                    <td
                      class="py-2.5"
                    >
                      <span
                        class="rounded-md px-2 py-0.5 text-[10px] font-bold"
                        :class="
                          statusTone[
                            f.status
                          ]
                        "
                      >
                        {{ f.status }}
                      </span>
                    </td>

                    <!-- Actions -->

                    <td
                      class="py-2.5 text-right"
                    >
                      <div
                        class="flex flex-wrap items-center justify-end gap-2"
                      >
                        <!-- Edit -->

                        <button
                          type="button"
                          @click="
                            openEdit(f)
                          "
                          class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Edit
                        </button>

                        <!-- Delete -->

                        <button
                          type="button"
                          :disabled="
                            deletingId ===
                            f.id
                          "
                          @click="
                            deleteFollowUp(
                              f.id,
                            )
                          "
                          class="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {{
                            deletingId ===
                            f.id
                              ? 'Deleting…'
                              : 'Delete'
                          }}
                        </button>

                        <!-- Complete -->

                        <button
                          v-if="
                            f.status !==
                            'Completed'
                          "
                          type="button"
                          :disabled="
                            completingId ===
                            f.id
                          "
                          @click="
                            markComplete(
                              f.id,
                            )
                          "
                          class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                        >
                          {{
                            completingId ===
                            f.id
                              ? 'Saving…'
                              : 'Mark Complete'
                          }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- ================================================================
         EDIT FOLLOW-UP MODAL
         ================================================================ -->

    <div
      v-if="editingFollowUp"
      class="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/60 px-3 py-4 backdrop-blur-sm sm:px-4"
      @click.self="closeEdit"
    >
      <div
        class="my-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#111a2e] p-4 shadow-2xl sm:p-5"
      >
        <!-- Modal header -->

        <div
          class="flex items-start justify-between gap-4"
        >
          <div class="min-w-0">
            <h2
              class="text-base font-bold text-white"
            >
              Edit Follow-up
            </h2>

            <p
              class="mt-1 text-xs leading-relaxed text-slate-400"
            >
              Update the scheduled welfare follow-up details.
            </p>
          </div>

          <button
            type="button"
            @click="closeEdit"
            class="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
            aria-label="Close"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Form -->

        <div
          class="mt-5 space-y-4"
        >
          <!-- Personnel -->

          <div>
            <label
              class="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Personnel
            </label>

            <div
              class="break-words rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-300"
            >
              {{ editingFollowUp.personnelName }}

              <span
                class="text-slate-500"
              >
                ({{ editingFollowUp.personnelId }})
              </span>
            </div>
          </div>

          <!-- Type -->

          <div>
            <label
              class="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Follow-up Type
            </label>

            <select
              v-model="editType"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            >
              <option
                v-for="t in followUpTypes"
                :key="t"
                :value="t"
              >
                {{ t }}
              </option>
            </select>
          </div>

          <!-- Date -->

          <div>
            <label
              class="mb-1.5 block text-xs font-medium text-slate-400"
            >
              Due Date
            </label>

            <input
              v-model="editDueDate"
              type="date"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            />
          </div>

          <!-- Error -->

          <p
            v-if="editError"
            class="text-[11px] leading-relaxed text-red-400"
          >
            {{ editError }}
          </p>
        </div>

        <!-- Modal actions -->

        <div
          class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end"
        >
          <button
            type="button"
            @click="closeEdit"
            class="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 sm:w-auto"
          >
            Cancel
          </button>

          <button
            type="button"
            :disabled="
              !editType.trim() ||
              !editDueDate ||
              savingEdit
            "
            @click="saveEdit"
            class="w-full rounded-lg bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {{
              savingEdit
                ? 'Saving…'
                : 'Save Changes'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
