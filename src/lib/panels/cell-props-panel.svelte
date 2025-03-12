<script lang="ts">
    import { CellIndex, generateDotDistribution, getPolarization, type Cell, type CellType } from "$lib/Cell";
    import { type Layer } from "$lib/Layer";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import { Input } from "$lib/components/ui/input";
    import { Set } from 'typescript-collections'
    import * as Select from "$lib/components/ui/select";
    import Label from "$lib/components/ui/label/label.svelte";

    let selectedClockMode: string|undefined = $state();
    let selectedCellType: string|undefined = $state();
    let polarizationInput: number[] = $state([]);

    interface Props {
        layers: Layer[];
        selectedCells: Set<CellIndex>;
    }

    let { layers, selectedCells }: Props = $props();

    function selectedClockModeChanged(newClockMode: string){
        selectedClockMode = newClockMode;

        if (isNaN(+selectedClockMode))
            return;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].clock_phase_shift = parseInt(selectedClockMode);
        });
    }

    function selectedCellTypeChanged(newCellType: string){
        selectedCellType = newCellType;

        if (isNaN(+selectedCellType))
            return;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].typ = parseInt(selectedCellType);
        });
    }

    function polarizationInputChanged(){
        if (polarizationInput.reduce((acc, v) => acc || isNaN(v), false))
            return;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].dot_probability_distribution = generateDotDistribution(polarizationInput);
        });
    }

    export function selectedCellsUpdated(){
        console.log(selectedCells);
        let clockModes: Set<number> = new Set();
        let cellTypes: Set<CellType> = new Set();
        let polarizations : Set<number>[] = [];
        let cellArchitecture: Set<number> = new Set();

        selectedCells.forEach((id) => {
            const cell = layers[id.getLayer()].cells[id.getCell()];
            clockModes.add(cell.clock_phase_shift);
            cellTypes.add(cell.typ);
            const polarization = getPolarization(cell);
            cellArchitecture.add(polarization.length);

            while (polarization.length > polarizations.length)
                polarizations.push(new Set<number>)
            for (let i = 0; i < polarization.length; i++)
                polarizations[i].add(polarization[i]);
        });
        
        if (clockModes.size() > 1)
            selectedClockMode = 'multiple';
        else if (clockModes.size() == 1)
            selectedClockMode = (clockModes.toArray()[0]).toString();
        
        if (cellTypes.size() > 1)
            selectedCellType = 'multiple';
        else if (cellTypes.size() == 1)
            selectedCellType = (cellTypes.toArray()[0]).toString();
        
        if (cellArchitecture.size() > 1)
            polarizationInput = [NaN];
        else {
            let equalCheck = polarizations.reduce((acc, v) => acc && (v.size() == 1), true)
            if (equalCheck)
                polarizationInput = polarizations.map((v) => v.toArray()[0]);
            else
                polarizationInput = new Array(polarizations.length).fill(NaN);
        }
    }

    const selected_clock_display = $derived((() => {
        switch(selectedClockMode){
            case '0': return 'Clock 1';
            case '1': return 'Clock 2';
            case '2': return 'Clock 3';
            case '3': return 'Clock 4';
            case 'multiple': return 'Multiple';
            default: return 'Select clock';
        }
    })());
    const selected_type_display = $derived((() => {
        switch(selectedCellType){
            case '0': return 'Normal';
            case '1': return 'Input';
            case '2': return 'Output';
            case '3': return 'Fixed';
            case 'multiple': return 'Multiple';
            default: return 'Select type';
        }
    })());

</script>

<Accordion.Item value="cell-props">
    <Accordion.Trigger>
        <div class="flex items-center gap-1.5">
            Cell properties
            <Icon icon="material-symbols:build-rounded"/>
        </div>
    </Accordion.Trigger>
    <Accordion.Content>
        <div class="flex flex-col gap-2 px-1">
            <div class="flex flex-col gap-1.5">
                <Label>Clock mode</Label>
                <Select.Root bind:value={selectedClockMode} type="single">
                    <Select.Trigger>
                        {selected_clock_display}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="0" label='Clock 1'/>
                        <Select.Item value="1" label='Clock 2'/>
                        <Select.Item value="2" label='Clock 3'/>
                        <Select.Item value="3" label='Clock 4'/>
                    </Select.Content>
                </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                <Label>Cell type</Label>
                <Select.Root bind:value={selectedCellType} type="single">
                    <Select.Trigger>
                        {selected_type_display}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="0" label='Normal'/>
                        <Select.Item value="1" label='Input'/>
                        <Select.Item value="2" label='Output'/>
                        <Select.Item value="3" label='Fixed'/>
                    </Select.Content>
                </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                {#if polarizationInput && polarizationInput.length > 0}
                <Label>Polarization</Label>
                {#each polarizationInput as polarization, i}
                    {#if polarizationInput.length > 1}
                        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                            <div class="input-group-shim bg-tertiary">{'ABCDE'.at(i)}</div>
                            <input class='input' type="number" min="-1" max="1" step="0.1" value={polarization}/>
                        </div>
                    {:else}
                        <input class='input' type="number" min="-1" max="1" step="0.1" value={polarization}/>
                    {/if}
                {/each}
                {/if}
            </div> 
            <div class="flex flex-col gap-1.5">
                <Label>Position</Label>
                <div class='flex'>
                    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                        <div class="input-group-shim bg-red-500">X</div>
                        <input type="number"/>
                    </div>
                    <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                        <div class="input-group-shim bg-green-500">Y</div>
                        <input type="number"/>
                    </div>
                </div>
            </div>
        </div>
    </Accordion.Content>
</Accordion.Item>