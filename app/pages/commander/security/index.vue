<!--
  pages/commander/security/index.vue
  URL: /commander/security  (sidebar label: "Security")
  Nuxt 3 + Composition API + Tailwind, same visual language as the
  Commander dashboard.
  Install once:
    npm install lucide-vue-next
-->

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import {
  Home,
  Users,
  AlertTriangle,
  ClipboardList,
  FileText,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  Search,
  Bell as BellIcon,
  Moon,
  ChevronDown,
  KeyRound,
  Smartphone,
  History,
  Monitor,
  RotateCw,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   ----------------------------------------------------------------------
   GET  /api/commander/security                    -> SecurityData
   POST /api/commander/security/change-password      { currentPassword, newPassword } -> { ok: true }
   POST /api/commander/security/2fa                   { enabled: boolean } -> { ok: true }
   POST /api/commander/security/sessions/:id/revoke    -> { ok: true }
   ====================================================================== */

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface LoginRecord {
  device: string
  location: string
  timeLabel: string
  status: 'Success' | 'Failed'
}

interface Session {
  id: string
  device: string
  location: string
  lastActiveLabel: string
  current: boolean
}

interface SecurityData {
  commander: CommanderHeader
  twoFactorEnabled: boolean
  loginHistory: LoginRecord[]
  activeSessions: Session[]
}

/* ---------------- Data fetching ---------------- */
const { data, pending: loading, error, refresh: fetchSecurity } =
  await useFetch<SecurityData>('/api/commander/security')

/* ---------------- Sidebar / header shell ---------------- */
const route = useRoute()
interface NavItem { label: string; to: string; icon: LucideIcon }
const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/commander/dashboard', icon: Home },
  { label: 'My Personnel', to: '/commander/personnel', icon: Users },
  { label: 'Risk Alerts', to: '/commander/alerts', icon: AlertTriangle },
  { label: 'Follow-ups', to: '/commander/follow-ups', icon: ClipboardList },
  { label: 'Unit Reports', to: '/commander/reports', icon: FileText },
  { label: 'My Profile', to: '/commander/profile', icon: User },
  { label: 'Security', to: '/commander/security', icon: ShieldCheck },
]
function isActive(to: string) { return route.path === to || route.path.startsWith(`${to}/`) }
async function logout() { await useFetch('/api/auth/logout', { method: 'POST' }); await navigateTo('/login') }
const topSearchQuery = ref('')
function submitTopSearch() {
  const q = topSearchQuery.value.trim()
  if (!q) return
  navigateTo({ path: '/commander/search', query: { q } })
}
const profileOpen = ref(false)
function toggleProfile() { profileOpen.value = !profileOpen.value }
async function handleProfileAction(action: 'Profile' | 'Security' | 'Logout') {
  profileOpen.value = false
  if (action === 'Logout') return logout()
  await navigateTo(`/commander/${action.toLowerCase()}`)
}
function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('[data-dropdown-root]')) profileOpen.value = false
}
onMounted(() => window.addEventListener('click', handleOutsideClick))
onUnmounted(() => window.removeEventListener('click', handleOutsideClick))

/* ---------------- Change password (real action) ---------------- */
const pwForm = reactive({ current: '', next: '', confirm: '' })
const changingPassword = ref(false)
const pwError = ref<string | null>(null)
const pwSuccess = ref(false)

async function changePassword() {
  pwError.value = null
  pwSuccess.value = false
  if (!pwForm.current || !pwForm.next) {
    pwError.value = 'Please fill in both password fields.'
    return
  }
  if (pwForm.next !== pwForm.confirm) {
    pwError.value = 'New password and confirmation do not match.'
    return
  }
  changingPassword.value = true
  try {
    await $fetch('/api/commander/security/change-password', {
      method: 'POST',
      body: { currentPassword: pwForm.current, newPassword: pwForm.next },
    })
    pwForm.current = ''
    pwForm.next = ''
    pwForm.confirm = ''
    pwSuccess.value = true
  } catch {
    pwError.value = 'Could not change your password. Please check your current password and try again.'
  } finally {
    changingPassword.value = false
  }
}

/* ---------------- 2FA toggle (real action) ---------------- */
const togglingTwoFactor = ref(false)
async function toggleTwoFactor() {
  if (!data.value) return
  togglingTwoFactor.value = true
  const nextState = !data.value.twoFactorEnabled
  try {
    await $fetch('/api/commander/security/2fa', { method: 'POST', body: { enabled: nextState } })
    data.value.twoFactorEnabled = nextState
  } catch {
    // Leave state unchanged on failure.
  } finally {
    togglingTwoFactor.value = false
  }
}

