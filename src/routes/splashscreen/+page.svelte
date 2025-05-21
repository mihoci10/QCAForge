<script lang="ts">
    import { invoke } from '@tauri-apps/api/core';
    import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
    import { onMount } from 'svelte';

    const EVENT_STARTUP_PROGRESS = 'splashscreenUpdate';

    let progress: number = $state(0);
    let status: string = $state("");

    onMount(() => {
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


<div class="flex flex-col items-center justify-center h-screen w-screen bg-background">
    <div class="flex flex-col items-center justify-center">
        <h1 class="text-2xl font-bold text-primary">QCAForge</h1>
        <p class="text-gray-500 mt-2">{status}</p>
        <p class="text-gray-500 mt-2">{progress}%</p>
    </div>
</div>