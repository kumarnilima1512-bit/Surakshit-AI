<script setup lang="ts">
import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Building2,
  Users,
  MoreVertical,
} from 'lucide-vue-next'

interface UnitData {
  id: number
  name: string
  code: string | null
  location: string | null
  personnelCount: number
}

const units = ref<UnitData[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')

const filteredUnits = computed(() => {
  const query = search.value.toLowerCase().trim()

  if (!query) return units.value

  return units.value.filter((unit) =>
    [
      unit.name,
      unit.code,
      unit.location,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query))
  )
})

const loadUnits = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      units: UnitData[]
    }>('/api/admin/unit')

    units.value = response.units
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load units'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  navigateTo('/admin/dashboard')
}

const goToAssignPersonnel = () => {
  navigateTo('/admin/units/assign-personnel')
}

onMounted(loadUnits)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="goBack"
            class="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
            title="Back"
          >
            <ArrowLeft :size="20" />
          </button>

          <div>
            <h1 class="text-2xl font-semibold">All Units</h1>
            <p class="mt-1 text-sm text-slate-400">
              Manage organizational units and assigned personnel
            </p>
          </div>
        </div>

        <button
          @click="goToAssignPersonnel"
          class="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Users :size="18" />
          Assign Personnel
        </button>
      </div>
    </header>

    <main class="p-6">
      <!-- Summary -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Total Units
            </span>

            <Building2
              :size="20"
              class="text-emerald-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ units.length }}
          </p>
        </div>

        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Assigned Personnel
            </span>

            <Users
              :size="20"
              class="text-blue-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{
              units.reduce(
                (total, unit) => total + unit.personnelCount,
                0
              )
            }}
          </p>
        </div>
      </div>

      <!-- Toolbar -->
      <div
        class="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d1b2d] p-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="relative w-full md:max-w-md">
          <Search
            :size="18"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            v-model="search"
            type="text"
            placeholder="Search unit, code or location..."
            class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
          />
        </div>

        <button
          @click="loadUnits"
          class="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#07111f] px-3 py-2.5 text-sm text-slate-400 transition hover:text-white"
        >
          <RefreshCw :size="18" />
          Refresh
        </button>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <!-- Table -->
      <div
        class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <div
          v-if="loading"
          class="p-10 text-center text-slate-400"
        >
          Loading units...
        </div>

        <div
          v-else-if="filteredUnits.length === 0"
          class="p-10 text-center"
        >
          <Building2
            :size="32"
            class="mx-auto text-slate-700"
          />

          <p class="mt-3 text-slate-500">
            No units found.
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
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Unit
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Code
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Location
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Personnel
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  ID
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-white/5">
              <tr
                v-for="unit in filteredUnits"
                :key="unit.id"
                class="transition hover:bg-white/[0.025]"
              >
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
                    >
                      <Building2 :size="18" />
                    </div>

                    <p class="font-medium text-slate-200">
                      {{ unit.name }}
                    </p>
                  </div>
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ unit.code || '—' }}
                </td>

                <td class="px-5 py-4 text-sm text-slate-400">
                  {{ unit.location || '—' }}
                </td>

                <td class="px-5 py-4">
                  <span
                    class="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400"
                  >
                    {{ unit.personnelCount }}
                  </span>
                </td>

                <td class="px-5 py-4 text-sm text-slate-500">
                  #{{ unit.id }}
                </td>

                <td class="px-5 py-4">
                  <button
                    class="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    title="Unit actions"
                  >
                    <MoreVertical :size="18" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="mt-3 text-xs text-slate-600">
        Showing {{ filteredUnits.length }} of {{ units.length }} units
      </p>
    </main>
  </div>
</template>