<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, type Input, InputType } from "$lib/qca-simulation";
    import LinePlotVis from "./line-plot-vis.svelte";
    import InputsPanel from "./panels/inputs-panel.svelte";
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
    let selectedInputs: Input[] = $state([]);

    const VIS_PANELS = [
        { id: 'linePlot', component: LinePlotVis, title: 'Line Plot', inputMode: InputType.SIGNAL },
        { id: 'truthTable', component: TruthTableVis, title: 'Truth Table', inputMode: InputType.CELL },
    ];

    function addPanel(panelId: string) {
        const panel = VIS_PANELS.find(p => p.id === panelId);
        if (!panel) 
            return

        const { component, title, inputMode } = panel;
        let componentTitle = title;
        let titleIdx = 1;
        while (visuals.some((visual: any) => visual.props.title == componentTitle)) {
            componentTitle = `${title} ${titleIdx}`;
            titleIdx++;
        }
        visuals.push({
            Component: component,
            props: {
                title: componentTitle,
                inputs: [],
            },
            inputMode,
        }); 
        updateSignalPanel((visuals.length - 1).toString());
    }

    let visuals: any = $state([]);

    $effect(() => {
        updatePanelInputs();
    });

    function updateSignalPanel(value: string){
        activeTab = value;

        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            selectedInputs = [...visuals[selectedIdx].props.inputs];
        }
    }

    function updatePanelInputs(){
        if (!activeTab) {
            return;
        }
        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            visuals[selectedIdx].props.inputs = [...selectedInputs];
        }
    };

    function getInputMode() {
        if (!activeTab) {
            return InputType.SIGNAL;
        }
        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            return visuals[selectedIdx].inputMode;
        }
    }

    onMount(() => {
        visuals = [];
        addPanel('linePlot');
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
                    {#each visuals as {props}, i}
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
                    {#each visuals as {Component, props}, i}
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
                <InputsPanel {qcaSimulation} bind:selectedInputs={selectedInputs} inputType={getInputMode()}/>
            </Accordion.Root>
        </div>  
    </Resizable.Pane>
</Resizable.PaneGroup>