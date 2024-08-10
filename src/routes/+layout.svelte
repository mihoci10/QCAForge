<script lang="ts">
	import '../app.postcss';
	import {AppRail, Modal, type ModalComponent, Toast, AppRailAnchor} from '@skeletonlabs/skeleton'

	import SimModelOptions from '$lib/SimModelOptions.svelte';
	import { initializeStores } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
	import { page } from '$app/stores';
    import { listen } from "@tauri-apps/api/event";
    import { EVENT_NEW_FILE, EVENT_OPEN_DESIGN, EVENT_OPEN_SIMULATION} from '$lib/utils/events';
    import { goto } from '$app/navigation';
    import { open } from '@tauri-apps/api/dialog';
    import { design, design_filename } from '$lib/globals';
    import { createDesign, deserializeDesign } from '$lib/qca-design';
    import { readTextFile } from '@tauri-apps/api/fs';
    import { onMount } from 'svelte';
    import { basename } from '@tauri-apps/api/path';
    import { appWindow } from '@tauri-apps/api/window';

	initializeStores();

	onMount(() => {
		createDesign([], undefined, new Map()).then((des) => {
			design.set(des);
		});
	});
	
	const modalRegistry: Record<string, ModalComponent> = {
		simModelOptions: { ref: SimModelOptions },
	};

	design_filename.subscribe((value) => {
        const DESIGN_MODE = $page.url.pathname.startsWith('/designer');
        if(value && DESIGN_MODE)
			basename(value).then((name) => appWindow.setTitle(`QCAForge - ${name}`));
		else
			appWindow.setTitle(`QCAForge`)
    })

	listen(EVENT_NEW_FILE, () => {
		createDesign([], undefined, new Map()).then((d) => {
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

<Modal components={modalRegistry}/>
<Toast/>

<div class="flex flex-col h-full">
	<div class="flex h-full overflow-auto">
		<AppRail width="w-12"> 
			<AppRailAnchor href='/designer' selected={$page.url.pathname.startsWith('/designer')}>
				<svelte:fragment slot="lead">
					<Icon width={36} icon="material-symbols:design-services-outline" style="margin: auto;"/>
				</svelte:fragment>
			</AppRailAnchor>
			<AppRailAnchor href='/analysis' selected={$page.url.pathname.startsWith('/analysis')}>
				<svelte:fragment slot="lead">
					<Icon width={36} icon="mdi:chart-bell-curve-cumulative" style="margin: auto;"/>
				</svelte:fragment>
			</AppRailAnchor>
		</AppRail>
	
		<slot />
	</div>
</div>
