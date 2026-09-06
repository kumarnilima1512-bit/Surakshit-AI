<script setup lang="ts">
import {
  Search,
  Plus,
  Users,
  Shield,
  User,
  MoreVertical,
  RefreshCw,
  Pencil,
  Trash2,
} from 'lucide-vue-next'

interface UserData {
  id: number
  email: string
  username: string | null
  name: string | null
  role: 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'
}

const users = ref<UserData[]>([])
const loading = ref(true)
const search = ref('')
const roleFilter = ref('ALL')
const error = ref('')
const openMenu = ref<number | null>(null)

const filteredUsers = computed(() => {
  const query = search.value.toLowerCase().trim()

  return users.value.filter((user) => {
    const matchesSearch =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)

    const matchesRole =
      roleFilter.value === 'ALL' || user.role === roleFilter.value

    return matchesSearch && matchesRole
  })
})

const roleClass = (role: string) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    case 'COMMANDER':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    case 'OFFICER':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    default:
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
}

const loadUsers = async () => {
  loading.value = true
  error.value = ''
  openMenu.value = null

  try {
    const response = await $fetch<{
      success: boolean
      users: UserData[]
    }>('/api/admin/user')

    users.value = response.users
  } catch (err) {
    console.error(err)
    error.value = 'Unable to load users'
  } finally {
    loading.value = false
  }
}

const goToCreateUser = () => {
  navigateTo('/admin/users/create')
}

const toggleMenu = (userId: number) => {
  openMenu.value = openMenu.value === userId ? null : userId
}

const editUser = (user: UserData) => {
  openMenu.value = null

  navigateTo({
    path: `/admin/users/${user.id}/edit`,
  })
}

const deleteUser = (user: UserData) => {
  openMenu.value = null

  console.log('Delete user:', user.id)

  // DELETE API will be connected here later.
}

const closeMenu = () => {
  openMenu.value = null
}

onMounted(loadUsers)
</script>

<template>
  <div
    class="min-h-screen bg-[#07111f] text-white"
    @click="closeMenu"
  >
    <!-- Header -->
    <header
      class="border-b border-white/10 bg-[#0a1626]/95 px-6 py-4 backdrop-blur"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold">
            All Users
          </h1>

          <p class="mt-1 text-sm text-slate-400">
            Manage all registered users and their access roles
          </p>
        </div>

        <button
          @click.stop="goToCreateUser"
          class="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus :size="18" />
          Create User
        </button>
      </div>
    </header>

    <main class="p-6">
      <!-- Summary Cards -->
      <div
        class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <!-- Total -->
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Total Users
            </span>

            <Users
              :size="20"
              class="text-emerald-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.length }}
          </p>
        </div>

        <!-- Admin -->
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Admins
            </span>

            <Shield
              :size="20"
              class="text-red-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.filter(u => u.role === 'ADMIN').length }}
          </p>
        </div>

        <!-- Officers -->
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Officers
            </span>

            <Shield
              :size="20"
              class="text-blue-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.filter(u => u.role === 'OFFICER').length }}
          </p>
        </div>

        <!-- Personnel -->
        <div
          class="rounded-xl border border-white/10 bg-[#0d1b2d] p-5"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-400">
              Personnel
            </span>

            <User
              :size="20"
              class="text-emerald-400"
            />
          </div>

          <p class="mt-3 text-3xl font-semibold">
            {{ users.filter(u => u.role === 'PERSONNEL').length }}
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
            placeholder="Search by name, email or username..."
            class="w-full rounded-lg border border-white/10 bg-[#07111f] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500/50"
          />
        </div>

        <div class="flex gap-2">
          <select
            v-model="roleFilter"
            class="rounded-lg border border-white/10 bg-[#07111f] px-4 py-2.5 text-sm text-slate-300 outline-none"
          >
            <option value="ALL">
              All Roles
            </option>

            <option value="ADMIN">
              Admin
            </option>

            <option value="COMMANDER">
              Commander
            </option>

            <option value="OFFICER">
              Officer
            </option>

            <option value="PERSONNEL">
              Personnel
            </option>
          </select>

          <button
            @click.stop="loadUsers"
            class="rounded-lg border border-white/10 bg-[#07111f] px-3 text-slate-400 transition hover:text-white"
            title="Refresh"
          >
            <RefreshCw :size="18" />
          </button>
        </div>
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
        class="overflow-visible rounded-xl border border-white/10 bg-[#0d1b2d]"
      >
        <!-- Loading -->
        <div
          v-if="loading"
          class="p-10 text-center text-slate-400"
        >
          Loading users...
        </div>

        <!-- Empty -->
        <div
          v-else-if="filteredUsers.length === 0"
          class="p-10 text-center text-slate-500"
        >
          No users found.
        </div>

        <!-- Users -->
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
                  User
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Email
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Username
                </th>

                <th
                  class="px-5 py-4 text-xs font-medium uppercase text-slate-500"
                >
                  Role
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
                v-for="user in filteredUsers"
                :key="user.id"
                class="transition hover:bg-white/[0.025]"
              >
                <!-- User -->
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-400"
                    >
                      {{
                        (user.name ||
                          user.username ||
                          user.email ||
                          '?')
                          .charAt(0)
                          .toUpperCase()
                      }}
                    </div>

                    <div>
                      <p class="font-medium text-slate-200">
                        {{ user.name || 'Unnamed User' }}
                      </p>
                    </div>
                  </div>
                </td>

                <!-- Email -->
                <td
                  class="px-5 py-4 text-sm text-slate-400"
                >
                  {{ user.email || '—' }}
                </td>

                <!-- Username -->
                <td
                  class="px-5 py-4 text-sm text-slate-400"
                >
                  {{ user.username || '—' }}
                </td>

                <!-- Role -->
                <td class="px-5 py-4">
                  <span
                    class="rounded-full border px-2.5 py-1 text-xs font-medium"
                    :class="roleClass(user.role)"
                  >
                    {{ user.role }}
                  </span>
                </td>

                <!-- ID -->
                <td
                  class="px-5 py-4 text-sm text-slate-500"
                >
                  #{{ user.id }}
                </td>

                <!-- Action -->
                <td class="relative px-5 py-4">
                  <div class="relative">
                    <button
                      @click.stop="toggleMenu(user.id)"
                      class="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                      title="Actions"
                    >
                      <MoreVertical :size="18" />
                    </button>

                    <!-- Dropdown -->
                    <div
                      v-if="openMenu === user.id"
                      class="absolute right-0 top-11 z-[100] w-36 overflow-hidden rounded-lg border border-white/10 bg-[#111f32] shadow-2xl"
                    >
                      <button
                        @click.stop="editUser(user)"
                        class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
                      >
                        <Pencil :size="15" />
                        Edit
                      </button>

                      <button
                        @click.stop="deleteUser(user)"
                        class="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 :size="15" />
                        Delete
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="mt-3 text-xs text-slate-600">
        Showing {{ filteredUsers.length }} of
        {{ users.length }} users
      </p>
    </main>
  </div>
</template>