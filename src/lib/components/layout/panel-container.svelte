<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs/";
	import LogPanel from "$lib/logging/log-panel.svelte";
	import { visibleBottomPanels } from "$lib/globals";
	import { onMount } from "svelte";

	interface PanelId {
		id: string;
		title: string;
		visible: boolean;
	}

	export const VALID_PANELS: PanelId[] = [
		{ id: "log", title: "Log", visible: true },
	];

	interface Props {
		panels: PanelId[];
		selectedPanelId: string;
	}
	let { panels = $bindable(), selectedPanelId = $bindable() }: Props =
		$props();

	onMount(() => {
		visibleBottomPanels.subscribe((visibleIds) => {
			panels.forEach((panel) => {
				panel.visible = visibleIds.includes(panel.id);
			});
			// If the selected panel is no longer visible, switch to the first visible panel
			if (!panels.find((p) => p.id === selectedPanelId && p.visible)) {
				const firstVisible = panels.find((p) => p.visible);
				if (firstVisible) selectedPanelId = firstVisible.id;
			}
			panels = [...panels]; // Trigger reactivity
		});
	});
</script>

<Tabs.Root bind:value={selectedPanelId} class="flex h-full min-h-0 flex-col ">
	<Tabs.List class="shrink-0 justify-start">
		{#each panels as panel}
			{#if panel.visible}
				<Tabs.Trigger value={panel.id}>{panel.title}</Tabs.Trigger>
			{/if}
		{/each}
	</Tabs.List>
	{#each panels as panel}
		{#if panel.visible}
			<Tabs.Content
				value={panel.id}
				class="flex flex-1 flex-col overflow-hidden"
			>
				{#if panel.id === "log"}
					<LogPanel />
				{/if}
			</Tabs.Content>
		{/if}
	{/each}
</Tabs.Root>
