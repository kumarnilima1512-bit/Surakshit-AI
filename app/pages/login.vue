```vue
<script setup lang="ts">
const role = ref<'personnel' | 'officer' | 'commander' | 'admin'>('personnel')
const showPassword = ref(false)

const userId = ref('')
const password = ref('')
const twoFactorCode = ref('')

const loginError = ref('')
const isLoading = ref(false)
const requiresTwoFactor = ref(false)

const currentLang = useAppLanguage()
const { t } = useTranslations(currentLang)

const roles = [
  { key: 'personnel', labelKey: 'role_personnel', icon: 'user' },
  { key: 'officer', labelKey: 'role_officer', icon: 'shield' },
  { key: 'commander', labelKey: 'role_commander', icon: 'star' },
  { key: 'admin', labelKey: 'role_admin', icon: 'settings' },
] as const

const handleLogin = async () => {
  loginError.value = ''
  isLoading.value = true

  try {
    /*
     * IMPORTANT:
     * First request:
     *   userId + password
     *
     * If 2FA is enabled, backend returns:
     *   requiresTwoFactor: true
     *
     * Then user enters the 6-digit PIN and clicks
     * Sign In again.
     *
     * Second request:
     *   userId + password + twoFactorCode
     */

    const response = await $fetch<{
      success: boolean
      requiresTwoFactor?: boolean
      message?: string
      user?: {
        id: number
        email: string
        name: string | null
        username: string | null
        role: string
      }
    }>('/api/auth/login', {
      method: 'POST',
      body: {
        userId: userId.value.trim(),
        password: password.value,
        twoFactorCode: twoFactorCode.value.trim() || undefined,
      },
    })

    console.log('LOGIN RESPONSE:', response)

    /*
     * 2FA is enabled for this account.
     * Backend has verified email/username + password,
     * but needs the 6-digit security PIN.
     */
    if (response.requiresTwoFactor) {
      requiresTwoFactor.value = true
      loginError.value = ''
      isLoading.value = false
      return
    }

    /*
     * Normal successful login
     */
    if (response.success && response.user) {
      const userRole = response.user.role

      if (userRole === 'ADMIN') {
        await navigateTo('/admin/dashboard')
      } else if (userRole === 'COMMANDER') {
        await navigateTo('/commander/dashboard')
      } else if (userRole === 'OFFICER') {
        await navigateTo('/officer/dashboard')
      } else {
        await navigateTo('/personnel/dashboard')
      }
    }
  } catch (error: any) {
    console.error('LOGIN ERROR:', error)

    loginError.value =
      error?.data?.message ||
      error?.data?.statusMessage ||
      error?.message ||
      'Invalid User ID or password'

    /*
     * If PIN is wrong, keep the user on the login page
     * and let them try again.
     */
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-900">

    <!-- Background image -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('https://images.unsplash.com/photo-1547483238-2cbf881a559f?q=80&w=2000&auto=format&fit=crop')"
    ></div>

    <div
      class="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-950/90"
    ></div>

    <!-- Top bar -->
    <div class="relative z-50 flex justify-end gap-3 px-6 pt-6">
      <LanguageSwitcher />
      <HelpMenu />
    </div>

    <div
      class="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-7xl flex-col items-center justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center lg:justify-between"
    >

      <!-- LEFT SIDE -->
      <div class="w-full max-w-xl text-white">

        <div class="mb-8 flex flex-wrap gap-8">
          <div
            v-for="force in ['Army', 'Navy', 'Air Force', 'Coast Guard', 'CAPFs']"
            :key="force"
            class="flex flex-col items-center gap-2"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm"
            >
              <svg
                class="h-7 w-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z"
                />
              </svg>
            </div>

            <span class="text-[11px] font-semibold uppercase tracking-wide">
              {{ force }}
            </span>
          </div>
        </div>

        <h1
          class="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
        >
          {{ t('brand_title1') }}
        </h1>

        <h2
          class="mt-1 text-xl font-bold tracking-tight text-amber-300 sm:text-2xl"
        >
          {{ t('brand_title2') }}
        </h2>

        <div class="my-5 flex items-center gap-3 text-amber-300/80">
          <span class="h-px w-16 bg-amber-300/40"></span>

          <svg
            class="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.448c-.783-.57-1.838-.196-1.539.118l1.287-3.957c.3-.922-.755-1.688-1.539-1.118l-3.37 2.448c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z"
            />
          </svg>

          <span class="h-px w-16 bg-amber-300/40"></span>
        </div>

        <p class="text-lg font-medium text-slate-200">
          {{ t('brand_tagline') }}
        </p>

        <div class="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">

          <div class="flex flex-col items-center gap-2 text-center">
            <svg
              class="h-7 w-7 text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>

            <p class="text-xs font-bold uppercase tracking-wide">
              {{ t('feature_secure_title') }}
            </p>

            <p class="text-[11px] text-slate-300">
              {{ t('feature_secure_desc') }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 text-center">
            <svg
              class="h-7 w-7 text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"
              />
            </svg>

            <p class="text-xs font-bold uppercase tracking-wide">
              {{ t('feature_confidential_title') }}
            </p>

            <p class="text-[11px] text-slate-300">
              {{ t('feature_confidential_desc') }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 text-center">
            <svg
              class="h-7 w-7 text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>

            <p class="text-xs font-bold uppercase tracking-wide">
              {{ t('feature_supportive_title') }}
            </p>

            <p class="text-[11px] text-slate-300">
              {{ t('feature_supportive_desc') }}
            </p>
          </div>

          <div class="flex flex-col items-center gap-2 text-center">
            <svg
              class="h-7 w-7 text-slate-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 19V6l7 7-7 6zM4 5v14"
              />
            </svg>

            <p class="text-xs font-bold uppercase tracking-wide">
              {{ t('feature_data_title') }}
            </p>

            <p class="text-[11px] text-slate-300">
              {{ t('feature_data_desc') }}
            </p>
          </div>

        </div>

        <div
          class="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm"
        >
          <svg
            class="mt-0.5 h-5 w-5 shrink-0 text-amber-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"
            />
          </svg>

          <p class="text-sm text-slate-200">
            {{ t('brand_quote') }}
          </p>
        </div>

      </div>

      <!-- RIGHT SIDE LOGIN CARD -->
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

        <div class="flex flex-col items-center">

          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900"
          >
            <svg
              class="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>

          <h2 class="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            {{ t('login_title') }}
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            {{ t('login_subtitle') }}
          </p>

          <div class="mt-4 flex items-center gap-3 text-amber-500">
            <span class="h-px w-24 bg-slate-200"></span>

            <svg
              class="h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.448c-.783-.57-1.838-.196-1.539.118l1.287-3.957c.3-.922-.755-1.688-1.539-1.118l-3.37 2.448c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z"
              />
            </svg>

            <span class="h-px w-24 bg-slate-200"></span>
          </div>

        </div>

        <!-- Role tabs -->
        <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="r in roles"
            :key="r.key"
            type="button"
            @click="role = r.key"
            class="flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors"
            :class="
              role === r.key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            "
          >
            <svg
              v-if="r.icon === 'user'"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>

            <svg
              v-else-if="r.icon === 'shield'"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"
              />
            </svg>

            <svg
              v-else-if="r.icon === 'star'"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.448c-.783-.57-1.838-.196-1.539-1.118l1.287-3.957c.3-.922-.755-1.688-1.539-1.118l-3.37-2.448c-.783-.57-1.838.196-1.539 1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z"
              />
            </svg>

            <svg
              v-else
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-1.543.826-2.37-2.37a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            {{ t(r.labelKey) }}
          </button>
        </div>

        <!-- Inputs -->
        <div class="mt-6 space-y-4">

          <!-- User ID -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400"
          >
            <svg
              class="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>

            <input
              v-model="userId"
              type="text"
              autocomplete="username"
              :placeholder="t('placeholder_userid')"
              class="w-full text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          <!-- Password -->
          <div
            class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400"
          >
            <svg
              class="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>

            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              :placeholder="t('placeholder_password')"
              class="w-full text-sm text-slate-800 placeholder-slate-400 outline-none"
              @keyup.enter="handleLogin"
            />

            <button
              type="button"
              @click="showPassword = !showPassword"
            >
              <svg
                class="h-5 w-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"
                />
              </svg>
            </button>
          </div>

          <!-- 2FA PIN -->
          <div
            class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
            :class="
              requiresTwoFactor
                ? 'border-amber-400 bg-amber-50'
                : 'border-slate-200'
            "
          >
            <svg
              class="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"
              />
            </svg>

            <input
              v-model="twoFactorCode"
              type="text"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="Enter 6-digit security PIN"
              class="w-full text-sm text-slate-800 placeholder-slate-400 outline-none"
              @input="
                twoFactorCode = twoFactorCode
                  .replace(/\D/g, '')
                  .slice(0, 6)
              "
              @keyup.enter="handleLogin"
            />

            <svg
              class="h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3.75 4.5h4.5v4.5h-4.5v-4.5zM15.75 4.5h4.5v4.5h-4.5v-4.5zM3.75 15h4.5v4.5h-4.5V15zM15 15h1.5v1.5H15V15zM18.75 15h1.5v1.5h-1.5V15zM15 18.75h1.5v1.5H15v-1.5zM18.75 18.75h1.5v1.5h-1.5v-1.5z"
              />
            </svg>
          </div>

        </div>

        <!-- 2FA message -->
        <div
          v-if="requiresTwoFactor"
          class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          Two-factor authentication is enabled for this account.
          Enter your 6-digit security PIN to continue.
        </div>

        <!-- Error -->
        <p
          v-if="loginError"
          class="mt-3 text-sm font-medium text-red-600"
        >
          {{ loginError }}
        </p>

        <!-- Remember / Forgot -->
        <div class="mt-4 flex items-center justify-between text-sm">

          <label class="flex items-center gap-2 text-slate-600">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300"
            />

            {{ t('remember_me') }}
          </label>

          <a
            href="#"
            class="font-medium text-blue-600 hover:underline"
          >
            {{ t('forgot_password') }}
          </a>

        </div>

        <!-- Login -->
        <button
          type="button"
          @click="handleLogin"
          :disabled="isLoading"
          class="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 16l4-4m0 0l-4-4m4 4H3m8 5v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1"
            />
          </svg>

          {{
            isLoading
              ? t('signing_in') || '...'
              : requiresTwoFactor
                ? 'Verify & Sign In'
                : t('sign_in')
          }}
        </button>

        <!-- OR -->
        <div
          class="my-5 flex items-center gap-3 text-xs font-medium text-slate-400"
        >
          <span class="h-px flex-1 bg-slate-200"></span>

          {{ t('or') }}

          <span class="h-px flex-1 bg-slate-200"></span>
        </div>

        <!-- Smart Card -->
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 text-sm font-bold uppercase tracking-wide text-slate-700 transition-colors hover:border-slate-400"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>

          {{ t('smart_card') }}
        </button>

        <p class="mt-6 text-center text-sm text-slate-500">
          {{ t('new_user') }}

          <a
            href="#"
            class="font-medium text-blue-600 hover:underline"
          >
            {{ t('contact') }}
          </a>

          {{ t('contact_suffix') }}
        </p>

      </div>
    </div>
  </div>
</template>
```
