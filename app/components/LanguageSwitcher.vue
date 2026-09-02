<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LangCode } from '~/utils/translations'

interface Language {
  code: LangCode
  label: string
  native: string
}

const languages: Language[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ur', label: 'Urdu', native: 'اردو' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'Assamese', native: 'অসমীয়া' },
]

const currentLang = useAppLanguage()
const isOpen = ref(false)

const current = computed<Language>(
  () => languages.find((l) => l.code === currentLang.value) ?? languages[0]!
)

function select(code: LangCode) {
  currentLang.value = code
  isOpen.value = false
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      {{ current.native }}
      <svg class="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 z-20 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
    >
      <button
        v-for="lang in languages"
        :key="lang.code"
        @click="select(lang.code)"
        class="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
        :class="lang.code === current.code ? 'font-semibold text-slate-900' : 'text-slate-600'"
      >
        <span>{{ lang.native }}</span>
        <span class="text-xs text-slate-400">{{ lang.label }}</span>
      </button>
    </div>
  </div>
</template>