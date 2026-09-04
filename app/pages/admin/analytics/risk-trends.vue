<script setup lang="ts">
import {
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-vue-next'

const loading = ref(true)
const error = ref('')

const riskData = ref({
  low: 0,
  moderate: 0,
  elevated: 0,
  high: 0,
})

const loadRiskTrends = async () => {
  loading.value = true
  error.value = ''

  try {
    // Connect API later
    // const response = await $fetch('/api/admin/analytics/risk-trends')
    // riskData.value = response

    riskData.value = {
      low: 0,
      moderate: 0,
      elevated: 0,
      high: 0,
    }
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load risk trends'
  } finally {
    loading.value = false
  }
}

onMounted(loadRiskTrends)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Risk Trends</h1>
          <p class="mt-1 text-sm text-slate-400">
            Monitor changes in personnel risk levels over time
          </p>
        </div>

        <button
          @click="loadRiskTrends"
          class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
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
        Loading risk trends...
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">Low Risk</p>
            <p class="mt-3 text-3xl font-semibold text-emerald-400">
              {{ riskData.low }}
            </p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">Moderate Risk</p>
            <p class="mt-3 text-3xl font-semibold text-yellow-400">
              {{ riskData.moderate }}
            </p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">Elevated Risk</p>
            <p class="mt-3 text-3xl font-semibold text-orange-400">
              {{ riskData.elevated }}
            </p>
          </div>

          <div
            class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">High Risk</p>
            <p class="mt-3 text-3xl font-semibold text-red-400">
              {{ riskData.high }}
            </p>
          </div>
        </div>

        <div
          class="mt-6 rounded-xl border border-white/10 bg-[#0d1b2d] p-8"
        >
          <div class="flex items-center gap-3">
            <TrendingUp :size="20" class="text-emerald-400" />
            <h2 class="text-lg font-semibold">Risk Trend</h2>
          </div>

          <div
            class="mt-6 flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-white/10"
          >
            <div class="text-center">
              <AlertTriangle
                :size="30"
                class="mx-auto text-slate-600"
              />
              <p class="mt-3 text-sm text-slate-500">
                Risk trend data will appear here.
              </p>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>