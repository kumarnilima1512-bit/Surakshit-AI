<script setup lang="ts">
import { ref, computed } from 'vue'

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

      twoFactorPin.value = ''
      confirmTwoFactorPin.value = ''
      showTwoFactorPin.value = false
      showConfirmTwoFactorPin.value = false
    } else {
      twoFactorSuccess.value =
        'Two-factor authentication disabled.'

      twoFactorPin.value = ''
      confirmTwoFactorPin.value = ''
      showTwoFactorPin.value = false
      showConfirmTwoFactorPin.value = false
    }
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
  <div class="min-h-screen bg-[#07100d] text-slate-200">

    <!-- HEADER -->
    <div
      class="border-b border-white/5 bg-[#09130f]/90 px-6 py-5"
    >
      <div class="mx-auto max-w-7xl">
        <h1 class="text-xl font-semibold text-white">
          System Settings
        </h1>

        <p class="mt-1 text-xs text-slate-500">
          Manage your account security, notifications and preferences.
        </p>
      </div>
    </div>

    <main class="mx-auto max-w-7xl space-y-6 px-6 py-6">

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
        class="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-300"
      >
        Unable to load system settings.
      </div>

      <template v-else>

        <!-- =========================
             SECURITY
        ========================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div class="mb-5">
            <h2 class="text-sm font-semibold text-white">
              Security
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              Protect your welfare officer account.
            </p>
          </div>

          <!-- CHANGE PASSWORD -->

          <div
            class="border-b border-white/5 pb-6"
          >
            <div class="mb-4">
              <h3 class="text-xs font-semibold text-slate-200">
                Change Password
              </h3>

              <p class="mt-1 text-[11px] text-slate-500">
                Update your account password regularly for better security.
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-3">

              <div>
                <label class="mb-2 block text-[11px] font-semibold text-slate-400">
                  Current Password
                </label>

                <input
                  v-model="currentPassword"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Current password"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label class="mb-2 block text-[11px] font-semibold text-slate-400">
                  New Password
                </label>

                <input
                  v-model="newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Minimum 8 characters"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label class="mb-2 block text-[11px] font-semibold text-slate-400">
                  Confirm Password
                </label>

                <input
                  v-model="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Confirm new password"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                />
              </div>

            </div>

            <p
              v-if="passwordError"
              class="mt-3 text-xs text-red-400"
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
              class="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
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

              <div class="flex gap-3">

                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
                >
                  🔐
                </div>

                <div>
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
                class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
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
                      class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-xs tracking-[0.3em] text-slate-200 outline-none focus:border-emerald-500/50"
                      @input="
                        twoFactorPin = sanitizeTwoFactorPin(
                          ($event.target as HTMLInputElement).value
                        )
                      "
                    />

                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-emerald-400"
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
                      <svg
                        v-if="!showTwoFactorPin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.178.07.21.07.434 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>

                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.443 7.315 19.5 12 19.5c1.524 0 2.971-.325 4.276-.91M6.228 6.228A10.45 10.45 0 0112 4.5c4.685 0 8.774 3.057 10.066 7.5a10.523 10.523 0 01-4.122 5.178M6.228 6.228L3 3m3.228 3.228l3.16 3.16m5.384 5.384L21 21m-6.228-6.228a3 3 0 01-4.243-4.243"
                        />
                      </svg>
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
                      class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-xs tracking-[0.3em] text-slate-200 outline-none focus:border-emerald-500/50"
                      @input="
                        confirmTwoFactorPin =
                          sanitizeTwoFactorPin(
                            ($event.target as HTMLInputElement).value
                          )
                      "
                    />

                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 transition hover:text-emerald-400"
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
                      <svg
                        v-if="!showConfirmTwoFactorPin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.178.07.21.07.434 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z"
                        />
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>

                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="h-4 w-4"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.443 7.315 19.5 12 19.5c1.524 0 2.971-.325 4.276-.91M6.228 6.228A10.45 10.45 0 0112 4.5c4.685 0 8.774 3.057 10.066 7.5a10.523 10.523 0 01-4.122 5.178M6.228 6.228L3 3m3.228 3.228l3.16 3.16m5.384 5.384L21 21m-6.228-6.228a3 3 0 01-4.243-4.243"
                        />
                      </svg>
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

              <div class="mt-4 flex items-center justify-between gap-4">

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
                  class="shrink-0 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
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

              <p class="mt-1 pl-5 text-[10px] text-slate-500">
                Your 6-digit security PIN will be requested
                during login.
              </p>
            </div>

            <!-- 2FA MESSAGES -->

            <p
              v-if="twoFactorError"
              class="mt-3 text-xs text-red-400"
            >
              {{ twoFactorError }}
            </p>

            <p
              v-if="twoFactorSuccess"
              class="mt-3 text-xs text-emerald-400"
            >
              {{ twoFactorSuccess }}
            </p>

          </div>
        </section>

        <!-- =========================
             NOTIFICATIONS
        ========================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div class="mb-5">
            <h2 class="text-sm font-semibold text-white">
              Notifications
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              Choose which welfare system notifications you receive.
            </p>
          </div>

          <div class="space-y-4">

            <div
              v-for="field in notificationFields"
              :key="field.key"
              class="flex items-start justify-between gap-4 rounded-lg border border-white/5 bg-black/10 p-4"
            >
              <div>
                <h3 class="text-xs font-medium text-slate-200">
                  {{ field.label }}
                </h3>

                <p class="mt-1 max-w-2xl text-[10px] leading-relaxed text-slate-500">
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
            class="mt-3 text-xs text-red-400"
          >
            {{ notificationError }}
          </p>

          <p
            v-if="notificationSuccess"
            class="mt-3 text-xs text-emerald-400"
          >
            {{ notificationSuccess }}
          </p>

          <button
            type="button"
            :disabled="savingNotifications"
            class="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            @click="saveNotifications"
          >
            {{
              savingNotifications
                ? 'Saving...'
                : 'Save Preferences'
            }}
          </button>
        </section>

        <!-- =========================
             ACCOUNT
        ========================== -->

        <section
          class="rounded-xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div class="mb-5">
            <h2 class="text-sm font-semibold text-white">
              Account
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              Manage your current welfare officer session.
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
            @click="logout"
          >
            Logout
          </button>
        </section>

      </template>
    </main>
  </div>
</template>

