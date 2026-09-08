<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
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
  KeyRound,
  Smartphone,
  History,
  Monitor,
  RotateCw,
  Eye,
  EyeOff,
  type LucideIcon,
} from 'lucide-vue-next'

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface LoginRecord {
  device: string
  location: string
  timeLabel: string
  status: 'Success' | 'Failed'
}

interface Session {
  id: string
  device: string
  location: string
  lastActiveLabel: string
  current: boolean
}

interface SecurityData {
  commander: CommanderHeader
  twoFactorEnabled: boolean
  loginHistory: LoginRecord[]
  activeSessions: Session[]
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchSecurity,
} = await useFetch<SecurityData>('/api/commander/security')

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

async function logout() {
  await useFetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}

const topSearchQuery = ref('')

function submitTopSearch() {
  const q = topSearchQuery.value.trim()

  if (!q) return

  navigateTo({
    path: '/commander/search',
    query: { q },
  })
}

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

/* ---------------- Password visibility ---------------- */

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

/* ---------------- Change password ---------------- */

const pwForm = reactive({
  current: '',
  next: '',
  confirm: '',
})

const changingPassword = ref(false)
const pwError = ref<string | null>(null)
const pwSuccess = ref(false)

async function changePassword() {
  pwError.value = null
  pwSuccess.value = false

  if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
    pwError.value = 'Please fill in all password fields.'
    return
  }

  if (pwForm.next.length < 8) {
    pwError.value = 'New password must be at least 8 characters.'
    return
  }

  if (pwForm.next !== pwForm.confirm) {
    pwError.value = 'New password and confirmation do not match.'
    return
  }

  changingPassword.value = true

  try {
    await $fetch('/api/commander/security/change-password', {
      method: 'POST',
      body: {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      },
    })

    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''

    pwSuccess.value = true
  } catch (error: any) {
    pwError.value =
      error?.data?.statusMessage ||
      'Could not change your password. Please check your current password and try again.'
  } finally {
    changingPassword.value = false
  }
}

/* ---------------- Two-factor authentication ---------------- */

const twoFactorPin = ref('')
const twoFactorPinConfirm = ref('')
const twoFactorPinError = ref<string | null>(null)
const togglingTwoFactor = ref(false)

const showTwoFactorPin = ref(false)
const showTwoFactorPinConfirm = ref(false)

function validateTwoFactorPin() {
  twoFactorPinError.value = null

  if (!/^\d{6}$/.test(twoFactorPin.value)) {
    twoFactorPinError.value = 'PIN must be exactly 6 digits.'
    return false
  }

  if (twoFactorPin.value !== twoFactorPinConfirm.value) {
    twoFactorPinError.value = 'PIN and confirmation do not match.'
    return false
  }

  return true
}

async function toggleTwoFactor() {
  if (!data.value) return

  twoFactorPinError.value = null

  if (!data.value.twoFactorEnabled) {
    if (!validateTwoFactorPin()) return
  }

  togglingTwoFactor.value = true

  const nextState = !data.value.twoFactorEnabled

  try {
    await $fetch('/api/commander/security/2fa', {
      method: 'POST',
      body: {
        enabled: nextState,
        pin: nextState ? twoFactorPin.value : undefined,
      },
    })

    data.value.twoFactorEnabled = nextState

    if (!nextState) {
      twoFactorPin.value = ''
      twoFactorPinConfirm.value = ''
      showTwoFactorPin.value = false
      showTwoFactorPinConfirm.value = false
    }
  } catch (error: any) {
    twoFactorPinError.value =
      error?.data?.statusMessage ||
      'Could not update two-factor authentication.'
  } finally {
    togglingTwoFactor.value = false
  }
}

/* ---------------- Revoke session ---------------- */

const revokingId = ref<string | null>(null)

