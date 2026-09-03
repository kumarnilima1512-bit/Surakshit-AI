<script setup lang="ts">
const features = [
  {
    icon: 'brain',
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Stress Prediction',
    desc: 'AI model analyzes behavioral & health data to predict stress levels.',
  },
  {
    icon: 'shield',
    color: 'bg-teal-100 text-teal-600',
    title: 'Risk Assessment',
    desc: 'Identifes high-risk personnel for timely intervention.',
  },
  {
    icon: 'heart',
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Welfare Monitoring',
    desc: 'Tracks physical, mental and social well-being indicators.',
  },
  {
    icon: 'chart',
    color: 'bg-sky-100 text-sky-600',
    title: 'Data Analytics',
    desc: 'Visual insights for better decision making.',
  },
  {
    icon: 'bell',
    color: 'bg-orange-100 text-orange-600',
    title: 'Alerts & Notifications',
    desc: 'Get real-time alerts for critical cases and trends.',
  },
  {
    icon: 'users',
    color: 'bg-blue-100 text-blue-600',
    title: 'Admin Management',
    desc: 'Manage personnel data, reports and welfare programs efficiently.',
  },
]

const whyPoints = [
  { icon: 'heart', color: 'bg-emerald-100 text-emerald-600', title: 'Better Mental Health', desc: 'Detect & reduce stress early' },
  { icon: 'trending', color: 'bg-sky-100 text-sky-600', title: 'Increased Productivity', desc: 'Healthier personnel, stronger performance' },
  { icon: 'bars', color: 'bg-violet-100 text-violet-600', title: 'Data-Driven Decisions', desc: 'Insights for better planning' },
  { icon: 'leaf', color: 'bg-amber-100 text-amber-600', title: 'Long-Term Sustainability', desc: 'Build a resilient CAPF force' },
]

const steps = [
  { icon: 'database', color: 'bg-emerald-100 text-emerald-600', title: '1. Data Collection', desc: 'Gather data from multiple sources (health, behavioral, work patterns).' },
  { icon: 'cpu', color: 'bg-sky-100 text-sky-600', title: '2. AI Analysis', desc: 'Predict stress levels, assess risk and detect patterns.' },
  { icon: 'insight', color: 'bg-violet-100 text-violet-600', title: '3. Insights & Alerts', desc: 'Generate actionable insights and real-time notifications.' },
  { icon: 'support', color: 'bg-orange-100 text-orange-600', title: '4. Welfare Support', desc: 'Enable timely intervention, proper guidance and wellness programs.' },
]

