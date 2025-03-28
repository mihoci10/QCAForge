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
    let selectedCellRotation: string|undefined = $state();
    let polarizationInput: number[] = $state([0.0]);
    let labelInput: string|undefined = $state();
    let positionInput: number[] = $state([]);

    interface Props {
        layers: Layer[];
        selectedCells: Set<CellIndex>;
        propertyChangedCallback: () => void;
    }

    let { layers = $bindable(), selectedCells, propertyChangedCallback }: Props = $props();

    function selectedClockModeChanged(newClockMode: string){
        selectedClockMode = newClockMode;

        if (isNaN(+selectedClockMode))
            return;

        const clock_phase_shift = parseInt(selectedClockMode);

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].clock_phase_shift = clock_phase_shift;
        });
        propertyChangedCallback();
    }

    function selectedCellTypeChanged(newCellType: string){
        selectedCellType = newCellType;

        if (isNaN(+selectedCellType))
            return;

        const cellType = parseInt(selectedCellType);

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].typ = cellType as CellType;
        });
        propertyChangedCallback();
    }

    function selectedCellRotationChanged(newCellRotation: string){
        selectedCellRotation = newCellRotation;

        if (isNaN(+selectedCellRotation))
            return;

        const rotation = parseInt(selectedCellRotation);

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].rotation = rotation;
        });
        propertyChangedCallback();
    }

    function polarizationInputChanged(){
        if (polarizationInput.reduce((acc, v) => acc || isNaN(v), false))
            return;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].dot_probability_distribution = generateDotDistribution(polarizationInput);
        });
        propertyChangedCallback();
    }

    function labelInputChanged(){
        if (!labelInput)
            return;

        if (labelInput.length == 0)
            labelInput = undefined;

        selectedCells.forEach((id) => {
            layers[id.getLayer()].cells[id.getCell()].label = labelInput;
        });
        propertyChangedCallback();
    }

    function positionInputChanged(ind: number){
        selectedCells.forEach((id) => {
            if (isNaN(positionInput[ind]))
                return;
            layers[id.getLayer()].cells[id.getCell()].position[ind] = positionInput[ind];
        });
        propertyChangedCallback();
    }

    export function selectedCellsUpdated(){
        let clockModes: Set<number> = new Set();
        let cellTypes: Set<CellType> = new Set();
        let cellRotation: Set<number> = new Set();
        let polarizations : Set<number>[] = [];
        let cellArchitecture: Set<number> = new Set();
        let cellPositions: [Set<number>, Set<number>] = [new Set(), new Set()];
        let cellLabels: Set<string|undefined> = new Set();

        selectedCells.forEach((id) => {
            const cell = layers[id.getLayer()].cells[id.getCell()];
            clockModes.add(cell.clock_phase_shift);
            cellTypes.add(cell.typ);
            cellRotation.add(cell.rotation);
            const polarization = getPolarization(cell.dot_probability_distribution);
            cellArchitecture.add(polarization.length);
            cellLabels.add(cell.label);

            while (polarization.length > polarizations.length)
                polarizations.push(new Set<number>)
            for (let i = 0; i < polarization.length; i++)
                polarizations[i].add(polarization[i]);

            for (let i = 0; i < 2; i++)
                cellPositions[i].add(cell.position[i]);
        });
        
        if (clockModes.size() > 1)
            selectedClockMode = 'multiple';
        else if (clockModes.size() == 1)
            selectedClockMode = (clockModes.toArray()[0]).toString();
        
        if (cellTypes.size() > 1)
            selectedCellType = 'multiple';
        else if (cellTypes.size() == 1)
            selectedCellType = (cellTypes.toArray()[0]).toString();

        if (cellRotation.size() > 1)
            selectedCellRotation = 'multiple';
        else if (cellRotation.size() == 1)
            selectedCellRotation = (cellRotation.toArray()[0]).toString();
        
        if (cellArchitecture.size() == 1){
            let equalCheck = polarizations.reduce((acc, v) => acc && (v.size() == 1), true)
            if (equalCheck)
                polarizationInput = polarizations.map((v) => v.toArray()[0]);
            else
                polarizationInput = new Array(polarizations.length).fill(NaN);
        }
        else if (cellArchitecture.size() > 1)
            polarizationInput = [NaN];

        if (cellLabels.size() == 1)
            labelInput = cellLabels.toArray()[0];
        else if (cellLabels.size() > 1)
            labelInput = 'multiple';

        for (let i = 0; i < 2; i++){
            if (cellPositions[i].size() > 1)
                positionInput[i] = NaN;
            else
                positionInput[i] = cellPositions[i].toArray()[0];
        }
    }

    export function getCellProps(): Cell{
        return{
            clock_phase_shift: parseInt(selectedClockMode || '0'),
            typ: parseInt(selectedCellType || '0') as CellType,
            rotation: parseInt(selectedCellRotation || '0'),
            dot_probability_distribution: generateDotDistribution(polarizationInput),
            label: labelInput,
            position: positionInput.map((v) => Math.round(v)) as [number, number],
        }
    }

    const selected_clock_display = $derived((() => {
        switch(selectedClockMode){
            case '0': return '0 degrees';
            case '90': return '90 degrees';
            case '180': return '180 degrees';
            case '270': return '270 degrees';
            case 'multiple': return 'Multiple';
            default: return 'Select phase shift';
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
    const selected_rotation_display = $derived((() => {
        switch(selectedCellRotation){
            case '0': return '0 degrees';
            case '90': return '90 degrees';
            default: return 'Select rotation';
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
                <Label>Clock phase shift</Label>
                <Select.Root 
                    bind:value={selectedClockMode} onValueChange={selectedClockModeChanged} 
                    type="single"
                    disabled={(!selectedCellType) || !['0', '2'].includes(selectedCellType)}>
                    <Select.Trigger>
                        {selected_clock_display}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value="0" label='0 degrees'/>
                        <Select.Item value="90" label='90 degrees'/>
                        <Select.Item value="180" label='180 degrees'/>
                        <Select.Item value="270" label='270 degrees'/>
                    </Select.Content>
                </Select.Root>
            </div>
            <div class="flex flex-col gap-1.5">
                <Label>Cell type</Label>
                <Select.Root 
                    bind:value={selectedCellType} onValueChange={selectedCellTypeChanged} 
                    type="single">
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
            {#if polarizationInput && polarizationInput.length == 1}
                <div class="flex flex-col gap-1.5">
                    <Label>Cell rotation</Label>
                    <Select.Root 
                        bind:value={selectedCellRotation} onValueChange={selectedCellRotationChanged}
                        type="single">
                        <Select.Trigger>
                            {selected_rotation_display}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="0" label='0 degrees'/>
                            <Select.Item value="90" label='90 degrees'/>
                        </Select.Content>
                    </Select.Root>
                </div>
            {/if}
            <div class="flex flex-col gap-1.5">
                {#if polarizationInput && polarizationInput.length > 0}
                <Label>Polarization</Label>
                {#each polarizationInput as polarization, i}
                    <div class="flex items-center gap-2">
                        {#if polarizationInput.length > 1}
                            <span>{'ABCDE'.at(i)}</span>
                        {/if}
                        <Input 
                            type='number' min="-1" max="1" step="0.1" 
                            bind:value={polarizationInput[i]} onchange={polarizationInputChanged}
                            disabled={(!selectedCellType) || !['3'].includes(selectedCellType)}/>
                    </div>
                {/each}
                {/if}
            </div> 
            <div class="flex flex-col gap-1.5">
                <Label>Cell label</Label>
                <Input 
                    type='text'
                    bind:value={labelInput} onchange={labelInputChanged}
                    placeholder= "Label"
                    disabled={(!selectedCellType) || !['1', '2'].includes(selectedCellType)}
                    />
            </div> 
            <div class="flex flex-col gap-1.5">
                <Label>Position</Label>
                <div class='flex gap-5'>
                    <div class="flex">
                        <div class='bg-red-700 flex items-center px-2'>X</div>
                        <Input 
                            type="number" 
                            step="1"
                            bind:value={positionInput[0]}
                            onchange={() => positionInputChanged(0)}
                        />
                    </div>
                    <div class="flex">
                        <div class='bg-green-700 flex items-center px-2'>Y</div>
                        <Input 
                            type="number" 
                            step="1"
                            bind:value={positionInput[1]}
                            onchange={() => positionInputChanged(1)}
                        />
                    </div>
                </div>
            </div>
        </div>
    </Accordion.Content>
</Accordion.Item>