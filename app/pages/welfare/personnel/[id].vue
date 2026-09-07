<!--
  pages/welfare/personnel/[id].vue
  This is the page every roster row / "View" link navigates to.
  Nuxt 3 + Composition API + Tailwind, same visual language as the rest
  of the Welfare Officer section.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ShieldCheck,
  User,
  ArrowLeft,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ClipboardList,
  FileText,
  RotateCw,
  ChevronDown,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/welfare/personnel/:id            -> PersonnelDetail
   POST /api/welfare/personnel/:id/note        { text: string } -> { ok: true }
   POST /api/welfare/personnel/:id/follow-up   { date: string }  -> { ok: true }
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
  notes: string
}

interface WelfareNote {
  author: string
  dateLabel: string
  text: string
}

interface PersonnelDetail {
  id: string
  name: string
  rank: string
  unit: string
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
  welfareNotes: WelfareNote[]
}

/* ---------------- Route + data fetching ---------------- */
const route = useRoute()
const personnelId = computed(() => route.params.id as string)

const { data, pending: loading, error, refresh: fetchPersonnel } =
  await useFetch<PersonnelDetail>(() => `/api/welfare/personnel/${personnelId.value}`)

/* ---------------- Risk tone tokens (identical to the rest of the section) ---------------- */
const riskTone: Record<RiskLevel, { text: string; ring: string; badgeBg: string; dot: string }> = {
  Low: { text: 'text-emerald-400', ring: '#34d399', badgeBg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  Moderate: { text: 'text-blue-400', ring: '#60a5fa', badgeBg: 'bg-blue-500/15', dot: 'bg-blue-400' },
  Elevated: { text: 'text-amber-400', ring: '#fbbf24', badgeBg: 'bg-amber-500/15', dot: 'bg-amber-400' },
  High: { text: 'text-red-400', ring: '#f87171', badgeBg: 'bg-red-500/15', dot: 'bg-red-400' },
}

/* ---------------- Gauge geometry ---------------- */
function gaugeDashArray(score: number, max: number) {
  const r = 68
  const circumference = 2 * Math.PI * r
  const pct = Math.min(Math.max(score / max, 0), 1)
  const dash = pct * circumference
  return `${dash} ${circumference - dash}`
}

/* ---------------- Trend chart geometry ---------------- */
const chartW = 640
const chartH = 200
const chartMax = 10

function trendPath(points: StressPoint[]) {
  if (!points.length) return ''
  const stepX = chartW / Math.max(points.length - 1, 1)
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${chartH - (p.score / chartMax) * chartH}`)
    .join(' ')
}
function pointXY(points: StressPoint[], i: number) {
  const stepX = chartW / Math.max(points.length - 1, 1)
  const p = points[i]

  if (!p) {
    return { x: i * stepX, y: chartH }
  }

  return { x: i * stepX, y: chartH - (p.score / chartMax) * chartH }
}

/* ---------------- Add welfare note (real action) ---------------- */
const noteDraft = ref('')
const savingNote = ref(false)
const noteError = ref<string | null>(null)

async function submitNote() {
  const text = noteDraft.value.trim()
  if (!text || !data.value) return
  savingNote.value = true
  noteError.value = null
  try {
    await $fetch(`/api/welfare/personnel/${personnelId.value}/note`, {
      method: 'POST',
      body: { text },
    })
    data.value.welfareNotes = [
      { author: 'You', dateLabel: 'Just now', text },
      ...data.value.welfareNotes,
    ]
    noteDraft.value = ''
  } catch (e) {
    noteError.value = 'Could not save the note. Please try again.'
  } finally {
    savingNote.value = false
  }
}

/* ---------------- Schedule follow-up (real action) ---------------- */
const followUpDate = ref('')
const schedulingFollowUp = ref(false)
const followUpError = ref<string | null>(null)

async function scheduleFollowUp() {
  if (!followUpDate.value || !data.value) return
  schedulingFollowUp.value = true
  followUpError.value = null
  try {
    await $fetch(`/api/welfare/personnel/${personnelId.value}/follow-up`, {
      method: 'POST',
      body: { date: followUpDate.value },
    })
    data.value.nextFollowUpDate = followUpDate.value
    followUpDate.value = ''
  } catch (e) {
    followUpError.value = 'Could not schedule the follow-up. Please try again.'
  } finally {
    schedulingFollowUp.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#0b1220] p-6 text-slate-100">
    <!-- Back link -->
    <NuxtLink to="/welfare/personnel" class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200">
      <ArrowLeft :size="14" />
      Back to Personnel
    </NuxtLink>

    <!-- Loading state -->
    <div v-if="loading" class="mt-4 flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
      <div class="flex flex-col items-center gap-3 text-slate-400">
        <RotateCw :size="22" class="animate-spin" />
        <p class="text-sm">Loading personnel record…</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
      <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
      <p class="text-sm font-semibold text-red-300">Couldn't load this record</p>
      <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/personnel/{{ personnelId }}</code></p>
      <button type="button" @click="fetchPersonnel()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
    </div>

    <!-- Content -->
    <template v-else-if="data">
      <!-- Profile header -->
      <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr]">
        <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5 xl:col-span-2">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-700">
              <img v-if="data.avatarUrl" :src="data.avatarUrl" class="h-full w-full object-cover" alt="">
              <User v-else :size="28" :stroke-width="1.5" class="text-slate-300" />
            </div>
            <div>
              <p class="text-lg font-bold text-white">{{ data.name }}</p>
              <p class="text-xs text-slate-400">{{ data.rank }} &middot; {{ data.unit }}</p>
              <p class="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>{{ data.status }}
              </p>
            </div>
            <span class="ml-auto rounded-md px-2.5 py-1 text-[11px] font-bold" :class="[riskTone[data.riskLevel].badgeBg, riskTone[data.riskLevel].text]">{{ data.riskLevel }} Risk</span>
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4 text-xs">
            <div>
              <p class="text-slate-500">Service ID</p>
              <p class="mt-0.5 font-semibold text-slate-200">{{ data.id }}</p>
            </div>
            <div>
              <p class="text-slate-500">Joined</p>
              <p class="mt-0.5 font-semibold text-slate-200">{{ data.joinedDate }}</p>
            </div>
            <div>
              <p class="text-slate-500">Next Follow-up</p>
              <p class="mt-0.5 font-semibold text-slate-200">{{ data.nextFollowUpDate ?? 'Not scheduled' }}</p>
            </div>
          </div>
        </div>

        <!-- Stress gauge -->
        <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
          <div class="flex items-center gap-2">
            <TrendingUp :size="15" :stroke-width="1.5" class="text-blue-400" />
            <h3 class="text-xs font-bold text-white">Current Stress Score</h3>
          </div>
          <div class="relative mx-auto mt-3 flex h-28 w-28 items-center justify-center">
            <svg viewBox="0 0 160 160" class="h-28 w-28 -rotate-90">
              <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="12" />
              <circle
                cx="80" cy="80" r="68" fill="none"
                :stroke="riskTone[data.riskLevel].ring" stroke-width="12" stroke-linecap="round"
                :stroke-dasharray="gaugeDashArray(data.currentStressScore, data.maxStressScore)"
              />
            </svg>
            <div class="absolute text-center">
              <p class="text-2xl font-extrabold text-white">{{ data.currentStressScore }}</p>
              <p class="text-[10px] text-slate-500">/ {{ data.maxStressScore }}</p>
            </div>
          </div>
        </div>

        <!-- Last assessment -->
        <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
          <div class="flex items-center gap-2">
            <Calendar :size="15" :stroke-width="1.5" class="text-blue-400" />
            <h3 class="text-xs font-bold text-white">Last Assessment</h3>
          </div>
          <p class="mt-3 text-lg font-extrabold text-white">{{ data.lastAssessmentDate }}</p>
          <p class="text-xs text-slate-400">{{ data.lastAssessmentTime }}</p>
          <p class="mt-3 text-[11px] leading-relaxed text-slate-400">{{ data.riskLevelNote }}</p>
        </div>
      </div>

      <!-- Stress trend + Actions -->
      <div class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
          <h3 class="text-sm font-bold text-white">Stress Trend</h3>
          <svg v-if="data.stressTrend.length" :viewBox="`0 0 ${chartW} ${chartH + 26}`" class="mt-4 h-48 w-full">
            <defs>
              <linearGradient id="detailTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#34d399" stop-opacity="0.3" />
                <stop offset="100%" stop-color="#34d399" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line v-for="g in 5" :key="g" x1="0" :x2="chartW" :y1="(chartH / 5) * g" :y2="(chartH / 5) * g" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
            <path :d="`${trendPath(data.stressTrend)} L ${chartW} ${chartH} L 0 ${chartH} Z`" fill="url(#detailTrendFill)" />
            <path :d="trendPath(data.stressTrend)" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <g v-for="(p, i) in data.stressTrend" :key="i">
              <circle :cx="pointXY(data.stressTrend, i).x" :cy="pointXY(data.stressTrend, i).y" r="3.5" fill="#34d399" />
              <text :x="pointXY(data.stressTrend, i).x" :y="pointXY(data.stressTrend, i).y - 10" text-anchor="middle" font-size="11" fill="#cbd5e1">{{ p.score }}</text>
              <text :x="pointXY(data.stressTrend, i).x" :y="chartH + 20" text-anchor="middle" font-size="11" fill="#64748b">{{ p.dateLabel }}</text>
            </g>
          </svg>
          <div v-else class="mt-4 flex h-48 items-center justify-center text-xs text-slate-500">No assessment history yet.</div>

          <h3 class="mt-6 text-sm font-bold text-white">Recent Assessments</h3>
          <div class="mt-3 overflow-x-auto">
            <table class="w-full min-w-[420px] text-left text-xs">
              <thead>
                <tr class="text-slate-500">
                  <th class="pb-2 font-medium">Date &amp; Time</th>
                  <th class="pb-2 font-medium">Score</th>
                  <th class="pb-2 font-medium">Risk Level</th>
                  <th class="pb-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!data.recentAssessments.length">
                  <td colspan="4" class="py-4 text-center text-slate-500">No assessments yet.</td>
                </tr>
                <tr v-for="(row, i) in data.recentAssessments" :key="i" class="border-t border-white/5">
                  <td class="py-2.5 text-slate-300">{{ row.dateTime }}</td>
                  <td class="py-2.5 font-semibold text-slate-200">{{ row.score }}</td>
                  <td class="py-2.5 font-semibold" :class="riskTone[row.riskLevel].text">{{ row.riskLevel }}</td>
                  <td class="py-2.5 text-slate-400">{{ row.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions + welfare notes -->
        <div class="space-y-4">
          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <div class="flex items-center gap-2">
              <ClipboardList :size="15" :stroke-width="1.5" class="text-blue-400" />
              <h3 class="text-sm font-bold text-white">Schedule Follow-up</h3>
            </div>
            <input
              v-model="followUpDate" type="date"
              class="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
            >
            <button
              type="button" :disabled="!followUpDate || schedulingFollowUp" @click="scheduleFollowUp"
              class="mt-2 w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {{ schedulingFollowUp ? 'Scheduling…' : 'Schedule' }}
            </button>
            <p v-if="followUpError" class="mt-2 text-[11px] text-red-400">{{ followUpError }}</p>
          </div>

          <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
            <div class="flex items-center gap-2">
              <FileText :size="15" :stroke-width="1.5" class="text-violet-400" />
              <h3 class="text-sm font-bold text-white">Welfare Notes</h3>
            </div>
            <textarea
              v-model="noteDraft" rows="3" placeholder="Add a welfare note…"
              class="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50"
            ></textarea>
            <button
              type="button" :disabled="!noteDraft.trim() || savingNote" @click="submitNote"
              class="mt-2 w-full rounded-lg bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {{ savingNote ? 'Saving…' : 'Add Note' }}
            </button>
            <p v-if="noteError" class="mt-2 text-[11px] text-red-400">{{ noteError }}</p>

            <div class="mt-4 space-y-3 border-t border-white/5 pt-3">
              <div v-if="!data.welfareNotes.length" class="text-[11px] text-slate-500">No notes yet.</div>
              <div v-for="(note, i) in data.welfareNotes" :key="i" class="text-xs">
                <p class="text-slate-200">{{ note.text }}</p>
                <p class="mt-0.5 text-[10px] text-slate-500">{{ note.author }} &middot; {{ note.dateLabel }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>