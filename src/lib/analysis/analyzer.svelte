<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { SignalType } from "$lib/qca-simulation";
    import LinePlot from "./line-plot.svelte";
    import SignalsPanel from "./panels/signals-panel.svelte";
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
        <LinePlot title='Line Plot' shownSignals={[
            {type: SignalType.CLOCK, index: 1},
            {type: SignalType.CELL, index: 1, subindex: 0},
            {type: SignalType.CELL, index: 1, subindex: 1}
            ]} />
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane defaultSize={15} minSize={10}>
        <div class='h-full overflow-y-auto p-2'>
            <Accordion.Root type='multiple'>
                <SignalsPanel/>
            </Accordion.Root>
        </div>  
    </Resizable.Pane>
</Resizable.PaneGroup>