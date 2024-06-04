<script lang="ts">
	import '../app.postcss';
	import {AppShell, AppRail, AppRailTile, Modal, type ModalComponent, Toast} from '@skeletonlabs/skeleton'

	import SimModelOptions from '$lib/SimModelOptions.svelte';
	import { initializeStores } from '@skeletonlabs/skeleton';
    import Icon from '@iconify/svelte';

	initializeStores();
	
	const modalRegistry: Record<string, ModalComponent> = {
		simModelOptions: { ref: SimModelOptions },
	};

	let selectedTab: number = 0;
</script>

<Modal components={modalRegistry}/>
<Toast/>

<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<AppRail width="w-12"> 
			<AppRailTile bind:group={selectedTab} name="tile-1" value={0} title="tile-1">
				<svelte:fragment slot="lead">
					<Icon width={36} icon="material-symbols:design-services-outline" style="margin: auto;"/>
				</svelte:fragment>
			</AppRailTile>
			<AppRailTile bind:group={selectedTab} name="tile-2" value={1} title="tile-2">
				<svelte:fragment slot="lead">
					<Icon width={36} icon="mdi:chart-bell-curve-cumulative" style="margin: auto;"/>
				</svelte:fragment>
			</AppRailTile>
		</AppRail>
	</svelte:fragment>

	<slot />
</AppShell>
