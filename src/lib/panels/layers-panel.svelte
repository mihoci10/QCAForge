<script lang="ts">
    import type { Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import { getModalStore, ListBox, ListBoxItem, type ModalSettings, TreeViewItem } from "@skeletonlabs/skeleton";

    
    export let layers: Layer[];
    export let selectedLayer: number;

    const modalStore = getModalStore();
    
    function openLayerOptions(layerIdx: number){

        return new Promise((resolve) => {
            const modal: ModalSettings = {
                type: 'component',
                component: 'layerOptions',
                title: `${layers[layerIdx].name} options`,
                meta: {},
                response: (r:any) => resolve(r),
            };
            modalStore.trigger(modal);
            })
        .then((res: any) => {
            console.log(res);
        });
    }

    function getIndexOfLayer(layerName: string): number{
        for (let i = 0; i < layers.length; i++) {
            if (layers[i].name == layerName)
                return i;            
        }
        return NaN;
    }

    function layerNameExists(layerName: string): boolean{
        return !isNaN(getIndexOfLayer(layerName));
    }

    function addLayer(){
        let newLayerName = 'New Layer';
        let layerCnt = 0;
        while (layerNameExists(newLayerName)){
            layerCnt++;
            newLayerName = `New Layer ${layerCnt}`;
        }

        const i = selectedLayer;

        layers.splice(i+1, 0, {name: newLayerName, visible: true})

        layers = layers;
    }

    function removeLayer(){
        if (layers.length == 1)
            return;

        const i = selectedLayer;
        layers.splice(i, 1);

        selectedLayer = Math.max(selectedLayer - 1, 0);
        layers = layers;
    }

    function moveLayerDown(){
        if (selectedLayer == layers.length - 1)
            return;

        layers[selectedLayer] = layers.splice(selectedLayer + 1, 1, layers[selectedLayer])[0];
        selectedLayer++;
        layers = layers;
    }

    function moveLayerUp(){
        if (selectedLayer == 0)
            return;

        layers[selectedLayer] = layers.splice(selectedLayer - 1, 1, layers[selectedLayer])[0];
        selectedLayer--;
        layers = layers;
    }

</script>

<TreeViewItem>
    Layers
    <svelte:fragment slot="lead"><Icon icon="material-symbols:layers"/></svelte:fragment>
    <svelte:fragment slot="children">
        <div>
            <button type="button" class="btn-icon variant-filled btn-icon-sm"
                on:click={addLayer}>
                <Icon icon="mdi:plus"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm"
                on:click={removeLayer}>
                <Icon icon="mdi:minus"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm"
                on:click={moveLayerUp}>
                <Icon icon="mdi:arrow-up"/>
            </button>
            <button type="button" class="btn-icon variant-filled btn-icon-sm"
                on:click={moveLayerDown}>
                <Icon icon="mdi:arrow-down"/>
            </button>
        </div>
        <div class="overflow-y-auto h-32 resize-y m-2 bg-surface-700">
            <ListBox padding="p-0">
                {#each layers as layer, i}
                    <ListBoxItem bind:group={selectedLayer} name={layer.name} value={i}>
                        <svelte:fragment slot="lead">
                            <button type="button" class="btn-icon" on:click={(e) => layer.visible = !layer.visible}>
                                <Icon icon="{layer.visible ? "mdi:eye" : "mdi:eye-closed"}"/>
                            </button>
                        </svelte:fragment>
                        {layer.name}
                        <svelte:fragment slot="trail">
                            <button type="button" class="btn-icon" on:click={(e) => openLayerOptions(i)}> 
                                <Icon icon="material-symbols:settings"/>
                            </button>
                        </svelte:fragment>
                    </ListBoxItem>
                {/each}
            </ListBox>
        </div>
    </svelte:fragment>
</TreeViewItem>