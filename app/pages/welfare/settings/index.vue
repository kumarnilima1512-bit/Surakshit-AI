<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
  Bell,
  User,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-vue-next'

interface NotificationPrefs {
  highRiskAlerts: boolean
  followUpReminders: boolean
  weeklySummary: boolean
  interventionUpdates: boolean
}

interface SettingsData {
  twoFactorEnabled: boolean
  notifications: NotificationPrefs
}

const {
  data,
  pending: loading,
  error,
  refresh: fetchSettings,
} = await useFetch<SettingsData>('/api/welfare/settings')

/* =========================
   MOBILE SIDEBAR
========================= */

const route = useRoute()

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function goBack() {
  navigateTo('/welfare/dashboard')
}

watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
  },
)

/* =========================
   PASSWORD
========================= */

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const passwordLoading = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

async function changePassword() {
  passwordError.value = null
  passwordSuccess.value = null

  if (!currentPassword.value || !newPassword.value) {
    passwordError.value =
      'Current password and new password are required.'
    return
  }

  if (newPassword.value.length < 8) {
    passwordError.value =
      'New password must be at least 8 characters long.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value =
      'New password and confirmation password do not match.'
    return
  }

  passwordLoading.value = true

  try {
    await $fetch(
      '/api/welfare/settings/change-password' as string,
      {
        method: 'POST',
        body: {
          currentPassword: currentPassword.value,
          newPassword: newPassword.value,
        },
      },
    )

    passwordSuccess.value =
      'Password changed successfully.'

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    passwordError.value =
      err?.data?.statusMessage ||
      'Could not change password.'
  } finally {
    passwordLoading.value = false
  }
}

/* =========================
   2FA
========================= */

const togglingTwoFactor = ref(false)

const twoFactorPin = ref('')
const confirmTwoFactorPin = ref('')

const showTwoFactorPin = ref(false)
const showConfirmTwoFactorPin = ref(false)

const twoFactorError = ref<string | null>(null)
const twoFactorSuccess = ref<string | null>(null)

const twoFactorPinValid = computed(() => {
  return /^\d{6}$/.test(twoFactorPin.value)
})

const confirmTwoFactorPinValid = computed(() => {
  return /^\d{6}$/.test(confirmTwoFactorPin.value)
})

const twoFactorPinsMatch = computed(() => {
  return (
    twoFactorPin.value.length === 6 &&
    confirmTwoFactorPin.value.length === 6 &&
    twoFactorPin.value === confirmTwoFactorPin.value
  )
})

