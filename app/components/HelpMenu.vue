<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const currentLang = useAppLanguage()
const { t, faqs } = useTranslations(currentLang)

const isOpen = ref(false)
const openIndex = ref<number | null>(null)

function toggleFaq(i: number) {
  openIndex.value = openIndex.value === i ? null : i
}

const wrapperRef = ref<HTMLElement | null>(null)

function onClickOutside(e: MouseEvent) {
  const el = wrapperRef.value
  if (el && !el.contains(e.target as Node)) isOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="wrapperRef" class="relative">
    <button
      @click="isOpen = !isOpen"
      class="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-white transition-colors"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      {{ t('nav_help') }}
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
    >
      <p class="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {{ t('faq_title') }}
      </p>
      <div v-for="(item, i) in faqs()" :key="i" class="border-b border-slate-100 last:border-0">
        <button
          @click="toggleFaq(i)"
          class="flex w-full items-center justify-between gap-2 py-2.5 text-left text-sm font-medium text-slate-800"
        >
          {{ item.q }}
          <svg
            class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
            :class="openIndex === i ? 'rotate-180' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        <p v-if="openIndex === i" class="pb-2.5 text-xs leading-relaxed text-slate-500">
          {{ item.a }}
        </p>
      </div>
    </div>
  </div>
</template>