<script lang="ts">
    import Label from "$lib/components/ui/label/label.svelte";
    import { InputType, type Input, type QCASimulation, type Signal } from "$lib/qca-simulation";
    import { onMount } from "svelte";
    
    let inputs: Input[] = $state([]);
    let filteredInputs: Input[] = $state([]);
    let searchTerm: string = $state("");

    interface Props {
        qcaSimulation: QCASimulation | undefined;
        selectedInputs: Input[];
        inputType: InputType;
    }
    let { 
        qcaSimulation,
        selectedInputs = $bindable([]),
        inputType,
     }: Props = $props();
    
    onMount(() => {
        inputs = [];
        filteredInputs = [];
        if (qcaSimulation)
            getSignals(qcaSimulation);
    });

    $effect(() => {
        if (qcaSimulation)
            getSignals(qcaSimulation);
    });
    
    function getSignals(simulation: QCASimulation) {
        inputs = simulation.getInputs(inputType);
        searchTerm = "";
    }
    
    function toggleInputSelection(input: Input) {
        if (selectedInputs.includes(input)) {
            selectedInputs = selectedInputs.filter(_input => _input !== input);
        } else {
            selectedInputs = [...selectedInputs, input];
        }
    }
    
    function applyFilter() {
        if (!searchTerm) {
            filteredInputs = inputs;
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredInputs = inputs.filter(input => 
                getInputName(input).toLowerCase().includes(lowerSearchTerm)
            );
        }
    }

    function getInputName(input: Input): string {
        if (!qcaSimulation) {
            throw new Error("QCASimulation is not defined");
        }

        switch (input.type) {
            case InputType.SIGNAL:
                return qcaSimulation.getSignal(input.index).name;
            case InputType.CELL:
                return qcaSimulation.getCell(input.index).label || `Cell ${input.index}`;
            default:
                return "Unknown Input";
        }
    }

    $effect(() => {
        searchTerm;
        applyFilter();
    });
</script>

<div class="flex flex-col gap-2 p-2 border rounded-md">
    <div class="flex items-center justify-between">
        <Label for="inputs-list" class="text-lg font-medium">Input Selector</Label>
        <div class="text-sm">
            {selectedInputs.length} selected
        </div>
    </div>
    
    <!-- Search input -->
    <div class="relative">
        <input
            type="text"
            placeholder="Search inputs..."
            class="w-full p-2 border rounded-md"
            bind:value={searchTerm}
        />
    </div>
    
    <hr class="border-t" />
    
    <div class="flex flex-col gap-1 overflow-y-auto">
        {#each filteredInputs as input}
            <div 
                class="flex items-center p-2 rounded-md cursor-pointer hover:bg-accent transition-colors duration-150"
                class:bg-primary-100={selectedInputs.includes(input)}
                class:text-primary-900={selectedInputs.includes(input)}
                onclick={() => toggleInputSelection(input)}
                onkeydown={(e) => e.key === 'Enter' && toggleInputSelection(input)}
                tabindex="0"
                role="button"
                aria-pressed={selectedInputs.includes(input)}
            >
                <div class="flex items-center gap-2 w-full">
                    <div class="w-4 h-4 flex items-center justify-center border rounded-sm" 
                        class:bg-primary-500={selectedInputs.includes(input)}>
                        {#if selectedInputs.includes(input)}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        {/if}
                    </div>
                    <span>{getInputName(input)}</span>
                </div>
            </div>
        {/each}
        
        {#if filteredInputs.length === 0}
            <div class="p-4 text-center text-accent-foreground">
                No inputs found
            </div>
        {/if}
    </div>
</div>