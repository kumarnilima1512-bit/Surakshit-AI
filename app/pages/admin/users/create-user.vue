<script setup lang="ts">
import {
  ArrowLeft,
  UserPlus,
  Mail,
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'

const form = reactive({
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'PERSONNEL',
})

const loading = ref(false)
const success = ref('')
const error = ref('')

const goBack = () => {
  navigateTo('/admin/users/all-users')
}

const createUser = async () => {
  success.value = ''
  error.value = ''

  if (!form.email || !form.password || !form.role) {
    error.value = 'Email, password and role are required'
    return
  }

  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }

  loading.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message: string
      user: {
        id: number
        email: string
        username: string | null
        name: string | null
        role: string
      }
    }>('/api/admin/users', {
      method: 'POST',
      body: {
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
        role: form.role,
      },
    })

    success.value = response.message

    form.name = ''
    form.email = ''
    form.username = ''
    form.password = ''
    form.role = 'PERSONNEL'
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.statusMessage ||
      err?.data?.message ||
      'Unable to create user'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Back"
        >
          <ArrowLeft :size="20" />
        </button>

        <div>
          <h1 class="text-2xl font-semibold">Create User</h1>
          <p class="mt-1 text-sm text-slate-400">
            Create a new user account and assign an access role
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl p-6">
      <!-- Success -->
      <div
        v-if="success"
        class="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
      >
        <CheckCircle :size="19" />
        {{ success }}
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        <AlertCircle :size="19" />
        {{ error }}
      </div>

      <!-- Form -->
      <div
        class="rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div class="border-b border-white/10 p-6">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
            >
              <UserPlus :size="20" />
            </div>

            <div>
              <h2 class="font-semibold">User Information</h2>
              <p class="text-sm text-slate-500">
                Enter the details for the new account
              </p>
            </div>
          </div>
        </div>

        <form @submit.prevent="createUser" class="space-y-6 p-6">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <!-- Name -->
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Full Name
              </label>

              <div class="relative">
                <User
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Enter full name"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <!-- Username -->
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Username
              </label>

              <div class="relative">
                <User
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  v-model="form.username"
                  type="text"
                  placeholder="Enter username"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Email <span class="text-red-400">*</span>
              </label>

              <div class="relative">
                <Mail
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="user@surakshit.ai"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Password <span class="text-red-400">*</span>
              </label>

              <div class="relative">
                <Lock
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  v-model="form.password"
                  type="password"
                  required
                  minlength="8"
                  placeholder="Minimum 8 characters"
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <!-- Role -->
            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-400">
                Access Role <span class="text-red-400">*</span>
              </label>

              <div class="relative">
                <Shield
                  :size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <select
                  v-model="form.role"
                  class="w-full appearance-none rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
                >
                  <option value="PERSONNEL">Personnel</option>
                  <option value="OFFICER">Officer</option>
                  <option value="COMMANDER">Commander</option>
                </select>
              </div>

              <p class="mt-2 text-xs text-slate-600">
                Administrator accounts cannot be created from this page.
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div
            class="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              @click="goBack"
              class="rounded-lg border border-white/10 bg-[#07111f] px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              :disabled="loading"
              class="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlus :size="18" />

              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>