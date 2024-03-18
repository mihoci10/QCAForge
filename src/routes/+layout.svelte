<script lang="ts">
	import '../app.postcss';
	import {AppShell, AppRail, AppRailTile} from '@skeletonlabs/skeleton'
</script>

<AppShell>
	<svelte:fragment slot="sidebarLeft">
		<AppRail>
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