/* ---------------- Revoke session (real action) ---------------- */
const revokingId = ref<string | null>(null)
async function revokeSession(id: string) {
  if (!data.value) return
  revokingId.value = id
  try {
    await $fetch(`/api/commander/security/sessions/${id}/revoke`, { method: 'POST' })
    data.value.activeSessions = data.value.activeSessions.filter((s) => s.id !== id)
  } catch {
    // Leave the session in place; button re-enables so the commander can retry.
  } finally {
    revokingId.value = null
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
          <div class="relative border-l border-white/10 pl-4" data-dropdown-root>
            <button type="button" @click.stop="toggleProfile" class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-700">
                <img v-if="data?.commander.avatarUrl" :src="data.commander.avatarUrl" class="h-full w-full object-cover" alt="">
                <User v-else :size="16" :stroke-width="1.5" class="text-slate-300" />
              </div>
              <div class="text-left leading-tight">
                <p class="text-sm font-semibold text-white">{{ data?.commander.rank }} {{ data?.commander.name }}</p>
                <p class="text-[11px] text-slate-400">Commander</p>
              </div>
              <ChevronDown :size="14" class="text-slate-500 transition-transform" :class="{ 'rotate-180': profileOpen }" />
            </button>
            <div v-if="profileOpen" class="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl">
              <button v-for="action in (['Profile', 'Security', 'Logout'] as const)" :key="action" type="button" @click="handleProfileAction(action)" class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white">{{ action }}</button>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 space-y-4 p-6">
        <div>
          <h1 class="text-xl font-extrabold tracking-tight text-white">Security</h1>
          <p class="mt-0.5 text-xs text-slate-400">Manage your password, two-factor authentication, and active sessions</p>
        </div>

        <div v-if="loading" class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-16">
          <div class="flex flex-col items-center gap-3 text-slate-400">
            <RotateCw :size="22" class="animate-spin" />
            <p class="text-sm">Loading security settings…</p>
          </div>
        </div>

        <div v-else-if="error" class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-16 text-center">
          <AlertTriangle :size="28" class="text-red-400" :stroke-width="1.5" />
          <p class="text-sm font-semibold text-red-300">Couldn't load security settings</p>
          <p class="text-xs text-slate-400">{{ error.message }} — expected data from <code class="rounded bg-white/5 px-1.5 py-0.5">/api/commander/security</code></p>
          <button type="button" @click="fetchSecurity()" class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500">Retry</button>
        </div>

        <template v-else-if="data">
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <!-- Change password -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <KeyRound :size="16" :stroke-width="1.5" class="text-blue-400" />
                <h3 class="text-sm font-bold text-white">Change Password</h3>
              </div>
              <div class="mt-3 space-y-3">
                <input v-model="pwForm.current" type="password" placeholder="Current password" class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
                <input v-model="pwForm.next" type="password" placeholder="New password" class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
                <input v-model="pwForm.confirm" type="password" placeholder="Confirm new password" class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50">
              </div>
              <p v-if="pwError" class="mt-2 text-[11px] text-red-400">{{ pwError }}</p>
              <p v-if="pwSuccess" class="mt-2 text-[11px] text-emerald-400">Password changed successfully.</p>
              <button type="button" :disabled="changingPassword" @click="changePassword" class="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {{ changingPassword ? 'Updating…' : 'Update Password' }}
              </button>
            </div>

            <!-- Two-factor authentication -->
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <Smartphone :size="16" :stroke-width="1.5" class="text-emerald-400" />
                <h3 class="text-sm font-bold text-white">Two-Factor Authentication</h3>
              </div>
              <p class="mt-3 text-xs leading-relaxed text-slate-400">
                Adds a one-time code from your authenticator app on top of your password when signing in.
              </p>
              <div class="mt-4 flex items-center justify-between rounded-xl border border-white/5 p-3.5">
                <div class="flex items-center gap-2">
                  <span class="h-2 w-2 rounded-full" :class="data.twoFactorEnabled ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                  <span class="text-xs font-semibold text-slate-200">{{ data.twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
                </div>
                <button
                  type="button" :disabled="togglingTwoFactor" @click="toggleTwoFactor"
                  class="rounded-lg px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                  :class="data.twoFactorEnabled ? 'border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-500'"
                >
                  {{ togglingTwoFactor ? 'Saving…' : (data.twoFactorEnabled ? 'Disable' : 'Enable') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Login history + Active sessions -->
          <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <History :size="16" :stroke-width="1.5" class="text-blue-400" />
                <h3 class="text-sm font-bold text-white">Recent Login Activity</h3>
              </div>
              <div class="mt-3 overflow-x-auto">
                <table class="w-full min-w-[340px] text-left text-xs">
                  <thead>
                    <tr class="text-slate-500">
                      <th class="pb-2 font-medium">Device</th>
                      <th class="pb-2 font-medium">Location</th>
                      <th class="pb-2 font-medium">Time</th>
                      <th class="pb-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!data.loginHistory.length">
                      <td colspan="4" class="py-4 text-center text-slate-500">No recent activity.</td>
                    </tr>
                    <tr v-for="(entry, i) in data.loginHistory" :key="i" class="border-t border-white/5">
                      <td class="py-2.5 text-slate-300">{{ entry.device }}</td>
                      <td class="py-2.5 text-slate-400">{{ entry.location }}</td>
                      <td class="py-2.5 text-slate-500">{{ entry.timeLabel }}</td>
                      <td class="py-2.5 text-right font-semibold" :class="entry.status === 'Success' ? 'text-emerald-400' : 'text-red-400'">{{ entry.status }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="rounded-2xl border border-white/5 bg-[#0d1526] p-5">
              <div class="flex items-center gap-2">
                <Monitor :size="16" :stroke-width="1.5" class="text-violet-400" />
                <h3 class="text-sm font-bold text-white">Active Sessions</h3>
              </div>
              <div class="mt-3 space-y-2.5">
                <div v-if="!data.activeSessions.length" class="text-xs text-slate-500">No other active sessions.</div>
                <div v-for="s in data.activeSessions" :key="s.id" class="flex items-center justify-between rounded-xl border border-white/5 p-3">
                  <div>
                    <p class="flex items-center gap-2 text-xs font-semibold text-slate-200">
                      {{ s.device }}
                      <span v-if="s.current" class="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">This device</span>
                    </p>
                    <p class="mt-0.5 text-[11px] text-slate-500">{{ s.location }} &middot; {{ s.lastActiveLabel }}</p>
                  </div>
                  <button
                    v-if="!s.current"
                    type="button" :disabled="revokingId === s.id" @click="revokeSession(s.id)"
                    class="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >{{ revokingId === s.id ? 'Revoking…' : 'Revoke' }}</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>
  </div>
</template>