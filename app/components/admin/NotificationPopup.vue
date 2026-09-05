<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Bell,
  Check,
  ShieldAlert,
  UserPlus,
  Activity,
  X,
} from 'lucide-vue-next'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  type: 'alert' | 'user' | 'assessment' | 'system'
  unread: boolean
}

const emit = defineEmits<{
  close: []
}>()

const notifications = ref<Notification[]>([
  {
    id: 1,
    title: 'High Risk Assessment',
    message: 'A personnel assessment has been marked as High Risk.',
    time: '5 min ago',
    type: 'alert',
    unread: true,
  },
  {
    id: 2,
    title: 'New Personnel Added',
    message: 'A new personnel account was successfully created.',
    time: '18 min ago',
    type: 'user',
    unread: true,
  },
  {
    id: 3,
    title: 'Assessment Completed',
    message: 'A new stress assessment has been completed.',
    time: '1 hour ago',
    type: 'assessment',
    unread: false,
  },
  {
    id: 4,
    title: 'System Update',
    message: 'Surakshit AI system monitoring is running normally.',
    time: '2 hours ago',
    type: 'system',
    unread: false,
  },
])

const markAllRead = () => {
  notifications.value = notifications.value.map((notification) => ({
    ...notification,
    unread: false,
  }))
}

const markAsRead = (notification: Notification) => {
  notification.unread = false
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'alert':
      return ShieldAlert
    case 'user':
      return UserPlus
    case 'assessment':
      return Activity
    case 'system':
      return Check
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
    <div
      class="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1b2d] shadow-2xl shadow-black/40"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between border-b border-white/10 px-4 py-3"
      >
        <div>
          <div class="flex items-center gap-2">
            <Bell class="h-4 w-4 text-emerald-400" />

            <h3 class="text-sm font-semibold text-white">
              Notifications
            </h3>

            <span
              v-if="notifications.some((item) => item.unread)"
              class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400"
            >
              {{ notifications.filter((item) => item.unread).length }} new
            </span>
          </div>

          <p class="mt-1 text-[11px] text-slate-500">
            Recent system activity
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
          aria-label="Close notifications"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Actions -->
      <div class="flex justify-end border-b border-white/10 px-4 py-2">
        <button
          type="button"
          class="text-[11px] font-medium text-emerald-400 transition hover:text-emerald-300"
          @click="markAllRead"
        >
          Mark all as read
        </button>
      </div>

      <!-- Notification list -->
      <div class="max-h-[360px] overflow-y-auto">
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="group flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/[0.03]"
          :class="notification.unread ? 'bg-emerald-500/[0.025]' : ''"
          @click="markAsRead(notification)"
        >
          <!-- Icon -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            :class="
              notification.type === 'alert'
                ? 'bg-red-500/10 text-red-400'
                : notification.type === 'user'
                  ? 'bg-blue-500/10 text-blue-400'
                  : notification.type === 'assessment'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-500/10 text-slate-400'
            "
          >
            <component
              :is="getIcon(notification.type)"
              class="h-4 w-4"
            />
          </div>

          <!-- Content -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p
                class="truncate text-xs font-semibold"
                :class="
                  notification.unread
                    ? 'text-white'
                    : 'text-slate-300'
                "
              >
                {{ notification.title }}
              </p>

              <span
                v-if="notification.unread"
                class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
              />
            </div>

            <p class="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
              {{ notification.message }}
            </p>

            <p class="mt-1.5 text-[10px] text-slate-600">
              {{ notification.time }}
            </p>
          </div>
        </button>

        <!-- Empty state -->
        <div
          v-if="notifications.length === 0"
          class="px-4 py-10 text-center"
        >
          <Bell class="mx-auto h-6 w-6 text-slate-600" />

          <p class="mt-2 text-xs font-medium text-slate-400">
            No notifications
          </p>

          <p class="mt-1 text-[10px] text-slate-600">
            You're all caught up.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-white/10 px-4 py-3 text-center">
        <button
          type="button"
          class="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          View all notifications
        </button>
      </div>
    </div>
  </div>
</template>