<script setup lang="ts">
import {
  User,
  Mail,
  ShieldCheck,
  Calendar,
  Edit,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-vue-next'

interface PersonnelProfile {
  id: number
  name: string | null
  email: string
  username: string | null
  role: string
  profilePicture: string | null
  createdAt: string
  updatedAt: string
}

interface ProfileResponse {
  success: boolean
  profile: PersonnelProfile
}

const {
  data,
  pending: loading,
  error,
  refresh,
} = await useFetch<ProfileResponse>('/api/personnel/profile')

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

const displayName = computed(() => {
  return data.value?.profile.name || 'Personnel'
})

const initials = computed(() => {
  const name = data.value?.profile.name?.trim()

  if (!name) return 'P'

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
})
</script>

<template>
  <div class="min-h-screen bg-[#0b1220] text-slate-100">
    <!-- Header -->
    <header class="border-b border-white/5 bg-[#0d1526]">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <div class="flex items-center gap-2">
            <ShieldCheck
              :size="20"
              :stroke-width="1.5"
              class="text-blue-400"
            />
            <h1 class="text-lg font-bold text-white">My Profile</h1>
          </div>


      <p class="mt-1 text-xs text-slate-500">
        View and manage your personnel account information
      </p>
    </div>

    <NuxtLink
      to="/personnel/dashboard"
      class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft :size="15" />
      Dashboard
    </NuxtLink>
  </div>
</header>

<main class="mx-auto max-w-6xl space-y-5 px-6 py-6">
  <!-- Loading -->
  <div
    v-if="loading"
    class="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526]"
  >
    <div class="flex flex-col items-center gap-3 text-slate-400">
      <Loader2 :size="26" class="animate-spin" />
      <p class="text-sm">Loading your profile...</p>
    </div>
  </div>

  <!-- Error -->
  <div
    v-else-if="error"
    class="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 text-center"
  >
    <AlertTriangle
      :size="30"
      :stroke-width="1.5"
      class="text-red-400"
    />

    <h2 class="mt-3 text-sm font-bold text-red-300">
      Couldn't load your profile
    </h2>

    <p class="mt-2 max-w-md text-xs leading-relaxed text-slate-400">
      {{ error.message }}
    </p>

    <button
      type="button"
      class="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
      @click="refresh()"
    >
      <RefreshCw :size="14" />
      Retry
    </button>
  </div>

  <!-- Profile -->
  <template v-else-if="data?.profile">
    <!-- Profile hero -->
    <section
      class="overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526]"
    >
      <div class="h-28 bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950" />

      <div class="px-6 pb-6">
        <div class="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div class="flex items-end gap-4">
            <!-- Avatar -->
            <div
              class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#0d1526] bg-slate-700 text-2xl font-bold text-slate-200 shadow-lg"
            >
              <img
                v-if="data.profile.profilePicture"
                :src="data.profile.profilePicture"
                :alt="displayName"
                class="h-full w-full object-cover"
              >

              <span v-else>
                {{ initials }}
              </span>
            </div>

            <div class="pb-1">
              <h2 class="text-xl font-extrabold text-white">
                {{ displayName }}
              </h2>

              <p class="mt-1 text-sm text-slate-400">
                {{ data.profile.username ? `@${data.profile.username}` : 'Personnel Account' }}
              </p>
            </div>
          </div>

          <NuxtLink
            to="/personnel/profile/edit"
            class="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
          >
            <Edit :size="15" />
            Edit Profile
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Account information -->
    <section
      class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
        >
          <User :size="18" :stroke-width="1.5" />
        </div>

        <div>
          <h2 class="text-sm font-bold text-white">
            Account Information
          </h2>

          <p class="text-[11px] text-slate-500">
            Your registered personnel account details
          </p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Full Name -->
        <div
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <p class="text-[11px] font-medium text-slate-500">
            Full Name
          </p>

          <p class="mt-2 text-sm font-semibold text-slate-200">
            {{ data.profile.name || 'Not provided' }}
          </p>
        </div>

        <!-- Username -->
        <div
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <p class="text-[11px] font-medium text-slate-500">
            Username
          </p>

          <p class="mt-2 text-sm font-semibold text-slate-200">
            {{ data.profile.username || 'Not provided' }}
          </p>
        </div>

        <!-- Email -->
        <div
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div class="flex items-center gap-2">
            <Mail :size="14" class="text-slate-500" />

            <p class="text-[11px] font-medium text-slate-500">
              Email Address
            </p>
          </div>

          <p class="mt-2 break-all text-sm font-semibold text-slate-200">
            {{ data.profile.email }}
          </p>
        </div>

        <!-- Role -->
        <div
          class="rounded-xl border border-white/5 bg-white/[0.02] p-4"
        >
          <div class="flex items-center gap-2">
            <ShieldCheck :size="14" class="text-slate-500" />

            <p class="text-[11px] font-medium text-slate-500">
              Account Role
            </p>
          </div>

          <p class="mt-2">
            <span
              class="inline-flex rounded-md bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-400"
            >
              {{ data.profile.role }}
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- Account activity -->
    <section
      class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400"
        >
          <Calendar :size="18" :stroke-width="1.5" />
        </div>

        <div>
          <h2 class="text-sm font-bold text-white">
            Account Activity
          </h2>

          <p class="text-[11px] text-slate-500">
            Important account dates
          </p>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-white/5 p-4">
          <p class="text-[11px] font-medium text-slate-500">
            Account Created
          </p>

          <p class="mt-2 text-sm font-semibold text-slate-200">
            {{ formatDate(data.profile.createdAt) }}
          </p>
        </div>

        <div class="rounded-xl border border-white/5 p-4">
          <p class="text-[11px] font-medium text-slate-500">
            Last Updated
          </p>

          <p class="mt-2 text-sm font-semibold text-slate-200">
            {{ formatDate(data.profile.updatedAt) }}
          </p>
        </div>
      </div>
    </section>

    <!-- Security shortcut -->
    <section
      class="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#0d1526] p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400"
        >
          <ShieldCheck :size="18" :stroke-width="1.5" />
        </div>

        <div>
          <p class="text-sm font-bold text-white">
            Account Security
          </p>

          <p class="text-[11px] text-slate-500">
            Manage password and security settings
          </p>
        </div>
      </div>

      <NuxtLink
        to="/personnel/security"
        class="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        Security Settings
      </NuxtLink>
    </section>
  </template>
</main>

<footer
  class="border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-500"
>
  Surakshit AI &nbsp;|&nbsp; Personnel Stress &amp; Welfare Monitoring System
</footer>
```

  </div>
</template>