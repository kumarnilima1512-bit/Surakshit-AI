<!--
  pages/commander/personnel/[id].vue
  URL: /commander/personnel/:id
  Nuxt 4 + Composition API + Tailwind
  Responsive Commander personnel detail page.
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  User,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ClipboardList,
  RotateCw,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/commander/personnel/:id
       -> PersonnelDetail

   POST /api/commander/personnel/:id/follow-up
       { date: string }

       -> { ok: true }
   ====================================================================== */

type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

interface StressPoint {
  dateLabel: string
  score: number
}

interface AssessmentRow {
  dateTime: string
  score: number
  riskLevel: RiskLevel
}

interface PersonnelDetail {
  id: string
  name: string
  rank: string
  subUnit: string
  status: 'Active' | 'On Leave' | 'Inactive'
  joinedDate: string
  avatarUrl: string | null
  currentStressScore: number
  maxStressScore: number
  riskLevel: RiskLevel
  riskLevelNote: string
  lastAssessmentDate: string
  lastAssessmentTime: string
  nextFollowUpDate: string | null
  stressTrend: StressPoint[]
  recentAssessments: AssessmentRow[]
}

/* ---------------- Route + data fetching ---------------- */

const route = useRoute()

const personnelId = computed(
  () => route.params.id as string,
)

const {
  data,
  pending: loading,
  error,
  refresh: fetchPersonnel,
} = await useFetch<PersonnelDetail>(
  () => `/api/commander/personnel/${personnelId.value}`,
)

/* ---------------- Risk tone tokens ---------------- */

const riskTone: Record<
  RiskLevel,
  {
    text: string
    ring: string
    badgeBg: string
  }
> = {
  Low: {
    text: 'text-emerald-400',
    ring: '#34d399',
    badgeBg: 'bg-emerald-500/15',
  },

  Moderate: {
    text: 'text-blue-400',
    ring: '#60a5fa',
    badgeBg: 'bg-blue-500/15',
  },

  Elevated: {
    text: 'text-amber-400',
    ring: '#fbbf24',
    badgeBg: 'bg-amber-500/15',
  },

  High: {
    text: 'text-red-400',
    ring: '#f87171',
    badgeBg: 'bg-red-500/15',
  },
}

/* ---------------- Gauge geometry ---------------- */

function gaugeDashArray(
  score: number,
  max: number,
) {
  const r = 68
  const circumference = 2 * Math.PI * r

  const pct = Math.min(
    Math.max(score / max, 0),
    1,
  )

  const dash = pct * circumference

  return `${dash} ${circumference - dash}`
}

/* ---------------- Trend chart geometry ---------------- */

const chartW = 640
const chartH = 200
const chartMax = 10

