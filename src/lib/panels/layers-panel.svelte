<!-- @migration-task Error while migrating Svelte code: Cannot use `export let` in runes mode — use `$props()` instead -->
<script lang="ts">
    import { getDefaultCellArchitecture } from "$lib/CellArchitecture";
    import type { Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import {ScrollArea} from "$lib/components/ui/scroll-area";
    import * as ToggleGroup from "$lib/components/ui/toggle-group";
    import { Button } from "$lib/components/ui/button";

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
        <div class="flex items-center gap-1.5">
            Layers
            <Icon icon="material-symbols:layers"/>
        </div>
    </Accordion.Trigger>
    <Accordion.Content>
        <div>
            <Button variant='outline' size='icon'
                onclick={addLayer}>
                <Icon icon="mdi:plus"/>
            </Button>
            <Button variant='outline' size='icon'
                onclick={removeLayer}>
                <Icon icon="mdi:minus"/>
            </Button>
            <Button variant='outline' size='icon'
                onclick={moveLayerUp}>
                <Icon icon="mdi:arrow-up"/>
            </Button>
            <Button variant='outline' size='icon'
                onclick={moveLayerDown}>
                <Icon icon="mdi:arrow-down"/>
            </Button>
        </div>

        <ScrollArea class="overflow-y-auto h-32 resize-y rounded-md border">
            {#each layers as layer, index}
            <div
                class="flex items-center justify-between px-2 py-1 border-b w-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
                onclick={() => selectedLayer = index}
                data-state={selectedLayer === index ? "on" : "off"}
            >
                <Button variant='ghost' size='icon'onclick={(e) => layer.visible = !layer.visible}>
                    <Icon icon="{layer.visible ? "mdi:eye" : "mdi:eye-closed"}"/>
                </Button>
                <span class="select-none cursor-default">{layer.name}</span>
                <Button variant='ghost' size='icon' onclick={(e) => openLayerOptions(i)}> 
                    <Icon icon="material-symbols:settings"/>
                </Button>
                
            </div>
            {/each}
        </ScrollArea>
    </Accordion.Content>
</Accordion.Item> 