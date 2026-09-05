<script setup lang="ts">
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Shield,
  Globe,
} from 'lucide-vue-next'

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')

const settings = reactive({
  systemName: '',
  timezone: '',
  notificationsEnabled: false,
  maintenanceMode: false,
  sessionTimeout: '',
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
    }>('/api/admin/settings/general')
    Object.assign(settings, response.settings)
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load system settings'
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
    await $fetch('/api/admin/settings/general', {
      method: 'PUT',
      body: {
        systemName: settings.systemName,
        timezone: settings.timezone,
        notificationsEnabled: settings.notificationsEnabled,
        maintenanceMode: settings.maintenanceMode,
        sessionTimeout: settings.sessionTimeout,
      },
    })

    success.value = 'General settings saved successfully'
  } catch (err) {
    console.error(err)
    error.value = 'Unable to save settings'
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
          <h1 class="text-2xl font-semibold">General Settings</h1>
          <p class="mt-1 text-sm text-slate-400">
            Configure general system preferences
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
        Loading settings...
      </div>

      <div v-else class="space-y-5">
        <!-- System -->
        <section
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-6"
        >
          <div class="mb-6 flex items-center gap-3">
            <div class="rounded-lg bg-emerald-500/10 p-2.5">
              <Settings :size="20" class="text-emerald-400" />
            </div>

            <div>
              <h2 class="font-semibold">System Configuration</h2>
              <p class="text-sm text-slate-500">
                Basic application configuration
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm text-slate-400">
                System Name
              </label>

              <input
                v-model="settings.systemName"
                type="text"
                placeholder="Surakshit AI"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Timezone
              </label>

              <select
                v-model="settings.timezone"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
              >
                <option value="">Select timezone</option>
                <option value="Asia/Kolkata">Asia/Kolkata</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label class="mb-2 block text-sm text-slate-400">
                Session Timeout
              </label>

              <input
                v-model="settings.sessionTimeout"
                type="number"
                min="1"
                placeholder="30"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
              />

              <p class="mt-1 text-xs text-slate-600">
                Timeout duration in minutes
              </p>
            </div>
          </div>
        </section>

        <!-- Notifications -->
        <section
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-6"
        >
          <div class="mb-6 flex items-center gap-3">
            <div class="rounded-lg bg-blue-500/10 p-2.5">
              <Bell :size="20" class="text-blue-400" />
            </div>

            <div>
              <h2 class="font-semibold">Notifications</h2>
              <p class="text-sm text-slate-500">
                Manage system notification behavior
              </p>
            </div>
          </div>

          <label
            class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/5 bg-[#07111f] p-4"
          >
            <div>
              <p class="text-sm font-medium text-slate-300">
                Enable Notifications
              </p>

              <p class="mt-1 text-xs text-slate-600">
                Allow system alerts and notifications
              </p>
            </div>

            <input
              v-model="settings.notificationsEnabled"
              type="checkbox"
              class="h-5 w-5 accent-emerald-500"
            />
          </label>
        </section>

        <!-- Security -->
        <section
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5 sm:p-6"
        >
          <div class="mb-6 flex items-center gap-3">
            <div class="rounded-lg bg-red-500/10 p-2.5">
              <Shield :size="20" class="text-red-400" />
            </div>

            <div>
              <h2 class="font-semibold">System Security</h2>
              <p class="text-sm text-slate-500">
                Control system availability
              </p>
            </div>
          </div>

          <label
            class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-white/5 bg-[#07111f] p-4"
          >
            <div>
              <p class="text-sm font-medium text-slate-300">
                Maintenance Mode
              </p>

              <p class="mt-1 text-xs text-slate-600">
                Temporarily restrict normal system access
              </p>
            </div>

            <input
              v-model="settings.maintenanceMode"
              type="checkbox"
              class="h-5 w-5 accent-emerald-500"
            />
          </label>
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