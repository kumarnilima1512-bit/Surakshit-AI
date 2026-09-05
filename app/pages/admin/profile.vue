<script setup lang="ts">
import {
  ArrowLeft,
  User,
  Camera,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next'

const router = useRouter()

const loading = ref(true)
const saving = ref(false)
const pictureSaving = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  name: '',
  username: '',
  email: '',
  role: '',
  profilePicture: null as string | null,
})

interface Profile {
  id: number
  email: string
  username: string | null
  name: string | null
  role: string
  createdAt: string
  updatedAt: string
  profilePicture: string | null
}

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      profile: Profile
    }>('/api/admin/profile')

    if (response.success) {
      form.name = response.profile.name || ''
      form.username = response.profile.username || ''
      form.email = response.profile.email
      form.role = response.profile.role
      form.profilePicture = response.profile.profilePicture
    }
  } catch (error: any) {
    console.error('Unable to load profile:', error)

    errorMessage.value =
      error?.data?.statusMessage ||
      'Unable to load administrator profile.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  saving.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message: string
      profile: Profile
    }>('/api/admin/profile', {
      method: 'PUT',
      body: {
        name: form.name.trim(),
        username: form.username.trim(),
        profilePicture: form.profilePicture,
      },
    })

    if (response.success) {
      form.name = response.profile.name || ''
      form.username = response.profile.username || ''
      form.email = response.profile.email
      form.role = response.profile.role
      form.profilePicture = response.profile.profilePicture

      successMessage.value = 'Profile updated successfully.'
    }
  } catch (error: any) {
    console.error('Profile update error:', error)

    errorMessage.value =
      error?.data?.statusMessage ||
      'Unable to update profile.'
  } finally {
    saving.value = false
  }
}

const openFilePicker = () => {
  if (!pictureSaving.value) {
    fileInput.value?.click()
  }
}

const handlePictureChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  errorMessage.value = ''
  successMessage.value = ''

  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Please select a valid image file.'
    target.value = ''
    return
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (!allowedTypes.includes(file.type)) {
    errorMessage.value = 'Only JPG, PNG or WebP images are allowed.'
    target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = 'Profile picture must be smaller than 2MB.'
    target.value = ''
    return
  }

  pictureSaving.value = true

  try {
    const imageData = await new Promise<string>(
      (resolve, reject) => {
        const reader = new FileReader()

        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result)
          } else {
            reject(new Error('Unable to read image'))
          }
        }

        reader.onerror = () => {
          reject(new Error('Unable to read image'))
        }

        reader.readAsDataURL(file)
      },
    )

    const response = await $fetch<{
      success: boolean
      message: string
      profile: Profile
    }>('/api/admin/profile', {
      method: 'PUT',
      body: {
        profilePicture: imageData,
      },
    })

    if (response.success) {
      form.profilePicture = response.profile.profilePicture
      successMessage.value =
        'Profile picture updated successfully.'
    }
  } catch (error: any) {
    console.error('Profile picture update error:', error)

    errorMessage.value =
      error?.data?.statusMessage ||
      'Unable to update profile picture.'
  } finally {
    pictureSaving.value = false
    target.value = ''
  }
}

const removePicture = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  pictureSaving.value = true

  try {
    const response = await $fetch<{
      success: boolean
      message: string
      profile: Profile
    }>('/api/admin/profile', {
      method: 'PUT',
      body: {
        profilePicture: null,
      },
    })

    if (response.success) {
      form.profilePicture = null
      successMessage.value =
        'Profile picture removed successfully.'
    }
  } catch (error: any) {
    console.error('Profile picture removal error:', error)

    errorMessage.value =
      error?.data?.statusMessage ||
      'Unable to remove profile picture.'
  } finally {
    pictureSaving.value = false
  }
}

const getInitials = () => {
  const name = form.name.trim()

  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }

  if (form.username.trim()) {
    return form.username.charAt(0).toUpperCase()
  }

  return 'A'
}

const goBack = () => {
  router.back()
}

onMounted(loadProfile)
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-4 py-4 backdrop-blur sm:px-6"
    >
      <div class="flex items-center gap-4">
        <button
          type="button"
          @click="goBack"
          class="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#07111f] text-slate-400 transition hover:bg-white/5 hover:text-white"
          title="Go back"
        >
          <ArrowLeft :size="19" />
        </button>

