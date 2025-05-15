<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, type SignalIndex } from "$lib/qca-simulation";
    import LinePlot from "./line-plot.svelte";
    import SignalsPanel from "./panels/signals-panel.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { onMount } from "svelte";

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

    let visuals: any = $state([]);

    onMount(() => {
        visuals = [
            [LinePlot, { title: 'Line Plot'}],
        ]
    });
</script>


<Resizable.PaneGroup direction="horizontal">
    <Resizable.Pane defaultSize={15} minSize={10}>
        <div class='h-full bg-surface-500 overflow-y-auto pr-2'>
            <Accordion.Root type='multiple'>

            </Accordion.Root>
        </div>  
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane minSize={10} class=''>
        <div class='h-full'>
            <Tabs.Root class='h-full w-full flex flex-col' value={"0"} activationMode="manual">
                <Tabs.List class='self-start'>
                    {#each visuals as [_, props], i}
                        <Tabs.Trigger value={i.toString()}>
                            {props.title}
                        </Tabs.Trigger>
                    {/each}
                    <Tabs.Trigger value="new">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger class='w-full'>
                                New
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content class='w-48'>
                                <DropdownMenu.Item onclick={() => {}}>
                                    Line Plot
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </Tabs.Trigger>
                </Tabs.List>
                <div class='h-full flex items-stretch'>
                    {#each visuals as [Component, props], i}
                        <Tabs.Content value={i.toString()} class='w-full'>
                            <Component {...props} {qcaSimulation} {shownSignals}/>
                        </Tabs.Content>
                    {/each}
                </div>
            </Tabs.Root>
        </div>
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