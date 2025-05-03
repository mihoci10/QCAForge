<script lang="ts">
    import * as Accordion from "$lib/components/ui/accordion";
    import Label from "$lib/components/ui/label/label.svelte";
    import { simulation } from "$lib/globals";
    import type { QCASimulation, Signal } from "$lib/qca-simulation";
    import { onMount } from "svelte";

    let signals: Signal[];
    let filteredSignals: Signal[] = $state([]);

    onMount(() => {
        signals = [];
        filteredSignals = [];
    });

    simulation.subscribe((qcaSimulation: QCASimulation) => {
        if (qcaSimulation) {
            getSignals(qcaSimulation);
        }
    });

    function getSignals(simulation: QCASimulation) {
        signals = simulation.getSignals();
        filteredSignals = signals;
    }
</script>

<Accordion.Item value="signals-list">
    <Accordion.Trigger>
        <div class="flex items-center gap-1.5">
            <span>Signal list</span>
        </div>
    </Accordion.Trigger>
    <Accordion.Content>
        <div class="flex flex-col gap-2 px-1">
            {#each filteredSignals as signal, i}
                <div class="flex items-center gap-1.5">
                    <Label for={signal.name} class="text-sm">{signal.name}</Label>
                </div>
            {/each}
        </div>
    </Accordion.Content>
</Accordion.Item>