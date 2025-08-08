<script lang="ts">
	import * as Resizable from "$lib/components/ui/resizable";
	import * as Accordion from "$lib/components/ui/accordion";
	import { QCASimulation, type Input, InputType } from "$lib/qca-simulation";
	import LinePlotVis from "./line-plot-vis.svelte";
	import InputsPanel from "./panels/inputs-panel.svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { mount, onDestroy, onMount } from "svelte";
	import Icon from "@iconify/svelte";
	import TruthTableVis from "./truth-table-vis.svelte";
	import LinePlotVisualPropsPanel from "./panels/line-plot-visual-props-panel.svelte";
	import TruthTableVisualPropsPanel from "./panels/truth-table-visual-props-panel.svelte";
	import TimelineControl from "./timeline-control.svelte";
	import DesignVisualProps from "./panels/design-visual-props.svelte";
	import DesignVis from "./design-vis.svelte";
	import { v4 as uuidv4 } from "uuid";
	import {
		DockviewComponent,
		type IDockviewPanel,
		type IContentRenderer,
	} from "dockview-core";
	import "dockview-core/dist/styles/dockview.css";

	interface Props {
		qcaSimulation: QCASimulation | undefined;
	}
	let { qcaSimulation = $bindable() }: Props = $props();

	let selectedInputs: Input[] = $state([]);
	let currentProps: any = $state({});
	let currentSample: number = $state(0);
	let activePanelId: string | undefined = $state(undefined);

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

	// Dockview setup
	let containerEl: HTMLDivElement | undefined;
	let dockview: DockviewComponent | undefined;

	type PanelState = {
		id: string;
		typeId: string; // one of VIS_PANELS ids
		title: string;
		inputMode: InputType;
		PropsPanel: any;
		inputs: Input[];
		visualProps: any;
		instance?: any; // svelte component instance
	};

	const panels = new Map<string, PanelState>();

	function defaultVisualProps(typeId: string) {
		if (typeId === "linePlot") {
			return {
				numTicksX: 5,
				numTicksY: 5,
				showDots: true,
				lineWidth: 3,
				showLegend: true,
				legendPosition: "upper right" as const,
			};
		}
		if (typeId === "truthTable") {
			return {
				showRowNumbers: true,
				clockTreshold: 0.05,
				logicalThreshold: 0.01,
				valueThreshold: 0.8,
				cellClockDelay: new Map<string, number>(),
			};
		}
		if (typeId === "designView") {
			return { selectedLayer: undefined };
		}
		return {};
	}

	function addPanel(typeId: string) {
		const def = VIS_PANELS.find((p) => p.id === typeId);
		if (!def || !dockview) return;

		// Generate a unique, human-friendly title
		let baseTitle = def.title;
		const existingTitles = new Set(
			Array.from(panels.values()).map((p) => p.title),
		);
		let title = baseTitle;
		let i = 1;
		while (existingTitles.has(title)) {
			title = `${baseTitle} ${i++}`;
		}

		const id = uuidv4();
		const panelState: PanelState = {
			id,
			typeId,
			title,
			inputMode: def.inputMode,
			PropsPanel: def.propsPanel,
			inputs: [],
			visualProps: defaultVisualProps(typeId),
		};
		panels.set(id, panelState);

		dockview.addPanel({
			id,
			title,
			component: "visual",
			params: { typeId },
		});

		// select newly added panel
		activePanelId = id;
		selectedInputs = [...panelState.inputs];
		currentProps = { ...panelState.visualProps };
	}

	function getInputMode() {
		if (!activePanelId) return InputType.SIGNAL;
		const p = panels.get(activePanelId);
		return p?.inputMode ?? InputType.SIGNAL;
	}

	function focusPanel(panelId: string) {
		activePanelId = panelId;
		const p = panels.get(panelId);
		if (p) {
			selectedInputs = [...p.inputs];
			currentProps = { ...p.visualProps };
		}
	}

	function applyEditsToActivePanel() {
		if (!activePanelId) return;
		const p = panels.get(activePanelId);
		if (!p) return;
		// persist edits
		p.inputs = [...selectedInputs];
		p.visualProps = { ...currentProps };
		// propagate to svelte instance if mounted
		if (p.instance) {
			p.instance.inputs = p.inputs;
			p.instance.props = p.visualProps;
		}
	}

	// keep visuals in sync with global sim/time
	$effect(() => {
		panels.forEach((p) => {
			if (p.instance) {
				p.instance.qcaSimulation = qcaSimulation;
				p.instance.currentSample = currentSample;
			}
		});
	});

	// persist side-panel edits to the active visual
	$effect(() => {
		// react to deps
		void activePanelId;
		void selectedInputs;
		void currentProps;
		applyEditsToActivePanel();
	});

	onMount(() => {
		if (!containerEl) return;
		dockview = new DockviewComponent(containerEl, {
			createWatermarkComponent: () => {
				const el = document.createElement("div");
				el.className = "text-muted-foreground text-sm";
				el.style.padding = "8px";
				el.textContent = "Use 'Add panel' to create a view";
				return {
					element: el,
					init: () => {},
					dispose: () => {},
				};
			},
			createComponent: (options): IContentRenderer => {
				const root = document.createElement("div");
				root.style.height = "100%";
				root.style.width = "100%";
				let instance: any | undefined;
				let panelRef: IDockviewPanel | undefined;
				return {
					element: root,
					init: ({ api, containerApi, params, title }) => {
						// params carries our typeId
						const typeId = (params as any)?.typeId as string;
						const def = VIS_PANELS.find((p) => p.id === typeId);
						const state = panels.get(api.id);
						if (!def || !state) {
							root.textContent = "Unknown panel";
							return;
						}
						const ComponentCtor: any = def.component as any;
						instance = mount(ComponentCtor, {
							target: root,
							props: {
								title: state.title,
								inputs: state.inputs,
								qcaSimulation,
								currentSample,
								props: state.visualProps,
							},
						});
						state.instance = instance;
						panelRef = containerApi.getPanel(api.id);
						root.addEventListener("mousedown", () =>
							focusPanel(api.id),
						);
					},
					update: () => {
						const s = panelRef
							? panels.get(panelRef.id)
							: undefined;
						if (s && instance) {
							instance.title = s.title;
						}
					},
					dispose: () => {
						try {
							instance?.$destroy?.();
						} catch {}
						if (panelRef) {
							panels.delete(panelRef.id);
							if (activePanelId === panelRef.id)
								activePanelId = undefined;
						}
						instance = undefined;
						panelRef = undefined;
					},
				} satisfies IContentRenderer;
			},
		});

		// sync active panel selection
		dockview.api.onDidActivePanelChange((panel) => {
			if (!panel) {
				activePanelId = undefined;
				return;
			}
			focusPanel(panel.id);
		});

		dockview.api.onDidRemovePanel((panel) => {
			panels.delete(panel.id);
			if (activePanelId === panel.id) activePanelId = undefined;
		});

		// initial panel
		addPanel("linePlot");
	});

	onDestroy(() => {
		try {
			dockview?.dispose?.();
		} catch {}
	});
