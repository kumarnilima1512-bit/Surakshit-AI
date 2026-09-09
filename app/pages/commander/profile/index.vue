<script setup lang="ts">
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'

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
  Camera,
  RotateCw,
  X,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-vue-next'

/* ======================================================================
   API CONTRACT
   GET  /api/commander/profile
   PUT  /api/commander/profile
   ====================================================================== */

interface CommanderHeader {
  name: string
  rank: string
  avatarUrl: string | null
}

interface ProfileData {
  name: string
  rank: string
  serviceId: string
  unitName: string
  unitCode: string
  email: string
  phone: string
  joinedDate: string
  avatarUrl: string | null
}

/* ---------------- Data fetching ---------------- */

const {
  data,
  pending: loading,
  error,
  refresh: fetchProfile,
} = await useFetch<ProfileData>('/api/commander/profile')

/* ---------------- Sidebar / header shell ---------------- */

const route = useRoute()

const sidebarOpen = ref(false)

function closeSidebar() {
  sidebarOpen.value = false
}

function goBack() {
  navigateTo('/commander/dashboard')
}

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/commander/dashboard',
    icon: Home,
  },
  {
    label: 'My Personnel',
    to: '/commander/personnel',
    icon: Users,
  },
  {
    label: 'Risk Alerts',
    to: '/commander/alerts',
    icon: AlertTriangle,
  },
  {
    label: 'Follow-ups',
    to: '/commander/follow-ups',
    icon: ClipboardList,
  },
  {
    label: 'Unit Reports',
    to: '/commander/reports',
    icon: FileText,
  },
  {
    label: 'My Profile',
    to: '/commander/profile',
    icon: User,
  },
  {
    label: 'Security',
    to: '/commander/security',
    icon: ShieldCheck,
  },
]

function isActive(to: string) {
  return (
    route.path === to ||
    route.path.startsWith(`${to}/`)
  )
}

async function logout() {
  await useFetch('/api/auth/logout', {
    method: 'POST',
  })

  await navigateTo('/login')
}

/* ---------------- Top search ---------------- */

const topSearchQuery = ref('')

function submitTopSearch() {
  const q = topSearchQuery.value.trim()

  if (!q) return

  navigateTo({
    path: '/commander/search',
    query: { q },
  })
}

/* ---------------- Profile dropdown ---------------- */

const profileOpen = ref(false)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

async function handleProfileAction(
  action: 'Profile' | 'Security' | 'Logout',
) {
  profileOpen.value = false

  if (action === 'Logout') {
    return logout()
  }

  await navigateTo(
    `/commander/${action.toLowerCase()}`,
  )
}

function handleOutsideClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (
    !target.closest('[data-dropdown-root]')
  ) {
    profileOpen.value = false
  }
}

/* Close mobile sidebar whenever route changes */
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false
    profileOpen.value = false
  },
)

onMounted(() => {
  window.addEventListener(
    'click',
    handleOutsideClick,
  )
})

onUnmounted(() => {
  window.removeEventListener(
    'click',
    handleOutsideClick,
  )
})

/* ---------------- Edit form ---------------- */

const form = reactive({
  name: '',
  phone: '',
  email: '',
})

const editing = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saved = ref(false)

/* ---------------- Profile picture ---------------- */

const fileInput =
  ref<HTMLInputElement | null>(null)

const uploadingPhoto = ref(false)
const photoError = ref<string | null>(null)
const photoSuccess = ref(false)

function openPhotoPicker() {
  photoError.value = null
  photoSuccess.value = false

  fileInput.value?.click()
}