function sanitizeTwoFactorPin(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

async function toggleTwoFactor() {
  if (!data.value) return

  twoFactorError.value = null
  twoFactorSuccess.value = null

  const nextState = !data.value.twoFactorEnabled

  /*
   * ENABLE 2FA
   */
  if (nextState) {
    if (!twoFactorPin.value) {
      twoFactorError.value =
        'Please enter a 6-digit security PIN.'
      return
    }

    if (!twoFactorPinValid.value) {
      twoFactorError.value =
        'Security PIN must contain exactly 6 digits.'
      return
    }

    if (!confirmTwoFactorPin.value) {
      twoFactorError.value =
        'Please confirm your 6-digit security PIN.'
      return
    }

    if (!confirmTwoFactorPinValid.value) {
      twoFactorError.value =
        'Confirmation PIN must contain exactly 6 digits.'
      return
    }

    if (!twoFactorPinsMatch.value) {
      twoFactorError.value =
        'Security PINs do not match.'
      return
    }
  }

  togglingTwoFactor.value = true

  try {
    await $fetch(
      '/api/welfare/settings/2fa' as string,
      {
        method: 'POST',
        body: {
          enabled: nextState,
          ...(nextState
            ? {
                pin: twoFactorPin.value,
              }
            : {}),
        },
      },
    )

    data.value.twoFactorEnabled = nextState

    if (nextState) {
      twoFactorSuccess.value =
        'Two-factor authentication enabled successfully.'
    } else {
      twoFactorSuccess.value =
        'Two-factor authentication disabled.'
    }

    twoFactorPin.value = ''
    confirmTwoFactorPin.value = ''
    showTwoFactorPin.value = false
    showConfirmTwoFactorPin.value = false
  } catch (err: any) {
    twoFactorError.value =
      err?.data?.statusMessage ||
      'Could not update two-factor authentication.'
  } finally {
    togglingTwoFactor.value = false
  }
}

/* =========================
   NOTIFICATIONS
========================= */

const savingNotifications = ref(false)
const notificationSuccess = ref<string | null>(null)
const notificationError = ref<string | null>(null)

const notificationFields: {
  key: keyof NotificationPrefs
  label: string
  description: string
}[] = [
  {
    key: 'highRiskAlerts',
    label: 'High-Risk Alerts',
    description:
      'Get notified when someone in your unit is flagged Elevated or High risk.',
  },
  {
    key: 'followUpReminders',
    label: 'Follow-up Reminders',
    description:
      'Reminders for upcoming and overdue welfare check-ins.',
  },
  {
    key: 'interventionUpdates',
    label: 'Intervention Updates',
    description:
      "Status changes on interventions you're assigned to.",
  },
  {
    key: 'weeklySummary',
    label: 'Weekly Summary',
    description:
      'A digest of unit risk trends every Monday morning.',
  },
]

async function saveNotifications() {
  if (!data.value) return

  notificationSuccess.value = null
  notificationError.value = null
  savingNotifications.value = true

  try {
    await $fetch(
      '/api/welfare/settings/notifications' as string,
      {
        method: 'PUT',
        body: data.value.notifications,
      },
    )

    notificationSuccess.value =
      'Notification preferences saved successfully.'
  } catch (err: any) {
    notificationError.value =
      err?.data?.statusMessage ||
      'Could not save notification preferences.'
  } finally {
    savingNotifications.value = false
  }
}

/* =========================
   LOGOUT
========================= */

async function logout() {
  try {
    await $fetch('/api/auth/logout' as string, {
      method: 'POST',
    })
  } finally {
    await navigateTo('/login')
  }
}
</script>

<template>
  <div class="min-h-screen min-w-0 bg-[#07100d] text-slate-200">

    <!-- =========================================================
         MOBILE TOP BAR
    ========================================================== -->

    <div
      class="sticky top-0 z-30 flex items-center justify-between border-b border-white/5 bg-[#09130f]/95 px-4 py-3 backdrop-blur lg:hidden"
    >
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          @click="sidebarOpen = true"
          class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          aria-label="Open menu"
        >
          <Menu :size="20" />
        </button>

        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-white">
            System Settings
          </p>

          <p class="truncate text-[10px] text-slate-500">
            Welfare Officer
          </p>
        </div>
      </div>

      <button
        type="button"
        @click="goBack"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft :size="14" />
        Back
      </button>
    </div>

    <!-- =========================================================
         MOBILE SIDEBAR OVERLAY
    ========================================================== -->

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
      @click="closeSidebar"
    />

    <!-- =========================================================
         MOBILE SIDEBAR
    ========================================================== -->

    <aside
      v-if="sidebarOpen"
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#0d1813] shadow-2xl lg:hidden"
    >
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
              class="h-9 w-9 object-contain"
            />
          </div>

          <div class="min-w-0">
            <p class="text-sm font-bold text-white">
              Surakshit AI
            </p>

            <p class="text-[10px] leading-tight text-slate-500">
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
          to="/welfare/dashboard"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          Dashboard
        </NuxtLink>

        <NuxtLink
          to="/welfare/personnel"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <User :size="16" />
          Personnel
        </NuxtLink>

        <NuxtLink
          to="/welfare/high-risk-cases"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          High-Risk Cases
        </NuxtLink>

        <NuxtLink
          to="/welfare/interventions"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          Interventions
        </NuxtLink>

        <NuxtLink
          to="/welfare/follow-ups"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          Follow-ups
        </NuxtLink>

        <NuxtLink
          to="/welfare/analytics"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          Analytics
        </NuxtLink>

        <NuxtLink
          to="/welfare/reports"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <ShieldCheck :size="16" />
          Reports
        </NuxtLink>

        <div class="my-3 border-t border-white/5" />

        <NuxtLink
          to="/welfare/profile"
          @click="closeSidebar"
          class="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <User :size="16" />
          Profile
        </NuxtLink>

        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut :size="16" />
          Logout
        </button>
      </nav>
    </aside>

    <!-- =========================================================
         HEADER
    ========================================================== -->

    <div
      class="hidden border-b border-white/5 bg-[#09130f]/90 px-4 py-5 sm:px-6 lg:block"
    >
      <div class="mx-auto max-w-7xl">

        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                @click="goBack"
                class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft :size="14" />
                Back
              </button>

              <h1 class="text-xl font-semibold text-white">
                System Settings
              </h1>
            </div>

            <p class="mt-2 text-xs text-slate-500 sm:ml-[70px]">
              Manage your account security, notifications and preferences.
            </p>
          </div>
        </div>

      </div>
    </div>

    <!-- =========================================================
         MAIN
    ========================================================== -->

    <main
      class="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6"
    >

      <!-- LOADING -->

      <div
        v-if="loading"
        class="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate-400"
      >
        Loading settings...
      </div>

      <!-- ERROR -->

      <div
        v-else-if="error || !data"
        class="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-300 sm:p-6"
      >
        <p>
          Unable to load system settings.
        </p>

        <button
          type="button"
          @click="fetchSettings()"
          class="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
        >
          Retry
        </button>
      </div>

      <template v-else>

        <!-- =======================================================
             SECURITY
        ======================================================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div class="mb-5">
            <div class="flex items-center gap-2">
              <ShieldCheck
                :size="17"
                class="text-emerald-400"
              />

              <h2 class="text-sm font-semibold text-white">
                Security
              </h2>
            </div>

            <p class="mt-1 text-xs text-slate-500">
              Protect your welfare officer account.
            </p>
          </div>

          <!-- CHANGE PASSWORD -->

          <div class="border-b border-white/5 pb-6">
            <div class="mb-4">
              <h3 class="text-xs font-semibold text-slate-200">
                Change Password
              </h3>

              <p class="mt-1 text-[11px] leading-relaxed text-slate-500">
                Update your account password regularly for better security.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-3">

              <div>
                <label
                  class="mb-2 block text-[11px] font-semibold text-slate-400"
                >
                  Current Password
                </label>

                <input
                  v-model="currentPassword"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Current password"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label
                  class="mb-2 block text-[11px] font-semibold text-slate-400"
                >
                  New Password
                </label>

                <input
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Minimum 8 characters"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label
                  class="mb-2 block text-[11px] font-semibold text-slate-400"
                >
                  Confirm Password
                </label>

                <input
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Confirm new password"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

            </div>

            <p
              v-if="passwordError"
              class="mt-3 text-xs leading-relaxed text-red-400"
            >
              {{ passwordError }}
            </p>

            <p
              v-if="passwordSuccess"
              class="mt-3 text-xs text-emerald-400"
            >
              {{ passwordSuccess }}
            </p>

            <button
              type="button"
              :disabled="passwordLoading"
              class="mt-4 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              @click="changePassword"
            >
              {{
                passwordLoading
                  ? 'Updating...'
                  : 'Update Password'
              }}
            </button>
          </div>

          <!-- 2FA -->

          <div class="pt-6">

            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >

              <div class="flex min-w-0 gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
                >
                  🔐
                </div>

                <div class="min-w-0">
                  <h3 class="text-xs font-semibold text-slate-200">
                    Two-Factor Authentication
                  </h3>

                  <p class="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500">
                    Adds an extra 6-digit security PIN on top of your
                    password when signing in.
                  </p>
                </div>
              </div>

              <button
                type="button"
                :disabled="togglingTwoFactor"
                class="relative inline-flex h-6 w-11 shrink-0 items-center self-start rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
                :class="
                  data.twoFactorEnabled
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                "
                @click="toggleTwoFactor"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                  :class="
                    data.twoFactorEnabled
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  "
                />
              </button>

            </div>

            <!-- ENABLE 2FA PIN FORM -->

            <div
              v-if="!data.twoFactorEnabled"
              class="mt-5 rounded-xl border border-white/5 bg-black/10 p-4"
            >

              <div class="grid gap-4 md:grid-cols-2">

                <!-- PIN -->

                <div>
                  <label
                    class="mb-2 block text-[11px] font-semibold text-slate-300"
                  >
                    Set 6-digit Security PIN
                  </label>

                  <div class="relative">

                    <input
                      :value="twoFactorPin"
                      :type="
                        showTwoFactorPin
                          ? 'text'
                          : 'password'
                      "
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="new-password"
                      placeholder="Enter 6-digit PIN"
                      class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-xs tracking-[0.3em] text-slate-200 outline-none focus:border-emerald-500/50"
                      @input="
                        twoFactorPin = sanitizeTwoFactorPin(
                          ($event.target as HTMLInputElement).value
                        )
                      "
                    />

                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400"
                      :aria-label="
                        showTwoFactorPin
                          ? 'Hide security PIN'
                          : 'Show security PIN'
                      "
                      @click="
                        showTwoFactorPin =
                          !showTwoFactorPin
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

                  <p class="mt-2 text-[10px] text-slate-500">
                    Use exactly 6 digits.
                  </p>
                </div>

                <!-- CONFIRM PIN -->

                <div>
                  <label
                    class="mb-2 block text-[11px] font-semibold text-slate-300"
                  >
                    Confirm Your 2FA PIN
                  </label>

                  <div class="relative">

                    <input
                      :value="confirmTwoFactorPin"
                      :type="
                        showConfirmTwoFactorPin
                          ? 'text'
                          : 'password'
                      "
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="new-password"
                      placeholder="Re-enter 6-digit PIN"
                      class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-xs tracking-[0.3em] text-slate-200 outline-none focus:border-emerald-500/50"
                      @input="
                        confirmTwoFactorPin =
                          sanitizeTwoFactorPin(
                            ($event.target as HTMLInputElement).value
                          )
                      "
                    />

                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-400"
                      :aria-label="
                        showConfirmTwoFactorPin
                          ? 'Hide confirmation PIN'
                          : 'Show confirmation PIN'
                      "
                      @click="
                        showConfirmTwoFactorPin =
                          !showConfirmTwoFactorPin
                      "
                    >
                      <EyeOff
                        v-if="showConfirmTwoFactorPin"
                        :size="16"
                      />

                      <Eye
                        v-else
                        :size="16"
                      />
                    </button>

                  </div>

                  <p
                    v-if="
                      confirmTwoFactorPin.length === 6 &&
                      !twoFactorPinsMatch
                    "
                    class="mt-2 text-[10px] text-red-400"
                  >
                    PINs do not match.
                  </p>

                  <p
                    v-else-if="twoFactorPinsMatch"
                    class="mt-2 text-[10px] text-emerald-400"
                  >
                    PINs match.
                  </p>

                </div>

              </div>

              <div
                class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <p class="text-[10px] leading-relaxed text-slate-500">
                  After enabling 2FA, this PIN will be required
                  in addition to your password during login.
                </p>

                <button
                  type="button"
                  :disabled="
                    togglingTwoFactor ||
                    !twoFactorPinsMatch
                  "
                  class="w-full shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  @click="toggleTwoFactor"
                >
                  {{
                    togglingTwoFactor
                      ? 'Enabling...'
                      : 'Enable 2FA'
                  }}
                </button>

              </div>

            </div>

            <!-- ENABLED STATE -->

            <div
              v-else
              class="mt-4 rounded-lg border border-emerald-500/10 bg-emerald-500/5 px-4 py-3"
            >
              <div class="flex items-center gap-2">
                <span class="text-emerald-400">✓</span>

                <p class="text-xs font-medium text-emerald-300">
                  Two-factor authentication is enabled.
                </p>
              </div>

              <p class="mt-1 pl-5 text-[10px] leading-relaxed text-slate-500">
                Your 6-digit security PIN will be requested
                during login.
              </p>
            </div>

            <!-- 2FA MESSAGES -->

            <p
              v-if="twoFactorError"
              class="mt-3 text-xs leading-relaxed text-red-400"
            >
              {{ twoFactorError }}
            </p>

            <p
              v-if="twoFactorSuccess"
              class="mt-3 text-xs leading-relaxed text-emerald-400"
            >
              {{ twoFactorSuccess }}
            </p>

          </div>
        </section>

        <!-- =======================================================
             NOTIFICATIONS
        ======================================================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div class="mb-5">
            <div class="flex items-center gap-2">
              <Bell
                :size="17"
                class="text-emerald-400"
              />

              <h2 class="text-sm font-semibold text-white">
                Notifications
              </h2>
            </div>

            <p class="mt-1 text-xs text-slate-500">
              Choose which welfare system notifications you receive.
            </p>
          </div>

          <div class="space-y-3 sm:space-y-4">

            <div
              v-for="field in notificationFields"
              :key="field.key"
              class="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-black/10 p-3 sm:gap-4 sm:p-4"
            >
              <div class="min-w-0 pr-2">
                <h3 class="text-xs font-medium text-slate-200">
                  {{ field.label }}
                </h3>

                <p
                  class="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500"
                >
                  {{ field.description }}
                </p>
              </div>

              <button
                type="button"
                class="relative mt-1 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition"
                :class="
                  data.notifications[field.key]
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                "
                @click="
                  data.notifications[field.key] =
                    !data.notifications[field.key]
                "
              >
                <span
                  class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition"
                  :class="
                    data.notifications[field.key]
                      ? 'translate-x-4'
                      : 'translate-x-1'
                  "
                />
              </button>
            </div>

          </div>

          <p
            v-if="notificationError"
            class="mt-3 text-xs leading-relaxed text-red-400"
          >
            {{ notificationError }}
          </p>

          <p
            v-if="notificationSuccess"
            class="mt-3 text-xs leading-relaxed text-emerald-400"
          >
            {{ notificationSuccess }}
          </p>

          <button
            type="button"
            :disabled="savingNotifications"
            class="mt-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            @click="saveNotifications"
          >
            {{
              savingNotifications
                ? 'Saving...'
                : 'Save Preferences'
            }}
          </button>
        </section>

        <!-- =======================================================
             ACCOUNT
        ======================================================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:p-6"
        >
          <div class="mb-5">
            <div class="flex items-center gap-2">
              <User
                :size="17"
                class="text-emerald-400"
              />

              <h2 class="text-sm font-semibold text-white">
                Account
              </h2>
            </div>

            <p class="mt-1 text-xs text-slate-500">
              Manage your current welfare officer session.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 sm:w-auto"
            @click="logout"
          >
            <LogOut :size="14" />
            Logout
          </button>
        </section>

      </template>
    </main>
  </div>
</template>