</script>

<Resizable.PaneGroup direction="horizontal">
	<Resizable.Pane defaultSize={15} minSize={10}>
		<div class="h-full bg-surface-500 overflow-y-auto pr-2">
			<Accordion.Root type="multiple">
				<Accordion.Item value="properties">
					<Accordion.Trigger class="w-full">
						<div class="flex items-center gap-2">
							<Icon icon="material-symbols:settings" width={16} />
							Properties
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="p-2">
						{#if activePanelId}
							{@const active = panels.get(activePanelId)}
							{#if active && active.PropsPanel}
								{@const PropsComponent = active.PropsPanel}
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
			<div class="flex items-center gap-2 p-2">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex items-center px-4 py-2 hover:bg-muted focus:bg-muted data-[state=open]:bg-muted rounded-sm"
					>
						<div
							class="flex items-center gap-2 text-sm text-muted-foreground hover:bg-muted rounded-md"
						>
							<Icon
								icon="material-symbols:add-2-rounded"
								width={16}
							/>
							Add panel
						</div>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-48">
						{#each VIS_PANELS as { id, title }}
							<DropdownMenu.Item onclick={() => addPanel(id)}>
								{title}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			<div class="flex-1 min-h-0">
				<div bind:this={containerEl} class="w-full h-full"></div>
			</div>
			<TimelineControl {qcaSimulation} bind:currentSample
			></TimelineControl>
		</div>
	</Resizable.Pane>
	<Resizable.Handle />
	<Resizable.Pane defaultSize={15} minSize={10}>
		<div class="h-full overflow-y-auto p-2">
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
