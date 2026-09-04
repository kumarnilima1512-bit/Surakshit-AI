<script setup lang="ts">
import {
  FileText,
  Download,
  RefreshCw,
} from 'lucide-vue-next'

const loading = ref(true)
const error = ref('')

const reports = ref<
  {
    id: number
    name: string
    type: string
    createdAt: string
  }[]
>([])

const loadReports = async () => {
  loading.value = true
  error.value = ''

  try {
    // Connect API later
    // const response = await $fetch('/api/admin/analytics/reports')
    // reports.value = response.reports

    reports.value = []
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load reports'
  } finally {
    loading.value = false
  }
}

const generateReport = () => {
  // Report generation API will be connected later
  console.log('Generate report')
}

onMounted(loadReports)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Reports</h1>
          <p class="mt-1 text-sm text-slate-400">
            Generate and manage system reports
          </p>
        </div>

        <div class="flex gap-2">
          <button
            @click="loadReports"
            class="rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-slate-400 transition hover:text-white"
            title="Refresh"
          >
            <RefreshCw :size="18" />
          </button>

          <button
            @click="generateReport"
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
        <div v-if="loading" class="p-10 text-center text-slate-400">
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

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Report
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Type
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Created
                </th>
                <th class="px-5 py-4 text-xs uppercase text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="report in reports"
                :key="report.id"
                class="hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <FileText
                      :size="18"
                      class="text-emerald-400"
                    />
                    <span class="text-sm text-slate-300">
                      {{ report.name }}
                    </span>
                  </div>
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ report.type }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  {{ report.createdAt }}
                </td>

                <td class="px-5 py-4">
                  <button
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
  </div>
</template>