<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, type SignalIndex } from "$lib/qca-simulation";
    import LinePlotVis from "./line-plot-vis.svelte";
    import SignalsPanel from "./panels/signals-panel.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";
    import TruthTableVis from "./truth-table-vis.svelte";

    interface Props {
        qcaSimulation: QCASimulation | undefined;
    }
    let { qcaSimulation = $bindable() }: Props = $props();

    let activeTab: string|undefined = $state('0');
    let selectedSignals: SignalIndex[] = $state([]);

    const VIS_PANELS = [
        { id: 'linePlot', component: LinePlotVis, title: 'Line Plot' },
        { id: 'truthTable', component: TruthTableVis, title: 'Truth Table' },
    ];

    function addPanel(panelId: string) {
        const panel = VIS_PANELS.find(p => p.id === panelId);
        if (!panel) 
            return

        const { component, title } = panel;
        let componentTitle = title;
        let titleIdx = 1;
        while (visuals.some((visual: any) => visual[1].title == componentTitle)) {
            componentTitle = `${title} ${titleIdx}`;
            titleIdx++;
        }
        visuals.push([component, { title: componentTitle, signals: [] }]); 
        updateSignalPanel((visuals.length - 1).toString());
    }

    let visuals: any = $state([]);

    $effect(() => {
        updatePanelSignals();
    });

    function updateSignalPanel(value: string){
        activeTab = value;

        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            selectedSignals = [...visuals[selectedIdx][1].signals];
        }
    }

    function updatePanelSignals(){
        if (!activeTab) {
            return;
        }
        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            visuals[selectedIdx][1].signals = [...selectedSignals];
        }
    };

    onMount(() => {
        visuals = [
            [LinePlotVis, { title: 'Line Plot', signals: []}],
        ]
        updateSignalPanel(activeTab!);
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
            <Tabs.Root class='h-full w-full flex flex-col' value={activeTab} onValueChange={updateSignalPanel} activationMode="automatic">
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
                            {#each VIS_PANELS as { id, title }}
                                <DropdownMenu.Item onclick={() => {addPanel(id)}}>
                                    {title}
                                </DropdownMenu.Item>
                            {/each}
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