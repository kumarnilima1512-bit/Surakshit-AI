<script setup lang="ts">
import {
  ArrowLeft,
  Shield,
  Users,
  UserCog,
  Lock,
  Check,
} from 'lucide-vue-next'

type Role = 'ADMIN' | 'COMMANDER' | 'OFFICER' | 'PERSONNEL'

const roles: {
  value: Role
  label: string
  description: string
}[] = [
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Full system administration and user management',
  },
  {
    value: 'COMMANDER',
    label: 'Commander',
    description: 'Command-level personnel and welfare monitoring',
  },
  {
    value: 'OFFICER',
    label: 'Officer',
    description: 'Officer-level monitoring and personnel access',
  },
  {
    value: 'PERSONNEL',
    label: 'Personnel',
    description: 'Personal assessment and welfare information',
  },
]

const permissions = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'View system dashboard',
  },
  {
    key: 'users',
    label: 'User Management',
    description: 'View and manage registered users',
  },
  {
    key: 'create_user',
    label: 'Create Users',
    description: 'Create new user accounts',
  },
  {
    key: 'assessments',
    label: 'Assessments',
    description: 'View stress and welfare assessments',
  },
  {
    key: 'reports',
    label: 'Reports',
    description: 'View personnel and welfare reports',
  },
  {
    key: 'settings',
    label: 'System Settings',
    description: 'Manage system configuration',
  },
]

const selectedRole = ref<Role>('ADMIN')

const permissionMap: Record<Role, string[]> = {
  ADMIN: [
    'dashboard',
    'users',
    'create_user',
    'assessments',
    'reports',
    'settings',
  ],
  COMMANDER: [
    'dashboard',
    'users',
    'assessments',
    'reports',
  ],
  OFFICER: [
    'dashboard',
    'assessments',
    'reports',
  ],
  PERSONNEL: [
    'dashboard',
    'assessments',
  ],
}

const currentRole = computed(() =>
  roles.find((role) => role.value === selectedRole.value)
)

const hasPermission = (permission: string) => {
  return permissionMap[selectedRole.value].includes(permission)
}

const goBack = () => {
  navigateTo('/admin/dashboard')
}
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
          <h1 class="text-2xl font-semibold">Roles & Permissions</h1>
          <p class="mt-1 text-sm text-slate-400">
            Manage access levels and system permissions
          </p>
        </div>
      </div>
    </header>

    <main class="p-6">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Roles -->
        <section class="lg:col-span-4">
          <div
            class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
          >
            <div class="border-b border-white/10 p-5">
              <div class="flex items-center gap-3">
                <Shield :size="20" class="text-emerald-400" />

                <div>
                  <h2 class="font-semibold">System Roles</h2>
                  <p class="text-xs text-slate-500">
                    Select a role to view permissions
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-2 p-3">
              <button
                v-for="role in roles"
                :key="role.value"
                @click="selectedRole = role.value"
                class="w-full rounded-lg border p-4 text-left transition"
                :class="
                  selectedRole === role.value
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                "
              >
                <div class="flex items-start gap-3">
                  <div
                    class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    :class="
                      selectedRole === role.value
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/5 text-slate-500'
                    "
                  >
                    <Shield :size="18" />
                  </div>

                  <div class="min-w-0">
                    <p class="font-medium text-slate-200">
                      {{ role.label }}
                    </p>

                    <p class="mt-1 text-xs leading-5 text-slate-500">
                      {{ role.description }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </section>

        <!-- Permissions -->
        <section class="lg:col-span-8">
          <div
            class="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2d]"
          >
            <div class="border-b border-white/10 p-5">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h2 class="font-semibold">
                    {{ currentRole?.label }} Permissions
                  </h2>

                  <p class="mt-1 text-sm text-slate-500">
                    {{ currentRole?.description }}
                  </p>
                </div>

                <div
                  class="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                >
                  {{ permissionMap[selectedRole].length }}
                  permissions
                </div>
              </div>
            </div>

            <div class="divide-y divide-white/5">
              <div
                v-for="permission in permissions"
                :key="permission.key"
                class="flex items-center justify-between gap-4 p-5"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center rounded-lg"
                    :class="
                      hasPermission(permission.key)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/5 text-slate-600'
                    "
                  >
                    <Lock :size="17" />
                  </div>

                  <div>
                    <p class="font-medium text-slate-300">
                      {{ permission.label }}
                    </p>

                    <p class="mt-1 text-xs text-slate-600">
                      {{ permission.description }}
                    </p>
                  </div>
                </div>

                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  :class="
                    hasPermission(permission.key)
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/10 bg-white/[0.02] text-slate-700'
                  "
                >
                  <Check
                    v-if="hasPermission(permission.key)"
                    :size="15"
                  />
                </div>
              </div>
            </div>

            <!-- Notice -->
            <div class="border-t border-white/10 p-5">
              <div
                class="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4"
              >
                <UserCog
                  :size="18"
                  class="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p class="text-sm text-slate-400">
                    Role-based access control
                  </p>

                  <p class="mt-1 text-xs leading-5 text-slate-600">
                    Permissions shown here represent the current access policy
                    for each system role.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>