async function revokeSession(id: string) {
  if (!data.value) return

  revokingId.value = id

  try {
    await $fetch(`/api/commander/security/sessions/${id}/revoke`, {
      method: 'POST',
    })

    data.value.activeSessions =
      data.value.activeSessions.filter(
        (session) => session.id !== id,
      )
  } catch {
    // Keep the session if revoke fails.
  } finally {
    revokingId.value = null
  }
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">

    <!-- Sidebar -->
    <aside
      class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]"
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

        <div>
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

          {{ item.label }}
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

        <form
          class="relative max-w-md flex-1"
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

        <div class="ml-auto flex items-center gap-4">

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

          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Toggle theme"
          >
            <Moon
              :size="20"
              :stroke-width="1.5"
            />
          </button>

          <div
            class="relative border-l border-white/10 pl-4"
            data-dropdown-root
          >
            <button
              type="button"
              @click.stop="toggleProfile"
              class="flex items-center gap-2.5"
            >
              <div
                class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700"
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

              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">
                  {{ data?.commander.rank }}
                  {{ data?.commander.name }}
                </p>

                <p class="text-[11px] text-slate-400">
                  Commander
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="text-slate-500 transition-transform"
                :class="{ 'rotate-180': profileOpen }"
              />
            </button>

            <div
              v-if="profileOpen"
              class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
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

      <!-- Content -->
      <main class="flex-1 space-y-4 p-6">

        <div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">
            Security
          </h1>

          <p class="mt-0.5 text-xs text-slate-400">
            Manage your password, two-factor authentication, and active sessions
          </p>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16"
        >
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw
              :size="22"
              class="animate-spin"
            />

            <p class="text-sm">
              Loading security settings…
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
            Couldn't load security settings
          </p>

          <p class="text-xs text-slate-400">
            {{ error.message }} — expected data from
            <code class="rounded bg-white/5 px-1.5 py-0.5">
              /api/commander/security
            </code>
          </p>

          <button
            type="button"
            @click="fetchSecurity()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <template v-else-if="data">

          <!-- Password + 2FA -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <!-- Change password -->
            <div
              class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
            >
              <div class="flex items-center gap-2">
                <KeyRound
                  :size="16"
                  :stroke-width="1.5"
                  class="text-blue-400"
                />

                <h3 class="text-sm font-bold text-white">
                  Change Password
                </h3>
              </div>

              <div class="mt-3 space-y-3">

                <!-- Current password -->
                <div class="relative">
                  <input
                    v-model="pwForm.current"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    placeholder="Current password"
                    autocomplete="current-password"
                    class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
                  />

                  <button
                    type="button"
                    @click="showCurrentPassword = !showCurrentPassword"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                    :aria-label="
                      showCurrentPassword
                        ? 'Hide current password'
                        : 'Show current password'
                    "
                  >
                    <EyeOff
                      v-if="showCurrentPassword"
                      :size="15"
                    />
                    <Eye
                      v-else
                      :size="15"
                    />
                  </button>
                </div>

                <!-- New password -->
                <div class="relative">
                  <input
                    v-model="pwForm.next"
                    :type="showNewPassword ? 'text' : 'password'"
                    placeholder="New password"
                    autocomplete="new-password"
                    class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
                  />

                  <button
                    type="button"
                    @click="showNewPassword = !showNewPassword"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                    :aria-label="
                      showNewPassword
                        ? 'Hide new password'
                        : 'Show new password'
                    "
                  >
                    <EyeOff
                      v-if="showNewPassword"
                      :size="15"
                    />
                    <Eye
                      v-else
                      :size="15"
                    />
                  </button>
                </div>

                <!-- Confirm password -->
                <div class="relative">
                  <input
                    v-model="pwForm.confirm"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    placeholder="Confirm new password"
                    autocomplete="new-password"
                    class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-3 pr-10 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
                  />

                  <button
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                    :aria-label="
                      showConfirmPassword
                        ? 'Hide password confirmation'
                        : 'Show password confirmation'
                    "
                  >
                    <EyeOff
                      v-if="showConfirmPassword"
                      :size="15"
                    />
                    <Eye
                      v-else
                      :size="15"
                    />
                  </button>
                </div>
              </div>

              <p
                v-if="pwError"
                class="mt-2 text-[11px] text-red-400"
              >
                {{ pwError }}
              </p>

              <p
                v-if="pwSuccess"
                class="mt-2 text-[11px] text-emerald-400"
              >
                Password changed successfully.
              </p>

              <button
                type="button"
                :disabled="changingPassword"
                @click="changePassword"
                class="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {{
                  changingPassword
                    ? 'Updating…'
                    : 'Update Password'
                }}
              </button>
            </div>

            <!-- Two-factor authentication -->
            <div
              class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
            >
              <div class="flex items-center gap-2">
                <Smartphone
                  :size="16"
                  :stroke-width="1.5"
                  class="text-emerald-400"
                />

                <h3 class="text-sm font-bold text-white">
                  Two-Factor Authentication
                </h3>
              </div>

              <p class="mt-3 text-xs leading-relaxed text-slate-400">
                Set a 6-digit security PIN that will be required as an
                additional verification step when signing in.
              </p>

              <!-- PIN setup -->
              <div
                v-if="!data.twoFactorEnabled"
                class="mt-4 space-y-3"
              >

                <!-- PIN -->
                <div>
                  <label
                    class="mb-1.5 block text-[11px] font-medium text-slate-400"
                  >
                    Set 6-digit PIN
                  </label>

                  <div class="relative">
                    <input
                      v-model="twoFactorPin"
                      :type="showTwoFactorPin ? 'text' : 'password'"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="new-password"
                      placeholder="Enter 6-digit PIN"
                      class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-10 text-sm tracking-[0.3em] text-slate-200 placeholder-slate-600 placeholder:tracking-normal outline-none focus:border-emerald-500/50"
                    />

                    <button
                      type="button"
                      @click="showTwoFactorPin = !showTwoFactorPin"
                      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                      :aria-label="
                        showTwoFactorPin
                          ? 'Hide PIN'
                          : 'Show PIN'
                      "
                    >
                      <EyeOff
                        v-if="showTwoFactorPin"
                        :size="16"
                      />

                      <Eye
                        v-else
                        :size="16"
                      />
                    </button>
                  </div>
                </div>

                <!-- Confirm PIN -->
                <div>
                  <label
                    class="mb-1.5 block text-[11px] font-medium text-slate-400"
                  >
                    Confirm PIN
                  </label>

                  <div class="relative">
                    <input
                      v-model="twoFactorPinConfirm"
                      :type="
                        showTwoFactorPinConfirm
                          ? 'text'
                          : 'password'
                      "
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="new-password"
                      placeholder="Re-enter 6-digit PIN"
                      class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-3 pr-10 text-sm tracking-[0.3em] text-slate-200 placeholder-slate-600 placeholder:tracking-normal outline-none focus:border-emerald-500/50"
                    />

                    <button
                      type="button"
                      @click="
                        showTwoFactorPinConfirm =
                          !showTwoFactorPinConfirm
                      "
                      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                      :aria-label="
                        showTwoFactorPinConfirm
                          ? 'Hide PIN confirmation'
                          : 'Show PIN confirmation'
                      "
                    >
                      <EyeOff
                        v-if="showTwoFactorPinConfirm"
                        :size="16"
                      />

                      <Eye
                        v-else
                        :size="16"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <p
                v-if="twoFactorPinError"
                class="mt-2 text-[11px] text-red-400"
              >
                {{ twoFactorPinError }}
              </p>

              <div
                class="mt-4 flex items-center justify-between rounded-xl border border-white/5 p-3.5"
              >
                <div class="flex items-center gap-2">
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="
                      data.twoFactorEnabled
                        ? 'bg-emerald-400'
                        : 'bg-slate-500'
                    "
                  ></span>

                  <span
                    class="text-xs font-semibold text-slate-200"
                  >
                    {{
                      data.twoFactorEnabled
                        ? 'Enabled'
                        : 'Disabled'
                    }}
                  </span>
                </div>

                <button
                  type="button"
                  :disabled="togglingTwoFactor"
                  @click="toggleTwoFactor"
                  class="rounded-lg px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                  :class="
                    data.twoFactorEnabled
                      ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  "
                >
                  {{
                    togglingTwoFactor
                      ? 'Saving…'
                      : data.twoFactorEnabled
                        ? 'Disable'
                        : 'Enable'
                  }}
                </button>
              </div>
            </div>
          </div>

          <!-- Login history + Active sessions -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

            <!-- Login history -->
            <div
              class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
            >
              <div class="flex items-center gap-2">
                <History
                  :size="16"
                  :stroke-width="1.5"
                  class="text-blue-400"
                />

                <h3 class="text-sm font-bold text-white">
                  Recent Login Activity
                </h3>
              </div>

              <div class="mt-3 overflow-x-auto">
                <table
                  class="w-full min-w-[340px] text-left text-xs"
                >
                  <thead>
                    <tr class="text-slate-500">
                      <th class="pb-2 font-medium">
                        Device
                      </th>

                      <th class="pb-2 font-medium">
                        Location
                      </th>

                      <th class="pb-2 font-medium">
                        Time
                      </th>

                      <th class="pb-2 text-right font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-if="!data.loginHistory.length"
                    >
                      <td
                        colspan="4"
                        class="py-4 text-center text-slate-500"
                      >
                        No recent activity.
                      </td>
                    </tr>

                    <tr
                      v-for="(entry, i) in data.loginHistory"
                      :key="i"
                      class="border-t border-white/5"
                    >
                      <td class="py-2.5 text-slate-300">
                        {{ entry.device }}
                      </td>

                      <td class="py-2.5 text-slate-400">
                        {{ entry.location }}
                      </td>

                      <td class="py-2.5 text-slate-500">
                        {{ entry.timeLabel }}
                      </td>

                      <td
                        class="py-2.5 text-right font-semibold"
                        :class="
                          entry.status === 'Success'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        "
                      >
                        {{ entry.status }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Active sessions -->
            <div
              class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
            >
              <div class="flex items-center gap-2">
                <Monitor
                  :size="16"
                  :stroke-width="1.5"
                  class="text-violet-400"
                />

                <h3 class="text-sm font-bold text-white">
                  Active Sessions
                </h3>
              </div>

              <div class="mt-3 space-y-2.5">

                <div
                  v-if="!data.activeSessions.length"
                  class="text-xs text-slate-500"
                >
                  No other active sessions.
                </div>

                <div
                  v-for="session in data.activeSessions"
                  :key="session.id"
                  class="flex items-center justify-between rounded-xl border border-white/5 p-3"
                >
                  <div>
                    <p
                      class="flex items-center gap-2 text-xs font-semibold text-slate-200"
                    >
                      {{ session.device }}

                      <span
                        v-if="session.current"
                        class="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400"
                      >
                        This device
                      </span>
                    </p>

                    <p
                      class="mt-0.5 text-[11px] text-slate-500"
                    >
                      {{ session.location }}
                      &middot;
                      {{ session.lastActiveLabel }}
                    </p>
                  </div>

                  <button
                    v-if="!session.current"
                    type="button"
                    :disabled="revokingId === session.id"
                    @click="revokeSession(session.id)"
                    class="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {{
                      revokingId === session.id
                        ? 'Revoking…'
                        : 'Revoke'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>
