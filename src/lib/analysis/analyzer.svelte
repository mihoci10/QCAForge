<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, SignalType, type SignalIndex } from "$lib/qca-simulation";
    import LinePlot from "./line-plot.svelte";
    import SignalsPanel from "./panels/signals-panel.svelte";

    interface Props {
        qcaSimulation: QCASimulation | undefined;
    }
    let { qcaSimulation = $bindable() }: Props = $props();

    let shownSignals: SignalIndex[] = $state([]);

    function onSignallAdded(signalIndex: SignalIndex) {
        shownSignals.push(signalIndex);
    }
    function onSignalRemoved(signalIndex: SignalIndex) {
        shownSignals = shownSignals.filter(signal => signal !== signalIndex);
    }
</script>


<Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={15} minSize={10}>
        <div class='h-full bg-surface-500 overflow-y-auto pr-2'>
            <Accordion.Root type='multiple'>

            </Accordion.Root>
        </div>  
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane minSize={10}>
        <LinePlot {qcaSimulation} title='Line Plot' {shownSignals}/>
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane defaultSize={15} minSize={10}>
        <div class='h-full overflow-y-auto p-2'>
            <Accordion.Root type='multiple'>
                <SignalsPanel {qcaSimulation} {onSignallAdded} {onSignalRemoved}/>
            </Accordion.Root>
        </div>  
    </Resizable.Pane>
</Resizable.PaneGroup>