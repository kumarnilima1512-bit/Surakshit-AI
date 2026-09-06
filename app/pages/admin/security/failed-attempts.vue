<script setup lang="ts">
import {
  ShieldX,
  RefreshCw,
} from 'lucide-vue-next'

interface FailedAttempt {
  id: number
  identifier: string
  ipAddress: string
  reason: string
  createdAt: string
}

const attempts = ref<FailedAttempt[]>([])
const loading = ref(true)
const error = ref('')

const loadAttempts = async () => {
  loading.value = true
  error.value = ''

  try {
    // API will be connected later
    attempts.value = []
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load failed login attempts'
  } finally {
    loading.value = false
  }
}

onMounted(loadAttempts)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Failed Attempts</h1>
          <p class="mt-1 text-sm text-slate-400">
            Monitor failed authentication attempts and suspicious activity
          </p>
        </div>

        <button
          @click="loadAttempts"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </header>

    <main class="p-6">
      <div
        class="mb-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5"
      >
        <div class="flex items-center gap-3">
          <ShieldX :size="22" class="text-orange-400" />

          <div>
            <h2 class="font-medium text-orange-300">
              Authentication Monitoring
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              Failed authentication events will be displayed here.
            </p>
          </div>
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
          Loading failed attempts...
        </div>

        <div
          v-else-if="attempts.length === 0"
          class="p-12 text-center"
        >
          <ShieldX
            :size="36"
            class="mx-auto text-slate-600"
          />

          <p class="mt-4 text-sm text-slate-400">
            No failed attempts recorded
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Identifier
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  IP Address
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Reason
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Date
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="attempt in attempts"
                :key="attempt.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4 text-sm text-slate-300">
                  {{ attempt.identifier }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ attempt.ipAddress }}
                </td>

                <td class="px-5 py-4 text-sm text-red-400">
                  {{ attempt.reason }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ attempt.createdAt }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>