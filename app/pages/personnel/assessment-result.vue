<script setup lang="ts">
// definePageMeta({
//   middleware: 'auth',
// })

const route = useRoute()

const stressScore = computed(() => {
  const value = Number(route.query.score)
  return Number.isFinite(value) ? value : null
})

const riskLevel = computed(() => {
  return typeof route.query.risk === 'string' ? route.query.risk : null
})

const scorePercentage = computed(() => {
  if (stressScore.value === null) return 0
  return (stressScore.value / 10) * 100
})

const riskDescription = computed(() => {
  switch (riskLevel.value?.toLowerCase()) {
    case 'low':
      return 'Your current assessment indicates a relatively low level of stress.'
    case 'moderate':
      return 'Your assessment indicates a moderate level of stress. Monitoring and preventive measures are recommended.'
    case 'elevated':
      return 'Your assessment indicates elevated stress. Consider taking appropriate rest and support measures.'
    case 'high':
      return 'Your assessment indicates a high level of stress. Additional support and timely intervention are recommended.'
    default:
      return 'Your assessment result is available below.'
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-4xl">


  <!-- Header -->
  <div class="mb-8">
    <p class="text-sm font-medium text-slate-500">
      Surakshit AI
    </p>

    <h1 class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
      Stress Assessment Result
    </h1>

    <p class="mt-2 text-sm text-slate-600 sm:text-base">
      Your latest personnel stress assessment has been analyzed.
    </p>
  </div>

  <!-- Result Card -->
  <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

    <div class="grid gap-8 md:grid-cols-2 md:items-center">

      <!-- Score -->
      <div class="text-center md:text-left">
        <p class="text-sm font-medium text-slate-500">
          Stress Score
        </p>

        <div v-if="stressScore !== null" class="mt-2">
          <span class="text-5xl font-bold text-slate-900 sm:text-6xl">
            {{ stressScore.toFixed(2) }}
          </span>

          <span class="ml-2 text-lg text-slate-500">
            / 10
          </span>
        </div>

        <p v-else class="mt-3 text-slate-500">
          No assessment result available.
        </p>
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
            'text-red-600': riskLevel?.toLowerCase() === 'high',
            'text-slate-700': !riskLevel,
          }"
        >
          {{ riskLevel || 'Unknown' }}
        </p>
      </div>
    </div>

    <!-- Progress -->
    <div v-if="stressScore !== null" class="mt-8">
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
        to="/personnel/recommendations"
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
  </div>

  <!-- Disclaimer -->
  <p class="mt-6 text-center text-xs leading-5 text-slate-500">
    This assessment is intended to support personnel wellbeing monitoring
    and should not be treated as a medical diagnosis.
  </p>

</div>
```

  </div>
</template>
