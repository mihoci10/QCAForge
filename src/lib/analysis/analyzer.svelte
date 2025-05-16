<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, type SignalIndex } from "$lib/qca-simulation";
    import LinePlot from "./line-plot.svelte";
    import SignalsPanel from "./panels/signals-panel.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";

    interface Props {
        qcaSimulation: QCASimulation | undefined;
    }
    let { qcaSimulation = $bindable() }: Props = $props();

    let activeTab: string|undefined = $state('0');
    let selectedSignals: SignalIndex[] = $state([]);

    function addPanel(panel: string) {
        switch (panel) {
            case 'Line Plot':
                visuals.push([LinePlot, { title: 'Line Plot', shownSignals: []}]);
                break;
            default:
                break;
        }

        activeTab = (visuals.length - 1).toString();
    }

    let visuals: any = $state([]);

    $effect(() => {
        if (activeTab)
            updateSignalPanel();
    });

    $effect(() => {
        updatePanelSignals();
    });

    function updateSignalPanel(){
        if (!activeTab) {
            return;
        }
        const selected = visuals[parseInt(activeTab)];
        if (selected) {
            const [_, props] = selected;
            selectedSignals = props.shownSignals;
        }
    }

    function updatePanelSignals(){
        if (!activeTab) {
            return;
        }
        const selectedIdx = parseInt(activeTab);
        if (selectedIdx) {
            visuals[selectedIdx][1].shownSignals = selectedSignals;
        }
    };

    onMount(() => {
        visuals = [
            [LinePlot, { title: 'Line Plot', shownSignals: []}],
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
            <Tabs.Root class='h-full w-full flex flex-col' bind:value={activeTab} activationMode="automatic">
                <Tabs.List class='self-start'>
                    {#each visuals as [_, props], i}
                        <Tabs.Trigger value={i.toString()}>
                            {props.title}
                        </Tabs.Trigger>
                    {/each}
                    <DropdownMenu.Root>
                        <DropdownMenu.Trigger class="flex items-center px-4 py-2 hover:bg-muted focus:bg-muted data-[state=open]:bg-muted rounded-sm">
                            <div class="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md">
                                <Icon icon="material-symbols:add-2-rounded" width={16} />
                                Add panel
                            </div>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content class='w-48'>
                            <DropdownMenu.Item onclick={() => {addPanel('Line Plot')}}>
                                Line Plot
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Tabs.List>
                <div class='h-full flex items-stretch'>
                    {#each visuals as [Component, props], i}
                        <Tabs.Content value={i.toString()} class='w-full'>
                            <Component {...props} {qcaSimulation}/>
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
                <SignalsPanel {qcaSimulation} bind:selectedSignals={selectedSignals}/>
            </Accordion.Root>
        </div>  
    </Resizable.Pane>
</Resizable.PaneGroup>