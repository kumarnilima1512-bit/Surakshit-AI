<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 text-center text-white">
    <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500">
      <svg class="h-7 w-7 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
      </svg>
    </div>

    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Surakshit AI</h1>
      <p class="mt-2 max-w-sm text-sm text-slate-400">
        AI-based predictive stress and welfare monitoring for CAPF personnel.
      </p>
    </div>

    <nav class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300">
      <NuxtLink to="/landing" class="hover:text-white transition-colors">Home</NuxtLink>
      <NuxtLink to="/landing#features" class="hover:text-white transition-colors">Features</NuxtLink>
      <NuxtLink to="/landing#how-it-works" class="hover:text-white transition-colors">How It Works</NuxtLink>
      <NuxtLink to="/landing#dashboard" class="hover:text-white transition-colors">Dashboard</NuxtLink>
      <NuxtLink to="/landing#why" class="hover:text-white transition-colors">About</NuxtLink>
      <NuxtLink to="/landing#contact" class="hover:text-white transition-colors">Contact</NuxtLink>
    </nav>

    <div class="flex flex-col gap-3 sm:flex-row">
      <NuxtLink
        to="/landing"
        class="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
      >
        Enter Site
      </NuxtLink>
      <NuxtLink
        to="/login"
        class="rounded-lg border border-slate-600 px-6 py-3 text-sm font-medium text-slate-200 hover:border-slate-400 hover:text-white transition-colors"
      >
        Login
      </NuxtLink>
    </div>
  </div>
</template>