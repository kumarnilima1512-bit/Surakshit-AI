<script setup lang="ts">
import {
  LogIn,
  RefreshCw,
  Search,
} from 'lucide-vue-next'

interface LoginRecord {
  id: number
  user: string
  ipAddress: string
  device: string
  status: string
  createdAt: string
}

const history = ref<LoginRecord[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')

const filteredHistory = computed(() => {
  const query = search.value.toLowerCase().trim()

  if (!query) return history.value

  return history.value.filter(
    (item) =>
      item.user.toLowerCase().includes(query) ||
      item.ipAddress.toLowerCase().includes(query) ||
      item.device.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query),
  )
})

const loadHistory = async () => {
  loading.value = true
  error.value = ''

  try {
    // API will be connected later
    history.value = []
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load login history'
  } finally {
    loading.value = false
  }
}

onMounted(loadHistory)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Login History</h1>
          <p class="mt-1 text-sm text-slate-400">
            Review successful and unsuccessful login activity
          </p>
        </div>

        <button
          @click="loadHistory"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </header>

    <main class="p-6">
      <div
        class="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-[#0d1b2d] p-4"
      >
        <Search :size="18" class="text-slate-500" />

        <input
          v-model="search"
          type="text"
          placeholder="Search login history..."
          class="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
        />
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
          Loading login history...
        </div>

        <div
          v-else-if="filteredHistory.length === 0"
          class="p-12 text-center"
        >
          <LogIn :size="36" class="mx-auto text-slate-600" />

          <p class="mt-4 text-sm text-slate-400">
            No login history available
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">User</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">IP Address</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Device</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Status</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Date</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="item in filteredHistory"
                :key="item.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4 text-sm text-slate-300">
                  {{ item.user }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ item.ipAddress }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ item.device }}
                </td>

                <td class="px-5 py-4">
                  <span
                    class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400"
                  >
                    {{ item.status }}
                  </span>
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ item.createdAt }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>