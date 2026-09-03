<script lang="ts">
	import * as Resizable from "$lib/components/ui/resizable";
	import * as Accordion from "$lib/components/ui/accordion";
	import {
		QCASimulation,
		type PanelInput,
		InputType,
	} from "$lib/qca-simulation";
	import LinePlotVis from "./line-plot-vis.svelte";
	import InputsPanel from "./panels/inputs-panel.svelte";
	import * as Tabs from "$lib/components/ui/tabs/";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import Icon from "@iconify/svelte";
	import TruthTableVis from "./truth-table-vis.svelte";
	import LinePlotVisualPropsPanel from "./panels/line-plot-visual-props-panel.svelte";
	import TruthTableVisualPropsPanel from "./panels/truth-table-visual-props-panel.svelte";
	import TimelineControl from "./timeline-control.svelte";
	import DesignVisualProps from "./panels/design-visual-props.svelte";
	import DesignVis from "./design-vis.svelte";

	interface Props {
		qcaSimulation: QCASimulation | undefined;
	}
	let { qcaSimulation = $bindable() }: Props = $props();

	let activeTab: string | undefined = $state("0");
	let selectedInputs: PanelInput[] = $state([]);
	let currentProps: any = $state({});
	let currentSample: number = $state(0);

	const VIS_PANELS = [
		{
			id: "linePlot",
			component: LinePlotVis,
			title: "Line Plot",
			inputMode: InputType.SIGNAL,
			propsPanel: LinePlotVisualPropsPanel,
		},
		{
			id: "truthTable",
			component: TruthTableVis,
			title: "Truth Table",
			inputMode: InputType.CELL,
			propsPanel: TruthTableVisualPropsPanel,
		},
		{
			id: "designView",
			component: DesignVis,
			title: "Design View",
			inputMode: InputType.CELL,
			propsPanel: DesignVisualProps,
		},
	];

	function addPanel(panelId: string) {
		const panel = VIS_PANELS.find((p) => p.id === panelId);
		if (!panel) return;

		const { component, title, inputMode, propsPanel } = panel;
		let componentTitle = title;
		let titleIdx = 1;
		while (
			visuals.some((visual: any) => visual.props.title == componentTitle)
		) {
			componentTitle = `${title} ${titleIdx}`;
			titleIdx++;
		} // Initialize visual properties based on panel type
		const visualProps =
			panelId === "linePlot"
				? {
						numTicksX: 5,
						numTicksY: 5,
						showDots: true,
						lineWidth: 3,
						showLegend: true,
						useDashedLines: false,
						legendPosition: "upper right" as const,
					}
				: panelId === "truthTable"
					? {
							showRowNumbers: true,
							clockTreshold: 0.05,
							logicalThreshold: 0.01,
							valueThreshold: 0.8,
							cellClockDelay: new Map<string, number>(),
						}
					: panelId === "designView"
						? {
								selectedLayer: undefined,
							}
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
	}
	let visuals: any = $state([]);

	// Keep track of which panel type each visual is
	$effect(() => {
		updatePanelProps();
	});

	// This component stays mounted across the whole session (switching to the
	// Design view and back must not lose panel layout/selection), so it can't
	// rely on onMount to start each simulation with a clean slate - onMount
	// only fires once, the first time a simulation is ever loaded. Reset the
	// panels, selected inputs, and timeline position whenever `qcaSimulation`
	// actually becomes a *different* simulation (a fresh session_id), so a
	// newly-opened .qcs file never shows panels/selections left over from
	// whatever was open before it.
	//
	// `visuals = []` immediately followed by `addPanel(...)` collapses to a
	// single committed change from Svelte's perspective (both happen inside
	// the same synchronous effect, before the next render), so an unkeyed
	// #each sees the array go directly from e.g. [oldLinePlot] to
	// [newLinePlot] and - since both have something at index 0 - reuses the
	// *same* child component instance across the reset rather than
	// destroying and recreating it. That leaves it up to every panel type's
	// own data-loading effect to notice its `inputs` prop went back to empty
	// and clear itself out, which line-plot-vis.svelte's chart did not
	// reliably do in testing. `resetGeneration` is mixed into the panels'
	// #each key below specifically so a reset always forces a real
	// destroy+recreate instead of an in-place prop update, sidestepping that
	// per-panel-type reliance entirely. This only affects panels that
	// *survive* a reset (in practice just the fresh "Line Plot" panel this
	// creates) - anything the user had added, like a WebGL-backed Design
	// View panel, is simply removed by `visuals = []` and never
	// re-created, so this does not add any extra WebGL context churn.
	let resetGeneration = $state(0);

	let lastSessionId: string | undefined;
	$effect(() => {
		if (qcaSimulation && qcaSimulation.session_id !== lastSessionId) {
			lastSessionId = qcaSimulation.session_id;
			resetGeneration++;
			currentSample = 0;
			visuals = [];
			addPanel("linePlot");
		}
	});

	function updateActiveTab(value: string) {
		activeTab = value;

		const selectedIdx = parseInt(activeTab);
		if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
			selectedInputs = [...visuals[selectedIdx].props.inputs];
			currentProps = { ...visuals[selectedIdx].props.visualProps };
		}
	}

	function updatePanelProps() {
		if (!activeTab) {
			return;
		}
		const selectedIdx = parseInt(activeTab);
		if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
			visuals[selectedIdx].props.inputs = [...selectedInputs];
			visuals[selectedIdx].props.visualProps = { ...currentProps };
		}
	}

	function getInputMode() {
		if (!activeTab) {
			return InputType.SIGNAL;
		}
		const selectedIdx = parseInt(activeTab);
		if (!isNaN(selectedIdx) && visuals[selectedIdx]) {
			return visuals[selectedIdx].inputMode;
		}
	}
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={15} minSize={10}>
		<div class="h-full bg-sidebar overflow-y-auto pr-2">
			<Accordion.Root type="multiple">
				<Accordion.Item value="properties">
					<Accordion.Trigger class="w-full">
						<div class="flex items-center gap-2">
							<Icon
								icon="material-symbols:settings"
								class="h-4 w-4"
							/>
							Properties
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="p-2">
						{#if activeTab !== undefined}
							{@const selectedIdx = parseInt(activeTab)}
							{#if !isNaN(selectedIdx) && visuals[selectedIdx] && visuals[selectedIdx].PropsPanel}
								{@const PropsComponent =
									visuals[selectedIdx].PropsPanel}
								<PropsComponent bind:props={currentProps} />
							{:else}
								<div class="text-muted-foreground text-sm">
									No properties available
								</div>
							{/if}
						{:else}
							<div class="text-muted-foreground text-sm">
								No panel selected
							</div>
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</div>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane minSize={10} class="">
		<div class="h-full flex flex-col">
			<Tabs.Root
				class="h-full w-full flex flex-col"
				value={activeTab}
				onValueChange={updateActiveTab}
				activationMode="automatic"
			>
				<Tabs.List class="self-start">
					{#each visuals as { props }, i}
						<Tabs.Trigger value={i.toString()}>
							{props.title}
						</Tabs.Trigger>
					{/each}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex items-center px-3 py-2 hover:bg-muted focus:bg-muted data-[state=open]:bg-muted rounded-sm transition-colors"
						>
							<div
								class="flex items-center gap-2 text-sm text-muted-foreground"
							>
								<Icon
									icon="material-symbols:add-2-rounded"
									class="h-4 w-4"
								/>
								Add panel
							</div>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content class="w-48">
							{#each VIS_PANELS as { id, title }}
								<DropdownMenu.Item
									onclick={() => {
										addPanel(id);
									}}
								>
									{title}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Tabs.List>
				<div class="h-full flex items-stretch">
					{#each visuals as { Component, props }, i (resetGeneration + "-" + i)}
						<Tabs.Content value={i.toString()} class="w-full">
							<Component
								title={props.title}
								inputs={props.inputs}
								{qcaSimulation}
								{currentSample}
								props={props.visualProps}
							/>
						</Tabs.Content>
					{/each}
				</div>
			</Tabs.Root>
			<TimelineControl {qcaSimulation} bind:currentSample
			></TimelineControl>
		</div>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane defaultSize={15} minSize={10}>
		<div class="h-full overflow-y-auto p-2 bg-sidebar">
			<Accordion.Root type="multiple">
				<InputsPanel
					{qcaSimulation}
					bind:selectedInputs
					inputType={getInputMode()}
				/>
			</Accordion.Root>
		</div>
	</Resizable.Pane>
</Resizable.PaneGroup>
