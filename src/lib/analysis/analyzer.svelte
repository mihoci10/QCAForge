<script lang="ts">
    import * as Resizable from "$lib/components/ui/resizable";
    import * as Accordion from "$lib/components/ui/accordion";
    import { QCASimulation, type Input, InputType } from "$lib/qca-simulation";    import LinePlotVis from "./line-plot-vis.svelte";
    import InputsPanel from "./panels/inputs-panel.svelte";
    import * as Tabs from "$lib/components/ui/tabs/";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";
    import TruthTableVis from "./truth-table-vis.svelte";
    import LinePlotVisualPropsPanel from "./panels/line-plot-visual-props-panel.svelte";
    import TruthTableVisualPropsPanel from "./panels/truth-table-visual-props-panel.svelte";

    interface Props {
        qcaSimulation: QCASimulation | undefined;
    }
    let { qcaSimulation = $bindable() }: Props = $props();

    let activeTab: string|undefined = $state('0');
    let selectedInputs: Input[] = $state([]);   
    let currentProps: any = $state({});

    const VIS_PANELS = [
        { id: 'linePlot', component: LinePlotVis, title: 'Line Plot', inputMode: InputType.SIGNAL, propsPanel: LinePlotVisualPropsPanel },
        { id: 'truthTable', component: TruthTableVis, title: 'Truth Table', inputMode: InputType.CELL, propsPanel: TruthTableVisualPropsPanel },
    ];

    function addPanel(panelId: string) {
        const panel = VIS_PANELS.find(p => p.id === panelId);
        if (!panel) 
            return  

        const { component, title, inputMode, propsPanel } = panel;
        let componentTitle = title;
        let titleIdx = 1;
        while (visuals.some((visual: any) => visual.props.title == componentTitle)) {
            componentTitle = `${title} ${titleIdx}`;
            titleIdx++;
        }          // Initialize visual properties based on panel type
        const visualProps = panelId === 'linePlot' 
            ? { numTicksX: 5, numTicksY: 5, showDots: true, lineWidth: 3, showLegend: true, legendPosition: 'upper right' as const }
            : panelId === 'truthTable'
            ? { showRowNumbers: true, clockTreshold: 0.05, logicalThreshold: 0.01, cellClockDelay: new Map<string, number>() }
            : {};
        
        visuals.push({
            Component: component,
            PropsPanel: propsPanel,
            props: {
                title: componentTitle,
                inputs: [],
                visualProps,
            },
            inputMode,
        });
        updateActiveTab((visuals.length - 1).toString());
    }    let visuals: any = $state([]);
    
    // Keep track of which panel type each visual is
    $effect(() => {
        updatePanelProps();
    });

    function updateActiveTab(value: string){
        activeTab = value;

        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            selectedInputs = [...visuals[selectedIdx].props.inputs];
            currentProps = { ...visuals[selectedIdx].props.visualProps };
        }
    }

    function updatePanelProps(){
        if (!activeTab) {
            return;
        }
        const selectedIdx = parseInt(activeTab);
        if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
            visuals[selectedIdx].props.inputs = [...selectedInputs];
            visuals[selectedIdx].props.visualProps = { ...currentProps };
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
                <Accordion.Item value="properties">
                    <Accordion.Trigger class='w-full'>
                        <div class='flex items-center gap-2'>
                            <Icon icon="material-symbols:settings" width={16} />
                            Properties
                        </div>                    
                    </Accordion.Trigger>
                    <Accordion.Content class='p-2'>
                        {#if activeTab !== undefined}
                            {@const selectedIdx = parseInt(activeTab)}                            
                            {#if !isNaN(selectedIdx) && visuals[selectedIdx] && visuals[selectedIdx].PropsPanel}                                
                                {@const PropsComponent = visuals[selectedIdx].PropsPanel}      
                                <PropsComponent
                                    bind:props={currentProps}
                                />
                            {:else}
                                <div class="text-muted-foreground text-sm">No properties available</div>
                            {/if}
                        {:else}
                            <div class="text-muted-foreground text-sm">No panel selected</div>
                        {/if}
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>
        </div>  
    </Resizable.Pane>
    <Resizable.Handle />
    <Resizable.Pane minSize={10} class=''>
        <div class='h-full'>
            <Tabs.Root class='h-full w-full flex flex-col' value={activeTab} onValueChange={updateActiveTab} activationMode="automatic">
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
                </Tabs.List>                <div class='h-full flex items-stretch'>
                    {#each visuals as {Component, props}, i}
                        <Tabs.Content value={i.toString()} class='w-full'>
                            <Component 
                                title={props.title} 
                                inputs={props.inputs} 
                                {qcaSimulation}
                                props={props.visualProps}
                            />
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