const dashboardChecklist = [
  'Interactive Analytics',
  'Custom Reports',
  'Role-Based Access',
  'Secure & Scalable',
]
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 antialiased">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
      <nav class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500">
            <svg class="h-5 w-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
            </svg>
          </div>
          <div class="leading-tight">
            <p class="text-base font-semibold tracking-tight text-white">Surakshit AI</p>
            <p class="text-[10px] text-slate-400">Safe Forces. Stronger Nation.</p>
          </div>
        </div>

        <div class="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          <a href="#" class="border-b-2 border-teal-400 pb-1 text-white">Home</a>
          <a href="#features" class="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a>
          <a href="#dashboard" class="hover:text-white transition-colors">Dashboard</a>
          <a href="#why" class="hover:text-white transition-colors">About</a>
          <a href="#" class="hover:text-white transition-colors">Contact</a>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink to="/login" class="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-400 hover:text-white transition-colors">
            Login
          </NuxtLink>
          <button class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors">
            Get Started
          </button>
        </div>
      </nav>
    </header>

    <!-- Hero -->
    <section class="relative overflow-hidden bg-slate-950">
      <div
        class="absolute inset-0 bg-cover bg-center opacity-60"
        style="background-image: url('https://images.unsplash.com/photo-1586083944757-6fa33fdfd9c0?q=80&w=2000&auto=format&fit=crop')"
      ></div>
      <div class="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/30"></div>

      <div class="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div class="max-w-xl">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-medium text-emerald-300">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            AI-Powered CAPF Welfare Solution
          </div>

          <h1 class="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Surakshit <span class="text-emerald-400">AI</span>
          </h1>

          <p class="mt-4 text-xl font-medium text-slate-200">
            AI-Based Predictive Personnel Stress and Welfare Monitoring System for Uniformed Forces
          </p>

          <p class="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
            Because their well-being matters. Surakshit AI leverages the power of artificial intelligence to monitor stress levels, predict risks, and ensure the welfare of our CAPF personnel — for a stronger, safer nation.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <button class="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition-colors">
              Explore Dashboard
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
            <a href="#how-it-works" class="rounded-lg border border-slate-600 px-6 py-3 text-center text-sm font-medium text-slate-200 hover:border-slate-400 hover:text-white transition-colors">
              Learn More
            </a>
          </div>
        </div>

        <p class="pointer-events-none absolute bottom-16 right-10 hidden max-w-[10rem] rotate-[-6deg] text-right font-serif text-lg italic text-white/80 lg:block">
          Healthy Personnel<br>Stronger CAPF<br>Safer India
        </p>
      </div>
    </section>

    <!-- Key Features -->
    <section id="features" class="bg-slate-50 py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center">
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Key Features</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Comprehensive Welfare Monitoring
          </h2>
          <p class="mx-auto mt-3 max-w-2xl text-sm text-slate-500">
            From stress detection to proactive support — Surakshit AI covers every aspect of personnel welfare with intelligent insights.
          </p>
        </div>

        <div class="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="f in features"
            :key="f.title"
            class="rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <div :class="['flex h-11 w-11 items-center justify-center rounded-xl', f.color]">
              <svg v-if="f.icon === 'brain'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.5 3a3.5 3.5 0 00-3.5 3.5v.5A3 3 0 004 9.5v1a3 3 0 001 2.24V15a3.5 3.5 0 003.5 3.5M9.5 3a3.5 3.5 0 013.5 3.5v9A3.5 3.5 0 019.5 19M9.5 3v16"></path>
              </svg>
              <svg v-else-if="f.icon === 'shield'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
              </svg>
              <svg v-else-if="f.icon === 'heart'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <svg v-else-if="f.icon === 'chart'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l7 7-7 6zM4 5v14"></path>
              </svg>
              <svg v-else-if="f.icon === 'bell'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"></path>
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"></path>
              </svg>
            </div>
            <p class="mt-4 text-sm font-semibold text-slate-900">{{ f.title }}</p>
            <p class="mt-1.5 text-xs leading-relaxed text-slate-500">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Surakshit AI -->
    <section id="why" class="bg-slate-100/70 py-24">
      <div class="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">Why Surakshit AI</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Caring for Those Who Protect Us
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-slate-500">
            CAPF personnel work in extreme conditions, often facing high stress, isolation and physical challenges. Surakshit AI helps in early detection of stress and welfare issues, ensuring timely support and a healthier, more productive force.
          </p>

          <div class="mt-8 grid gap-6 sm:grid-cols-2">
            <div v-for="p in whyPoints" :key="p.title" class="flex items-start gap-3">
              <div :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', p.color]">
                <svg v-if="p.icon === 'heart'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
                <svg v-else-if="p.icon === 'trending'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"></path>
                </svg>
                <svg v-else-if="p.icon === 'bars'" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.5h3v6H3v-6zM10.5 8.25h3v11.25h-3V8.25zM18 4.5h3v15h-3v-15z"></path>
                </svg>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3c2.5 2.5 3.5 5 3.5 7.5A3.5 3.5 0 0112 14a3.5 3.5 0 01-3.5-3.5C8.5 8 9.5 5.5 12 3zM8 20c0-3 1.5-5 4-6 2.5 1 4 3 4 6"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-slate-900">{{ p.title }}</p>
                <p class="text-xs text-slate-500">{{ p.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-1 space-y-4">
            <div class="overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1661113248101-f2881bea4abb?q=80&w=800&auto=format&fit=crop"
                alt="CAPF personnel in formation"
                class="h-40 w-full object-cover"
              >
            </div>
            <div class="relative overflow-hidden rounded-2xl">
              <img
                src="https://images.unsplash.com/photo-1691134691246-51b1f28c3875?q=80&w=800&auto=format&fit=crop"
                alt="Indian flag flying high"
                class="h-32 w-full object-cover"
              >
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
              <p class="absolute bottom-3 left-3 text-xs font-semibold text-white">Their Duty<br>Our Responsibility</p>
            </div>
          </div>

          <div class="col-span-1 space-y-4">
            <div class="rounded-2xl bg-slate-900 p-5 text-white">
              <p class="text-xs font-medium text-slate-300">Stress Score</p>
              <div class="mt-3 flex items-end gap-2">
                <span class="text-3xl font-bold">4.2</span>
                <span class="pb-1 text-xs text-slate-400">/10</span>
              </div>
              <span class="mt-2 inline-block rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-300">Low Risk</span>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold text-slate-900">Risk Level</p>
              <p class="mt-1 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Low
              </p>
              <p class="mt-0.5 text-[11px] text-slate-400">Continue monitoring</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <p class="text-xs font-semibold text-slate-900">Recommendation</p>
              <p class="mt-1 text-[11px] leading-relaxed text-slate-500">Maintain current routine. Encourage rest and recreational activities.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="bg-slate-50 py-24">
      <div class="mx-auto max-w-7xl px-6">
        <div class="text-center">
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-600">How It Works</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-slate-900">From Data to a Safer Tomorrow</h2>
          <p class="mx-auto mt-3 max-w-xl text-sm text-slate-500">
            A simple yet powerful process to monitor, analyze and support CAPF personnel.
          </p>
        </div>

        <div class="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <template v-for="(s, i) in steps" :key="s.title">
            <div class="relative">
              <div :class="['flex h-12 w-12 items-center justify-center rounded-xl', s.color]">
                <svg v-if="s.icon === 'database'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 6c0 1.657-3.582 3-8 3S4 7.657 4 6s3.582-3 8-3 8 1.343 8 3zM4 6v6c0 1.657 3.582 3 8 3s8-1.343 8-3V6M4 12v6c0 1.657 3.582 3 8 3s8-1.343 8-3v-6"></path>
                </svg>
                <svg v-else-if="s.icon === 'cpu'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 7h10v10H7V7z"></path>
                </svg>
                <svg v-else-if="s.icon === 'insight'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 4v-1a4 4 0 00-3-3.87"></path>
                </svg>
              </div>
              <p class="mt-4 text-sm font-semibold text-slate-900">{{ s.title }}</p>
              <p class="mt-1.5 text-xs leading-relaxed text-slate-500">{{ s.desc }}</p>

              <svg
                v-if="i < steps.length - 1"
                class="absolute right-[-2rem] top-5 hidden h-5 w-5 text-slate-300 lg:block"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- Dashboard preview -->
    <section id="dashboard" class="bg-slate-950 py-24">
      <div class="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <!-- Mock dashboard -->
        <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div class="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <div class="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20">
              <svg class="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
              </svg>
            </div>
            <span class="text-xs font-semibold text-white">Surakshit AI</span>
            <span class="ml-auto text-[10px] text-slate-500">Dashboard</span>
          </div>

          <div class="p-4">
            <p class="text-[11px] font-medium text-slate-400">Personnel Overview</p>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p class="text-[10px] text-slate-500">Total Personnel</p>
                <p class="mt-1 text-lg font-semibold text-white">2,548</p>
              </div>
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p class="text-[10px] text-slate-500">At Risk</p>
                <p class="mt-1 text-lg font-semibold text-orange-400">186</p>
              </div>
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p class="text-[10px] text-slate-500">Under Monitoring</p>
                <p class="mt-1 text-lg font-semibold text-sky-400">642</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="rounded-lg border border-slate-800 bg-slate-950 p-3">
                <p class="text-[10px] text-slate-500">Stress Level Trend</p>
                <svg class="mt-2 h-16 w-full" viewBox="0 0 120 40" preserveAspectRatio="none">
                  <polyline points="0,30 20,22 40,26 60,14 80,18 100,10 120,16" fill="none" stroke="#2dd4bf" stroke-width="2"></polyline>
                </svg>
              </div>
              <div class="flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 p-3">
                <svg viewBox="0 0 36 36" class="h-16 w-16">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" stroke-width="4"></circle>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" stroke-width="4" stroke-dasharray="56 100" stroke-linecap="round"></circle>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#fbbf24" stroke-width="4" stroke-dasharray="20 100" stroke-dashoffset="-56" stroke-linecap="round"></circle>
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#f87171" stroke-width="4" stroke-dasharray="12 100" stroke-dashoffset="-76" stroke-linecap="round"></circle>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Copy -->
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-emerald-400">Real-Time Insights</p>
          <h2 class="mt-3 text-3xl font-bold tracking-tight text-white">
            Powerful Dashboards, Meaningful Impact
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-slate-400">
            Visualize key metrics, track personnel well-being, understand trends and take action — all in one place.
          </p>

          <ul class="mt-6 space-y-2.5">
            <li v-for="item in dashboardChecklist" :key="item" class="flex items-center gap-2 text-sm text-slate-300">
              <svg class="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.5 12.75l6 6 9-13.5"></path>
              </svg>
              {{ item }}
            </li>
          </ul>

          <button class="mt-8 flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition-colors">
            View Dashboard
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-800 bg-slate-950 py-10">
      <div class="mx-auto max-w-7xl px-6">
        <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500">
              <svg class="h-4 w-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M12 3l8.25 4v5c0 5-3.375 8.5-8.25 10-4.875-1.5-8.25-5-8.25-10v-5L12 3z"></path>
              </svg>
            </div>
            <div class="leading-tight">
              <p class="text-sm font-semibold text-white">Surakshit AI</p>
              <p class="text-[10px] text-slate-500">Safe Forces. Stronger Nation.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <a href="#" class="hover:text-white transition-colors">Home</a>
            <a href="#features" class="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" class="hover:text-white transition-colors">How It Works</a>
            <a href="#dashboard" class="hover:text-white transition-colors">Dashboard</a>
            <a href="#why" class="hover:text-white transition-colors">About</a>
            <a href="#" class="hover:text-white transition-colors">Contact</a>
          </div>

          <p class="text-xs text-slate-500">Ministry of Home Affairs&nbsp;|&nbsp;CAPF Welfare Initiative</p>
        </div>

        <div class="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-800 pt-6 text-[11px] text-slate-500 sm:flex-row">
          <p>© 2025 Surakshit AI. All rights reserved.</p>
          <p class="italic">For the heroes who keep us safe</p>
        </div>
      </div>
    </footer>
  </div>
</template>