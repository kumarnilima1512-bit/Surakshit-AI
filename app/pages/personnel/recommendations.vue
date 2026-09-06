
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

const riskMessage = computed(() => {
  switch (riskLevel.value?.toLowerCase()) {
    case 'low':
      return 'Your current stress indicator is relatively low. Continue maintaining healthy recovery and support routines.'

    case 'moderate':
      return 'Your assessment indicates moderate stress. Preventive measures and regular monitoring are recommended.'

    case 'elevated':
      return 'Your assessment indicates elevated stress. Consider appropriate recovery and support measures.'

    case 'high':
      return 'Your assessment indicates high stress. Additional support and timely professional assessment are recommended.'

    default:
      return 'Complete an assessment to receive personalized wellbeing recommendations.'
  }
})

const recommendations = computed(() => {
  switch (riskLevel.value?.toLowerCase()) {

    case 'low':
      return [
        {
          title: 'Maintain Recovery Routine',
          description:
            'Continue maintaining regular sleep, physical activity and adequate recovery between duties.',
          icon: '🌿'
        },
        {
          title: 'Stay Connected',
          description:
            'Maintain regular communication with family, colleagues and trusted support networks.',
          icon: '🤝'
        },
        {
          title: 'Monitor Stress',
          description:
            'Continue periodic self-assessment so that changes in stress levels can be identified early.',
          icon: '📊'
        }
      ]

    case 'moderate':
      return [
        {
          title: 'Prioritize Recovery',
          description:
            'Make sufficient sleep and recovery time a priority, particularly after extended or demanding duties.',
          icon: '🌙'
        },
        {
          title: 'Manage Operational Pressure',
          description:
            'Where operationally possible, balance demanding assignments with appropriate recovery periods.',
          icon: '⚖️'
        },
        {
          title: 'Use Your Support Network',
          description:
            'Stay connected with trusted colleagues, supervisors, family members or available welfare resources.',
          icon: '🤝'
        },
        {
          title: 'Monitor Your Stress',
          description:
            'Repeat the assessment periodically and pay attention to significant changes in your stress level.',
          icon: '📊'
        }
      ]

    case 'elevated':
      return [
        {
          title: 'Prioritize Recovery',
          description:
            'Focus on adequate sleep, recovery time and maintaining a healthy routine between demanding duties.',
          icon: '🌙'
        },
        {
          title: 'Manage Operational Pressure',
          description:
            'Identify manageable sources of workload or operational pressure and discuss possible support where appropriate.',
          icon: '⚖️'
        },
        {
          title: 'Stay Connected',
          description:
            'Maintain communication with trusted colleagues, supervisors, family or other support networks.',
          icon: '🤝'
        },
        {
          title: 'Monitor Stress',
          description:
            'Repeat the assessment periodically to monitor changes in your stress level.',
          icon: '📊'
        }
      ]

    case 'high':
      return [
        {
          title: 'Seek Professional Support',
          description:
            'Consider speaking with an appropriate qualified mental-health or welfare professional for further assessment and support.',
          icon: '🩺'
        },
        {
          title: 'Inform a Trusted Authority',
          description:
            'Where appropriate and safe, communicate significant wellbeing concerns to a trusted supervisor or designated welfare officer.',
          icon: '🛡️'
        },
        {
          title: 'Prioritize Recovery',
          description:
            'Adequate sleep, recovery time and physical wellbeing should receive immediate attention where operational circumstances permit.',
          icon: '🌙'
        },
        {
          title: 'Reduce Avoidable Pressure',
          description:
            'Identify manageable sources of workload or operational pressure and discuss possible support where appropriate.',
          icon: '⚖️'
        }
      ]

    default:
      return []
  }
})

const hasResult = computed(() => {
  return stressScore.value !== null && riskLevel.value !== null
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

    <div class="mx-auto max-w-5xl">

      <!-- Header -->
      <div class="mb-8">

        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Surakshit AI
        </p>

        <h1 class="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Personnel Well-being Recommendations
        </h1>

        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Based on your latest assessment, here are practical steps that may
          help support your wellbeing and stress management.
        </p>

      </div>

      <!-- Valid Assessment -->
      <template v-if="hasResult">

        <!-- Assessment Summary -->
        <div class="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow-sm">

          <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p class="text-sm text-slate-400">
                Latest Assessment
              </p>

              <h2 class="mt-1 text-xl font-semibold">
                {{ riskLevel }} Risk
              </h2>

              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {{ riskMessage }}
              </p>

            </div>

            <div
              class="shrink-0 rounded-xl bg-white/10 px-5 py-4 text-center"
            >

              <p class="text-xs text-slate-400">
                Stress Score
              </p>

              <p class="mt-1 text-3xl font-bold">
                {{ stressScore!.toFixed(2) }}

                <span class="text-sm font-normal text-slate-400">
                  / 10
                </span>
              </p>

            </div>

          </div>

        </div>

        <!-- Recommendations -->
        <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

          <div class="mb-6">

            <h2 class="text-lg font-semibold text-slate-900">
              Recommended Actions
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              Consider the following actions based on your current assessment.
            </p>

          </div>

          <div class="grid gap-4 md:grid-cols-2">

            <div
              v-for="recommendation in recommendations"
              :key="recommendation.title"
              class="rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm"
            >

              <div class="flex gap-4">

                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl"
                >
                  {{ recommendation.icon }}
                </div>

                <div>

                  <h3 class="font-semibold text-slate-900">
                    {{ recommendation.title }}
                  </h3>

                  <p class="mt-2 text-sm leading-6 text-slate-600">
                    {{ recommendation.description }}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        <!-- Support Notice -->
        <div class="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

          <div class="flex gap-4">

            <div class="text-2xl">
              🛡️
            </div>

            <div>

              <h2 class="font-semibold text-blue-900">
                Remember
              </h2>

              <p class="mt-2 text-sm leading-6 text-blue-800">
                Asking for support is a strength, not a weakness. If stress
                becomes persistent, overwhelming, or begins affecting your
                daily functioning, consider contacting an appropriate qualified
                professional or designated welfare support service.
              </p>

            </div>

          </div>

        </div>

      </template>

      <!-- No Assessment -->
      <template v-else>

        <div class="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">

          <div class="text-5xl">
            🛡️
          </div>

          <h2 class="mt-4 text-xl font-semibold text-slate-900">
            No Assessment Available
          </h2>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Complete a stress assessment first to receive recommendations
            based on your current wellbeing indicators.
          </p>

        </div>

      </template>

      <!-- Actions -->
      <div class="mt-6 flex flex-col gap-3 sm:flex-row">

        <NuxtLink
          to="/personnel/assessment"
          class="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Take New Assessment
        </NuxtLink>

        <NuxtLink
          v-if="hasResult"
          :to="{
            path: '/personnel/assessment-result',
            query: {
              score: stressScore!.toString(),
              risk: riskLevel!
            }
          }"
          class="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Result
        </NuxtLink>

      </div>

      <!-- Disclaimer -->
      <p class="mt-6 text-center text-xs leading-5 text-slate-500">
        These recommendations are general wellbeing guidance and are not a
        substitute for professional medical or psychological assessment.
      </p>

    </div>

  </div>
</template>

