<script lang="ts">
  import '../../app.css';
  import { invoke } from '@tauri-apps/api/core';
  import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
  import { onMount } from 'svelte';

  const EVENT_STARTUP_PROGRESS = 'splashscreenUpdate';
  let progress: number = $state(0);
  let status: string = $state("Initializing...");
  let mounted: boolean = $state(false);

  onMount(() => {
    // Trigger fade-in animation
    setTimeout(() => mounted = true, 100);

    const appWebview = getCurrentWebviewWindow();
    const unlistenStartup = appWebview.listen(EVENT_STARTUP_PROGRESS, (event) => {
      const obj = event.payload as any;
      if (obj.Status) {
        status = obj.Status as string;
      } else if (obj.Progress) {
        progress = obj.Progress as number;
      }
    });

    invoke("startup_frontend_ready");

    return () => {
      unlistenStartup.then(f => f());
    };
  });
</script>

<div class="flex flex-col items-center justify-center h-screen w-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
  <!-- Background decoration -->
  <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPgo8cGF0aCB3PSIzMDAiIGQ9Im0gLTEwLjQwMDAwMDAwMDAwMDAwMyAwIGwgMjAuODAwMDAwMDAwMDAwMDA2IDAgbSAtMTAuNDAwMDAwMDAwMDAwMDAzIC0xMC40MDAwMDAwMDAwMDAwMDMgbCAwIDIwLjgwMDAwMDAwMDAwMDAwNiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz4KPHN2Zz4K')] opacity-10"></div>
  
  <!-- Floating particles -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    {#each Array(20) as _, i}
      <div 
        class="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
        style="
          left: {Math.random() * 100}%;
          top: {Math.random() * 100}%;
          animation-delay: {Math.random() * 3}s;
          animation-duration: {2 + Math.random() * 3}s;
        "
      ></div>
    {/each}
  </div>

  <!-- Main content -->
  <div class="flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ease-out transform {mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}">
    <!-- Logo/Icon container -->
    <div class="relative mb-8">
      <div class="w-24 h-24 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl shadow-2xl shadow-purple-500/25 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
        <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
          </svg>
        </div>
      </div>
      <!-- Glow effect -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
    </div>

    <!-- App name -->
    <h1 class="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-2 tracking-wide">
      QCAForge
    </h1>
    
    <!-- Subtitle -->

    <!-- Status and progress container -->
    <div class="w-80 max-w-sm">
      <!-- Status text -->
      <div class="mb-4 text-center">
        <p class="text-gray-300 text-sm font-medium transition-all duration-300 min-h-[1.25rem]">
          {status}
        </p>
      </div>

      <!-- Progress bar container -->
      <div class="relative">
        <!-- Progress bar background -->
        <div class="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
          <!-- Progress bar fill -->
          <div 
            class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style="width: {progress}%"
          >
            <!-- Shimmer effect -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading spinner -->
    <div class="mt-2">
      <div class="w-6 h-6 border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
  </div>
</div>

<style>
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
  
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
</style>