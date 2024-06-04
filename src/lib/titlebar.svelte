<script lang="ts">
    import Icon from '@iconify/svelte';
    import { appWindow } from '@tauri-apps/api/window'
    import { onMount } from 'svelte';

    let maximizeIcon: string = "mdi:maximize";
    onMount(() =>{
        appWindow.onResized((e) => {
            appWindow.isMaximized().then((res) => {
                maximizeIcon = res ? "mdi:dock-window" : "mdi:maximize"
            })
        });
    });
</script>

<div data-tauri-drag-region class='h-10 bg-surface-200 flex-none flex justify-between'>
    <div class="h-full flex items-center">
        <button class="py-0.5 px-2 cursor-default hover:bg-surface-50 text-black">
            File
        </button>
        <button class="py-0.5 px-2 cursor-default hover:bg-surface-50 text-black">
            Edit
        </button>
        <button class="py-0.5 px-2 cursor-default hover:bg-surface-50 text-black">
            Run
        </button>
        <button class="py-0.5 px-2 cursor-default hover:bg-surface-50 text-black">
            Help
        </button>
    </div>
    <div class="h-full flex items-center justify-center select-none text-black">
        QCAForge
    </div>
    <div class="h-full">
        <button class="h-full p-2 cursor-default hover:bg-surface-50" on:click={() => appWindow.minimize()}>
            <Icon color='black' height={22} icon="mdi:minimize" class='h-full'/>
        </button>
        <button class="h-full p-2 cursor-default hover:bg-surface-50" 
            on:click={() => {appWindow.toggleMaximize()}}>
            <Icon color='black' height={22} bind:icon={maximizeIcon} class='h-full'/>
        </button>
        <button class="h-full p-2 cursor-default hover:bg-error-500" on:click={() => appWindow.close()}>
            <Icon color='black' height={22} icon="mdi:close" class='h-full'/>
        </button>
    </div>
</div>