function trendPath(points: StressPoint[]) {
  if (!points.length) return ''

  const stepX =
    chartW / Math.max(points.length - 1, 1)

  return points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${
          i * stepX
        } ${
          chartH -
          (p.score / chartMax) * chartH
        }`,
    )
    .join(' ')
}

function pointXY(
  points: StressPoint[],
  i: number,
) {
  const stepX =
    chartW / Math.max(points.length - 1, 1)

  const p = points[i]

  if (!p) {
    return {
      x: i * stepX,
      y: chartH,
    }
  }

  return {
    x: i * stepX,
    y:
      chartH -
      (p.score / chartMax) * chartH,
  }
}

/* ---------------- Schedule follow-up ---------------- */

const followUpDate = ref('')
const scheduling = ref(false)
const scheduleError = ref<string | null>(null)

async function scheduleFollowUp() {
  if (!followUpDate.value || !data.value) {
    return
  }

  scheduling.value = true
  scheduleError.value = null

  try {
    await $fetch(
      `/api/commander/personnel/${personnelId.value}/follow-up`,
      {
        method: 'POST',
        body: {
          date: followUpDate.value,
        },
      },
    )

    data.value.nextFollowUpDate =
      followUpDate.value

    followUpDate.value = ''
  } catch {
    scheduleError.value =
      'Could not schedule the follow-up. Please try again.'
  } finally {
    scheduling.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen min-w-0 bg-[#0b1220] p-4 text-slate-100 sm:p-5 lg:p-6"
  >
    <!-- ================================================================
         BACK BUTTON
         ================================================================ -->

    <NuxtLink
      to="/commander/personnel"
      class="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
    >
      <ArrowLeft :size="14" />

      <span>Back to My Personnel</span>
    </NuxtLink>

    <!-- ================================================================
         LOADING
         ================================================================ -->

    <div
      v-if="loading"
      class="mt-4 flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-12 sm:p-16"
    >
      <div
        class="flex flex-col items-center gap-3 text-slate-400"
      >
        <RotateCw
          :size="22"
          class="animate-spin"
        />

        <p class="text-sm">
          Loading personnel record…
        </p>
      </div>
    </div>

    <!-- ================================================================
         ERROR
         ================================================================ -->

    <div
      v-else-if="error"
      class="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center sm:p-16"
    >
      <AlertTriangle
        :size="28"
        class="text-red-400"
        :stroke-width="1.5"
      />

      <p
        class="text-sm font-semibold text-red-300"
      >
        Couldn't load this record
      </p>

      <p
        class="max-w-2xl text-xs leading-5 text-slate-400"
      >
        {{ error.message }} — expected data from

        <code
          class="break-all rounded bg-white/5 px-1.5 py-0.5"
        >
          /api/commander/personnel/{{ personnelId }}
        </code>
      </p>

      <button
        type="button"
        @click="fetchPersonnel()"
        class="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500"
      >
        Retry
      </button>
    </div>

    <!-- ================================================================
         PERSONNEL DETAIL
         ================================================================ -->

    <template v-else-if="data">
      <!-- ============================================================
           TOP INFORMATION
           ============================================================ -->

      <div
        class="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-4"
      >
        <!-- ----------------------------------------------------------
             PERSONNEL PROFILE
             ---------------------------------------------------------- -->

        <div
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5 xl:col-span-2"
        >
          <!-- Profile header -->
          <div
            class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center"
          >
            <!-- Avatar -->
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700"
            >
              <img
                v-if="data.avatarUrl"
                :src="data.avatarUrl"
                class="h-full w-full object-cover"
                alt=""
              />

              <User
                v-else
                :size="28"
                :stroke-width="1.5"
                class="text-slate-300"
              />
            </div>

            <!-- Basic information -->
            <div class="min-w-0 flex-1">
              <p
                class="break-words text-lg font-bold text-white"
              >
                {{ data.name }}
              </p>

              <p
                class="mt-0.5 break-words text-xs text-slate-400"
              >
                {{ data.rank }} &middot;
                {{ data.subUnit }}
              </p>

              <p
                class="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400"
              >
                <span
                  class="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                ></span>

                {{ data.status }}
              </p>
            </div>

            <!-- Risk badge -->
            <span
              class="self-start rounded-md px-2.5 py-1 text-[11px] font-bold sm:self-center"
              :class="[
                riskTone[data.riskLevel].badgeBg,
                riskTone[data.riskLevel].text,
              ]"
            >
              {{ data.riskLevel }} Risk
            </span>
          </div>

          <!-- Service information -->
          <div
            class="mt-5 grid grid-cols-1 gap-4 border-t border-white/5 pt-4 text-xs min-[420px]:grid-cols-2 sm:grid-cols-3"
          >
            <div class="min-w-0">
              <p class="text-slate-500">
                Service ID
              </p>

              <p
                class="mt-0.5 break-all font-semibold text-slate-200"
              >
                {{ data.id }}
              </p>
            </div>

            <div class="min-w-0">
              <p class="text-slate-500">
                Joined
              </p>

              <p
                class="mt-0.5 break-words font-semibold text-slate-200"
              >
                {{ data.joinedDate }}
              </p>
            </div>

            <div class="min-w-0">
              <p class="text-slate-500">
                Next Follow-up
              </p>

              <p
                class="mt-0.5 break-words font-semibold text-slate-200"
              >
                {{
                  data.nextFollowUpDate ??
                  'Not scheduled'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- ----------------------------------------------------------
             CURRENT STRESS SCORE
             ---------------------------------------------------------- -->

        <div
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >
          <div
            class="flex items-center gap-2"
          >
            <TrendingUp
              :size="15"
              :stroke-width="1.5"
              class="text-blue-400"
            />

            <h3
              class="text-xs font-bold text-white"
            >
              Current Stress Score
            </h3>
          </div>

          <div
            class="relative mx-auto mt-3 flex h-28 w-28 items-center justify-center"
          >
            <svg
              viewBox="0 0 160 160"
              class="h-28 w-28 -rotate-90"
            >
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                stroke-width="12"
              />

              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                :stroke="
                  riskTone[data.riskLevel].ring
                "
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="
                  gaugeDashArray(
                    data.currentStressScore,
                    data.maxStressScore,
                  )
                "
              />
            </svg>

            <div class="absolute text-center">
              <p
                class="text-2xl font-extrabold text-white"
              >
                {{ data.currentStressScore }}
              </p>

              <p class="text-[10px] text-slate-500">
                / {{ data.maxStressScore }}
              </p>
            </div>
          </div>
        </div>

        <!-- ----------------------------------------------------------
             LAST ASSESSMENT
             ---------------------------------------------------------- -->

        <div
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >
          <div
            class="flex items-center gap-2"
          >
            <Calendar
              :size="15"
              :stroke-width="1.5"
              class="text-blue-400"
            />

            <h3
              class="text-xs font-bold text-white"
            >
              Last Assessment
            </h3>
          </div>

          <p
            class="mt-3 break-words text-lg font-extrabold text-white"
          >
            {{ data.lastAssessmentDate }}
          </p>

          <p class="text-xs text-slate-400">
            {{ data.lastAssessmentTime }}
          </p>

          <p
            class="mt-3 text-[11px] leading-relaxed text-slate-400"
          >
            {{ data.riskLevelNote }}
          </p>
        </div>
      </div>

      <!-- ============================================================
           TREND + FOLLOW-UP
           ============================================================ -->

      <div
        class="mt-4 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]"
      >
        <!-- ----------------------------------------------------------
             STRESS TREND + ASSESSMENTS
             ---------------------------------------------------------- -->

        <div
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >
          <h3
            class="text-sm font-bold text-white"
          >
            Stress Trend
          </h3>

          <!-- Chart wrapper -->
          <div class="mt-4 min-w-0 overflow-x-auto">
            <svg
              v-if="data.stressTrend.length"
              :viewBox="`0 0 ${chartW} ${chartH + 26}`"
              class="h-48 min-w-[560px] w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="cmdDetailTrendFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="#34d399"
                    stop-opacity="0.3"
                  />

                  <stop
                    offset="100%"
                    stop-color="#34d399"
                    stop-opacity="0"
                  />
                </linearGradient>
              </defs>

              <!-- Grid lines -->
              <line
                v-for="g in 5"
                :key="g"
                x1="0"
                :x2="chartW"
                :y1="(chartH / 5) * g"
                :y2="(chartH / 5) * g"
                stroke="rgba(255,255,255,0.06)"
                stroke-width="1"
              />

              <!-- Area -->
              <path
                :d="`${trendPath(
                  data.stressTrend,
                )} L ${chartW} ${chartH} L 0 ${chartH} Z`"
                fill="url(#cmdDetailTrendFill)"
              />

              <!-- Line -->
              <path
                :d="
                  trendPath(data.stressTrend)
                "
                fill="none"
                stroke="#34d399"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <!-- Points -->
              <g
                v-for="(p, i) in data.stressTrend"
                :key="i"
              >
                <circle
                  :cx="
                    pointXY(
                      data.stressTrend,
                      i,
                    ).x
                  "
                  :cy="
                    pointXY(
                      data.stressTrend,
                      i,
                    ).y
                  "
                  r="3.5"
                  fill="#34d399"
                />

                <text
                  :x="
                    pointXY(
                      data.stressTrend,
                      i,
                    ).x
                  "
                  :y="
                    pointXY(
                      data.stressTrend,
                      i,
                    ).y - 10
                  "
                  text-anchor="middle"
                  font-size="11"
                  fill="#cbd5e1"
                >
                  {{ p.score }}
                </text>

                <text
                  :x="
                    pointXY(
                      data.stressTrend,
                      i,
                    ).x
                  "
                  :y="chartH + 20"
                  text-anchor="middle"
                  font-size="11"
                  fill="#64748b"
                >
                  {{ p.dateLabel }}
                </text>
              </g>
            </svg>

            <!-- Empty chart -->
            <div
              v-else
              class="flex h-48 items-center justify-center text-xs text-slate-500"
            >
              No assessment history yet.
            </div>
          </div>

          <!-- Mobile chart hint -->
          <p
            v-if="data.stressTrend.length"
            class="mt-1 text-[10px] text-slate-600 sm:hidden"
          >
            Swipe horizontally to view the full trend.
          </p>

          <!-- ========================================================
               RECENT ASSESSMENTS
               ======================================================== -->

          <h3
            class="mt-6 text-sm font-bold text-white"
          >
            Recent Assessments
          </h3>

          <div
            class="mt-3 overflow-x-auto rounded-xl border border-white/5"
          >
            <table
              class="w-full min-w-[360px] text-left text-xs"
            >
              <thead
                class="bg-white/[0.02]"
              >
                <tr class="text-slate-500">
                  <th
                    class="px-3 py-3 font-medium"
                  >
                    Date &amp; Time
                  </th>

                  <th
                    class="px-3 py-3 font-medium"
                  >
                    Score
                  </th>

                  <th
                    class="px-3 py-3 text-right font-medium"
                  >
                    Risk Level
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-if="
                    !data.recentAssessments.length
                  "
                >
                  <td
                    colspan="3"
                    class="px-3 py-5 text-center text-slate-500"
                  >
                    No assessments yet.
                  </td>
                </tr>

                <tr
                  v-for="(
                    row, i
                  ) in data.recentAssessments"
                  :key="i"
                  class="border-t border-white/5"
                >
                  <td
                    class="whitespace-nowrap px-3 py-2.5 text-slate-300"
                  >
                    {{ row.dateTime }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-200"
                  >
                    {{ row.score }}
                  </td>

                  <td
                    class="whitespace-nowrap px-3 py-2.5 text-right font-semibold"
                    :class="
                      riskTone[
                        row.riskLevel
                      ].text
                    "
                  >
                    {{ row.riskLevel }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ----------------------------------------------------------
             SCHEDULE FOLLOW-UP
             ---------------------------------------------------------- -->

        <div
          class="min-w-0 rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-5"
        >
          <div
            class="flex items-center gap-2"
          >
            <ClipboardList
              :size="15"
              :stroke-width="1.5"
              class="text-blue-400"
            />

            <h3
              class="text-sm font-bold text-white"
            >
              Schedule Follow-up
            </h3>
          </div>

          <p
            class="mt-2 text-[11px] leading-relaxed text-slate-500"
          >
            Schedule a welfare follow-up for this personnel.
          </p>

          <label
            class="mt-4 block text-[11px] font-medium text-slate-400"
          >
            Follow-up date
          </label>

          <input
            v-model="followUpDate"
            type="date"
            class="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none transition-colors focus:border-emerald-500/50"
          />

          <button
            type="button"
            :disabled="
              !followUpDate || scheduling
            "
            @click="scheduleFollowUp"
            class="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{
              scheduling
                ? 'Scheduling…'
                : 'Schedule'
            }}
          </button>

          <p
            v-if="scheduleError"
            class="mt-2 text-[11px] leading-relaxed text-red-400"
          >
            {{ scheduleError }}
          </p>

          <!-- Current follow-up status -->
          <div
            class="mt-5 rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            <p
              class="text-[10px] uppercase tracking-wide text-slate-500"
            >
              Current follow-up
            </p>

            <p
              class="mt-1 text-xs font-semibold text-slate-200"
            >
              {{
                data.nextFollowUpDate ??
                'Not scheduled'
              }}
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>