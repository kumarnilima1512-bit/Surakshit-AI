<script setup lang="ts">
/*
 * SMART CARD LOGIN PAGE
 * ----------------------
 * Flow:
 *  1. User "inserts" the smart card (simulated here — in a real deployment
 *     this is where you'd call a PKCS#11 / middleware bridge to read the
 *     card automatically). Until then we show a "Detect Card" state.
 *  2. Once detected, the user fills in / confirms the details that were
 *     supposed to come off the card: User ID, Name, Unit.
 *  3. On "Verify & Sign In" we POST to /api/auth/smartcard-login with
 *     those fields (plus optional cardId), same pattern as the password
 *     login page's /api/auth/login call.
 *
 * Wire the card-detection step up to your actual smart card middleware
 * later — for now cardDetected just toggles manually so the UI/UX and
 * the request flow are ready to plug in.
 */

const currentLang = useAppLanguage()
const { t } = useTranslations(currentLang)

const forces = [
  { name: 'Army', logo: '/logos/indian-army-logo.png' },
  { name: 'Navy', logo: '/images/indianNavy.png' },
  { name: 'Air Force', logo: '/logos/air_force-logo.png' },
  { name: 'Coast Guard', logo: '/images/coastGuard.png' },
  { name: 'CAPFs', logo: '/logos/capf-logo.png' },
]

const cardDetected = ref(false)
const isDetecting = ref(false)

const userId = ref('')
const fullName = ref('')
const unit = ref('')
const cardId = ref('')

const loginError = ref('')
const isLoading = ref(false)

// Simulate the "read smart card" step.
// Replace this with an actual call to your card-reader middleware
// (it should resolve userId / fullName / unit / cardId from the chip).
const detectCard = async () => {
  loginError.value = ''
  isDetecting.value = true
  try {
    // Placeholder: pretend the reader took a moment to respond.
    await new Promise((resolve) => setTimeout(resolve, 800))
    cardDetected.value = true
  } catch (error) {
    loginError.value = 'Could not read smart card. Please re-insert and try again.'
  } finally {
    isDetecting.value = false
  }
}

const resetCard = () => {
  cardDetected.value = false
  userId.value = ''
  fullName.value = ''
  unit.value = ''
  cardId.value = ''
  loginError.value = ''
}

