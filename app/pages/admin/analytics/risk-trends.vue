<script setup lang="ts">
import {
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-vue-next'

interface RiskData {
  low: number
  moderate: number
  elevated: number
  high: number
}

interface TrendItem {
  id: number
  stressScore: number
  riskLevel: string
  createdAt: string
}

interface RiskTrendsResponse {
  success: boolean
  riskData: RiskData
  trends: TrendItem[]
  totalAssessments: number
}

interface ChartPoint extends TrendItem {
  x: number
  y: number
}

const loading = ref(true)
const error = ref('')

const riskData = ref<RiskData>({
  low: 0,
  moderate: 0,
  elevated: 0,
  high: 0,
})

const trends = ref<TrendItem[]>([])

const loadRiskTrends = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<RiskTrendsResponse>(
      '/api/admin/analytics/risk-trends',
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (!response.success) {
      throw new Error('Failed to load risk trends')
    }

    riskData.value = response.riskData

    trends.value = (response.trends ?? []).map((item) => ({
      id: Number(item.id),
      stressScore: Number(item.stressScore),
      riskLevel: String(item.riskLevel ?? ''),
      createdAt: String(item.createdAt ?? ''),
    }))
  } catch (err) {
    console.error('Risk trends error:', err)
    error.value = 'Unable to load risk trends'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  navigateTo('/admin/dashboard')
}

const chartWidth = 900
const chartHeight = 300

const chartPadding = {
  top: 25,
  right: 25,
  bottom: 45,
  left: 50,
}

const plotWidth =
  chartWidth -
  chartPadding.left -
  chartPadding.right

const plotHeight =
  chartHeight -
  chartPadding.top -
  chartPadding.bottom

const chartPoints = computed<ChartPoint[]>(() => {
  if (trends.value.length === 0) {
    return []
  }

  const sorted = [...trends.value].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  )

  if (sorted.length === 1) {
    const item = sorted[0]

    if (!item) {
      return []
    }

    const score = Math.max(
      0,
      Math.min(10, item.stressScore),
    )

    return [
      {
        ...item,
        x: chartPadding.left + plotWidth / 2,
        y:
          chartPadding.top +
          plotHeight -
          (score / 10) * plotHeight,
      },
    ]
  }

  return sorted.map((item, index) => {
    const x =
      chartPadding.left +
      (index / (sorted.length - 1)) * plotWidth

    const score = Math.max(
      0,
      Math.min(10, item.stressScore),
    )

    const y =
      chartPadding.top +
      plotHeight -
      (score / 10) * plotHeight

    return {
      ...item,
      x,
      y,
    }
  })
})

const chartLine = computed(() => {
  if (chartPoints.value.length === 0) {
    return ''
  }

  return chartPoints.value
    .map((point, index) => {
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
    })
    .join(' ')
})

const formatDate = (value: string): string => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

const riskLabel = (risk: string): string => {
  const value = risk.trim().toLowerCase()

  if (value === 'high') {
    return 'High'
  }

  if (value === 'elevated') {
    return 'Elevated'
  }

  if (value === 'moderate') {
    return 'Moderate'
  }

  return 'Low'
}

onMounted(() => {
  loadRiskTrends()
})
</script>

