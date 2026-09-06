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
} from 'lucide-vue-next'

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  email: '',
  username: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loadAccount = async () => {
  try {
    const response = await $fetch<{
      success: boolean
      user: {
        email: string
        username: string | null
      }
    }>('/api/admin/profile')

    if (response.success) {
      form.email = response.user.email
      form.username = response.user.username || ''
    }
  } catch (error) {
    console.error('Unable to load account:', error)
  }
}

const saveAccount = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!form.email.trim()) {
    errorMessage.value = 'Email is required.'
    return
  }

  if (
    form.newPassword &&
    form.newPassword.length < 8
  ) {
    errorMessage.value = 'New password must be at least 8 characters.'
    return
  }

  if (
    form.newPassword &&
    form.newPassword !== form.confirmPassword
  ) {
    errorMessage.value = 'New password and confirmation do not match.'
    return
  }

  if (form.newPassword && !form.currentPassword) {
    errorMessage.value = 'Current password is required to change your password.'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/admin/account-settings', {
      method: 'PUT',
      body: {
        email: form.email.trim().toLowerCase(),
        username: form.username.trim() || null,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      },
    })

    successMessage.value = 'Account settings updated successfully.'

    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (error: any) {
    console.error('Account settings error:', error)

    errorMessage.value =
      error?.data?.statusMessage ||
      'Unable to update account settings.'
  } finally {
    loading.value = false
  }
}

onMounted(loadAccount)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">

    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-4 py-4 backdrop-blur sm:px-6"
    >
      <div>
        <h1 class="text-xl font-semibold sm:text-2xl">
          Account Settings
        </h1>

        <p class="mt-1 text-sm text-slate-400">
          Manage your administrator account and password
        </p>
      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl p-4 sm:p-6">

      <!-- Success -->
      <div
        v-if="successMessage"
        class="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
      >
        <CheckCircle2 :size="18" class="mt-0.5 shrink-0" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        <AlertCircle :size="18" class="mt-0.5 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Account Information -->
      <section
        class="mb-6 rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div class="border-b border-white/10 p-5 sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
            >
              <User :size="20" />
            </div>

            <div>
              <h2 class="font-semibold">
                Account Information
              </h2>

              <p class="text-sm text-slate-500">
                Update your basic account details
              </p>
            </div>
          </div>
        </div>

        <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

          <!-- Email -->
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-300">
              Email Address
            </label>

            <div class="relative">
              <Mail
                :size="17"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                placeholder="admin@surakshit.ai"
              />
            </div>
          </div>

          <!-- Username -->
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-300">
              Username
            </label>

            <div class="relative">
              <User
                :size="17"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                v-model="form.username"
                type="text"
                autocomplete="username"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                placeholder="admin"
              />
            </div>
          </div>

        </div>
      </section>

      <!-- Password -->
      <section
        class="mb-6 rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div class="border-b border-white/10 p-5 sm:p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"
            >
              <Lock :size="20" />
            </div>

            <div>
              <h2 class="font-semibold">
                Change Password
              </h2>

              <p class="text-sm text-slate-500">
                Leave blank if you don't want to change your password
              </p>
            </div>
          </div>
        </div>

        <div class="space-y-5 p-5 sm:p-6">

          <!-- Current Password -->
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-300">
              Current Password
            </label>

            <div class="relative">
              <input
                v-model="form.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-4 pr-11 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                placeholder="Enter current password"
              />

              <button
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <EyeOff
                  v-if="showCurrentPassword"
                  :size="18"
                />
                <Eye
                  v-else
                  :size="18"
                />
              </button>
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">

            <!-- New Password -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                New Password
              </label>

              <div class="relative">
                <input
                  v-model="form.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-4 pr-11 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                  placeholder="Minimum 8 characters"
                />

                <button
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <EyeOff
                    v-if="showNewPassword"
                    :size="18"
                  />
                  <Eye
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-300">
                Confirm New Password
              </label>

              <div class="relative">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-4 pr-11 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                  placeholder="Confirm new password"
                />

                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <EyeOff
                    v-if="showConfirmPassword"
                    :size="18"
                  />
                  <Eye
                    v-else
                    :size="18"
                  />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Security -->
      <section
        class="mb-6 rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div class="flex items-start gap-4 p-5 sm:p-6">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
          >
            <Shield :size="20" />
          </div>

          <div>
            <h2 class="font-semibold">
              Account Security
            </h2>

            <p class="mt-1 text-sm leading-6 text-slate-500">
              Your administrator account should use a strong,
              unique password. Two-factor authentication can be
              managed from the Security section.
            </p>
          </div>
        </div>
      </section>

      <!-- Save -->
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          @click="loadAccount"
          class="rounded-lg border border-white/10 bg-[#0d1b2d] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Reset
        </button>

        <button
          type="button"
          :disabled="loading"
          @click="saveAccount"
          class="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save :size="17" />
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

    </main>
  </div>
</template>