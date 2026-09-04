<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-950 px-6 text-center text-white">
    <div class="flex h-24 w-24 items-center justify-center overflow-hidden">
  <img
    src="/logos/surakshit-ai.png"
    alt="Surakshit AI Logo"
    class="h-full w-full object-contain"
  />
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
