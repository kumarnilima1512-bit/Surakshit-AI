<script setup lang="ts">
import {
  User,
  Mail,
  Lock,
  Shield,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Power,
  RefreshCw,
} from 'lucide-vue-next'

interface AccountForm {
  email: string
  username: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  twoFactorEnabled: boolean
  twoFactorPin: string
  confirmTwoFactorPin: string
}

const form = reactive<AccountForm>({
  email: '',
  username: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: false,
  twoFactorPin: '',
  confirmTwoFactorPin: '',
})

const initialTwoFactorEnabled = ref(false)
const changingPin = ref(false)

const loading = ref(true)
const saving = ref(false)

const successMessage = ref('')
const errorMessage = ref('')

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const showPin = ref(false)
const showConfirmPin = ref(false)

const loadAccount = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{
      email?: string
      username?: string | null
      twoFactorEnabled?: boolean
    }>('/api/admin/profile')

    form.email = response.email ?? ''
    form.username = response.username ?? ''

    form.twoFactorEnabled =
      response.twoFactorEnabled === true

    initialTwoFactorEnabled.value =
      response.twoFactorEnabled === true
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'Unable to load account settings.'
  } finally {
    loading.value = false
  }
}

const preparePinChange = () => {
  changingPin.value = true

  form.twoFactorPin = ''
  form.confirmTwoFactorPin = ''

  successMessage.value = ''
  errorMessage.value = ''
}

const cancelPinChange = () => {
  changingPin.value = false

  form.twoFactorPin = ''
  form.confirmTwoFactorPin = ''

  form.twoFactorEnabled =
    initialTwoFactorEnabled.value
}

const enableTwoFactor = () => {
  form.twoFactorEnabled = true
  changingPin.value = false

  form.twoFactorPin = ''
  form.confirmTwoFactorPin = ''

  successMessage.value = ''
  errorMessage.value = ''
}

const disableTwoFactor = () => {
  form.twoFactorEnabled = false
  changingPin.value = false

  form.twoFactorPin = ''
  form.confirmTwoFactorPin = ''

  successMessage.value = ''
  errorMessage.value = ''
}

const validateForm = () => {
  if (!form.email.trim()) {
    errorMessage.value = 'Email is required.'
    return false
  }

  /*
   * Password validation
   */
  if (form.newPassword) {
    if (!form.currentPassword) {
      errorMessage.value =
        'Current password is required to change your password.'
      return false
    }

    if (form.newPassword.length < 8) {
      errorMessage.value =
        'New password must be at least 8 characters.'
      return false
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      errorMessage.value =
        'New password and confirm password do not match.'
      return false
    }
  }

  /*
   * 2FA validation
   *
   * PIN is required only when:
   * 1. Enabling 2FA for the first time
   * 2. Changing an existing PIN
   */
  const enabling2FA =
    form.twoFactorEnabled &&
    !initialTwoFactorEnabled.value

  const changingExistingPin =
    form.twoFactorEnabled &&
    initialTwoFactorEnabled.value &&
    changingPin.value

  if (
    enabling2FA ||
    changingExistingPin
  ) {
    if (!/^\d{6}$/.test(form.twoFactorPin)) {
      errorMessage.value =
        '2FA PIN must be exactly 6 digits.'
      return false
    }

    if (
      form.twoFactorPin !==
      form.confirmTwoFactorPin
    ) {
      errorMessage.value =
        '2FA PIN and confirm PIN do not match.'
      return false
    }
  }

  return true
}

