<script setup lang="ts">
import {
  ClipboardList,
  RefreshCw,
  Search,
} from 'lucide-vue-next'

interface AuditLog {
  id: number
  user: string
  action: string
  resource: string
  ipAddress: string
  createdAt: string
}

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')

const filteredLogs = computed(() => {
  const query = search.value.toLowerCase().trim()

  if (!query) return logs.value

  return logs.value.filter(
    (log) =>
      log.user.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query) ||
      log.ipAddress.toLowerCase().includes(query),
  )
})

const loadLogs = async () => {
  loading.value = true
  error.value = ''

  try {
    // API will be connected later
    // const response = await $fetch<{ logs: AuditLog[] }>(
    //   '/api/admin/security/audit-logs'
    // )
    // logs.value = response.logs

    logs.value = []
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load audit logs'
  } finally {
    loading.value = false
  }
}

onMounted(loadLogs)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Audit Logs</h1>
          <p class="mt-1 text-sm text-slate-400">
            Track important actions and security events across the system
          </p>
        </div>

        <button
          @click="loadLogs"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
          title="Refresh"
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
          placeholder="Search logs..."
          class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
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
          Loading audit logs...
        </div>

        <div
          v-else-if="filteredLogs.length === 0"
          class="p-12 text-center"
        >
          <ClipboardList
            :size="36"
            class="mx-auto text-slate-600"
          />

          <p class="mt-4 text-sm text-slate-400">
            No audit logs available
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">User</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Action</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Resource</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">IP Address</th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">Date</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4 text-sm text-slate-300">
                  {{ log.user }}
                </td>

                <td class="px-5 py-4 text-sm text-emerald-400">
                  {{ log.action }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ log.resource }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ log.ipAddress }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ log.createdAt }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>