<template>
  <div class="min-h-screen w-full overflow-x-hidden bg-[#07111f] text-white">

    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-4 py-4 backdrop-blur sm:px-6"
    >
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >

        <!-- Left Section -->
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">

          <!-- Back Button -->
          <button
            type="button"
            @click="goBack"
            class="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"
            title="Back to Dashboard"
          >
            <ArrowLeft :size="18" />

            <span class="hidden sm:inline">
              Back
            </span>
          </button>

          <!-- Page Title -->
          <div class="min-w-0">
            <h1 class="text-xl font-semibold sm:text-2xl">
              Risk Trends
            </h1>

            <p class="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
              Monitor changes in personnel risk levels over time
            </p>
          </div>

        </div>

        <!-- Refresh -->
        <button
          type="button"
          :disabled="loading"
          class="flex w-fit shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          @click="loadRiskTrends"
          title="Refresh"
        >
          <RefreshCw
            :size="18"
            :class="{ 'animate-spin': loading }"
          />
        </button>

      </div>
    </header>

    <main class="w-full p-4 sm:p-6">

      <!-- Error -->
      <div
        v-if="error"
        class="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="w-full rounded-xl border border-white/10 bg-[#0d1b2d] p-8 text-center text-slate-400 sm:p-10"
      >
        Loading risk trends...
      </div>

      <template v-else>

        <!-- Risk Summary -->
        <div
          class="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >

          <!-- Low -->
          <div
            class="min-w-0 rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">
              Low Risk
            </p>

            <p class="mt-3 text-3xl font-semibold text-emerald-400">
              {{ riskData.low }}
            </p>
          </div>

          <!-- Moderate -->
          <div
            class="min-w-0 rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">
              Moderate Risk
            </p>

            <p class="mt-3 text-3xl font-semibold text-yellow-400">
              {{ riskData.moderate }}
            </p>
          </div>

          <!-- Elevated -->
          <div
            class="min-w-0 rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">
              Elevated Risk
            </p>

            <p class="mt-3 text-3xl font-semibold text-orange-400">
              {{ riskData.elevated }}
            </p>
          </div>

          <!-- High -->
          <div
            class="min-w-0 rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
          >
            <p class="text-sm text-slate-400">
              High Risk
            </p>

            <p class="mt-3 text-3xl font-semibold text-red-400">
              {{ riskData.high }}
            </p>
          </div>

        </div>

        <!-- Risk Trend Graph -->
        <div
          class="mt-6 w-full rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-8"
        >

          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >

            <div class="flex items-center gap-3">

              <TrendingUp
                :size="20"
                class="shrink-0 text-emerald-400"
              />

              <div>
                <h2 class="text-base font-semibold sm:text-lg">
                  Risk Trend
                </h2>

                <p class="mt-1 text-xs text-slate-500">
                  Stress score progression across assessments
                </p>
              </div>

            </div>

            <div
              class="flex items-center gap-2 text-xs text-slate-500"
            >
              <span
                class="h-2.5 w-2.5 rounded-full bg-emerald-400"
              ></span>

              Stress Score
            </div>

          </div>

          <!-- Graph -->
          <div
            v-if="chartPoints.length > 0"
            class="mt-6 w-full overflow-x-auto"
          >
            <svg
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              class="h-[260px] min-w-[650px] w-full"
              preserveAspectRatio="none"
            >

              <!-- Grid -->
              <g>
                <line
                  v-for="score in [0, 2, 4, 6, 8, 10]"
                  :key="score"
                  :x1="chartPadding.left"
                  :x2="chartWidth - chartPadding.right"
                  :y1="
                    chartPadding.top +
                    plotHeight -
                    (score / 10) * plotHeight
                  "
                  :y2="
                    chartPadding.top +
                    plotHeight -
                    (score / 10) * plotHeight
                  "
                  stroke="currentColor"
                  class="text-white/5"
                  stroke-width="1"
                />

                <text
                  v-for="score in [0, 2, 4, 6, 8, 10]"
                  :key="`label-${score}`"
                  :x="chartPadding.left - 12"
                  :y="
                    chartPadding.top +
                    plotHeight -
                    (score / 10) * plotHeight +
                    4
                  "
                  text-anchor="end"
                  class="fill-slate-600 text-[11px]"
                >
                  {{ score }}
                </text>
              </g>

              <!-- X Axis -->
              <line
                :x1="chartPadding.left"
                :x2="chartWidth - chartPadding.right"
                :y1="chartPadding.top + plotHeight"
                :y2="chartPadding.top + plotHeight"
                stroke="currentColor"
                class="text-white/10"
                stroke-width="1"
              />

              <!-- Trend Line -->
              <path
                v-if="chartPoints.length > 1"
                :d="chartLine"
                fill="none"
                stroke="currentColor"
                class="text-emerald-400"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Data Points -->
              <g
                v-for="point in chartPoints"
                :key="point.id"
              >
                <circle
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  fill="currentColor"
                  class="text-emerald-400"
                />

                <circle
                  :cx="point.x"
                  :cy="point.y"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  class="text-emerald-400/20"
                >
                  <title>
                    {{ riskLabel(point.riskLevel) }} —
                    {{ point.stressScore.toFixed(2) }}/10 —
                    {{ formatDate(point.createdAt) }}
                  </title>
                </circle>
              </g>

              <!-- Dates -->
              <g v-if="chartPoints.length <= 12">
                <text
                  v-for="point in chartPoints"
                  :key="`date-${point.id}`"
                  :x="point.x"
                  :y="chartHeight - 15"
                  text-anchor="middle"
                  class="fill-slate-600 text-[10px]"
                >
                  {{ formatDate(point.createdAt) }}
                </text>
              </g>

            </svg>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="mt-6 flex min-h-[220px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 px-4"
          >
            <div class="text-center">

              <AlertTriangle
                :size="30"
                class="mx-auto text-slate-600"
              />

              <p class="mt-3 text-sm leading-6 text-slate-500">
                No assessment trend data available yet.
              </p>

            </div>
          </div>

          <!-- Footer -->
          <div
            v-if="chartPoints.length > 0"
            class="mt-4 flex flex-col gap-2 border-t border-white/5 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              {{ chartPoints.length }} assessment{{
                chartPoints.length === 1 ? '' : 's'
              }}
              plotted
            </span>

            <span>
              Stress score scale: 0–10
            </span>
          </div>

        </div>
      </template>
    </main>
  </div>
</template>