const saveAccount = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!validateForm()) {
    return
  }

  saving.value = true

  try {
    const enabling2FA =
      form.twoFactorEnabled &&
      !initialTwoFactorEnabled.value

    const changingExistingPin =
      form.twoFactorEnabled &&
      initialTwoFactorEnabled.value &&
      changingPin.value

    const response = await $fetch<{
      success: boolean
      message?: string
      twoFactor?: {
        enabled: boolean
      }
    }>('/api/admin/account-settings', {
      method: 'PUT',
      body: {
        email: form.email.trim(),
        username:
          form.username.trim() || null,

        currentPassword:
          form.currentPassword || undefined,

        newPassword:
          form.newPassword || undefined,

        twoFactorEnabled:
          form.twoFactorEnabled,

        /*
         * Only send PIN when it is actually
         * being created or changed.
         */
        twoFactorPin:
          enabling2FA ||
          changingExistingPin
            ? form.twoFactorPin
            : undefined,
      },
    })

    successMessage.value =
      response.message ||
      'Account settings updated successfully.'

    /*
     * Reset password fields after success.
     */
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''

    /*
     * Reset 2FA temporary fields.
     */
    form.twoFactorPin = ''
    form.confirmTwoFactorPin = ''

    changingPin.value = false

    /*
     * Keep the current state as the new
     * baseline for future saves.
     */
    initialTwoFactorEnabled.value =
      response.twoFactor?.enabled ??
      form.twoFactorEnabled

    form.twoFactorEnabled =
      response.twoFactor?.enabled ??
      form.twoFactorEnabled
  } catch (error: any) {
    console.error(error)

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      'Unable to save account settings.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadAccount()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <!-- Header -->
    <div
      class="border-b border-slate-800 bg-slate-950/95"
    >
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-6 py-6"
      >
        <div>
          <div
            class="mb-2 flex items-center gap-3"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400"
            >
              <User :size="22" />
            </div>

            <div>
              <h1
                class="text-2xl font-bold tracking-tight"
              >
                Account Settings
              </h1>

              <p
                class="text-sm text-slate-400"
              >
                Manage your administrator account
                and security preferences
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          :disabled="saving || loading"
          @click="saveAccount"
          class="flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            v-if="saving"
            :size="17"
            class="animate-spin"
          />

          <Save
            v-else
            :size="17"
          />

          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <!-- Main -->
    <main
      class="mx-auto max-w-7xl px-6 py-8"
    >
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex min-h-[400px] items-center justify-center"
      >
        <div
          class="flex items-center gap-3 text-slate-400"
        >
          <RefreshCw
            :size="20"
            class="animate-spin"
          />

          Loading account settings...
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Success -->
        <div
          v-if="successMessage"
          class="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4"
        >
          <CheckCircle2
            class="mt-0.5 shrink-0 text-emerald-400"
            :size="20"
          />

          <div>
            <p
              class="font-medium text-emerald-300"
            >
              {{ successMessage }}
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4"
        >
          <AlertCircle
            class="mt-0.5 shrink-0 text-red-400"
            :size="20"
          />

          <div>
            <p
              class="font-medium text-red-300"
            >
              {{ errorMessage }}
            </p>
          </div>
        </div>

        <!-- Account Information -->
        <section
          class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div
            class="mb-6 flex items-center gap-3"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400"
            >
              <User :size="20" />
            </div>

            <div>
              <h2
                class="text-lg font-semibold"
              >
                Account Information
              </h2>

              <p
                class="text-sm text-slate-500"
              >
                Update your administrator account
                details.
              </p>
            </div>
          </div>

          <div
            class="grid gap-5 md:grid-cols-2"
          >
            <!-- Email -->
            <div>
              <label
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>

              <div class="relative">
                <Mail
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  v-model="form.email"
                  type="email"
                  class="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <!-- Username -->
            <div>
              <label
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>

              <div class="relative">
                <User
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  v-model="form.username"
                  type="text"
                  class="w-full rounded-xl border border-slate-700 bg-slate-950 px-10 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
                  placeholder="Administrator username"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Password -->
        <section
          class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div
            class="mb-6 flex items-center gap-3"
          >
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400"
            >
              <Lock :size="20" />
            </div>

            <div>
              <h2
                class="text-lg font-semibold"
              >
                Change Password
              </h2>

              <p
                class="text-sm text-slate-500"
              >
                Leave these fields empty if you
                do not want to change your password.
              </p>
            </div>
          </div>

          <div
            class="grid gap-5 md:grid-cols-3"
          >
            <!-- Current -->
            <div>
              <label
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Current Password
              </label>

              <div class="relative">
                <input
                  v-model="form.currentPassword"
                  :type="
                    showCurrentPassword
                      ? 'text'
                      : 'password'
                  "
                  class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-500"
                  placeholder="Current password"
                />

                <button
                  type="button"
                  @click="
                    showCurrentPassword =
                      !showCurrentPassword
                  "
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <Eye
                    v-if="!showCurrentPassword"
                    :size="18"
                  />

                  <EyeOff
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>

            <!-- New -->
            <div>
              <label
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                New Password
              </label>

              <div class="relative">
                <input
                  v-model="form.newPassword"
                  :type="
                    showNewPassword
                      ? 'text'
                      : 'password'
                  "
                  class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-500"
                  placeholder="Minimum 8 characters"
                />

                <button
                  type="button"
                  @click="
                    showNewPassword =
                      !showNewPassword
                  "
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <Eye
                    v-if="!showNewPassword"
                    :size="18"
                  />

                  <EyeOff
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>

            <!-- Confirm -->
            <div>
              <label
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Confirm New Password
              </label>

              <div class="relative">
                <input
                  v-model="form.confirmPassword"
                  :type="
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  "
                  class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-sm text-white outline-none transition focus:border-cyan-500"
                  placeholder="Repeat new password"
                />

                <button
                  type="button"
                  @click="
                    showConfirmPassword =
                      !showConfirmPassword
                  "
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <Eye
                    v-if="!showConfirmPassword"
                    :size="18"
                  />

                  <EyeOff
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Two Factor Authentication -->
        <section
          class="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        >
          <div
            class="mb-6 flex items-start justify-between gap-4"
          >
            <div
              class="flex items-center gap-3"
            >
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400"
              >
                <Shield :size="20" />
              </div>

              <div>
                <h2
                  class="text-lg font-semibold"
                >
                  Two-Factor Authentication
                </h2>

                <p
                  class="text-sm text-slate-500"
                >
                  Secure your administrator account
                  with a 6-digit PIN.
                </p>
              </div>
            </div>

            <!-- Status -->
            <span
              v-if="form.twoFactorEnabled"
              class="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400"
            >
              <CheckCircle2 :size="14" />
              Enabled
            </span>

            <span
              v-else
              class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-400"
            >
              <AlertCircle :size="14" />
              Disabled
            </span>
          </div>

          <!-- Disabled State -->
          <div
            v-if="!form.twoFactorEnabled"
            class="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
          >
            <div
              class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h3
                  class="font-semibold text-white"
                >
                  Protect your account
                </h3>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  Enable 2FA and create a 6-digit
                  security PIN for your account.
                </p>
              </div>

              <button
                type="button"
                @click="enableTwoFactor"
                class="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                <Power :size="17" />
                Enable 2FA
              </button>
            </div>
          </div>

          <!-- Enabled State -->
          <div
            v-else
            class="space-y-5"
          >
            <!-- Current protection -->
            <div
              class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5"
            >
              <div
                class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div
                    class="flex items-center gap-2"
                  >
                    <KeyRound
                      :size="18"
                      class="text-emerald-400"
                    />

                    <h3
                      class="font-semibold text-white"
                    >
                      6-Digit PIN Protection
                    </h3>
                  </div>

                  <p
                    class="mt-1 text-sm text-slate-500"
                  >
                    Your account is protected by
                    two-factor authentication.
                  </p>
                </div>

                <div
                  class="flex flex-wrap gap-2"
                >
                  <button
                    v-if="!changingPin"
                    type="button"
                    @click="preparePinChange"
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
                  >
                    <KeyRound :size="16" />
                    Change PIN
                  </button>

                  <button
                    type="button"
                    @click="disableTwoFactor"
                    class="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    <Power :size="16" />
                    Disable 2FA
                  </button>
                </div>
              </div>
            </div>

            <!-- PIN Form -->
            <div
              v-if="changingPin"
              class="rounded-xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <div class="mb-5">
                <h3
                  class="font-semibold text-white"
                >
                  Change 2FA PIN
                </h3>

                <p
                  class="mt-1 text-sm text-slate-500"
                >
                  Enter a new 6-digit PIN.
                </p>
              </div>

              <div
                class="grid gap-5 md:grid-cols-2"
              >
                <!-- New PIN -->
                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-slate-300"
                  >
                    New 6-Digit PIN
                  </label>

                  <div class="relative">
                    <input
                      v-model="form.twoFactorPin"
                      inputmode="numeric"
                      maxlength="6"
                      :type="
                        showPin
                          ? 'text'
                          : 'password'
                      "
                      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-center text-lg tracking-[0.4em] text-white outline-none transition focus:border-violet-500"
                      placeholder="••••••"
                    />

                    <button
                      type="button"
                      @click="
                        showPin = !showPin
                      "
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <Eye
                        v-if="!showPin"
                        :size="18"
                      />

                      <EyeOff
                        v-else
                        :size="18"
                      />
                    </button>
                  </div>
                </div>

                <!-- Confirm PIN -->
                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Confirm 6-Digit PIN
                  </label>

                  <div class="relative">
                    <input
                      v-model="
                        form.confirmTwoFactorPin
                      "
                      inputmode="numeric"
                      maxlength="6"
                      :type="
                        showConfirmPin
                          ? 'text'
                          : 'password'
                      "
                      class="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pr-11 text-center text-lg tracking-[0.4em] text-white outline-none transition focus:border-violet-500"
                      placeholder="••••••"
                    />

                    <button
                      type="button"
                      @click="
                        showConfirmPin =
                          !showConfirmPin
                      "
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <Eye
                        v-if="!showConfirmPin"
                        :size="18"
                      />

                      <EyeOff
                        v-else
                        :size="18"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="mt-5 flex flex-wrap justify-end gap-3"
              >
                <button
                  type="button"
                  @click="cancelPinChange"
                  class="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  :disabled="saving"
                  @click="saveAccount"
                  class="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                >
                  <Save :size="16" />
                  Save PIN
                </button>
              </div>
            </div>

            <!-- Normal enabled info -->
            <div
              v-else
              class="rounded-xl border border-slate-800 bg-slate-950/40 px-5 py-4"
            >
              <div
                class="flex items-start gap-3"
              >
                <Shield
                  :size="18"
                  class="mt-0.5 shrink-0 text-violet-400"
                />

                <div>
                  <p
                    class="text-sm font-medium text-slate-200"
                  >
                    Two-factor authentication is
                    active.
                  </p>

                  <p
                    class="mt-1 text-xs leading-5 text-slate-500"
                  >
                    Your existing PIN will remain
                    unchanged when you save other
                    account settings. Use
                    <span
                      class="font-medium text-slate-300"
                    >
                      Change PIN
                    </span>
                    if you want to create a new
                    PIN.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>