<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs/";
	import LogPanel from "$lib/logging/log-panel.svelte";

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
    let { panels, selectedPanelId = $bindable() }: Props = $props();

</script>

<Tabs.Root bind:value={selectedPanelId} class="flex h-full min-h-0 flex-col overflow-hidden">
    <Tabs.List class="shrink-0">
        {#each panels as panel}
            {#if panel.visible}
                <Tabs.Trigger value={panel.id}>{panel.title}</Tabs.Trigger>
            {/if}
        {/each}
    </Tabs.List>
    {#each panels as panel}
        {#if panel.visible}
        <Tabs.Content value={panel.id} class="flex flex-1 flex-col overflow-hidden">
            {#if panel.id === 'log'}
                <LogPanel />
            {/if}
        </Tabs.Content>
        {/if}
    {/each}
</Tabs.Root>
