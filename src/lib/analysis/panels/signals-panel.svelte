<script lang="ts">
    import Label from "$lib/components/ui/label/label.svelte";
    import type { QCASimulation, Signal, SignalIndex } from "$lib/qca-simulation";
    import { onMount } from "svelte";
    
    let signals: Signal[] = $state([]);
    let filteredSignals: Signal[] = $state([]);
    let searchTerm: string = $state("");

    interface Props {
        qcaSimulation: QCASimulation | undefined;
        selectedSignals: SignalIndex[];
    }
    let { 
        qcaSimulation,
        selectedSignals = $bindable([]),
     }: Props = $props();
    
    onMount(() => {
        signals = [];
        filteredSignals = [];
        if (qcaSimulation)
            getSignals(qcaSimulation);
    });

    $effect(() => {
        if (qcaSimulation)
            getSignals(qcaSimulation);
    });
    
    function getSignals(simulation: QCASimulation) {
        signals = simulation.getSignals();
        searchTerm = "";
    }
    
    function toggleSignalSelection(signal: Signal) {
        if (selectedSignals.includes(signal.index)) {
            selectedSignals = selectedSignals.filter(index => index !== signal.index);
        } else {
            selectedSignals.push(signal.index);
        }
    }
    
    function applyFilter() {
        if (!searchTerm) {
            filteredSignals = signals;
        } else {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filteredSignals = signals.filter(signal => 
                signal.name.toLowerCase().includes(lowerSearchTerm)
            );
        }
    }

    $effect(() => {
        searchTerm;
        applyFilter();
    });
</script>

<div class="flex flex-col gap-2 p-2 border rounded-md">
    <div class="flex items-center justify-between">
        <Label for="signals-list" class="text-lg font-medium">Signal Selector</Label>
        <div class="text-sm">
            {selectedSignals.length} selected
        </div>
    </div>
    
    <!-- Search input -->
    <div class="relative">
        <input
            type="text"
            placeholder="Search signals..."
            class="w-full p-2 border rounded-md"
            bind:value={searchTerm}
        />
    </div>
    
    <hr class="border-t" />
    
    <div class="flex flex-col gap-1 overflow-y-auto">
        {#each filteredSignals as signal}
            <div 
                class="flex items-center p-2 rounded-md cursor-pointer hover:bg-accent transition-colors duration-150"
                class:bg-primary-100={selectedSignals.includes(signal.index)}
                class:text-primary-900={selectedSignals.includes(signal.index)}
                onclick={() => toggleSignalSelection(signal)}
                onkeydown={(e) => e.key === 'Enter' && toggleSignalSelection(signal)}
                tabindex="0"
                role="button"
                aria-pressed={selectedSignals.includes(signal.index)}
            >
                <div class="flex items-center gap-2 w-full">
                    <div class="w-4 h-4 flex items-center justify-center border rounded-sm" 
                        class:bg-primary-500={selectedSignals.includes(signal.index)}>
                        {#if selectedSignals.includes(signal.index)}
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        {/if}
                    </div>
                    <span>{signal.name}</span>
                </div>
            </div>
        {/each}
        
        {#if filteredSignals.length === 0}
            <div class="p-4 text-center text-accent-foreground">
                No signals found
            </div>
        {/if}
    </div>
</div>