const handleSmartCardLogin = async () => {
  loginError.value = ''

  if (!userId.value.trim() || !fullName.value.trim() || !unit.value.trim()) {
    loginError.value = 'Please fill in User ID, Name and Unit to continue.'
    return
  }

  isLoading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message?: string
      user?: {
        id: number
        email: string
        name: string | null
        username: string | null
        role: string
      }
    }>('/api/auth/smartcard-login', {
      method: 'POST',
      body: {
        userId: userId.value.trim(),
        name: fullName.value.trim(),
        unit: unit.value.trim(),
        cardId: cardId.value.trim() || undefined,
      },
    })

    console.log('SMART CARD LOGIN RESPONSE:', response)

    if (response.success && response.user) {
      const userRole = response.user.role

      if (userRole === 'ADMIN') {
        await navigateTo('/admin/dashboard')
      } else if (userRole === 'COMMANDER') {
        await navigateTo('/commander/dashboard')
      } else if (userRole === 'OFFICER') {
        await navigateTo('/welfare/dashboard')
      } else {
        await navigateTo('/personnel/dashboard')
      }
    }
  } catch (error: any) {
    console.error('SMART CARD LOGIN ERROR:', error)
    loginError.value =
      error?.data?.message ||
      error?.data?.statusMessage ||
      error?.message ||
      'Smart card verification failed. Please check the details and try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden bg-slate-950">

    <!-- Background image -->
    <div
      class="absolute inset-0 bg-cover bg-center"
      style="background-image: url('/images/loginbg.png')"
      aria-hidden="true"
    ></div>

    <div class="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/95"></div>

    <!-- Top bar -->
    <div class="relative z-50 flex justify-end gap-2 px-4 pt-4 sm:gap-3 sm:px-6 sm:pt-6">
      <LanguageSwitcher />
      <HelpMenu />
    </div>

    <div
      class="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col items-center justify-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-10 lg:min-h-[calc(100vh-88px)] lg:flex-row lg:items-center lg:justify-between"
    >

      <!-- LEFT SIDE -->
      <div class="w-full max-w-xl text-white">

        <div class="mb-6 flex flex-wrap justify-center gap-4 sm:mb-8 sm:justify-start sm:gap-8">
          <div
            v-for="force in forces"
            :key="force.name"
            class="flex flex-col items-center gap-2"
          >
            <div
              class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 backdrop-blur-sm sm:h-14 sm:w-14"
            >
              <img
                :src="force.logo"
                :alt="`${force.name} logo`"
                class="h-full w-full object-contain"
                :class="
                  force.name === 'Coast Guard'
                    ? 'scale-90 p-0'
                    : force.name === 'Air Force'
                      ? 'scale-150 p-0.5'
                      : 'p-1.5'
                "
              />
            </div>

            <span class="text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
              {{ force.name }}
            </span>
          </div>
        </div>

        <h1
          class="text-center text-2xl font-extrabold leading-tight tracking-tight sm:text-left sm:text-3xl md:text-4xl lg:text-5xl"
        >
          {{ t('brand_title1') }}
        </h1>

        <h2
          class="mt-1 text-center text-lg font-bold tracking-tight text-amber-300 sm:text-left sm:text-xl md:text-2xl"
        >
          {{ t('brand_title2') }}
        </h2>

        <div class="my-4 flex items-center justify-center gap-3 text-amber-300/80 sm:my-5 sm:justify-start">
          <span class="h-px w-12 bg-amber-300/40 sm:w-16"></span>
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.448c-.783-.57-1.838-.196-1.539.118l1.287-3.957c.3-.922-.755-1.688-1.539-1.118l-3.37 2.448c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z"
            />
          </svg>
          <span class="h-px w-12 bg-amber-300/40 sm:w-16"></span>
        </div>

        <p class="text-center text-base font-medium text-slate-200 sm:text-left sm:text-lg">
          {{ t('brand_tagline') }}
        </p>

        <div
          class="mt-8 hidden items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-sm sm:flex"
        >
          <svg class="mt-0.5 h-5 w-5 shrink-0 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3.75 4.5h4.5v4.5h-4.5v-4.5zM15.75 4.5h4.5v4.5h-4.5v-4.5zM3.75 15h4.5v4.5h-4.5V15zM15 15h1.5v1.5H15V15zM18.75 15h1.5v1.5h-1.5V15zM15 18.75h1.5v1.5H15v-1.5zM18.75 18.75h1.5v1.5h-1.5v-1.5z"
            />
          </svg>
          <p class="text-sm text-slate-200">
            Insert your CAC / Smart Card into the reader, then confirm your details on the right to continue.
          </p>
        </div>

      </div>

      <!-- RIGHT SIDE SMART CARD LOGIN CARD -->
      <div class="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-8">

        <div class="flex flex-col items-center">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 sm:h-16 sm:w-16">
            <svg class="h-7 w-7 text-white sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h2 class="mt-4 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Smart Card Sign In
          </h2>

          <p class="mt-1 text-center text-sm text-slate-500">
            Verify your identity using your issued Smart Card / CAC.
          </p>

          <div class="mt-4 flex items-center gap-3 text-amber-500">
            <span class="h-px w-16 bg-slate-200 sm:w-24"></span>
            <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.957c.3.922-.755 1.688-1.539 1.118l-3.37-2.448c-.783-.57-1.838-.196-1.539.118l1.287-3.957c.3-.922-.755-1.688-1.539-1.118l-3.37 2.448c-.783.57-1.838-.196-1.539-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.285-3.958z"
              />
            </svg>
            <span class="h-px w-16 bg-slate-200 sm:w-24"></span>
          </div>
        </div>

        <!-- STEP 1: Card not yet detected -->
        <div v-if="!cardDetected" class="mt-6 flex flex-col items-center gap-4">

          <div
            class="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500"
          >
            <svg
              class="h-8 w-8"
              :class="isDetecting ? 'animate-pulse text-amber-500' : 'text-slate-400'"
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
            <p class="text-xs font-medium">
              {{ isDetecting ? 'Reading smart card…' : 'Insert your smart card to begin' }}
            </p>
          </div>

          <button
            type="button"
            @click="detectCard"
            :disabled="isDetecting"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isDetecting ? 'Detecting…' : 'Detect Smart Card' }}
          </button>
        </div>

        <!-- STEP 2: Card detected - confirm / enter details -->
        <div v-else class="mt-6 space-y-4">

          <div class="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Smart card detected. Please confirm your details.
          </div>

          <!-- User ID -->
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400">
            <svg class="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              placeholder="User ID"
              class="w-full min-w-0 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          <!-- Name -->
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400">
            <svg class="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975M15 6.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <input
              v-model="fullName"
              type="text"
              autocomplete="name"
              placeholder="Full Name"
              class="w-full min-w-0 text-sm text-slate-800 placeholder-slate-400 outline-none"
            />
          </div>

          <!-- Unit -->
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400">
            <svg class="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M2.25 21h19.5M3 21V8.25l6.75-3.75L16.5 8.25V21M9.75 21v-6h4.5v6M16.5 8.25L21 6v15"
              />
            </svg>
            <input
              v-model="unit"
              type="text"
              placeholder="Unit"
              class="w-full min-w-0 text-sm text-slate-800 placeholder-slate-400 outline-none"
              @keyup.enter="handleSmartCardLogin"
            />
          </div>

          <!-- Card ID (optional, auto from chip in real integration) -->
          <div class="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 focus-within:border-slate-400">
            <svg class="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              v-model="cardId"
              type="text"
              placeholder="Card ID (optional)"
              class="w-full min-w-0 text-sm text-slate-800 placeholder-slate-400 outline-none"
              @keyup.enter="handleSmartCardLogin"
            />
          </div>

          <!-- Error -->
          <p v-if="loginError" class="text-sm font-medium text-red-600">
            {{ loginError }}
          </p>

          <!-- Verify & Sign In -->
          <button
            type="button"
            @click="handleSmartCardLogin"
            :disabled="isLoading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 16l4-4m0 0l-4-4m4 4H3m8 5v1a3 3 0 003 3h4a3 3 0 003-3V7a3 3 0 00-3-3h-4a3 3 0 00-3 3v1"
              />
            </svg>
            {{ isLoading ? 'Verifying…' : 'Verify & Sign In' }}
          </button>

          <!-- Use a different card -->
          <button
            type="button"
            @click="resetCard"
            class="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
          >
            Use a different card
          </button>
        </div>

        <!-- Back to password login -->
        <p class="mt-6 text-center text-sm text-slate-500">
          <NuxtLink to="/login" class="font-medium text-blue-600 hover:underline">
            ← Back to password sign in
          </NuxtLink>
        </p>

      </div>
    </div>
  </div>
</template>