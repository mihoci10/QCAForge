<script lang="ts">
    import Icon from '@iconify/svelte';
    import { appWindow } from '@tauri-apps/api/window'
    import { onMount } from 'svelte';
    import { showMenu } from "tauri-plugin-context-menu";
    import type { Position } from 'tauri-plugin-context-menu/dist/types';
    import { EVENT_NEW_FILE, EVENT_OPEN_DESIGN, EVENT_OPEN_SIMULATION, EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from './utils/events';
    import { page } from '$app/stores';
    import { design_filename } from './globals';
    import { basename } from '@tauri-apps/api/path';

    let maximizeIcon: string = "mdi:maximize";
    let title_suffix: string = '';
    const TITLE_PREFIX = 'QCAForge'

    design_filename.subscribe((value) => {
        const DESIGN_MODE = $page.url.pathname.startsWith('/designer');
        if(value && DESIGN_MODE)
            basename(value).then((name) => title_suffix = `- ${name}`);
    })

    onMount(() =>{
        appWindow.onResized((e) => {
            appWindow.isMaximized().then((res) => {
                maximizeIcon = res ? "mdi:dock-window" : "mdi:maximize"
            })
        });
    });

    function getCtxMenuPos(element: HTMLElement): Position{
        let rect = element.getBoundingClientRect();
        return {x: rect.left, y: rect.bottom};
    }

    function showFileMenu(e: MouseEvent){
        const DESIGN_MODE = $page.url.pathname.startsWith('/designer');
        const ANALYSIS_MODE = $page.url.pathname.startsWith('/analysis');

        showMenu({
            pos: getCtxMenuPos(e.target as HTMLElement),
            items: [
                {
                    label: 'New design',
                    shortcut: 'ctrl+N',
                    event: EVENT_NEW_FILE
                },
                {
                    is_separator: true
                },
                {
                    label: 'Open design...',
                    shortcut: 'ctrl+O',
                    event: EVENT_OPEN_DESIGN
                },
                {
                    label: 'Open simulation...',
                    event: EVENT_OPEN_SIMULATION
                },
                {
                    is_separator: true
                },
                {
                    disabled: !(DESIGN_MODE || ANALYSIS_MODE),
                    label: `Save`,
                    shortcut: 'ctrl+S',
                    event: EVENT_SAVE_FILE
                },
                {
                    disabled: !(DESIGN_MODE || ANALYSIS_MODE),
                    label: `Save as...`,
                    shortcut: 'ctrl+shift+S',
                    event: EVENT_SAVE_FILE_AS
                }
            ]
        });
    }
</script>

<div data-tauri-drag-region class='h-10 bg-surface-200 flex-none flex justify-between'>
    <div class="h-full flex items-center">
        <button class="py-0.5 px-2 cursor-default hover:bg-surface-50 text-black"
                on:click={showFileMenu}>
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
        {TITLE_PREFIX + ' ' + title_suffix}
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