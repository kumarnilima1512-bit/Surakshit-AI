<!--
  pages/welfare/profile/index.vue
  URL: /welfare/profile
  Reached by clicking the profile icon / name in the top-right corner
  of any Welfare Officer page (the "Profile" item in that dropdown).
  Nuxt 3 + Composition API + Tailwind, same visual language as the rest
  of the Welfare Officer section.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  Home,
  Users,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  BarChart2,
  FileText,
  User,
  LogOut,
  Menu,
  Search,
  Bell as BellIcon,
  Moon,
  ChevronDown,
  Camera,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET /api/welfare/profile -> ProfileData
   PUT /api/welfare/profile { name, phone, email } -> ProfileData
   ====================================================================== */

interface ProfileData {
  name: string
  role: string
  serviceId: string
  unitName: string
  unitCode: string
  email: string
  phone: string
  joinedDate: string
  lastLoginLabel: string
  avatarUrl: string | null
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchProfile } =
  await useFetch<ProfileData>('/api/welfare/profile')

/* ---------------- Sidebar / header shell (identical to the rest of the section) ---------------- */
const route = useRoute()
interface NavItem { label: string; to: string; icon: LucideIcon }
const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/welfare/dashboard', icon: Home },
  { label: 'Personnel', to: '/welfare/personnel', icon: Users },
  { label: 'High-Risk Cases', to: '/welfare/high-risk-cases', icon: AlertTriangle },
  { label: 'Interventions', to: '/welfare/interventions', icon: ShieldCheck },
  { label: 'Follow-ups', to: '/welfare/follow-ups', icon: ClipboardList },
  { label: 'Analytics', to: '/welfare/analytics', icon: BarChart2 },
  { label: 'Reports', to: '/welfare/reports', icon: FileText },
]
function isActive(to: string) { return route.path === to || route.path.startsWith(`${to}/`) }
async function logout() { await useFetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/login') }
const topSearchQuery = ref('')
function submitTopSearch() {
  const q = topSearchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/welfare/search', query: { q } })
}
const profileOpen = ref(false)
function toggleProfile() { profileOpen.value = !profileOpen.value }
async function handleProfileAction(action: 'Profile' | 'Settings' | 'Logout') {
  profileOpen.value = false
  if (action === 'Logout') return logout()
  await navigateTo(`/welfare/${action.toLowerCase()}`)
}
function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) profileOpen.value = false
}
onMounted(() => window.addEventListener('click', handleOutsideClick))
onUnmounted(() => window.removeEventListener('click', handleOutsideClick))

/* ---------------- Edit form (real action) ---------------- */
const form = reactive({ name: '', phone: '', email: '' })
const editing = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saved = ref(false)

function startEdit() {
  if (!data.value) return
  form.name = data.value.name
  form.phone = data.value.phone
  form.email = data.value.email
  editing.value = true
  saved.value = false
}
function cancelEdit() {
  editing.value = false
  saveError.value = null
}
async function saveProfile() {
  if (!data.value) return
  saving.value = true
  saveError.value = null
  try {
    const updated = await $fetch<ProfileData>('/api/welfare/profile', {
      method: 'PUT',
      body: { name: form.name, phone: form.phone, email: form.email },
    })
    data.value = updated
    editing.value = false
    saved.value = true
  } catch {
    saveError.value = 'Could not save your profile. Please try again.'
  } finally {
    saving.value = false
  }
}

const ICON_SIZE = 16
</script>

