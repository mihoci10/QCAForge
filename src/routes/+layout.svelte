<script lang="ts">
	import '../app.postcss';
	import {AppRail, Modal, type ModalComponent, Toast, AppRailAnchor} from '@skeletonlabs/skeleton'

	import SimModelOptions from '$lib/SimModelOptions.svelte';
	import { initializeStores } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';
    import Titlebar from '$lib/titlebar.svelte';
	import { page } from '$app/stores';
    import { listen } from "@tauri-apps/api/event";
    import { EVENT_NEW_FILE, EVENT_OPEN_DESIGN, EVENT_OPEN_SIMULATION, EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from '$lib/utils/events';

	initializeStores();
	
	const modalRegistry: Record<string, ModalComponent> = {
		simModelOptions: { ref: SimModelOptions },
	};

	listen(EVENT_NEW_FILE, () => {
		console.log(EVENT_NEW_FILE);
	});
	listen(EVENT_OPEN_DESIGN, () => {
		console.log(EVENT_OPEN_DESIGN);
	});
	listen(EVENT_OPEN_SIMULATION, () => {
		console.log(EVENT_OPEN_SIMULATION);
	});
	listen(EVENT_SAVE_FILE, () => {
		console.log(EVENT_SAVE_FILE);
	});
	listen(EVENT_SAVE_FILE_AS, () => {
		console.log(EVENT_SAVE_FILE_AS);
	});

</script>

<Modal components={modalRegistry}/>
<Toast/>

<div class="flex flex-col h-full">
	<Titlebar/>
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
