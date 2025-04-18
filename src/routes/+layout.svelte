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
    import { generate_default_cell_architectures, get_default_cell_architecture_id } from '$lib/CellArchitecture';
    import { generateDotDistribution } from '$lib/Cell';
    import { Button } from '$lib/components/ui/button';
    import Icon from '@iconify/svelte';

	let { children } = $props();
	const appWindow = getCurrentWebviewWindow()

	onMount(() => {
		createDesign([{
			name: "Main Layer", 
			visible: true, 
			cell_architecture_id: get_default_cell_architecture_id(), 
			cells: [
				{position: [0, 0], typ: 0, clock_phase_shift: 0, dot_probability_distribution: generateDotDistribution([0]), rotation: 0},
			], 
			z_position: 0}], 
			undefined, 
			new Map(),
			generate_default_cell_architectures()
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
			[{name: "Main Layer", visible: true, cell_architecture_id: get_default_cell_architecture_id(), cells: [], z_position: 0}],
			undefined,
			new Map(),
			generate_default_cell_architectures()
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

<div class="flex flex-row h-full">
	<div class='flex flex-col h-full bg-sidebar gap-1'>
		<Button 
			variant='ghost' size='icon' 
			class='data-[state=on]:bg-sidebar-ring'
			href="/designer"
			data-state={page.url.pathname.startsWith('/designer') ? "on" : "off"}>
            <Icon width={32} icon='material-symbols:design-services-outline'/>
        </Button>
		<Button 
			variant='ghost' size='icon' 
			class='data-[state=on]:bg-sidebar-ring'
			href="/analysis"
			data-state={page.url.pathname.startsWith('/analysis') ? "on" : "off"}>
            <Icon width={32} icon='material-symbols:search-insights-rounded'/>
        </Button>
		<div class='grow'></div>
		<Button variant='ghost' size='icon'>
            <Icon width={24} icon='material-symbols:settings'/>
        </Button>
	</div>
	<div class="flex h-full w-full overflow-auto">	
		{@render children()}
	</div>
</div>
