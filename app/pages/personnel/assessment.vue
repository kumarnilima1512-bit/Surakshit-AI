<script setup lang="ts">
import { reactive, ref } from 'vue'

const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  age: undefined as number | undefined,
  gender: '',
  job_role: '',
  experience_years: undefined as number | undefined,
  company_size: '',
  work_mode: '',

  work_hours_per_week: undefined as number | undefined,
  overtime_hours: undefined as number | undefined,
  meetings_per_day: undefined as number | undefined,
  deadlines_missed: undefined as number | undefined,

  job_satisfaction: undefined as number | undefined,
  manager_support: undefined as number | undefined,
  work_life_balance: undefined as number | undefined,

  sleep_hours: undefined as number | undefined,
  physical_activity_days: undefined as number | undefined,
  screen_time_hours: undefined as number | undefined,
  caffeine_intake: undefined as number | undefined,
  social_support_score: undefined as number | undefined,
  has_therapy: 0
})

async function predictStress() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      stress_score: number
      risk_level: string
    }>('/api/personnel/predict', {
      method: 'POST',
      body: form
    })

    if (!response.success) {
      throw new Error('Prediction failed')
    }

    await navigateTo({
      path: '/personnel/assessment-result',
      query: {
        score: response.stress_score.toString(),
        risk: response.risk_level
      }
    })
  } catch (error) {
    console.error('Prediction failed:', error)
    errorMessage.value =
      'Unable to generate the assessment result. Please check your details and try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10">
    <div class="mx-auto max-w-5xl">


  <!-- Header -->
  <div class="mb-8">
    <p class="text-sm font-semibold uppercase tracking-wider text-blue-600">
      Surakshit AI
    </p>

    <h1 class="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
      Personnel Stress Assessment
    </h1>

    <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
      Provide information about your current duty conditions, workload,
      sleep, physical activity and support system to receive an
      AI-assisted stress risk assessment.
    </p>
  </div>

  <!-- Assessment Form -->
  <form
    @submit.prevent="predictStress"
    class="rounded-2xl bg-white p-5 shadow-sm md:p-8"
  >

    <!-- Personal & Duty Information -->
    <section>
      <h2 class="text-lg font-semibold text-slate-900">
        Personal & Duty Information
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Tell us about your service background and current duty situation.
      </p>

      <div class="mt-6 grid gap-5 md:grid-cols-2">

        <!-- Age -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Age
          </label>

          <input
            v-model.number="form.age"
            type="number"
            min="18"
            max="70"
            placeholder="e.g. 30"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Gender -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Gender
          </label>

          <select
            v-model="form.gender"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>
              Select gender
            </option>
            <option value="Male">
              Male
            </option>
            <option value="Female">
              Female
            </option>
            <option value="Other">
              Other
            </option>
          </select>
        </div>

        <!-- Duty Role -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Duty Role
          </label>

          <input
            v-model="form.job_role"
            type="text"
            placeholder="e.g. Field Personnel"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Years of Service -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Years of Service
          </label>

          <input
            v-model.number="form.experience_years"
            type="number"
            min="0"
            max="40"
            placeholder="e.g. 5"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Unit Size -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Force / Unit Size
          </label>

          <select
            v-model="form.company_size"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>
              Select unit size
            </option>
            <option value="Small">
              Small
            </option>
            <option value="Medium">
              Medium
            </option>
            <option value="Large">
              Large
            </option>
          </select>
        </div>

        <!-- Deployment -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Current Duty Deployment
          </label>

          <select
            v-model="form.work_mode"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>
              Select deployment
            </option>
            <option value="On Duty">
              On Duty
            </option>
            <option value="Field">
              Field
            </option>
            <option value="Base">
              Base
            </option>
            <option value="Remote">
              Remote
            </option>
          </select>
        </div>

      </div>
    </section>

    <hr class="my-8 border-slate-200" />

    <!-- Operational Pressure -->
    <section>
      <h2 class="text-lg font-semibold text-slate-900">
        Duty & Operational Pressure
      </h2>

      <p class="mt-1 text-sm text-slate-500">
        Describe your recent workload and operational demands.
      </p>

      <div class="mt-6 grid gap-5 md:grid-cols-2">

        <!-- Duty Hours -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Duty Hours per Week
          </label>

          <input
            v-model.number="form.work_hours_per_week"
            type="number"
            min="0"
            placeholder="e.g. 48"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Extended Duty -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Extended Duty Hours
          </label>

          <input
            v-model.number="form.overtime_hours"
            type="number"
            min="0"
            placeholder="e.g. 8"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Briefings -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Briefings per Day
          </label>

          <input
            v-model.number="form.meetings_per_day"
            type="number"
            min="0"
            placeholder="e.g. 2"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Missed Tasks -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Critical Tasks Missed
          </label>

          <input
            v-model.number="form.deadlines_missed"
            type="number"
            min="0"
            placeholder="e.g. 1"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

      <p class="mt-1 text-sm text-slate-500">
        Share information about your sleep, activity, satisfaction and
        support system.
      </p>

      <div class="mt-6 grid gap-5 md:grid-cols-2">

        <!-- Duty Satisfaction -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Duty Satisfaction
          </label>

          <input
            v-model.number="form.job_satisfaction"
            type="number"
            min="1"
            max="10"
            placeholder="e.g. 7"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Supervisor Support -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Command / Supervisor Support
          </label>

          <input
            v-model.number="form.manager_support"
            type="number"
            min="1"
            max="10"
            placeholder="e.g. 8"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Work Life Balance -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Work-Life Balance
          </label>

          <input
            v-model.number="form.work_life_balance"
            type="number"
            min="1"
            max="10"
            placeholder="e.g. 6"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Social Support -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Social / Family Support
          </label>

          <input
            v-model.number="form.social_support_score"
            type="number"
            min="1"
            max="10"
            placeholder="e.g. 8"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Sleep -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Sleep Hours per Day
          </label>

          <input
            v-model.number="form.sleep_hours"
            type="number"
            min="0"
            max="24"
            placeholder="e.g. 6"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Physical Activity -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Physical Activity Days / Week
          </label>

          <input
            v-model.number="form.physical_activity_days"
            type="number"
            min="0"
            max="7"
            placeholder="e.g. 3"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Screen Time -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Screen Time Hours / Day
          </label>

          <input
            v-model.number="form.screen_time_hours"
            type="number"
            min="0"
            max="24"
            placeholder="e.g. 6"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Caffeine -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Caffeine Intake / Day
          </label>

          <input
            v-model.number="form.caffeine_intake"
            type="number"
            min="0"
            placeholder="e.g. 2"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <!-- Professional Support -->
        <div>
          <label class="text-sm font-medium text-slate-700">
            Currently Receiving Professional Support?
          </label>

          <select
            v-model.number="form.has_therapy"
            required
            class="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option :value="0">
              No
            </option>
            <option :value="1">
              Yes
            </option>
          </select>
        </div>

      </div>
    </section>

    <!-- Error Message -->
    <div
      v-if="errorMessage"
      class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ errorMessage }}
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="loading"
      class="mt-8 w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ loading ? 'Analysing...' : 'Predict Stress Level' }}
    </button>

    <p class="mt-4 text-center text-xs leading-5 text-slate-500">
      This assessment provides an AI-based screening indicator and does
      not replace professional evaluation or clinical judgement.
    </p>

  </form>
</div>
```

  </div>
</template>