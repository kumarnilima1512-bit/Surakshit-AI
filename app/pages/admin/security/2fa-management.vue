<script setup lang="ts">
import {
  ShieldCheck,
  RefreshCw,
  Users,
} from 'lucide-vue-next'

interface TwoFAUser {
  id: number
  name: string | null
  email: string
  role: string
  enabled: boolean
}

const users = ref<TwoFAUser[]>([])
const loading = ref(true)
const error = ref('')

const loadUsers = async () => {
  loading.value = true
  error.value = ''

  try {
    // API will be connected later
    users.value = []
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load 2FA information'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">2FA Management</h1>
          <p class="mt-1 text-sm text-slate-400">
            Manage two-factor authentication for system users
          </p>
        </div>

        <button
          @click="loadUsers"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </header>

    <main class="p-6">
      <div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">Protected Users</span>
            <ShieldCheck :size="20" class="text-emerald-400" />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.filter(u => u.enabled).length }}
          </p>
        </div>

        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">Total Users</span>
            <Users :size="20" class="text-blue-400" />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.length }}
          </p>
        </div>
      </div>

      <div
        v-if="error"
        class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <div
        class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div v-if="loading" class="p-10 text-center text-slate-400">
          Loading 2FA information...
        </div>

        <div
          v-else-if="users.length === 0"
          class="p-12 text-center"
        >
          <ShieldCheck
            :size="36"
            class="mx-auto text-slate-600"
          />

          <p class="mt-4 text-sm text-slate-400">
            No 2FA information available
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">User</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Email</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Role</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">2FA Status</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="user in users"
                :key="user.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4 text-sm text-slate-300">
                  {{ user.name || 'Unnamed User' }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ user.email }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ user.role }}
                </td>

                <td class="px-5 py-4">
                  <span
                    class="rounded-full border px-2.5 py-1 text-xs"
                    :class="
                      user.enabled
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                    "
                  >
                    {{ user.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>