<template>
  <div class="flex min-h-screen bg-[#0b1220] text-slate-100">
    <aside class="flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526]">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck :size="19" :stroke-width="1.5" />
        </div>
        <div>
          <p class="text-sm font-bold leading-tight text-white">Surakshit AI</p>
          <p class="text-[10px] leading-tight text-slate-400">Personnel Stress &amp; Welfare Monitoring</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1 px-3">
        <NuxtLink
          v-for="item in navItems" :key="item.label" :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="isActive(item.to) ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-300 hover:bg-white/5'"
        >
          <component :is="item.icon" :size="ICON_SIZE" :stroke-width="1.5" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-white/5 px-3 py-3">
        <button type="button" @click="logout" class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200">
          <LogOut :size="14" :stroke-width="1.5" />
          Logout
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-1 flex-col">
      <header class="flex items-center gap-4 border-b border-white/5 bg-[#0d1526] px-6 py-3.5">
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5" aria-label="Toggle menu"><Menu :size="20" /></button>
        <form class="relative max-w-md flex-1" @submit.prevent="submitTopSearch">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input v-model="topSearchQuery" type="text" placeholder="Search personnel, unit, or ID..." class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
        </form>
        <div class="ml-auto flex items-center gap-4">
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Notifications"><BellIcon :size="20" :stroke-width="1.5" /></button>
          <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200" aria-label="Toggle theme"><Moon :size="20" :stroke-width="1.5" /></button>

          <!-- Profile icon (top-right corner) — this is the entry point into this page -->
          <div class="relative border-l border-white/10 pl-4" data-dropdown-root>
            <button type="button" @click.stop="toggleProfile" class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                <img v-if="data?.avatarUrl" :src="data.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">{{ data?.name ?? '—' }}</p>
                <p class="text-[11px] text-slate-400">{{ data?.role ?? '' }}</p>
              </div>
              <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="{ 'rotate-180': profileOpen }" />
            </button>
            <div v-if="profileOpen" class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl">
              <button v-for="action in (['Profile', 'Settings', 'Logout'] as const)" :key="action" type="button" @click="handleProfileAction(action)" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">{{ action }}</button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-4 p-6">
        <div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">My Profile</h1>
          <p class="mt-0.5 text-xs text-slate-400">Your role and contact details</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading profile…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load your profile</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/welfare/profile</code></p>
          <button type="button" @click="fetchProfile()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <div v-else-if="data" class="max-w-2xl rounded-2xl border border-white/5 bg-[#0d1526] p-6">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                <img v-if="data.avatarUrl" :src="data.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="34" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <button type="button" class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0d1526] text-slate-300 hover:bg-white/10" aria-label="Change photo">
                <Camera :size="13" :stroke-width="1.5" />
              </button>
            </div>
            <div>
              <p class="text-lg font-bold text-white">{{ data.name }}</p>
              <p class="text-xs text-slate-400">{{ data.role }} &middot; {{ data.unitName }}</p>
              <p class="mt-0.5 text-xs text-slate-500">Service ID: {{ data.serviceId }}</p>
            </div>
          </div>

          <div class="mt-6 border-t border-white/5 pt-5">
            <div v-if="!editing" class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p class="text-[11px] text-slate-500">Email</p>
                  <p class="mt-0.5 text-sm font-medium text-slate-200">{{ data.email }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500">Phone</p>
                  <p class="mt-0.5 text-sm font-medium text-slate-200">{{ data.phone }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500">Joined</p>
                  <p class="mt-0.5 text-sm font-medium text-slate-200">{{ data.joinedDate }}</p>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500">Assigned Unit</p>
                  <p class="mt-0.5 text-sm font-medium text-slate-200">{{ data.unitName }} ({{ data.unitCode }})</p>
                </div>
                <div>
                  <p class="text-[11px] text-slate-500">Last Login</p>
                  <p class="mt-0.5 text-sm font-medium text-slate-200">{{ data.lastLoginLabel }}</p>
                </div>
              </div>
              <p v-if="saved" class="text-xs font-medium text-emerald-400">Profile updated.</p>
              <button type="button" @click="startEdit" class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Edit Profile</button>
            </div>

            <div v-else class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label class="text-[11px] text-slate-500">Full Name</label>
                  <input v-model="form.name" type="text" class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50">
                </div>
                <div>
                  <label class="text-[11px] text-slate-500">Phone</label>
                  <input v-model="form.phone" type="tel" class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50">
                </div>
                <div class="sm:col-span-2">
                  <label class="text-[11px] text-slate-500">Email</label>
                  <input v-model="form.email" type="email" class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50">
                </div>
              </div>
              <p v-if="saveError" class="text-xs text-red-400">{{ saveError }}</p>
              <div class="flex items-center gap-2">
                <button type="button" :disabled="saving" @click="saveProfile" class="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                  {{ saving ? 'Saving…' : 'Save Changes' }}
                </button>
                <button type="button" @click="cancelEdit" class="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>