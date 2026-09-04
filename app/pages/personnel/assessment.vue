<script setup lang="ts">
import { reactive, ref } from 'vue'

// definePageMeta({
//   middleware: 'auth'
// })

const loading = ref(false)
const result = ref<{
  stress_score: number
  risk_level: string
} | null>(null)

const form = reactive({
  age: 30,
  gender: 'Male',
  job_role: 'Field Personnel',
  experience_years: 5,
  company_size: 'Large',
  work_mode: 'On Duty',

  work_hours_per_week: 48,
  overtime_hours: 8,
  meetings_per_day: 2,
  deadlines_missed: 1,

  job_satisfaction: 5,
  manager_support: 5,
  work_life_balance: 5,

  sleep_hours: 6,
  physical_activity_days: 3,
  screen_time_hours: 6,
  caffeine_intake: 2,
  social_support_score: 5,
  has_therapy: 0
})

async function predictStress() {
  loading.value = true
  result.value = null

  try {
    const response = await $fetch<{
      success: boolean
      stress_score: number
      risk_level: string
    }>('http://127.0.0.1:8000/predict', {
      method: 'POST',
      body: form
    })

    result.value = {
      stress_score: response.stress_score,
      risk_level: response.risk_level
    }
  } catch (error) {
    console.error('Prediction failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6 md:p-10">

    <div class="mx-auto max-w-5xl">

      <!-- Header -->
      <div class="mb-8">
        <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Surakshit AI
        </p>

        <h1 class="mt-2 text-3xl font-bold text-slate-900">
          Personnel Stress Assessment
        </h1>

        <p class="mt-2 max-w-2xl text-slate-600">
          Complete this assessment based on your current duty conditions,
          workload, sleep, support system and overall well-being.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">

        <!-- Form -->
        <div class="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm">

          <!-- Personal & Duty Information -->
          <section>
            <h2 class="text-lg font-semibold text-slate-900">
              Personal & Duty Information
            </h2>

            <div class="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Age
                </label>

                <input
                  v-model.number="form.age"
                  type="number"
                  min="18"
                  max="70"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Gender
                </label>

                <select
                  v-model="form.gender"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Duty Role
                </label>

                <input
                  v-model="form.job_role"
                  type="text"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Years of Service
                </label>

                <input
                  v-model.number="form.experience_years"
                  type="number"
                  min="0"
                  max="40"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Force / Unit Size
                </label>

                <select
                  v-model="form.company_size"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Current Duty Deployment
                </label>

                <select
                  v-model="form.work_mode"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option>On Duty</option>
                  <option>Field</option>
                  <option>Base</option>
                  <option>Remote</option>
                </select>
              </div>

            </div>
          </section>

          <hr class="my-8 border-slate-200" />

          <!-- Workload -->
          <section>
            <h2 class="text-lg font-semibold text-slate-900">
              Duty & Operational Pressure
            </h2>

            <div class="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Duty Hours per Week
                </label>

                <input
                  v-model.number="form.work_hours_per_week"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Extended Duty Hours
                </label>

                <input
                  v-model.number="form.overtime_hours"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Briefings per Day
                </label>

                <input
                  v-model.number="form.meetings_per_day"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Critical Tasks Missed
                </label>

                <input
                  v-model.number="form.deadlines_missed"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

            </div>
          </section>

          <hr class="my-8 border-slate-200" />

          <!-- Wellbeing -->
          <section>
            <h2 class="text-lg font-semibold text-slate-900">
              Well-being & Support
            </h2>

            <div class="mt-5 grid gap-5 md:grid-cols-2">

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Duty Satisfaction (1–10)
                </label>

                <input
                  v-model.number="form.job_satisfaction"
                  type="number"
                  min="1"
                  max="10"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Command / Supervisor Support (1–10)
                </label>

                <input
                  v-model.number="form.manager_support"
                  type="number"
                  min="1"
                  max="10"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Work-Life Balance (1–10)
                </label>

                <input
                  v-model.number="form.work_life_balance"
                  type="number"
                  min="1"
                  max="10"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Social / Family Support (1–10)
                </label>

                <input
                  v-model.number="form.social_support_score"
                  type="number"
                  min="1"
                  max="10"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Sleep Hours per Day
                </label>

                <input
                  v-model.number="form.sleep_hours"
                  type="number"
                  min="0"
                  max="24"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Physical Activity Days / Week
                </label>

                <input
                  v-model.number="form.physical_activity_days"
                  type="number"
                  min="0"
                  max="7"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Screen Time Hours / Day
                </label>

                <input
                  v-model.number="form.screen_time_hours"
                  type="number"
                  min="0"
                  max="24"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Caffeine Intake / Day
                </label>

                <input
                  v-model.number="form.caffeine_intake"
                  type="number"
                  min="0"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700">
                  Currently Receiving Professional Support?
                </label>

                <select
                  v-model.number="form.has_therapy"
                  class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option :value="0">No</option>
                  <option :value="1">Yes</option>
                </select>
              </div>

            </div>
          </section>

          <!-- Submit -->
          <button
            :disabled="loading"
            @click="predictStress"
            class="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ loading ? 'Analysing...' : 'Predict Stress Level' }}
          </button>

        </div>

        <!-- Result -->
        <div class="h-fit rounded-2xl bg-slate-900 p-6 text-white">

          <p class="text-sm font-medium text-slate-400">
            AI Assessment Result
          </p>

          <div v-if="!result" class="mt-8">
            <div class="text-4xl">🛡️</div>

            <h2 class="mt-4 text-xl font-semibold">
              Ready for assessment
            </h2>

            <p class="mt-2 text-sm leading-6 text-slate-400">
              Submit the personnel assessment to receive an AI-generated
              stress score and risk classification.
            </p>
          </div>

          <div v-else class="mt-8">

            <p class="text-sm text-slate-400">
              Predicted Stress Score
            </p>

            <p class="mt-2 text-5xl font-bold">
              {{ result.stress_score.toFixed(2) }}
              <span class="text-xl text-slate-400">/10</span>
            </p>

            <div class="mt-6">
              <p class="text-sm text-slate-400">
                Risk Level
              </p>

              <p class="mt-2 text-2xl font-bold">
                {{ result.risk_level }}
              </p>
            </div>

            <p class="mt-6 text-xs leading-5 text-slate-400">
              This result is an AI-based screening indicator and should
              support, not replace, professional assessment.
            </p>

          </div>

        </div>

      </div>
    </div>
  </div>
</template>