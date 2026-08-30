<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 antialiased">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
      <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-400/30">
            <span class="text-teal-400 text-lg font-bold">S</span>
          </div>
          <span class="text-lg font-semibold tracking-tight">Surakshit AI</span>
        </div>
        <div class="hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <a href="#how-it-works" class="hover:text-slate-100 transition-colors">How it Works</a>
          <a href="#risk-levels" class="hover:text-slate-100 transition-colors">Risk Levels</a>
          <a href="#model" class="hover:text-slate-100 transition-colors">Model</a>
        </div>
        <button
          class="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400 transition-colors"
        >
          Start Assessment
        </button>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_20%_-10%,rgba(45,212,191,0.15),transparent_50%)]"></div>

      <div class="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center relative">
        <div class="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/5 px-4 py-1.5 text-xs font-medium text-teal-300">
          <span class="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
          AI-Powered Welfare Monitoring
        </div>

        <h1 class="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Monitor stress. Identify risk.
          <span class="text-teal-400">Support personnel.</span>
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
          Surakshit AI predicts stress risk from workplace and lifestyle
          patterns, giving early, actionable insight — not a diagnosis.
        </p>
        
        <div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            class="w-full rounded-lg bg-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400 transition-colors sm:w-auto"
          >
            Start Stress Assessment
          </button>
          <a
            href="#how-it-works"
            class="w-full rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors sm:w-auto text-center"
          >
            Learn How It Works
          </a>
        </div>
      </div>
    </section>

    <!-- Overview cards -->
    <section class="mx-auto max-w-7xl px-6 pb-24">
      <div class="grid gap-6 sm:grid-cols-3">
        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Prediction Engine</p>
          <p class="mt-2 text-2xl font-semibold text-white">XGBoost</p>
          <p class="mt-1 text-sm text-slate-400">Tuned regression model</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Stress Scale</p>
          <p class="mt-2 text-2xl font-semibold text-white">1 – 10</p>
          <p class="mt-1 text-sm text-slate-400">Continuous risk score</p>
        </div>
        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Risk Categories</p>
          <p class="mt-2 text-2xl font-semibold text-white">4 Levels</p>
          <p class="mt-1 text-sm text-slate-400">Low to High</p>
        </div>
      </div>
    </section>

    <!-- Risk Levels -->
    <section id="risk-levels" class="mx-auto max-w-7xl px-6 pb-24">
      <h2 class="text-2xl font-semibold text-white">Risk Levels</h2>
      <p class="mt-2 text-sm text-slate-400">Score ranges and what they mean.</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
          <p class="text-sm font-medium text-emerald-300">Low</p>
          <p class="mt-1 text-xs text-slate-400">Score 1 – 3</p>
        </div>
        <div class="rounded-xl border border-amber-400/20 bg-amber-400/5 p-5">
          <p class="text-sm font-medium text-amber-300">Moderate</p>
          <p class="mt-1 text-xs text-slate-400">Score 3 – 5</p>
        </div>
        <div class="rounded-xl border border-orange-400/20 bg-orange-400/5 p-5">
          <p class="text-sm font-medium text-orange-300">Elevated</p>
          <p class="mt-1 text-xs text-slate-400">Score 5 – 7</p>
        </div>
        <div class="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
          <p class="text-sm font-medium text-red-300">High</p>
          <p class="mt-1 text-xs text-slate-400">Score 7 – 10</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-800/60 py-10">
      <div class="mx-auto max-w-7xl px-6 text-center text-xs text-slate-500">
        Surakshit AI — Stress risk prediction &amp; welfare support system.
        Not a substitute for professional medical diagnosis.
      </div>
    </footer>
  </div>
</template>