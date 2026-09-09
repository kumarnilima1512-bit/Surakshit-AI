<script setup lang="ts">
import {
  FileText,
  Download,
  RefreshCw,
  X,
  ArrowLeft,
} from 'lucide-vue-next'

interface Report {
  id: number
  name: string
  type: string
  createdAt: string
  fromDate?: string
  toDate?: string
  downloadUrl: string
}

interface ReportsResponse {
  success: boolean
  reports: Report[]
}

interface GenerateResponse {
  success: boolean
  id: string
  name: string
  type: string
  dateRangeLabel: string
  generatedBy: string
  generatedOnLabel: string
  downloadUrl: string
}

const loading = ref(true)
const generating = ref(false)
const error = ref('')

const reports = ref<Report[]>([])

const showGenerateModal = ref(false)

const reportType = ref('System Risk Summary')
const fromDate = ref('')
const toDate = ref('')

const reportTypes = [
  'System Risk Summary',
  'High-Risk Case Log',
  'Personnel Readiness Report',
  'Monthly System Report',
]

const goBack = () => {
  navigateTo('/admin/dashboard')
}

const loadReports = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<ReportsResponse>(
      '/api/admin/analytics/reports',
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (!response.success) {
      throw new Error('Failed to load reports')
    }

    reports.value = response.reports
  } catch (err) {
    console.error('Reports loading error:', err)
    error.value = 'Unable to load reports'
  } finally {
    loading.value = false
  }
}

const openGenerateModal = () => {
  error.value = ''

  const today = new Date()
    .toISOString()
    .slice(0, 10)

  if (!fromDate.value) {
    fromDate.value = today
  }

  if (!toDate.value) {
    toDate.value = today
  }

  showGenerateModal.value = true
}

const closeGenerateModal = () => {
  if (generating.value) return

  showGenerateModal.value = false
}

const generateReport = async () => {
  error.value = ''

  if (!reportType.value || !fromDate.value || !toDate.value) {
    error.value =
      'Please select report type, from date, and to date.'

    return
  }

  if (fromDate.value > toDate.value) {
    error.value =
      'From date must be before To date.'

    return
  }

  generating.value = true

  try {
    const response = await $fetch<GenerateResponse>(
      '/api/admin/analytics/reports/generate',
      {
        method: 'POST',
        credentials: 'include',
        body: {
          type: reportType.value,
          from: fromDate.value,
          to: toDate.value,
        },
      },
    )

    if (!response.success) {
      throw new Error('Report generation failed')
    }

    reports.value.unshift({
      id: Number(response.id),
      name: response.name,
      type: response.type,
      createdAt: response.generatedOnLabel,
      downloadUrl: response.downloadUrl,
    })

    showGenerateModal.value = false
  } catch (err) {
    console.error('Report generation error:', err)
    error.value = 'Unable to generate report'
  } finally {
    generating.value = false
  }
}

const downloadReport = (report: Report) => {
  if (!report.downloadUrl) {
    error.value = 'Download link is not available'
    return
  }

  window.open(report.downloadUrl, '_blank')
}

onMounted(loadReports)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex min-w-0 items-center gap-3 sm:gap-4">
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

          <div class="min-w-0">
            <h1 class="text-2xl font-semibold">
              Reports
            </h1>

            <p class="mt-1 text-sm text-slate-400">
              Generate and manage system reports
            </p>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            :disabled="loading"
            @click="loadReports"
            class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw
              :size="18"
              :class="{ 'animate-spin': loading }"
            />
          </button>

          <button
            type="button"
            @click="openGenerateModal"
            class="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            <FileText :size="18" />
            Generate Report
          </button>
        </div>
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
        class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div
          v-if="loading"
          class="p-10 text-center text-slate-400"
        >
          Loading reports...
        </div>

        <div
          v-else-if="reports.length === 0"
          class="p-12 text-center"
        >
          <FileText
            :size="36"
            class="mx-auto text-slate-600"
          />

          <p class="mt-4 font-medium text-slate-400">
            No reports available
          </p>

          <p class="mt-1 text-sm text-slate-600">
            Generated reports will appear here.
          </p>
        </div>

        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left">
            <thead
              class="border-b border-white/10 bg-white/[0.02]"
            >
              <tr>
                <th
                  class="px-5 py-4 text-xs uppercase text-slate-500"
                >
                  Report
                </th>

                <th
                  class="px-5 py-4 text-xs uppercase text-slate-500"
                >
                  Type
                </th>

                <th
                  class="px-5 py-4 text-xs uppercase text-slate-500"
                >
                  Created
                </th>

                <th
                  class="px-5 py-4 text-xs uppercase text-slate-500"
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody
              class="divide-y divide-white/5"
            >
              <tr
                v-for="report in reports"
                :key="report.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4">
                  <div
                    class="flex items-center gap-3"
                  >
                    <FileText
                      :size="18"
                      class="text-emerald-400"
                    />

                    <span
                      class="text-sm text-slate-300"
                    >
                      {{ report.name }}
                    </span>
                  </div>
                </td>

                <td
                  class="px-5 py-4 text-sm text-slate-400"
                >
                  {{ report.type }}
                </td>

                <td
                  class="px-5 py-4 text-sm text-slate-500"
                >
                  {{ report.createdAt }}
                </td>

                <td class="px-5 py-4">
                  <button
                    type="button"
                    @click="downloadReport(report)"
                    class="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    title="Download"
                  >
                    <Download :size="18" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Generate Report Modal -->
    <div
      v-if="showGenerateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      @click.self="closeGenerateModal"
    >
      <div
        class="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1b2d] p-6 shadow-2xl"
      >
        <div
          class="flex items-center justify-between"
        >
          <div>
            <h2 class="text-lg font-semibold">
              Generate Report
            </h2>

            <p
              class="mt-1 text-sm text-slate-500"
            >
              Select the report type and period.
            </p>
          </div>

          <button
            type="button"
            :disabled="generating"
            @click="closeGenerateModal"
            class="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <X :size="18" />
          </button>
        </div>

        <div class="mt-6 space-y-5">
          <div>
            <label
              class="mb-2 block text-sm text-slate-400"
            >
              Report Type
            </label>

            <select
              v-model="reportType"
              class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
            >
              <option
                v-for="type in reportTypes"
                :key="type"
                :value="type"
                class="bg-[#07111f]"
              >
                {{ type }}
              </option>
            </select>
          </div>

          <div
            class="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label
                class="mb-2 block text-sm text-slate-400"
              >
                From Date
              </label>

              <input
                v-model="fromDate"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label
                class="mb-2 block text-sm text-slate-400"
              >
                To Date
              </label>

              <input
                v-model="toDate"
                type="date"
                class="w-full rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          <button
            type="button"
            :disabled="generating"
            @click="generateReport"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              v-if="generating"
              :size="17"
              class="animate-spin"
            />

            <FileText
              v-else
              :size="17"
            />

            {{
              generating
                ? 'Generating...'
                : 'Generate Report'
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>