<script setup lang="ts">
import { ArrowLeft, Save, Loader2, UserRound } from 'lucide-vue-next'

interface UserData {
  id: number
  email: string
  username: string | null
  name: string | null
  role: 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'
}

const route = useRoute()

const userId = Number(route.params.id)

const user = ref<UserData | null>(null)

const name = ref('')
const email = ref('')
const username = ref('')
const password = ref('')
const role = ref<UserData['role']>('PERSONNEL')

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const loadUser = async () => {
  loading.value = true
  error.value = ''

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user ID')
    }

    const response = await $fetch<{
      success: boolean
      user: UserData
    }>(`/api/admin/users/${userId}`)

    user.value = response.user

    name.value = response.user.name || ''
    email.value = response.user.email || ''
    username.value = response.user.username || ''
    role.value = response.user.role
  } catch (err) {
    console.error('Failed to load user:', err)
    error.value = 'Unable to load user details.'
  } finally {
    loading.value = false
  }
}

const updateUser = async () => {
  error.value = ''
  success.value = ''

  if (!name.value.trim()) {
    error.value = 'Name is required.'
    return
  }

  if (!email.value.trim()) {
    error.value = 'Email is required.'
    return
  }

  saving.value = true

  try {
    await $fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        username: username.value.trim(),
        role: role.value,
        ...(password.value.trim()
          ? {
              password: password.value.trim(),
            }
          : {}),
      },
    })

    success.value = 'User updated successfully.'

    password.value = ''

    setTimeout(() => {
      navigateTo('/admin/users/all-users')
    }, 700)
  } catch (err: any) {
    console.error('Update user failed:', err)

    error.value =
      err?.data?.statusMessage ||
      err?.data?.message ||
      'Unable to update user.'
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  navigateTo('/admin/users/all-users')
}

onMounted(loadUser)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-4 py-4 backdrop-blur sm:px-6"
    >
      <div class="mx-auto max-w-3xl">
        <!-- Back Arrow -->
        <button
          type="button"
          @click="goBack"
          aria-label="Back to All Users"
          title="Back"
          class="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#07111f] text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft :size="19" />
        </button>

        <h1 class="text-xl font-semibold sm:text-2xl">
          Edit User
        </h1>

        <p class="mt-1 text-xs text-slate-400 sm:text-sm">
          Update user information and access role
        </p>
      </div>
    </header>

    <main class="px-4 py-5 sm:p-6">
      <!-- Loading -->
      <div
        v-if="loading"
        class="mx-auto max-w-3xl rounded-xl border border-white/10 bg-[#0d1b2d] p-8 text-center text-sm text-slate-400 sm:p-10"
      >
        Loading user details...
      </div>

      <!-- Error while loading -->
      <div
        v-else-if="!user"
        class="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-center sm:p-6"
      >
        <p class="text-sm text-red-400">
          {{ error || 'User not found.' }}
        </p>

        <button
          type="button"
          @click="goBack"
          class="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/15"
        >
          Return to All Users
        </button>
      </div>

      <!-- Edit Form -->
      <div
        v-else
        class="mx-auto max-w-3xl"
      >
        <div
          class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
        >
          <!-- Form Header -->
          <div
            class="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5"
          >
            <div class="flex items-center gap-3 sm:gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 sm:h-12 sm:w-12"
              >
                <UserRound :size="20" class="sm:hidden" />
                <UserRound :size="23" class="hidden sm:block" />
              </div>

              <div class="min-w-0">
                <h2
                  class="truncate font-semibold text-slate-200"
                >
                  {{ user.name || user.username || user.email }}
                </h2>

                <p class="mt-1 text-xs text-slate-500">
                  User ID #{{ user.id }}
                </p>
              </div>
            </div>
          </div>

          <form
            @submit.prevent="updateUser"
            class="space-y-5 p-4 sm:space-y-6 sm:p-6"
          >
            <!-- Name -->
            <div>
              <label
                for="name"
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Full Name
              </label>

              <input
                id="name"
                v-model="name"
                type="text"
                placeholder="Enter full name"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 sm:px-4"
              />
            </div>

            <!-- Email -->
            <div>
              <label
                for="email"
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Enter email address"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 sm:px-4"
              />
            </div>

            <!-- Username -->
            <div>
              <label
                for="username"
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Username
              </label>

              <input
                id="username"
                v-model="username"
                type="text"
                placeholder="Enter username"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 sm:px-4"
              />
            </div>

            <!-- Role -->
            <div>
              <label
                for="role"
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                Role
              </label>

              <select
                id="role"
                v-model="role"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3.5 py-3 text-sm text-slate-300 outline-none transition focus:border-emerald-500/50 sm:px-4"
              >
                <option value="ADMIN">
                  Admin
                </option>

                <option value="COMMANDER">
                  Commander
                </option>

                <option value="OFFICER">
                  Officer
                </option>

                <option value="PERSONNEL">
                  Personnel
                </option>
              </select>
            </div>

            <!-- Password -->
            <div>
              <label
                for="password"
                class="mb-2 block text-sm font-medium text-slate-300"
              >
                New Password
              </label>

              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Leave blank to keep current password"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-500/50 sm:px-4"
              />

              <p class="mt-2 text-xs leading-5 text-slate-500">
                Leave this field empty to keep the current password.
              </p>
            </div>

            <!-- Error -->
            <div
              v-if="error"
              class="rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 sm:p-4"
            >
              {{ error }}
            </div>

            <!-- Success -->
            <div
              v-if="success"
              class="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-400 sm:p-4"
            >
              {{ success }}
            </div>

            <!-- Actions -->
            <div
              class="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end sm:pt-6"
            >
              <button
                type="button"
                @click="goBack"
                :disabled="saving"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="submit"
                :disabled="saving"
                class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Loader2
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
          </form>
        </div>
      </div>
    </main>
  </div>
</template>