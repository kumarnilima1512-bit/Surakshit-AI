<script setup lang="ts">
import {
  User,
  Mail,
  Image,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
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
  error: fetchError,
} = await useFetch<ProfileResponse>('/api/personnel/profile')

const name = ref('')
const username = ref('')
const profilePicture = ref('')

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

watch(
  () => data.value?.profile,
  (profile) => {
    if (!profile) return

    name.value = profile.name ?? ''
    username.value = profile.username ?? ''
    profilePicture.value = profile.profilePicture ?? ''
  },
  { immediate: true },
)

async function saveProfile() {
  saveError.value = ''
  saveSuccess.value = ''

  const cleanName = name.value.trim()
  const cleanUsername = username.value.trim()
  const cleanPicture = profilePicture.value.trim()

  if (!cleanName) {
    saveError.value = 'Name is required.'
    return
  }

  if (!cleanUsername) {
    saveError.value = 'Username is required.'
    return
  }

  saving.value = true

  try {
    await $fetch('/api/personnel/profile', {
      method: 'PATCH',
      body: {
        name: cleanName,
        username: cleanUsername,
        profilePicture: cleanPicture || null,
      },
    })

    saveSuccess.value = 'Profile updated successfully.'

    setTimeout(() => {
      navigateTo('/personnel/profile')
    }, 700)
  } catch (err: any) {
    saveError.value =
      err?.data?.statusMessage ||
      err?.data?.message ||
      'Unable to update your profile.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b1220] text-slate-100">
    <!-- Header -->
    <header class="border-b border-white/5 bg-[#0d1526]">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <div>
          <div class="flex items-center gap-2">
            <User
              :size="20"
              :stroke-width="1.5"
              class="text-blue-400"
            />
            <h1 class="text-lg font-bold text-white">
              Edit Profile
            </h1>
          </div>

```
      <p class="mt-1 text-xs text-slate-500">
        Update your personnel account information
      </p>
    </div>

    <NuxtLink
      to="/personnel/profile"
      class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft :size="15" />
      Back to Profile
    </NuxtLink>
  </div>
</header>

<main class="mx-auto max-w-4xl px-6 py-8">
  <!-- Loading -->
  <div
    v-if="loading"
    class="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526]"
  >
    <div class="flex flex-col items-center gap-3 text-slate-400">
      <Loader2 :size="26" class="animate-spin" />
      <p class="text-sm">Loading profile...</p>
    </div>
  </div>

  <!-- Fetch error -->
  <div
    v-else-if="fetchError"
    class="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 px-6 text-center"
  >
    <AlertTriangle
      :size="30"
      class="text-red-400"
      :stroke-width="1.5"
    />

    <p class="mt-3 text-sm font-semibold text-red-300">
      Couldn't load your profile
    </p>

    <p class="mt-2 text-xs text-slate-400">
      {{ fetchError.message }}
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    class="space-y-5"
    @submit.prevent="saveProfile"
  >
    <!-- Personal information -->
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
            Personal Information
          </h2>

          <p class="text-[11px] text-slate-500">
            Update the information displayed on your profile
          </p>
        </div>
      </div>

      <div class="mt-6 space-y-5">
        <!-- Name -->
        <div>
          <label
            for="name"
            class="mb-2 block text-xs font-semibold text-slate-300"
          >
            Full Name
          </label>

          <div class="relative">
            <User
              :size="16"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="name"
              v-model="name"
              type="text"
              autocomplete="name"
              placeholder="Enter your full name"
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            >
          </div>
        </div>

        <!-- Username -->
        <div>
          <label
            for="username"
            class="mb-2 block text-xs font-semibold text-slate-300"
          >
            Username
          </label>

          <div class="relative">
            <span
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500"
            >
              @
            </span>

            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="Enter your username"
              class="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            >
          </div>
        </div>

        <!-- Email - read only -->
        <div>
          <label
            for="email"
            class="mb-2 block text-xs font-semibold text-slate-300"
          >
            Email Address
          </label>

          <div class="relative">
            <Mail
              :size="16"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="email"
              :value="data?.profile.email ?? ''"
              type="email"
              disabled
              class="w-full cursor-not-allowed rounded-lg border border-white/5 bg-white/[0.02] py-2.5 pl-9 pr-4 text-sm text-slate-500 outline-none"
            >
          </div>

          <p class="mt-1.5 text-[10px] text-slate-600">
            Email address cannot be changed from this page.
          </p>
        </div>

        <!-- Role - read only -->
        <div>
          <label
            class="mb-2 block text-xs font-semibold text-slate-300"
          >
            Account Role
          </label>

          <div
            class="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-slate-500"
          >
            {{ data?.profile.role ?? 'PERSONNEL' }}
          </div>
        </div>
      </div>
    </section>

    <!-- Profile picture -->
    <section
      class="rounded-2xl border border-white/5 bg-[#0d1526] p-6"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400"
        >
          <Image :size="18" :stroke-width="1.5" />
        </div>

        <div>
          <h2 class="text-sm font-bold text-white">
            Profile Picture
          </h2>

          <p class="text-[11px] text-slate-500">
            Add an image URL for your profile picture
          </p>
        </div>
      </div>

      <div class="mt-6">
        <label
          for="profilePicture"
          class="mb-2 block text-xs font-semibold text-slate-300"
        >
          Image URL
        </label>

        <input
          id="profilePicture"
          v-model="profilePicture"
          type="url"
          placeholder="https://example.com/profile.jpg"
          class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
        >

        <!-- Preview -->
        <div
          v-if="profilePicture"
          class="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
        >
          <img
            :src="profilePicture"
            alt="Profile preview"
            class="h-14 w-14 rounded-xl object-cover"
          >

          <div>
            <p class="text-xs font-semibold text-slate-300">
              Image Preview
            </p>

            <p class="mt-1 text-[10px] text-slate-500">
              This image will be used as your profile picture.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Messages -->
    <div
      v-if="saveError"
      class="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4"
    >
      <AlertTriangle
        :size="18"
        class="mt-0.5 shrink-0 text-red-400"
      />

      <p class="text-xs text-red-300">
        {{ saveError }}
      </p>
    </div>

    <div
      v-if="saveSuccess"
      class="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
    >
      <CheckCircle2
        :size="18"
        class="mt-0.5 shrink-0 text-emerald-400"
      />

      <p class="text-xs text-emerald-300">
        {{ saveSuccess }}
      </p>
    </div>

    <!-- Actions -->
    <div
      class="flex flex-col-reverse gap-3 rounded-2xl border border-white/5 bg-[#0d1526] p-5 sm:flex-row sm:justify-end"
    >
      <NuxtLink
        to="/personnel/profile"
        class="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        Cancel
      </NuxtLink>

      <button
        type="submit"
        :disabled="saving"
        class="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Loader2
          v-if="saving"
          :size="15"
          class="animate-spin"
        />

        <Save
          v-else
          :size="15"
        />

        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </form>
</main>

<footer
  class="border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-500"
>
  Surakshit AI &nbsp;|&nbsp; Personnel Stress &amp; Welfare Monitoring System
</footer>
```

  </div>
</template>
