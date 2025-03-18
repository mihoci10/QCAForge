<script lang="ts">
	import '../app.css';
	import { Toaster } from "$lib/components/ui/sonner";

	import { page } from '$app/state';
    import { listen } from "@tauri-apps/api/event";
    import { EVENT_NEW_FILE, EVENT_OPEN_DESIGN, EVENT_OPEN_SIMULATION} from '$lib/utils/events';
    import { goto } from '$app/navigation';
    import { open } from '@tauri-apps/plugin-dialog';
    import { design, design_filename } from '$lib/globals';
    import { createDesign, deserializeDesign } from '$lib/qca-design';
    import { readTextFile } from '@tauri-apps/plugin-fs';
    import { onMount } from 'svelte';
    import { basename } from '@tauri-apps/api/path';
    import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
    import { DEFAULT_CELL_ARCHITECTURES, getDefaultCellArchitecture } from '$lib/CellArchitecture';
    import { generateDotDistribution } from '$lib/Cell';

	let { children } = $props();
	const appWindow = getCurrentWebviewWindow()

	onMount(() => {
		createDesign([{
			name: "Main Layer", 
			visible: true, 
			cell_architecture: getDefaultCellArchitecture(), 
			cells: [
				{position: [0, 0], typ: 0, clock_phase_shift: 0, dot_probability_distribution: generateDotDistribution([0]), rotation: 0},
			], 
			z_position: 0}], 
			undefined, 
			new Map(),
			DEFAULT_CELL_ARCHITECTURES
		).then((des) => { 
			design.set(des); 
		});
	});

	design_filename.subscribe((value) => {
        const DESIGN_MODE = page.url.pathname.startsWith('/designer');
        if(value && DESIGN_MODE)
			basename(value).then((name) => appWindow.setTitle(`QCAForge - ${name}`));
		else
			appWindow.setTitle(`QCAForge`)
    })

	listen(EVENT_NEW_FILE, () => {
		createDesign(
			[{name: "Main Layer", visible: true, cell_architecture: getDefaultCellArchitecture(), cells: [], z_position: 0}],
			undefined,
			new Map(),
			DEFAULT_CELL_ARCHITECTURES
		).then((d) => {
			design.set(d);
		})
		design_filename.set(undefined);
		goto(`/designer`);
	});
	listen(EVENT_OPEN_DESIGN, () => {
		open({
			title: 'Load design',
			filters: [{name: 'Design', extensions: ['qcd']}]
		}).then((filename) => {
			if (!filename)
				return;

			readTextFile(filename as string).then((contents) => {
				design_filename.set(filename as string);
				design.set(deserializeDesign(contents));
				goto(`/designer`);
			})
		});
	});
	listen(EVENT_OPEN_SIMULATION, () => {
		console.log(EVENT_OPEN_SIMULATION);
	});

</script>

<Toaster/>

<div class="flex flex-col h-full">
	<div class="flex h-full overflow-auto">	
		{@render children()}
	</div>
</div>
