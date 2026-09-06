<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  ShieldAlert,
  ArrowLeft,
  Check,
  RotateCw,
} from 'lucide-vue-next'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationsResponse {
  success: boolean
  notifications: NotificationItem[]
}

const {
  data,
  pending,
  error,
  refresh: refreshNotifications,
} = await useFetch<NotificationsResponse>('/api/personnel/notifications')

const notifications = computed(
  () => data.value?.notifications ?? []
)

const filter = ref<'all' | 'unread'>('all')

const filteredNotifications = computed(() => {
  if (filter.value === 'unread') {
    return notifications.value.filter(
      (notification) => !notification.isRead
    )
  }

  return notifications.value
})

const unreadCount = computed(
  () =>
    notifications.value.filter(
      (notification) => !notification.isRead
    ).length
)

function notificationIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'warning':
    case 'alert':
    case 'risk':
      return AlertTriangle

    case 'assessment':
      return CheckCircle2

    case 'followup':
    case 'appointment':
      return Calendar

    case 'security':
      return ShieldAlert

    default:
      return Info
  }
}

function notificationTone(type: string) {
  switch (type.toLowerCase()) {
    case 'warning':
    case 'alert':
    case 'risk':
      return {
        box: 'bg-amber-500/10',
        icon: 'text-amber-400',
      }

    case 'assessment':
      return {
        box: 'bg-emerald-500/10',
        icon: 'text-emerald-400',
      }

    case 'followup':
    case 'appointment':
      return {
        box: 'bg-blue-500/10',
        icon: 'text-blue-400',
      }

    case 'security':
      return {
        box: 'bg-red-500/10',
        icon: 'text-red-400',
      }

    default:
      return {
        box: 'bg-slate-500/10',
        icon: 'text-slate-400',
      }
  }
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

async function markAsRead(notificationId: string) {
  await $fetch(
    `/api/personnel/notifications/${notificationId}`,
    {
      method: 'PATCH',
      body: {
        isRead: true,
      },
    }
  )

  await refreshNotifications()
}

async function markAllAsRead() {
  if (!unreadCount.value) {
    return
  }

  await $fetch(
    '/api/personnel/notifications/read-all',
    {
      method: 'PATCH',
    }
  )

  await refreshNotifications()
}
</script>

<template>
  <div class="min-h-screen bg-[#0b1220] text-slate-100">

    <!-- Header -->
    <header class="border-b border-white/5 bg-[#0d1526]">
      <div
        class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >

        <div class="flex items-center gap-3">

          <NuxtLink
            to="/personnel/dashboard"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft :size="18" />
          </NuxtLink>

          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400"
          >
            <Bell
              :size="22"
              :stroke-width="1.5"
            />
          </div>

          <div>
            <h1 class="text-sm font-bold text-white">
              Notifications
            </h1>

            <p class="text-[11px] text-slate-500">
              Updates and alerts related to your account
            </p>
          </div>

        </div>

        <button
          v-if="unreadCount"
          type="button"
          class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
          @click="markAllAsRead()"
        >
          <Check :size="14" />
          Mark all as read
        </button>

      </div>
    </header>

    <!-- Main -->
    <main class="mx-auto max-w-6xl px-6 py-6">

      <!-- Summary -->
      <section
        class="rounded-2xl border border-white/5 bg-[#0d1526] p-5"
      >
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >

          <div>
            <h2 class="text-lg font-bold text-white">
              Your Notifications
            </h2>

            <p class="mt-1 text-xs text-slate-500">
              Stay updated with important wellbeing and account information.
            </p>
          </div>

          <div class="flex items-center gap-2">

            <button
              type="button"
              class="rounded-lg px-3 py-2 text-xs font-semibold transition"
              :class="
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              "
              @click="filter = 'all'"
            >
              All
            </button>

            <button
              type="button"
              class="rounded-lg px-3 py-2 text-xs font-semibold transition"
              :class="
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              "
              @click="filter = 'unread'"
            >
              Unread

              <span v-if="unreadCount">
                ({{ unreadCount }})
              </span>
            </button>

          </div>

        </div>
      </section>

      <!-- Loading -->
      <div
        v-if="pending"
        class="mt-4 flex min-h-64 items-center justify-center rounded-2xl border border-white/5 bg-[#0d1526]"
      >
        <div
          class="flex flex-col items-center gap-3 text-slate-400"
        >
          <RotateCw
            :size="22"
            class="animate-spin"
          />

          <p class="text-xs">
            Loading notifications...
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"
      >
        <AlertTriangle
          :size="28"
          class="mx-auto text-red-400"
        />

        <p class="mt-3 text-sm font-semibold text-red-300">
          Couldn't load notifications
        </p>

        <p class="mt-1 text-xs text-slate-500">
          {{ error.message }}
        </p>

        <button
          type="button"
          class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          @click="refreshNotifications()"
        >
          Retry
        </button>
      </div>

      <!-- Notifications -->
      <section
        v-else
        class="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-[#0d1526]"
      >

        <!-- Empty state -->
        <div
          v-if="!filteredNotifications.length"
          class="flex min-h-64 flex-col items-center justify-center px-6 text-center"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-slate-500"
          >
            <Bell :size="22" />
          </div>

          <p class="mt-4 text-sm font-semibold text-slate-300">
            {{
              filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications yet'
            }}
          </p>

          <p class="mt-1 text-xs text-slate-500">
            You're all caught up.
          </p>
        </div>

        <!-- Notification list -->
        <div v-else>

          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="border-b border-white/5 p-5 last:border-b-0"
            :class="
              notification.isRead
                ? 'bg-transparent'
                : 'bg-blue-500/[0.025]'
            "
          >

            <div class="flex items-start gap-4">

              <!-- Icon -->
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                :class="notificationTone(notification.type).box"
              >
                <component
                  :is="notificationIcon(notification.type)"
                  :size="19"
                  :stroke-width="1.5"
                  :class="notificationTone(notification.type).icon"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">

                <div
                  class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
                >

                  <div class="flex items-center gap-2">

                    <h3 class="text-sm font-semibold text-white">
                      {{ notification.title }}
                    </h3>

                    <span
                      v-if="!notification.isRead"
                      class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"
                    />

                  </div>

                  <span
                    class="shrink-0 text-[10px] text-slate-600"
                  >
                    {{ formatDate(notification.createdAt) }}
                  </span>

                </div>

                <p
                  class="mt-1.5 text-xs leading-relaxed text-slate-400"
                >
                  {{ notification.message }}
                </p>

                <!-- Mark as read -->
                <button
                  v-if="!notification.isRead"
                  type="button"
                  class="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 transition hover:text-blue-300"
                  @click="markAsRead(notification.id)"
                >
                  <Check :size="13" />
                  Mark as read
                </button>

                <!-- Already read -->
                <span
                  v-else
                  class="mt-3 inline-flex items-center gap-1.5 text-[10px] text-slate-600"
                >
                  <CheckCircle2 :size="12" />
                  Read
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>

    <!-- Footer -->
    <footer
      class="mt-6 border-t border-white/5 px-6 py-5 text-center text-[11px] text-slate-600"
    >
      Surakshit AI &nbsp;|&nbsp;
      Personnel Stress &amp; Welfare Monitoring System
    </footer>

  </div>
</template>