```
    <div>
      <h1 class="text-xl font-semibold sm:text-2xl">
        Administrator Profile
      </h1>

      <p class="mt-1 text-sm text-slate-400">
        Manage your profile information and profile picture
      </p>
    </div>
  </div>
</header>

<main class="mx-auto w-full max-w-4xl p-4 sm:p-6">
  <!-- Loading -->
  <div
    v-if="loading"
    class="rounded-xl border border-white/10 bg-[#0d1b2d] p-10 text-center text-slate-400"
  >
    Loading profile...
  </div>

  <template v-else>
    <!-- Success -->
    <div
      v-if="successMessage"
      class="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400"
    >
      <CheckCircle2
        :size="18"
        class="mt-0.5 shrink-0"
      />

      <span>{{ successMessage }}</span>
    </div>

    <!-- Error -->
    <div
      v-if="errorMessage"
      class="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
    >
      <AlertCircle
        :size="18"
        class="mt-0.5 shrink-0"
      />

      <span>{{ errorMessage }}</span>
    </div>

    <!-- Profile Picture -->
    <section
      class="mb-6 rounded-xl border border-white/10 bg-[#0d1b2d]"
    >
      <div class="border-b border-white/10 p-5 sm:p-6">
        <h2 class="font-semibold">
          Profile Picture
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          Add, change or remove your administrator profile picture
        </p>
      </div>

      <div
        class="flex flex-col items-center gap-5 p-6 sm:flex-row"
      >
        <!-- Avatar -->
        <div
          class="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/30 bg-[#07111f] text-3xl font-semibold text-emerald-400"
        >
          <img
            v-if="form.profilePicture"
            :src="form.profilePicture"
            alt="Administrator profile picture"
            class="h-full w-full object-cover"
          />

          <span v-else>
            {{ getInitials() }}
          </span>

          <div
            v-if="pictureSaving"
            class="absolute inset-0 flex items-center justify-center bg-black/60"
          >
            <RefreshCw
              :size="24"
              class="animate-spin text-white"
            />
          </div>
        </div>

        <!-- Controls -->
        <div class="text-center sm:text-left">
          <h3 class="font-medium text-slate-200">
            {{ form.name || form.username || 'Administrator' }}
          </h3>

          <p class="mt-1 text-sm text-slate-500">
            JPG, PNG or WebP · Maximum 2MB
          </p>

          <div
            class="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="handlePictureChange"
            />

            <button
              type="button"
              :disabled="pictureSaving"
              @click="openFilePicker"
              class="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Camera :size="17" />

              {{
                form.profilePicture
                  ? 'Change Photo'
                  : 'Upload Photo'
              }}
            </button>

            <button
              v-if="form.profilePicture"
              type="button"
              :disabled="pictureSaving"
              @click="removePicture"
              class="flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 :size="17" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Personal Information -->
    <section
      class="mb-6 rounded-xl border border-white/10 bg-[#0d1b2d]"
    >
      <div class="border-b border-white/10 p-5 sm:p-6">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400"
          >
            <User :size="20" />
          </div>

          <div>
            <h2 class="font-semibold">
              Personal Information
            </h2>

            <p class="text-sm text-slate-500">
              Update your profile details
            </p>
          </div>
        </div>
      </div>

      <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <!-- Name -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-slate-300"
          >
            Full Name
          </label>

          <input
            v-model="form.name"
            type="text"
            placeholder="Enter your name"
            class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
          />
        </div>

        <!-- Username -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-slate-300"
          >
            Username
          </label>

          <input
            v-model="form.username"
            type="text"
            placeholder="Enter username"
            class="w-full rounded-lg border border-white/10 bg-[#07111f] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
          />
        </div>

        <!-- Email -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-slate-300"
          >
            Email Address
          </label>

          <input
            :value="form.email"
            type="email"
            disabled
            class="w-full cursor-not-allowed rounded-lg border border-white/10 bg-[#07111f]/60 px-4 py-2.5 text-sm text-slate-500 outline-none"
          />

          <p class="mt-1.5 text-xs text-slate-600">
            Email can be changed from Account Settings.
          </p>
        </div>

        <!-- Role -->
        <div>
          <label
            class="mb-2 block text-sm font-medium text-slate-300"
          >
            Role
          </label>

          <input
            :value="form.role"
            type="text"
            disabled
            class="w-full cursor-not-allowed rounded-lg border border-white/10 bg-[#07111f]/60 px-4 py-2.5 text-sm uppercase text-slate-500 outline-none"
          />
        </div>
      </div>
    </section>

    <!-- Save -->
    <div class="flex justify-end">
      <button
        type="button"
        :disabled="saving"
        @click="saveProfile"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        <Save :size="17" />

        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </template>
</main>


  </div>
</template>