function handlePhotoSelected(event: Event) {
  const input =
    event.target as HTMLInputElement

  const file = input.files?.[0]

  if (!file) return

  photoError.value = null
  photoSuccess.value = false

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    photoError.value =
      'Please select a JPEG, PNG, or WebP image.'

    input.value = ''

    return
  }

  const maxSize = 2 * 1024 * 1024

  if (file.size > maxSize) {
    photoError.value =
      'Image size must be 2MB or less.'

    input.value = ''

    return
  }

  const reader = new FileReader()

  reader.onload = async () => {
    const result = reader.result

    if (typeof result !== 'string') {
      photoError.value =
        'Could not read the selected image.'

      input.value = ''

      return
    }

    await uploadProfilePhoto(result)

    input.value = ''
  }

  reader.onerror = () => {
    photoError.value =
      'Could not read the selected image.'

    input.value = ''
  }

  reader.readAsDataURL(file)
}

async function uploadProfilePhoto(
  imageData: string,
) {
  uploadingPhoto.value = true
  photoError.value = null
  photoSuccess.value = false

  try {
    const updated =
      await $fetch<ProfileData>(
        '/api/commander/profile',
        {
          method: 'PUT',
          body: {
            profilePicture: imageData,
          },
        },
      )

    if (data.value) {
      data.value = updated
    }

    photoSuccess.value = true
  } catch (error: any) {
    photoError.value =
      error?.data?.statusMessage ||
      'Could not update your profile picture. Please try again.'
  } finally {
    uploadingPhoto.value = false
  }
}

async function removeProfilePhoto() {
  if (!data.value?.avatarUrl) return

  uploadingPhoto.value = true
  photoError.value = null
  photoSuccess.value = false

  try {
    const updated =
      await $fetch<ProfileData>(
        '/api/commander/profile',
        {
          method: 'PUT',
          body: {
            profilePicture: null,
          },
        },
      )

    if (data.value) {
      data.value = updated
    }

    photoSuccess.value = true
  } catch (error: any) {
    photoError.value =
      error?.data?.statusMessage ||
      'Could not remove your profile picture. Please try again.'
  } finally {
    uploadingPhoto.value = false
  }
}

/* ---------------- Edit profile ---------------- */

function startEdit() {
  if (!data.value) return

  form.name = data.value.name
  form.phone = data.value.phone
  form.email = data.value.email

  saveError.value = null
  saved.value = false
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  saveError.value = null
}

async function saveProfile() {
  if (!data.value) return

  saveError.value = null
  saved.value = false

  const name = form.name.trim()
  const phone = form.phone.trim()
  const email =
    form.email.trim().toLowerCase()

  if (!name || !email) {
    saveError.value =
      'Name and email are required.'

    return
  }

  saving.value = true

  try {
    const updated =
      await $fetch<ProfileData>(
        '/api/commander/profile',
        {
          method: 'PUT',
          body: {
            name,
            phone,
            email,
          },
        },
      )

    data.value = updated

    form.name = updated.name
    form.phone = updated.phone
    form.email = updated.email

    editing.value = false
    saved.value = true
  } catch (error: any) {
    saveError.value =
      error?.data?.statusMessage ||
      'Could not save your profile. Please try again.'
  } finally {
    saving.value = false
  }
}

const ICON_SIZE = 16
</script>

