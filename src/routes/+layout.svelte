<script lang="ts">
	import '../app.postcss';
	import {AppShell, AppRail, AppRailTile, Modal, type ModalComponent} from '@skeletonlabs/skeleton'

	import SimModelOptions from '$lib/SimModelOptions.svelte';
	import { initializeStores } from '@skeletonlabs/skeleton';

	initializeStores();
	
	const modalRegistry: Record<string, ModalComponent> = {
		simModelOptions: { ref: SimModelOptions },
	};
</script>

<Modal components={modalRegistry}/>

<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<AppRail width="w-10"> 
			<AppRailTile group="" name="tile-1" value={0} title="tile-1">
				Item 1
			</AppRailTile>
			<AppRailTile group="" name="tile-2" value={0} title="tile-2">
				Item 2
			</AppRailTile>
		</AppRail>
	</svelte:fragment>

	<slot />
</AppShell>
