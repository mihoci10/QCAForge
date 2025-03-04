<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<script lang="ts">
    import { getDefaultCellArchitecture } from "$lib/CellArchitecture";
    import type { Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import {ScrollArea} from "$lib/components/ui/scroll-area";
    import * as ToggleGroup from "$lib/components/ui/toggle-group";

    interface Props {
        layers: Layer[];
        selectedLayer: number;
    }

    let { layers = $bindable(), selectedLayer = $bindable() }: Props = $props();
    
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
            if(res){
                layers[layerIdx].cell_architecture = res.cell_architecture;
            }
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

        layers.splice(i+1, 0, {name: newLayerName, visible: true, cell_architecture: getDefaultCellArchitecture(), cells: [], z_position: 0})
        dispatchLayerChange('addLayer', i+1);

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

<Accordion.Item value="layers">
    <Accordion.Trigger>
        Layers
        <Icon icon="material-symbols:layers"/>
    </Accordion.Trigger>
    <Accordion.Content>
        <!-- <div>
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
            <ScrollArea>
                <ToggleGroup.Root type="single" orientation="vertical" class="flex-col" bind:value={selectedLayer}>
                    {#each layers as layer, i}
                    <ToggleGroup.Item value={i.toString()}>
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
                        {layer.name}
                    </ToggleGroup.Item>
                {/each}
                </ToggleGroup.Root>
            </ScrollArea>
        </div> -->

        <ScrollArea class="h-20 rounded-md border">
            {#each layers as layer, index}
            <div
                class="flex items-center justify-between px-2 py-1 border-b w-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                onclick={() => selectedLayer = index}
                data-state={selectedLayer === index ? "on" : "off"}
            >
                <button type="button" class="btn-icon" onclick={(e) => layer.visible = !layer.visible}>
                    <Icon icon="{layer.visible ? "mdi:eye" : "mdi:eye-closed"}"/>
                </button>
                <span class="select-none cursor-default">{layer.name}</span>
                <button type="button" class="btn-icon" onclick={(e) => openLayerOptions(i)}> 
                    <Icon icon="material-symbols:settings"/>
                </button>
                
            </div>
            {/each}
        </ScrollArea>
    </Accordion.Content>
</Accordion.Item> 