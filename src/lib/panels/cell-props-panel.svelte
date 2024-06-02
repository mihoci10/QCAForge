<script lang="ts">
    import type { Cell, CellType } from "$lib/Cell";
    import Icon from "@iconify/svelte";
    import { TreeViewItem } from "@skeletonlabs/skeleton";

    
    let selectedClockMode: string = "0";
    $: selectedClockMode, selectedClockModeChanged();
    let selectedCellType: string = "0";
    $: selectedCellType, selectedCellTypeChanged();
    let polarizationInput: number = 0;
    $: polarizationInput, polarizationInputChanged();

    export let cells: Cell[];
    export let selectedCells: Set<number>;

    function selectedClockModeChanged(){
        if (isNaN(+selectedClockMode))
            return;

        selectedCells.forEach((id) => {
            cells[id].clock_phase_shift = parseInt(selectedClockMode);
        });
    }

    function selectedCellTypeChanged(){
        if (isNaN(+selectedCellType))
            return;

        selectedCells.forEach((id) => {
            cells[id].typ = parseInt(selectedCellType);
        });
    }

    function polarizationInputChanged(){
        if (isNaN(polarizationInput))
            return;

        selectedCells.forEach((id) => {
            cells[id].polarization = polarizationInput;
        });
    }

    export function selectedCellsUpdated(){
        let clockModes: Set<number> = new Set();
        let cellTypes: Set<CellType> = new Set();
        let polarizations : Set<Number> = new Set();

        selectedCells.forEach((id) => {
            clockModes.add(cells[id].clock_phase_shift);
            cellTypes.add(cells[id].typ);
            polarizations.add(cells[id].polarization);
        });
        
        if (clockModes.size > 1)
            selectedClockMode = 'multiple';
        else if (clockModes.size == 1)
            selectedClockMode = (clockModes.values().next().value).toString();
        
        if (cellTypes.size > 1)
            selectedCellType = 'multiple';
        else if (cellTypes.size == 1)
            selectedCellType = (cellTypes.values().next().value).toString();
        
        if (polarizations.size > 1)
            polarizationInput = NaN;
        else if (polarizations.size == 1)
            polarizationInput = parseFloat((polarizations.values().next().value).toString());
    }
    
</script>

<TreeViewItem>
    Cell properties
    <svelte:fragment slot="lead"><Icon icon="material-symbols:build-rounded"/></svelte:fragment>
    <svelte:fragment slot="children">
        <form>
            <label class="label">
                <span>Clock mode</span>
                <select class="select" bind:value={selectedClockMode}>
                    <option value="multiple" hidden>Multiple values</option>
                    <option value=0>Clock 0</option>
                    <option value=1>Clock 1</option>
                    <option value=2>Clock 2</option>
                    <option value=3>Clock 3</option>
                </select>
            </label>
            <label class="label">
                <span>Cell type</span>
                <select class="select" bind:value={selectedCellType}>
                    <option value="multiple" hidden>Multiple values</option>
                    <option value=0>Normal</option>
                    <option value=1>Input</option>
                    <option value=2>Output</option>
                    <option value=3>Fixed</option>
                </select>
            </label>
            <label class="label">
                <span>Polarization</span>
                <input class='input' type="number" min="-1" max="1" step="0.1" bind:value={polarizationInput}/>
            </label> 
            <label class="label">
                <span>Position</span>
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
            </label>
        </form>
    </svelte:fragment>
</TreeViewItem>