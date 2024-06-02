<script lang="ts">
    import type { Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import { ListBox, ListBoxItem, TreeViewItem } from "@skeletonlabs/skeleton";

    
    export let layers: Layer[];
    export let selectedLayer: string;
</script>

<TreeViewItem>
    Layers
    <svelte:fragment slot="lead"><Icon icon="material-symbols:layers"/></svelte:fragment>
    <svelte:fragment slot="children">
        <div>
            <button type="button" class="btn-icon variant-filled btn-icon-sm">
                <Icon icon="mdi:plus"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm">
                <Icon icon="mdi:minus"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm">
                <Icon icon="mdi:arrow-up"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm">
                <Icon icon="mdi:arrow-down"/>
            </button>
        </div>
        <div class="overflow-y-auto h-32 m-2 bg-surface-700">
            <ListBox padding="p-0">
                {#each layers as layer, i}
                    <ListBoxItem bind:group={selectedLayer} name={layer.name} value={i.toString()}>
                        <svelte:fragment slot="lead">
                            <button type="button" class="btn-icon" on:click={(e) => layer.visible = !layer.visible}>
                                <Icon icon="{layer.visible ? "mdi:eye" : "mdi:eye-closed"}"/>
                            </button>
                        </svelte:fragment>
                        {layer.name}
                        <svelte:fragment slot="trail">
                            <button type="button" class="btn-icon">
                                <Icon icon="material-symbols:settings" />
                            </button>
                        </svelte:fragment>
                    </ListBoxItem>
                {/each}
            </ListBox>
        </div>
    </svelte:fragment>
</TreeViewItem>