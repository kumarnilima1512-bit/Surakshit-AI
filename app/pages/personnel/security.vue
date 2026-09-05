```vue
<script setup lang="ts">
import {
  ShieldCheck,
  Lock,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-vue-next'

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const passwordMessage = ref('')
const passwordError = ref('')

const twoFactorEnabled = ref(false)
const showTwoFactorSetup = ref(false)

const twoFactorPin = ref('')
const confirmTwoFactorPin = ref('')

const twoFactorMessage = ref('')
const twoFactorError = ref('')
const twoFactorLoading = ref(false)

const passwordStrength = computed(() => {
  const password = newPassword.value

  if (!password) return 0

  let score = 0

  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  return score
})

const passwordStrengthLabel = computed(() => {
  switch (passwordStrength.value) {
    case 1:
    case 2:
      return 'Weak'
    case 3:
      return 'Fair'
    case 4:
      return 'Good'
    case 5:
      return 'Strong'
    default:
      return ''
  }
})

const passwordStrengthWidth = computed(() => {
  return `${(passwordStrength.value / 5) * 100}%`
})

// --------------------------------------------------
// LOAD 2FA STATUS
// --------------------------------------------------

async function loadTwoFactorStatus() {
  try {
    const response = await $fetch<{
      success: boolean
      twoFactorEnabled: boolean
    }>('/api/personnel/security/2fa/status')

    twoFactorEnabled.value = response.twoFactorEnabled
  } catch {
    // Keep default state if status endpoint is unavailable.
  }
}

onMounted(() => {
  loadTwoFactorStatus()
})

// --------------------------------------------------
// 2FA SETUP
// --------------------------------------------------

function openTwoFactorSetup() {
  twoFactorError.value = ''
  twoFactorMessage.value = ''
  twoFactorPin.value = ''
  confirmTwoFactorPin.value = ''
  showTwoFactorSetup.value = true
}

function cancelTwoFactorSetup() {
  showTwoFactorSetup.value = false
  twoFactorError.value = ''
  twoFactorMessage.value = ''
  twoFactorPin.value = ''
  confirmTwoFactorPin.value = ''
}

async function enableTwoFactor() {
  twoFactorError.value = ''
  twoFactorMessage.value = ''

  if (!/^\d{6}$/.test(twoFactorPin.value)) {
    twoFactorError.value =
      'Security PIN must contain exactly 6 digits.'
    return
  }

  if (!/^\d{6}$/.test(confirmTwoFactorPin.value)) {
    twoFactorError.value =
      'Please enter a valid 6-digit confirmation PIN.'
    return
  }

  if (twoFactorPin.value !== confirmTwoFactorPin.value) {
    twoFactorError.value =
      'Security PINs do not match.'
    return
  }

  twoFactorLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message: string
    }>('/api/personnel/security/2fa/setup', {
      method: 'POST',
      body: {
        pin: twoFactorPin.value,
        confirmPin: confirmTwoFactorPin.value,
      },
    })

    if (!response.success) {
      throw new Error(response.message || 'Unable to enable 2FA')
    }

    twoFactorEnabled.value = true
    twoFactorMessage.value =
      'Two-factor authentication has been enabled successfully.'

    showTwoFactorSetup.value = false

    twoFactorPin.value = ''
    confirmTwoFactorPin.value = ''
  } catch (error: any) {
    twoFactorError.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      'Unable to enable two-factor authentication.'
  } finally {
    twoFactorLoading.value = false
  }
}

// --------------------------------------------------
// PASSWORD
// --------------------------------------------------

function validatePassword() {
  passwordError.value = ''
  passwordMessage.value = ''

  if (!currentPassword.value) {
    passwordError.value =
      'Please enter your current password.'
    return false
  }

  if (!newPassword.value) {
    passwordError.value =
      'Please enter a new password.'
    return false
  }

  if (newPassword.value.length < 8) {
    passwordError.value =
      'New password must contain at least 8 characters.'
    return false
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value =
      'New passwords do not match.'
    return false
  }

  return true
}

async function updatePassword() {
  if (!validatePassword()) return

  passwordError.value = ''
  passwordMessage.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      message?: string
    }>('/api/personnel/security/password', {
      method: 'PATCH',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
    })

    passwordMessage.value =
      response.message ||
      'Password updated successfully.'

    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (error: any) {
    passwordError.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      'Unable to update password.'
  }
}

function clearPasswordForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordError.value = ''
  passwordMessage.value = ''
}

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

async function logout() {
  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    })
  } finally {
    await navigateTo('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b1220] text-slate-100">

    <!-- Header -->
    <header class="border-b border-white/5 bg-[#0d1526]">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >

        <div class="flex items-center gap-3">

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400"
          >
            <ShieldCheck
              :size="22"
              :stroke-width="1.5"
            />
          </div>

          <div>
            <p class="text-sm font-bold text-white">
              Security
            </p>

            <p class="text-[11px] text-slate-500">
              Protect your Surakshit AI account
            </p>
          </div>

        </div>

        <NuxtLink
          to="/personnel/profile"
          class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
        >
          <User :size="15" />
          My Profile
        </NuxtLink>

      </div>
    </header>

    <!-- Main -->
    <main
      class="mx-auto max-w-6xl space-y-5 px-6 py-6"
    >

      <!-- Security overview -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
      >
        <div class="flex items-start gap-4">

          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
          >
            <ShieldCheck
              :size="24"
              :stroke-width="1.5"
            />
          </div>

          <div>
            <h1 class="text-lg font-bold text-white">
              Account Security
            </h1>

            <p
              class="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400"
            >
              Manage your password and strengthen your
              Surakshit AI personnel account with two-factor
              authentication.
            </p>
          </div>

        </div>
      </section>

      <!-- Security status -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
      >
        <div class="flex items-center gap-2">

          <CheckCircle2
            :size="18"
            :stroke-width="1.5"
            class="text-emerald-400"
          />

          <h2 class="text-sm font-bold text-white">
            Security Status
          </h2>

        </div>

        <div
          class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3"
        >

          <!-- Password -->
          <div
            class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <div class="flex items-center gap-3">

              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
              >
                <Lock :size="17" />
              </div>

              <div>
                <p class="text-xs font-semibold text-white">
                  Password
                </p>

                <p class="mt-0.5 text-[11px] text-emerald-400">
                  Protected
                </p>
              </div>

            </div>
          </div>

          <!-- Authentication -->
          <div
            class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <div class="flex items-center gap-3">

              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"
              >
                <ShieldCheck :size="17" />
              </div>

              <div>
                <p class="text-xs font-semibold text-white">
                  Authentication
                </p>

                <p
                  class="mt-0.5 text-[11px]"
                  :class="
                    twoFactorEnabled
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  "
                >
                  {{ twoFactorEnabled ? '2FA Active' : 'Password Only' }}
                </p>
              </div>

            </div>
          </div>

          <!-- Session -->
          <div
            class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
          >
            <div class="flex items-center gap-3">

              <div
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400"
              >
                <KeyRound :size="17" />
              </div>

              <div>
                <p class="text-xs font-semibold text-white">
                  Session
                </p>

                <p class="mt-0.5 text-[11px] text-emerald-400">
                  Secure
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- Two Factor Authentication -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
      >

        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >

          <div class="flex items-start gap-3">

            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
            >
              <ShieldAlert
                :size="19"
                :stroke-width="1.5"
              />
            </div>

            <div>
              <h2 class="text-sm font-bold text-white">
                Two-Factor Authentication
              </h2>

              <p
                class="mt-1 max-w-xl text-[11px] leading-relaxed text-slate-500"
              >
                Add an extra layer of security by protecting
                your account with a personal 6-digit security PIN.
              </p>
            </div>

          </div>

          <!-- Status -->
          <span
            class="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold"
            :class="
              twoFactorEnabled
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            "
          >
            <CheckCircle2
              v-if="twoFactorEnabled"
              :size="12"
            />

            <AlertTriangle
              v-else
              :size="12"
            />

            {{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}
          </span>

        </div>

        <!-- Enabled -->
        <div
          v-if="twoFactorEnabled"
          class="mt-5 flex items-start gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"
        >

          <CheckCircle2
            :size="17"
            class="mt-0.5 shrink-0 text-emerald-400"
          />

          <div>
            <p class="text-xs font-semibold text-emerald-300">
              Two-factor authentication is active
            </p>

            <p class="mt-1 text-[11px] leading-relaxed text-slate-500">
              Your account now requires your personal 6-digit
              security PIN after entering your password.
            </p>
          </div>

        </div>

        <!-- Setup -->
        <div v-else-if="!showTwoFactorSetup" class="mt-5">

          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            @click="openTwoFactorSetup"
          >
            <ShieldCheck :size="15" />
            Enable 2FA
          </button>

        </div>

        <!-- PIN Setup Form -->
        <div
          v-else
          class="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-5"
        >

          <div class="mb-5">

            <h3 class="text-sm font-semibold text-white">
              Create your security PIN
            </h3>

            <p class="mt-1 text-[11px] leading-relaxed text-slate-500">
              Choose a private 6-digit PIN. You will need this
              PIN every time you sign in after entering your password.
            </p>

          </div>

          <div class="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">

            <!-- PIN -->
            <div>
              <label
                class="mb-2 block text-xs font-semibold text-slate-300"
              >
                6-Digit Security PIN
              </label>

              <input
                v-model="twoFactorPin"
                type="password"
                inputmode="numeric"
                maxlength="6"
                autocomplete="new-password"
                placeholder="Enter 6-digit PIN"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-lg tracking-[0.35em] text-slate-200 outline-none transition placeholder:text-xs placeholder:tracking-normal focus:border-blue-500/50 focus:bg-white/[0.07]"
                @input="
                  twoFactorPin = twoFactorPin
                    .replace(/\D/g, '')
                    .slice(0, 6)
                "
              />
            </div>

            <!-- Confirm PIN -->
            <div>
              <label
                class="mb-2 block text-xs font-semibold text-slate-300"
              >
                Confirm Security PIN
              </label>

              <input
                v-model="confirmTwoFactorPin"
                type="password"
                inputmode="numeric"
                maxlength="6"
                autocomplete="new-password"
                placeholder="Confirm 6-digit PIN"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-lg tracking-[0.35em] text-slate-200 outline-none transition placeholder:text-xs placeholder:tracking-normal focus:border-blue-500/50 focus:bg-white/[0.07]"
                @input="
                  confirmTwoFactorPin = confirmTwoFactorPin
                    .replace(/\D/g, '')
                    .slice(0, 6)
                "
              />
            </div>

          </div>

          <!-- Error -->
          <div
            v-if="twoFactorError"
            class="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5"
          >

            <AlertTriangle
              :size="15"
              class="mt-0.5 shrink-0 text-red-400"
            />

            <p class="text-xs text-red-300">
              {{ twoFactorError }}
            </p>

          </div>

          <!-- Success -->
          <div
            v-if="twoFactorMessage"
            class="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5"
          >

            <CheckCircle2
              :size="15"
              class="mt-0.5 shrink-0 text-emerald-400"
            />

            <p class="text-xs text-emerald-300">
              {{ twoFactorMessage }}
            </p>

          </div>

          <!-- Actions -->
          <div class="mt-5 flex items-center gap-3">

            <button
              type="button"
              :disabled="twoFactorLoading"
              class="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              @click="enableTwoFactor"
            >
              {{
                twoFactorLoading
                  ? 'Enabling...'
                  : 'Enable 2FA'
              }}
            </button>

            <button
              type="button"
              :disabled="twoFactorLoading"
              class="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
              @click="cancelTwoFactorSetup"
            >
              Cancel
            </button>

          </div>

        </div>

      </section>

      <!-- Change Password -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
      >

        <div class="flex items-center gap-3">

          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
          >
            <KeyRound
              :size="19"
              :stroke-width="1.5"
            />
          </div>

          <div>
            <h2 class="text-sm font-bold text-white">
              Change Password
            </h2>

            <p class="mt-0.5 text-[11px] text-slate-500">
              Keep your account protected with a strong password.
            </p>
          </div>

        </div>

        <form
          class="mt-6 max-w-2xl space-y-5"
          @submit.prevent="updatePassword"
        >

          <!-- Current password -->
          <div>

            <label
              class="mb-2 block text-xs font-semibold text-slate-300"
            >
              Current Password
            </label>

            <div class="relative">

              <input
                v-model="currentPassword"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Enter current password"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-12 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
              />

              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                @click="showPassword = !showPassword"
              >
                <EyeOff
                  v-if="showPassword"
                  :size="16"
                />

                <Eye
                  v-else
                  :size="16"
                />
              </button>

            </div>

          </div>

          <!-- New password -->
          <div>

            <label
              class="mb-2 block text-xs font-semibold text-slate-300"
            >
              New Password
            </label>

            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Enter new password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
            />

            <div
              v-if="newPassword"
              class="mt-2"
            >

              <div
                class="h-1.5 overflow-hidden rounded-full bg-white/5"
              >
                <div
                  class="h-full rounded-full bg-blue-500 transition-all"
                  :style="{ width: passwordStrengthWidth }"
                />
              </div>

              <p class="mt-1 text-[10px] text-slate-500">
                Password strength:
                <span class="font-semibold text-slate-300">
                  {{ passwordStrengthLabel }}
                </span>
              </p>

            </div>

          </div>

          <!-- Confirm password -->
          <div>

            <label
              class="mb-2 block text-xs font-semibold text-slate-300"
            >
              Confirm New Password
            </label>

            <div class="relative">

              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Confirm new password"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-12 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:bg-white/[0.07]"
              />

              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                @click="
                  showConfirmPassword = !showConfirmPassword
                "
              >
                <EyeOff
                  v-if="showConfirmPassword"
                  :size="16"
                />

                <Eye
                  v-else
                  :size="16"
                />
              </button>

            </div>

          </div>

          <!-- Error -->
          <div
            v-if="passwordError"
            class="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5"
          >

            <AlertTriangle
              :size="15"
              class="mt-0.5 shrink-0 text-amber-400"
            />

            <p class="text-xs text-amber-300">
              {{ passwordError }}
            </p>

          </div>

          <!-- Success -->
          <div
            v-if="passwordMessage"
            class="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5"
          >

            <CheckCircle2
              :size="15"
              class="mt-0.5 shrink-0 text-emerald-400"
            />

            <p class="text-xs text-emerald-300">
              {{ passwordMessage }}
            </p>

          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-1">

            <button
              type="submit"
              class="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-500"
            >
              Update Password
            </button>

            <button
              type="button"
              class="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              @click="clearPasswordForm"
            >
              Cancel
            </button>

          </div>

        </form>

      </section>

      <!-- Security tips -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
      >

        <h2 class="text-sm font-bold text-white">
          Security Tips
        </h2>

        <div class="mt-4 space-y-3">

          <div class="flex items-start gap-3">
            <CheckCircle2
              :size="16"
              class="mt-0.5 shrink-0 text-emerald-400"
            />

            <p class="text-xs leading-relaxed text-slate-400">
              Use a strong password with a combination of
              letters, numbers and special characters.
            </p>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle2
              :size="16"
              class="mt-0.5 shrink-0 text-emerald-400"
            />

            <p class="text-xs leading-relaxed text-slate-400">
              Never share your security PIN or account password
              with another person.
            </p>
          </div>

          <div class="flex items-start gap-3">
            <CheckCircle2
              :size="16"
              class="mt-0.5 shrink-0 text-emerald-400"
            />

            <p class="text-xs leading-relaxed text-slate-400">
              Always log out when using a shared or public device.
            </p>
          </div>

        </div>

      </section>

      <!-- Logout -->
      <section
        class="flex items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5"
      >

        <div>
          <h2 class="text-sm font-bold text-white">
            Sign Out
          </h2>

          <p class="mt-1 text-xs text-slate-500">
            End your current personnel session.
          </p>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/15"
          @click="logout"
        >
          <LogOut :size="15" />
          Logout
          <ChevronRight :size="14" />
        </button>

      </section>

    </main>

    <!-- Footer -->
    <footer
      class="border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-600"
    >
      Surakshit AI &nbsp;|&nbsp;
      Personnel Stress &amp; Welfare Monitoring System
    </footer>

  </div>
</template>
```
