```vue
<script setup lang="ts">
const route = useRoute()

const stressScore = computed(() => {
  const value = Number(route.query.score)

  return Number.isFinite(value) ? value : null
})

const riskLevel = computed(() => {
  return typeof route.query.risk === 'string'
    ? route.query.risk
    : null
})

const scorePercentage = computed(() => {
  if (stressScore.value === null) return 0

  return Math.min(Math.max((stressScore.value / 10) * 100, 0), 100)
})

const riskDescription = computed(() => {
  switch (riskLevel.value?.toLowerCase()) {
    case 'low':
      return 'Your current assessment indicates a relatively low level of stress. Continue maintaining healthy routines, adequate recovery and a strong support system.'

    case 'moderate':
      return 'Your assessment indicates a moderate level of stress. Regular monitoring, sufficient recovery and preventive wellbeing measures are recommended.'

    case 'elevated':
      return 'Your assessment indicates elevated stress. Consider taking appropriate rest, recovery and support measures.'

    case 'high':
      return 'Your assessment indicates a high level of stress. Additional support and timely professional assessment are recommended.'

    default:
      return 'No valid assessment result is currently available.'
  }
})

const resultAvailable = computed(() => {
  return stressScore.value !== null && riskLevel.value !== null
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl">

      <!-- Header -->
      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Surakshit AI
        </p>

        <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Stress Assessment Result
        </h1>

        <p class="mt-2 text-sm text-slate-600 sm:text-base">
          Your latest personnel stress assessment has been analyzed.
        </p>
      </div>

      <!-- Result Card -->
      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

        <!-- Valid Result -->
        <template v-if="resultAvailable">

          <div class="grid gap-8 md:grid-cols-2 md:items-center">

            <!-- Score -->
            <div class="text-center md:text-left">
              <p class="text-sm font-medium text-slate-500">
                Stress Score
              </p>

              <div class="mt-2">
                <span class="text-5xl font-bold text-slate-900 sm:text-6xl">
                  {{ stressScore!.toFixed(2) }}
                </span>

                <span class="ml-2 text-lg text-slate-500">
                  / 10
                </span>
              </div>
            </div>

            <!-- Risk -->
            <div class="rounded-xl bg-slate-50 p-6 text-center">
              <p class="text-sm font-medium text-slate-500">
                Risk Level
              </p>

              <p
                class="mt-2 text-3xl font-bold"
                :class="{
                  'text-green-600': riskLevel?.toLowerCase() === 'low',
                  'text-yellow-600': riskLevel?.toLowerCase() === 'moderate',
                  'text-orange-600': riskLevel?.toLowerCase() === 'elevated',
                  'text-red-600': riskLevel?.toLowerCase() === 'high'
                }"
              >
                {{ riskLevel }}
              </p>
            </div>

          </div>

          <!-- Progress -->
          <div class="mt-8">

            <div class="mb-2 flex justify-between text-xs text-slate-500">
              <span>Lower Stress</span>
              <span>Higher Stress</span>
            </div>

            <div class="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                class="h-full rounded-full bg-slate-700 transition-all duration-500"
                :style="{ width: `${scorePercentage}%` }"
              />
            </div>

          </div>

          <!-- Interpretation -->
          <div class="mt-8 border-t border-slate-200 pt-6">
            <h2 class="text-lg font-semibold text-slate-900">
              Assessment Summary
            </h2>

            <p class="mt-2 text-sm leading-6 text-slate-600">
              {{ riskDescription }}
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">

            <NuxtLink
              :to="{
                path: '/personnel/recommendations',
                query: {
                  score: stressScore!.toString(),
                  risk: riskLevel!
                }
              }"
              class="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              View Recommendations
            </NuxtLink>

            <NuxtLink
              to="/personnel/assessment"
              class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Retake Assessment
            </NuxtLink>

          </div>

        </template>

        <!-- No Result -->
        <template v-else>

          <div class="py-8 text-center">

            <div class="text-5xl">
              🛡️
            </div>

            <h2 class="mt-4 text-xl font-semibold text-slate-900">
              No Assessment Result
            </h2>

            <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              We couldn't find a valid assessment result. Please complete the
              assessment first to receive your AI-generated stress score.
            </p>

            <NuxtLink
              to="/personnel/assessment"
              class="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Start Assessment
            </NuxtLink>

          </div>

        </template>

      </div>

      <!-- Disclaimer -->
      <p class="mt-6 text-center text-xs leading-5 text-slate-500">
        This assessment is intended to support personnel wellbeing monitoring
        and should not be treated as a medical diagnosis.
      </p>

    </div>
  </div>
</template>