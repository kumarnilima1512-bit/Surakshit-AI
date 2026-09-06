<script setup lang="ts">
import {
  ArrowLeft,
  UserPlus,
  Users,
  Building2,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-vue-next'

interface Personnel {
  id: number
  name: string | null
  username: string | null
  email: string
  role: string
}

interface Unit {
  id: number
  name: string
  code: string | null
}

const personnel = ref<Personnel[]>([])
const units = ref<Unit[]>([])

const selectedPersonnel = ref('')
const selectedUnit = ref('')

const search = ref('')
const loading = ref(true)
const assigning = ref(false)

const success = ref('')
const error = ref('')

const filteredPersonnel = computed(() => {
  const query = search.value.toLowerCase().trim()

  if (!query) {
    return personnel.value
  }

  return personnel.value.filter((person) =>
    [
      person.name,
      person.username,
      person.email,
    ]
      .filter(Boolean)
      .some((value) =>
        value!.toLowerCase().includes(query)
      )
  )
})

const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [personnelResponse, unitsResponse] = await Promise.all([
      $fetch<{
        success: boolean
        personnel: Personnel[]
      }>('/api/admin/personnel'),

      $fetch<{
        success: boolean
        units: Unit[]
      }>('/api/admin/unit'),
    ])

    personnel.value = personnelResponse.personnel
    units.value = unitsResponse.units
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load personnel or units'
  } finally {
    loading.value = false
  }
}

const assignPersonnel = async () => {
  success.value = ''
  error.value = ''

  if (!selectedPersonnel.value || !selectedUnit.value) {
    error.value = 'Please select both personnel and unit'
    return
  }

  assigning.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message: string
    }>('/api/admin/unit/assign', {
      method: 'POST',
      body: {
        personnelId: Number(selectedPersonnel.value),
        unitId: Number(selectedUnit.value),
      },
    })

    success.value = response.message

    selectedPersonnel.value = ''
    selectedUnit.value = ''
  } catch (err: any) {
    console.error(err)

    error.value =
      err?.data?.statusMessage ||
      err?.data?.message ||
      'Unable to assign personnel'
  } finally {
    assigning.value = false
  }
}

const goBack = () => {
  navigateTo('/admin/units/all-units')
}

onMounted(loadData)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Back"
        >
          <ArrowLeft :size="20" />
        </button>

        <div>
          <h1 class="text-2xl font-semibold">
            Assign Personnel
          </h1>

          <p class="mt-1 text-sm text-slate-400">
            Assign personnel to an organizational unit
          </p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl p-6">
      <!-- Success -->
      <div
        v-if="success"
        class="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
      >
        <CheckCircle :size="19" />
        {{ success }}
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
      >
        <AlertCircle :size="19" />
        {{ error }}
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="rounded-xl border border-white/10 bg-[#0d1b2d] p-12 text-center text-slate-400"
      >
        Loading personnel and units...
      </div>

      <template v-else>
        <!-- Assignment Card -->
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d]"
        >
          <div class="border-b border-white/10 p-6">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
              >
                <UserPlus :size="20" />
              </div>

              <div>
                <h2 class="font-semibold">
                  Personnel Assignment
                </h2>

                <p class="text-sm text-slate-500">
                  Select personnel and the unit they should belong to
                </p>
              </div>
            </div>
          </div>

          <form
            @submit.prevent="assignPersonnel"
            class="space-y-6 p-6"
          >
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <!-- Personnel -->
              <div>
                <label
                  class="mb-2 block text-sm text-slate-400"
                >
                  Personnel
                </label>

                <div class="relative">
                  <Users
                    :size="18"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <select
                    v-model="selectedPersonnel"
                    class="w-full appearance-none rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
                  >
                    <option value="">
                      Select personnel
                    </option>

                    <option
                      v-for="person in filteredPersonnel"
                      :key="person.id"
                      :value="person.id"
                    >
                      {{
                        person.name ||
                        person.username ||
                        person.email
                      }}
                      — {{ person.email }}
                    </option>
                  </select>
                </div>

                <p
                  v-if="personnel.length === 0"
                  class="mt-2 text-xs text-slate-600"
                >
                  No personnel available.
                </p>
              </div>

              <!-- Unit -->
              <div>
                <label
                  class="mb-2 block text-sm text-slate-400"
                >
                  Unit
                </label>

                <div class="relative">
                  <Building2
                    :size="18"
                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                  />

                  <select
                    v-model="selectedUnit"
                    class="w-full appearance-none rounded-lg border border-white/10 bg-[#07111f] py-3 pl-10 pr-4 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
                  >
                    <option value="">
                      Select unit
                    </option>

                    <option
                      v-for="unit in units"
                      :key="unit.id"
                      :value="unit.id"
                    >
                      {{ unit.name }}
                      <template v-if="unit.code">
                        — {{ unit.code }}
                      </template>
                    </option>
                  </select>
                </div>

                <p
                  v-if="units.length === 0"
                  class="mt-2 text-xs text-slate-600"
                >
                  No units available.
                </p>
              </div>
            </div>

            <!-- Search -->
            <div
              class="rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              <div class="relative">
                <Search
                  :size="17"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                />

                <input
                  v-model="search"
                  type="text"
                  placeholder="Filter personnel by name, username or email..."
                  class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
                />
              </div>

              <p class="mt-2 text-xs text-slate-600">
                {{ filteredPersonnel.length }}
                personnel available
              </p>
            </div>

            <!-- Action -->
            <div
              class="flex justify-end border-t border-white/10 pt-6"
            >
              <button
                type="submit"
                :disabled="
                  assigning ||
                  !selectedPersonnel ||
                  !selectedUnit
                "
                class="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus :size="18" />

                {{
                  assigning
                    ? 'Assigning...'
                    : 'Assign Personnel'
                }}
              </button>
            </div>
          </form>
        </div>

        <!-- Information -->
        <div
          class="mt-5 rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-start gap-3">
            <Building2
              :size="19"
              class="mt-0.5 text-slate-500"
            />

            <div>
              <h3 class="text-sm font-medium text-slate-300">
                Unit Assignment
              </h3>

              <p class="mt-1 text-xs leading-5 text-slate-600">
                Personnel assignments are stored in the system
                and can be used for unit-level welfare monitoring,
                assessments and reporting.
              </p>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>