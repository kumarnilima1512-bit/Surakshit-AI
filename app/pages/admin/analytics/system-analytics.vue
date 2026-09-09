<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

interface Analytics {
  users: number
  units: number
  assignments: number
  assessments: number
  posts: number
  notifications: number
  avgStress: number
  highRisk: number
}

interface AnalyticsResponse {
  success: boolean
  analytics: Analytics
}

const loading = ref(true)
const error = ref('')

const analytics = ref<Analytics>({
  users: 0,
  units: 0,
  assignments: 0,
  assessments: 0,
  posts: 0,
  notifications: 0,
  avgStress: 0,
  highRisk: 0,
})

async function loadAnalytics() {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<AnalyticsResponse>(
      '/api/admin/analytics/system',
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (!response.success) {
      throw new Error('Failed to load system analytics')
    }

    analytics.value = response.analytics
  } catch (err) {
    console.error('System analytics error:', err)

    error.value =
      'Unable to load system analytics. Please try again.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  navigateTo('/admin/dashboard')
}

onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white">

    <!-- Header -->
    <header class="border-b border-slate-800 bg-slate-900">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-6 py-6"
      >

        <!-- Left Section -->
        <div class="flex items-center gap-4">

          <!-- Back Button -->
          <button
            type="button"
            @click="goBack"
            class="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
            title="Back to Dashboard"
          >
            <ArrowLeft :size="18" />

            <span class="hidden sm:inline">
              Back
            </span>
          </button>

          <!-- Page Title -->
          <div>
            <h1 class="text-2xl font-bold">
              System Analytics
            </h1>

            <p class="mt-1 text-sm text-slate-400">
              Overview of Surakshit AI system activity
            </p>
          </div>

        </div>

        <!-- Refresh -->
        <button
          type="button"
          :disabled="loading"
          class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          @click="loadAnalytics"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>

      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-7xl px-6 py-8">

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex min-h-[400px] items-center justify-center"
      >
        <div class="text-center">

          <div
            class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500"
          ></div>

          <p class="mt-4 text-sm text-slate-400">
            Loading system analytics...
          </p>

        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 p-6"
      >
        <div class="flex items-center justify-between gap-4">

          <div>
            <h2 class="font-semibold text-red-400">
              Unable to Load Analytics
            </h2>

            <p class="mt-1 text-sm text-red-300/80">
              {{ error }}
            </p>
          </div>

          <button
            type="button"
            class="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/30"
            @click="loadAnalytics"
          >
            Try Again
          </button>

        </div>
      </div>

      <!-- Analytics Content -->
      <div v-else>

        <!-- Primary Statistics -->
        <section>
          <div class="mb-5">
            <h2 class="text-lg font-semibold">
              System Overview
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              Key platform statistics
            </p>
          </div>

          <div
            class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >

            <!-- Total Users -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Total Users
              </p>

              <p class="mt-3 text-3xl font-bold">
                {{ analytics.users }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Registered system users
              </p>
            </div>

            <!-- Units -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Total Units
              </p>

              <p class="mt-3 text-3xl font-bold">
                {{ analytics.units }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Operational units
              </p>
            </div>

            <!-- Assessments -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Assessments
              </p>

              <p class="mt-3 text-3xl font-bold">
                {{ analytics.assessments }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Stress assessments recorded
              </p>
            </div>

            <!-- High Risk -->
            <div
              class="rounded-xl border border-red-500/20 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                High Risk Cases
              </p>

              <p class="mt-3 text-3xl font-bold text-red-400">
                {{ analytics.highRisk }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Elevated and high-risk cases
              </p>
            </div>

          </div>
        </section>

        <!-- Secondary Statistics -->
        <section class="mt-8">

          <div class="mb-5">
            <h2 class="text-lg font-semibold">
              Detailed Statistics
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              Additional system activity metrics
            </p>
          </div>

          <div
            class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >

            <!-- Average Stress -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Average Stress
              </p>

              <p class="mt-3 text-2xl font-bold">
                {{ analytics.avgStress.toFixed(2) }}

                <span class="text-sm font-normal text-slate-500">
                  / 10
                </span>
              </p>
            </div>

            <!-- Assignments -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Personnel Assignments
              </p>

              <p class="mt-3 text-2xl font-bold">
                {{ analytics.assignments }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Unit assignments
              </p>
            </div>

            <!-- Posts -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Posts
              </p>

              <p class="mt-3 text-2xl font-bold">
                {{ analytics.posts }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                System posts
              </p>
            </div>

            <!-- Notifications -->
            <div
              class="rounded-xl border border-slate-800 bg-slate-900 p-5"
            >
              <p class="text-sm text-slate-400">
                Notifications
              </p>

              <p class="mt-3 text-2xl font-bold">
                {{ analytics.notifications }}
              </p>

              <p class="mt-2 text-xs text-slate-500">
                Notifications generated
              </p>
            </div>

          </div>
        </section>

        <!-- Summary -->
        <section class="mt-8">

          <div
            class="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >

            <h2 class="text-lg font-semibold">
              System Summary
            </h2>

            <p class="mt-1 text-sm text-slate-400">
              Current platform monitoring status
            </p>

            <div
              class="mt-6 grid gap-4 md:grid-cols-2"
            >

              <!-- Assessment Summary -->
              <div
                class="rounded-lg border border-slate-800 bg-slate-800/40 p-4"
              >
                <p class="text-sm text-slate-400">
                  Assessment Coverage
                </p>

                <p class="mt-2 text-lg font-semibold">
                  {{ analytics.assessments }}
                  assessments
                </p>
              </div>

              <!-- Risk Summary -->
              <div
                class="rounded-lg border border-slate-800 bg-slate-800/40 p-4"
              >
                <p class="text-sm text-slate-400">
                  Risk Monitoring
                </p>

                <p class="mt-2 text-lg font-semibold">
                  {{ analytics.highRisk }}
                  high-risk cases
                </p>
              </div>

              <!-- Unit Summary -->
              <div
                class="rounded-lg border border-slate-800 bg-slate-800/40 p-4"
              >
                <p class="text-sm text-slate-400">
                  Unit Coverage
                </p>

                <p class="mt-2 text-lg font-semibold">
                  {{ analytics.units }}
                  units
                </p>
              </div>

              <!-- Stress Summary -->
              <div
                class="rounded-lg border border-slate-800 bg-slate-800/40 p-4"
              >
                <p class="text-sm text-slate-400">
                  Average Stress Score
                </p>

                <p class="mt-2 text-lg font-semibold">
                  {{ analytics.avgStress.toFixed(2) }}
                  / 10
                </p>
              </div>

            </div>
          </div>

        </section>

      </div>
    </main>
  </div>
</template>