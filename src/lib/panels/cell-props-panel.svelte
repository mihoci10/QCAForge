<script lang="ts">
    import { generateDotDistribution, getPolarization, type Cell, type CellType } from "$lib/Cell";
    import Icon from "@iconify/svelte";
    import { TreeViewItem } from "@skeletonlabs/skeleton";

    let selectedClockMode: string = "0";
    $: selectedClockMode, selectedClockModeChanged();
    let selectedCellType: string = "0";
    $: selectedCellType, selectedCellTypeChanged();
    let polarizationInput: number[] = [];
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
        if (polarizationInput.reduce((acc, v) => acc || isNaN(v), false))
            return;

        selectedCells.forEach((id) => {
            cells[id].dot_probability_distribution = generateDotDistribution(polarizationInput);
        });
    }

    export function selectedCellsUpdated(){
        let clockModes: Set<number> = new Set();
        let cellTypes: Set<CellType> = new Set();
        let polarizations : Set<Number>[] = [];
        let cellArchitecture: Set<Number> = new Set();

        selectedCells.forEach((id) => {
            clockModes.add(cells[id].clock_phase_shift);
            cellTypes.add(cells[id].typ);
            const polarization = getPolarization(cells[id]);
            cellArchitecture.add(polarization.length);

            while (polarization.length > polarizations.length)
                polarizations.push(new Set<Number>)
            for (let i = 0; i < polarization.length; i++)
                polarizations[i].add(polarization[i]);
        });
        
        if (clockModes.size > 1)
            selectedClockMode = 'multiple';
        else if (clockModes.size == 1)
            selectedClockMode = (clockModes.values().next().value).toString();
        
        if (cellTypes.size > 1)
            selectedCellType = 'multiple';
        else if (cellTypes.size == 1)
            selectedCellType = (cellTypes.values().next().value).toString();
        
        if (cellArchitecture.size > 1)
            polarizationInput = [NaN];
        else {
            let equalCheck = polarizations.reduce((acc, v) => acc && (v.size == 1), true)
            if (equalCheck)
                polarizationInput = polarizations.map((v) => v.values().next().value);
            else
                polarizationInput = new Array(polarizations.length).fill(NaN);
        }
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
                {#if polarizationInput && polarizationInput.length > 0}
                <span>Polarization</span>
                {#each polarizationInput as polarization, i}
                    {#if polarizationInput.length > 1}
                        <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                            <div class="input-group-shim bg-tertiary">{'ABCDE'.at(i)}</div>
                            <input class='input' type="number" min="-1" max="1" step="0.1" bind:value={polarization}/>
                        </div>
                    {:else}
                        <input class='input' type="number" min="-1" max="1" step="0.1" bind:value={polarization}/>
                    {/if}
                {/each}
                {/if}
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