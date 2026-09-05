<script setup lang="ts">
import {
  Brain,
  Save,
  RefreshCw,
  Activity,
} from 'lucide-vue-next'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const settings = reactive({
  modelName: '',
  modelVersion: '',
  endpoint: '',
  threshold: '',
  enabled: false,
})

const loadSettings = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // Database/API will be connected here.
    const response = await $fetch<{
      success: boolean
      settings: typeof settings
    }>('/api/admin/settings/ml-model')

    Object.assign(settings, response.settings)
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load ML model settings'
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  error.value = ''
  success.value = ''

  try {
    // Database/API will be connected here.
    await $fetch('/api/admin/settings/ml-model', {
      method: 'PUT',
      body:{
        modelName: settings.modelName,
        modelVersion: settings.modelVersion,
        endpoint: settings.endpoint,
        threshold: settings.threshold,
        enabled: settings.enabled,
      },
    })

    success.value = 'ML model settings saved successfully'
  } catch (err) {
    console.error(err)
    error.value = 'Unable to save ML model settings'
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-4 py-4 backdrop-blur sm:px-6"
    >
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold">ML Model Settings</h1>

          <p class="mt-1 text-sm text-slate-400">
            Configure the Surakshit AI prediction model
          </p>
        </div>

        <button
          @click="loadSettings"
          class="flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-slate-400 transition hover:text-white"
        >
          <RefreshCw :size="17" />
          Refresh
        </button>
      </div>
    </header>

    <main class="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div
        v-if="error"
        class="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <div
        v-if="success"
        class="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
      >
        {{ success }}
      </div>

      <div
        v-if="loading"
        class="rounded-xl border border-white/10 bg-[#0d1b2d] p-10 text-center text-slate-400"
      >
        Loading ML model settings...
      </div>

      <div v-else class="space-y-5">
        <section
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-6"
        >
          <div class="mb-6 flex items-center gap-3">
            <div class="rounded-lg bg-emerald-500/10 p-2.5">
              <Brain :size="20" class="text-emerald-400" />
            </div>

            <div>
              <h2 class="font-semibold">Model Configuration</h2>
              <p class="text-sm text-slate-500">
                Configure the active prediction model
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Model Name
              </label>

              <input
                v-model="settings.modelName"
                type="text"
                placeholder="Surakshit AI Stress Model"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Model Version
              </label>

              <input
                v-model="settings.modelVersion"
                type="text"
                placeholder="1.0.0"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>

            <div class="md:col-span-2">
              <label class="mb-2 block text-sm text-slate-400">
                Prediction Endpoint
              </label>

              <input
                v-model="settings.endpoint"
                type="text"
                placeholder="http://127.0.0.1:8000/predict"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Risk Threshold
              </label>

              <input
                v-model="settings.threshold"
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="7.0"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>
          </div>
        </section>

        <section
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-6"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-blue-500/10 p-2.5">
                <Activity :size="20" class="text-blue-400" />
              </div>

              <div>
                <h2 class="font-semibold">Model Status</h2>

                <p class="mt-1 text-sm text-slate-500">
                  Enable or disable ML predictions
                </p>
              </div>
            </div>

            <input
              v-model="settings.enabled"
              type="checkbox"
              class="h-5 w-5 accent-emerald-500"
            />
          </div>
        </section>

        <div class="flex justify-end">
          <button
            @click="saveSettings"
            :disabled="saving"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Save :size="17" />
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </main>
  </div>
</template>