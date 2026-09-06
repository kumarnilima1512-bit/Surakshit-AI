<script setup lang="ts">
import {
  Activity,
  Users,
  Brain,
  ShieldAlert,
  RefreshCw,
} from 'lucide-vue-next'

const loading = ref(true)
const error = ref('')

const analytics = ref({
  totalUsers: 0,
  assessments: 0,
  avgStress: 0,
  highRisk: 0,
})

const loadAnalytics = async () => {
  loading.value = true
  error.value = ''

  try {
    // Connect to analytics API here later
    // const response = await $fetch('/api/admin/analytics/system')
    // analytics.value = response

    analytics.value = {
      totalUsers: 0,
      assessments: 0,
      avgStress: 0,
      highRisk: 0,
    }
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load system analytics'
  } finally {
    loading.value = false
  }
}

onMounted(loadAnalytics)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">System Analytics</h1>
          <p class="mt-1 text-sm text-slate-400">
            Monitor overall system activity and personnel analytics
          </p>
        </div>

        <button
          @click="loadAnalytics"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
          title="Refresh"
        >
          <RefreshCw :size="18" />
        </button>
      </div>
    </header>

    <main class="p-6">
      <div
        v-if="error"
        class="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <div
        v-if="loading"
        class="rounded-xl border border-white/10 bg-[#0d1b2d] p-10 text-center text-slate-400"
      >
        Loading system analytics...
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Total Users</span>
              <Users :size="20" class="text-emerald-400" />
            </div>
            <p class="mt-3 text-3xl font-semibold">
              {{ analytics.totalUsers }}
            </p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Assessments</span>
              <Brain :size="20" class="text-blue-400" />
            </div>
            <p class="mt-3 text-3xl font-semibold">
              {{ analytics.assessments }}
            </p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">Average Stress</span>
              <Activity :size="20" class="text-purple-400" />
            </div>
            <p class="mt-3 text-3xl font-semibold">
              {{ analytics.avgStress.toFixed(1) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Out of 10</p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm text-slate-400">High Risk</span>
              <ShieldAlert :size="20" class="text-red-400" />
            </div>
            <p class="mt-3 text-3xl font-semibold">
              {{ analytics.highRisk }}
            </p>
          </div>
        </div>

        <div
          class="mt-6 rounded-xl border border-white/10 bg-[#0d1b2d] p-8"
        >
          <h2 class="text-lg font-semibold">System Overview</h2>
          <p class="mt-2 text-sm text-slate-500">
            Analytics will appear here once assessment data is available.
          </p>
        </div>
      </template>
    </main>
  </div>
</template>