<template>
  <div
    class="relative flex min-h-screen overflow-x-hidden bg-[#0b1220] text-slate-100"
  >

    <!-- ================================================================
         Desktop Sidebar
         ================================================================ -->

    <aside
      class="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[#0d1526] lg:flex"
    >
      <!-- Logo -->
      <div class="flex items-center gap-3 px-5 py-5">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"
        >
          <img
            src="/logos/surakshit-ai.png"
            alt="Surakshit AI"
            class="h-10 w-10 object-contain"
          />
        </div>

        <div class="min-w-0">
          <p
            class="text-sm font-bold leading-tight text-white"
          >
            Surakshit AI
          </p>

          <p
            class="text-[10px] leading-tight text-slate-400"
          >
            Personnel Stress &amp; Welfare Monitoring
          </p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-1 px-3">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
          :class="
            isActive(item.to)
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-white/5'
          "
        >
          <component
            :is="item.icon"
            :size="ICON_SIZE"
            :stroke-width="1.5"
          />

          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div
        class="border-t border-white/5 px-3 py-3"
      >
        <button
          type="button"
          @click="logout"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut
            :size="14"
            :stroke-width="1.5"
          />

          Logout
        </button>
      </div>
    </aside>

    <!-- ================================================================
         Mobile Sidebar Overlay
         ================================================================ -->

    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/60 lg:hidden"
        @click="closeSidebar"
      />
    </Transition>

    <!-- ================================================================
         Mobile Sidebar Drawer
         ================================================================ -->

    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed inset-y-0 left-0 z-50 flex w-[min(82vw,18rem)] flex-col border-r border-white/5 bg-[#0d1526] shadow-2xl lg:hidden"
      >
        <!-- Mobile Logo -->
        <div
          class="flex items-center justify-between border-b border-white/5 px-4 py-4"
        >
          <div
            class="flex min-w-0 items-center gap-3"
          >
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15"
            >
              <img
                src="/logos/surakshit-ai.png"
                alt="Surakshit AI"
                class="h-10 w-10 object-contain"
              />
            </div>

            <div class="min-w-0">
              <p
                class="text-sm font-bold leading-tight text-white"
              >
                Surakshit AI
              </p>

              <p
                class="text-[10px] leading-tight text-slate-400"
              >
                Personnel Stress &amp; Welfare Monitoring
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="closeSidebar"
            class="ml-2 shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Close menu"
          >
            <X :size="18" />
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav
          class="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
            :class="
              isActive(item.to)
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-white/5'
            "
          >
            <component
              :is="item.icon"
              :size="ICON_SIZE"
              :stroke-width="1.5"
            />

            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- Mobile Logout -->
        <div
          class="border-t border-white/5 px-3 py-3"
        >
          <button
            type="button"
            @click="logout"
            class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200"
          >
            <LogOut
              :size="14"
              :stroke-width="1.5"
            />

            Logout
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ================================================================
         Main Area
         ================================================================ -->

    <div
      class="flex min-h-screen min-w-0 flex-1 flex-col"
    >

      <!-- ==============================================================
           Header
           ============================================================== -->

      <header
        class="flex min-w-0 items-center gap-2 border-b border-white/5 bg-[#0d1526] px-3 py-3.5 sm:gap-4 sm:px-6"
      >

        <!-- Mobile Menu -->
        <button
          type="button"
          @click="sidebarOpen = true"
          class="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu :size="20" />
        </button>

        <!-- Desktop menu placeholder -->
        <div class="hidden lg:block lg:w-0" />

        <!-- Search -->
        <form
          class="relative min-w-0 max-w-md flex-1"
          @submit.prevent="submitTopSearch"
        >
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            v-model="topSearchQuery"
            type="text"
            placeholder="Search personnel, unit, or ID..."
            class="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500/50 sm:pr-4"
          />
        </form>

        <!-- Header Right -->
        <div
          class="ml-auto flex shrink-0 items-center gap-1 sm:gap-3 lg:gap-4"
        >

          <!-- Notifications -->
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Notifications"
          >
            <BellIcon
              :size="20"
              :stroke-width="1.5"
            />
          </button>

          <!-- Theme -->
          <button
            type="button"
            class="hidden rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 sm:block"
            aria-label="Toggle theme"
          >
            <Moon
              :size="20"
              :stroke-width="1.5"
            />
          </button>

          <!-- Profile -->
          <div
            class="relative border-l border-white/10 pl-2 sm:pl-3 lg:pl-4"
            data-dropdown-root
          >
            <button
              type="button"
              @click.stop="toggleProfile"
              class="flex items-center gap-2"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700"
              >
                <img
                  v-if="data?.avatarUrl"
                  :src="data.avatarUrl"
                  class="h-full w-full object-cover"
                  alt=""
                />

                <User
                  v-else
                  :size="16"
                  :stroke-width="1.5"
                  class="text-slate-300"
                />
              </div>

              <div
                class="hidden text-left leading-tight md:block"
              >
                <p
                  class="max-w-[150px] truncate text-sm font-semibold text-white"
                >
                  {{ data?.rank }} {{ data?.name }}
                </p>

                <p
                  class="text-[11px] text-slate-400"
                >
                  Commander
                </p>
              </div>

              <ChevronDown
                :size="14"
                class="hidden text-slate-500 transition-transform sm:block"
                :class="{
                  'rotate-180': profileOpen,
                }"
              />
            </button>

            <!-- Profile Dropdown -->
            <div
              v-if="profileOpen"
              class="absolute right-0 z-30 mt-2 w-44 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/10 bg-[#111a2e] p-1.5 shadow-xl"
            >
              <button
                v-for="action in ([
                  'Profile',
                  'Security',
                  'Logout',
                ] as const)"
                :key="action"
                type="button"
                @click="handleProfileAction(action)"
                class="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {{ action }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- ==============================================================
           Content
           ============================================================== -->

      <main
        class="min-w-0 flex-1 space-y-4 p-4 sm:p-6"
      >

        <!-- Page Heading -->
        <div
          class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <!-- Back -->
            <button
              type="button"
              @click="goBack"
              class="mb-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ArrowLeft :size="14" />
              Back
            </button>

            <h1
              class="text-xl font-extrabold tracking-tight text-white"
            >
              My Profile
            </h1>

            <p
              class="mt-0.5 text-xs text-slate-400"
            >
              Your command and contact details
            </p>
          </div>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="flex items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526] p-10 sm:p-16"
        >
          <div
            class="flex flex-col items-center gap-3 text-slate-400"
          >
            <RotateCw
              :size="22"
              class="animate-spin"
            />

            <p class="text-sm">
              Loading profile…
            </p>
          </div>
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          class="flex flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center sm:p-16"
        >
          <AlertTriangle
            :size="28"
            class="text-red-400"
            :stroke-width="1.5"
          />

          <p
            class="text-sm font-semibold text-red-300"
          >
            Couldn't load your profile
          </p>

          <p
            class="max-w-xl text-xs leading-relaxed text-slate-400"
          >
            {{ error.message }} — expected data from
            <code
              class="rounded bg-white/5 px-1.5 py-0.5"
            >
              /api/commander/profile
            </code>
          </p>

          <button
            type="button"
            @click="fetchProfile()"
            class="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Retry
          </button>
        </div>

        <!-- Profile -->
        <div
          v-else-if="data"
          class="w-full max-w-2xl rounded-2xl border border-white/5 bg-[#0d1526] p-4 sm:p-6"
        >

          <!-- Profile Header -->
          <div
            class="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >

            <!-- Avatar -->
            <div
              class="relative shrink-0"
            >

              <div
                class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-slate-700"
              >
                <img
                  v-if="data.avatarUrl"
                  :src="data.avatarUrl"
                  class="h-full w-full object-cover"
                  alt="Commander profile picture"
                />

                <User
                  v-else
                  :size="34"
                  :stroke-width="1.5"
                  class="text-slate-300"
                />
              </div>

              <!-- Hidden File Input -->
              <input
                ref="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                @change="handlePhotoSelected"
              />

              <!-- Camera -->
              <button
                type="button"
                :disabled="uploadingPhoto"
                @click="openPhotoPicker"
                class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#0d1526] text-slate-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Change photo"
              >
                <RotateCw
                  v-if="uploadingPhoto"
                  :size="13"
                  class="animate-spin"
                />

                <Camera
                  v-else
                  :size="13"
                  :stroke-width="1.5"
                />
              </button>

              <!-- Remove -->
              <button
                v-if="
                  data.avatarUrl &&
                  !uploadingPhoto
                "
                type="button"
                @click="removeProfilePhoto"
                class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-red-500/80 text-white hover:bg-red-500"
                aria-label="Remove photo"
              >
                <X :size="12" />
              </button>
            </div>

            <!-- Identity -->
            <div class="min-w-0">
              <p
                class="break-words text-lg font-bold text-white"
              >
                {{ data.rank }} {{ data.name }}
              </p>

              <p
                class="mt-1 break-words text-xs text-slate-400"
              >
                {{ data.unitName }}
                &middot;
                {{ data.unitCode }}
              </p>

              <p
                class="mt-0.5 break-words text-xs text-slate-500"
              >
                Service ID:
                {{ data.serviceId }}
              </p>
            </div>
          </div>

          <!-- Photo Status -->
          <p
            v-if="photoError"
            class="mt-3 break-words text-xs text-red-400"
          >
            {{ photoError }}
          </p>

          <p
            v-if="photoSuccess"
            class="mt-3 text-xs font-medium text-emerald-400"
          >
            Profile picture updated successfully.
          </p>

          <!-- Profile Details -->
          <div
            class="mt-6 border-t border-white/5 pt-5"
          >

            <!-- View Mode -->
            <div
              v-if="!editing"
              class="space-y-4"
            >

              <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >

                <!-- Email -->
                <div class="min-w-0">
                  <p
                    class="text-[11px] text-slate-500"
                  >
                    Email
                  </p>

                  <p
                    class="mt-0.5 break-all text-sm font-medium text-slate-200"
                  >
                    {{ data.email }}
                  </p>
                </div>

                <!-- Phone -->
                <div class="min-w-0">
                  <p
                    class="text-[11px] text-slate-500"
                  >
                    Phone
                  </p>

                  <p
                    class="mt-0.5 break-words text-sm font-medium text-slate-200"
                  >
                    {{
                      data.phone ||
                      'Not provided'
                    }}
                  </p>
                </div>

                <!-- Joined -->
                <div class="min-w-0">
                  <p
                    class="text-[11px] text-slate-500"
                  >
                    Joined
                  </p>

                  <p
                    class="mt-0.5 text-sm font-medium text-slate-200"
                  >
                    {{ data.joinedDate }}
                  </p>
                </div>

                <!-- Unit -->
                <div class="min-w-0">
                  <p
                    class="text-[11px] text-slate-500"
                  >
                    Unit
                  </p>

                  <p
                    class="mt-0.5 break-words text-sm font-medium text-slate-200"
                  >
                    {{ data.unitName }}
                    ({{ data.unitCode }})
                  </p>
                </div>

              </div>

              <!-- Saved -->
              <p
                v-if="saved"
                class="text-xs font-medium text-emerald-400"
              >
                Profile updated.
              </p>

              <!-- Edit Button -->
              <button
                type="button"
                @click="startEdit"
                class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 sm:w-auto"
              >
                Edit Profile
              </button>
            </div>

            <!-- Edit Mode -->
            <div
              v-else
              class="space-y-4"
            >

              <div
                class="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >

                <!-- Name -->
                <div>
                  <label
                    class="text-[11px] text-slate-500"
                  >
                    Full Name
                  </label>

                  <input
                    v-model="form.name"
                    type="text"
                    class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label
                    class="text-[11px] text-slate-500"
                  >
                    Phone
                  </label>

                  <input
                    v-model="form.phone"
                    type="tel"
                    inputmode="tel"
                    autocomplete="tel"
                    placeholder="Enter phone number"
                    class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

                <!-- Email -->
                <div
                  class="sm:col-span-2"
                >
                  <label
                    class="text-[11px] text-slate-500"
                  >
                    Email
                  </label>

                  <input
                    v-model="form.email"
                    type="email"
                    autocomplete="email"
                    class="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500/50"
                  />
                </div>

              </div>

              <!-- Save Error -->
              <p
                v-if="saveError"
                class="text-xs text-red-400"
              >
                {{ saveError }}
              </p>

              <!-- Actions -->
              <div
                class="flex flex-col gap-2 sm:flex-row sm:items-center"
              >

                <button
                  type="button"
                  :disabled="saving"
                  @click="saveProfile"
                  class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
                >
                  {{
                    saving
                      ? 'Saving…'
                      : 'Save Changes'
                  }}
                </button>

                <button
                  type="button"
                  :disabled="saving"
                  @click="cancelEdit"
                  class="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>