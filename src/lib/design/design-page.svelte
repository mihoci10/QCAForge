<script lang="ts">
	import Designer from "$lib/design/designer.svelte";
	import DesignToolbar from "$lib/design/design-toolbar.svelte";
	import { onMount } from "svelte";
	import {
		loadSimulationModels,
		type SimulationModel,
	} from "$lib/SimulationModel";
	import { listen } from "@tauri-apps/api/event";
	import {
		EVENT_EXPORT_FIGURE,
		EVENT_SAVE_FILE,
		EVENT_SAVE_FILE_AS,
	} from "$lib/utils/events";
	import {
		createDefaultDesignViewProps,
		createDesign,
		createQCADesignFile,
		QCA_DESIGN_FILE_EXTENSION,
		saveDesignToFile,
	} from "$lib/qca-design";
	import { save } from "@tauri-apps/plugin-dialog";
	import { design, design_filename, visibleBottomPanels } from "$lib/globals";
	import { page } from "$app/state";
	import { get } from "svelte/store";
	import { lastDirectoryManager } from "$lib/last-directory";
	import { lastSimulationModelManager } from "$lib/last-simulation-model";
	import { type Layer } from "$lib/Layer.js";
	import { type CellArchitecture } from "$lib/CellArchitecture";
	import type { DesignViewProps } from "$lib/components/design/design-view.svelte";
	import * as Resizable from "$lib/components/ui/resizable";
	import PanelContainer from "$lib/components/layout/panel-container.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import * as Accordion from "$lib/components/ui/accordion";
	import LayersPanel from "$lib/design/panels/layers-panel.svelte";
	import CellPropsPanel from "$lib/design/panels/cell-props-panel.svelte";
	import type { CellIndex } from "$lib/Cell";
	import { Set } from "typescript-collections";

	let selected_model_id: string | undefined = $state();
	let layers: Layer[] = $state([]);
	let useCustomInputSequence: boolean = $state(false);
	let customInputSequence: number[][] = $state([]);

	let simulation_models: Map<string, SimulationModel> = $state(
		new Map<string, SimulationModel>(),
	);
	let cell_architectures: Map<string, CellArchitecture> = $state(
		new Map<string, CellArchitecture>(),
	);
	let designViewProps: DesignViewProps = $state(
		createDefaultDesignViewProps(),
	);
	let designer: Designer | undefined = $state();
	// Bind targets managed at page level and wired to Designer and panels
	let selectedLayer: number = $state(0);
	let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
	let cellPropsPanel: CellPropsPanel | undefined = $state();

	function propertyChangedCallback() {}

	let bottomPanels = $state([{ id: "log", title: "Log", visible: true }]);
	let selectedBottomPanelId: string = $state("log");

	// The bottom (Log) pane defaults to roughly 3 text lines tall rather than a fixed
	// percentage of the window (which could be huge on a large display), while staying
	// freely resizable by dragging the handle. paneforge's Pane only takes a percentage
	// `defaultSize`, so we compute that percentage from the vertical pane group's actual
	// pixel height once it's known, then apply it via the pane's imperative `resize`.
	const LOG_PANE_DEFAULT_PX = 96; // ~3 lines of log text plus the tab strip/toolbar row
	let verticalPaneGroupEl: HTMLElement | undefined = $state();
	let logPane: { resize: (size: number) => void } | undefined = $state();

	$effect(() => {
		if (!logPane || !verticalPaneGroupEl) return;
		const groupHeight = verticalPaneGroupEl.clientHeight;
		if (groupHeight <= 0) return;
		const percent = Math.min(50, (LOG_PANE_DEFAULT_PX / groupHeight) * 100);
		logPane.resize(percent);
	});

	// This component is mounted once (the first time a design is loaded) and then kept
	// alive for the rest of the session, so switching to the Analysis view and back no
	// longer tears down/rebuilds the designer - camera position, selection, and panel
	// state all just stay as they were. Because of that, this subscription only fires
	// when a design is genuinely (re)loaded (new/open), never on a mere view switch, so
	// it's safe to re-fit the camera here every time it runs.
	let pendingCenterCamera = false;

	design.subscribe((cur_design_file) => {
		if (!cur_design_file) return;

		console.log("Design file updated:", cur_design_file);
		const cur_design = cur_design_file.design;
		designViewProps = cur_design_file.designer_properties;
		layers = cur_design.layers;
		cell_architectures = cur_design.cell_architectures;
		useCustomInputSequence =
			cur_design.simulation_settings.use_custom_input_sequence ?? false;
		customInputSequence =
			cur_design.simulation_settings.custom_input_sequence ?? [];
		setSimulationModels().then(() => {
			const designModelId =
				cur_design.simulation_settings.selected_simulation_model_id;
			if (designModelId) {
				selected_model_id = designModelId;
			} else {
				// This design was never explicitly simulated (e.g. it's brand
				// new), so default to whichever model the user picked last
				// instead of leaving the selector blank every time.
				lastSimulationModelManager.getModelId().then((lastModelId) => {
					if (lastModelId && simulation_models.has(lastModelId)) {
						selected_model_id = lastModelId;
					}
				});
			}
			cur_design.simulation_settings.simulation_model_settings.forEach(
				(val, key, map) => {
					const model = simulation_models.get(key);
					if (model) {
						model.model_settings = val.model_settings;
						model.clock_generator_settings =
							val.clock_generator_settings;
						simulation_models.set(key, model);
					}
				},
			);
			simulation_models = new Map(simulation_models);
		});
		if (designer) {
			designer.redraw();
			designer.centerCamera();
		} else {
			pendingCenterCamera = true;
		}
	});

	onMount(() => {
		if (pendingCenterCamera) {
			designer?.centerCamera();
			pendingCenterCamera = false;
		}

		const unlistenSave = listen(EVENT_SAVE_FILE, async () => {
			const filename = get(design_filename) ?? (await pickDesignPath());
			if (filename) await writeDesign(filename);
		});
		const unlistenSaveAs = listen(EVENT_SAVE_FILE_AS, async () => {
			const filename = await pickDesignPath();
			if (filename) await writeDesign(filename);
		});
		const unlistenExportFigure = listen(EVENT_EXPORT_FIGURE, () => {
			// This page stays mounted while other views are shown.
			if (!page.url.pathname.startsWith("/design")) return;
			designer?.openPrintDesignModal();
		});

		return () => {
			unlistenSave.then((f) => f());
			unlistenSaveAs.then((f) => f());
			unlistenExportFigure.then((f) => f());
		};
	});

	async function pickDesignPath(): Promise<string | null> {
		return save({
			defaultPath: await lastDirectoryManager.defaultPath(
				"design",
				`New design.${QCA_DESIGN_FILE_EXTENSION}`,
			),
			title: "Save design as",
			filters: [
				{ name: "Design", extensions: [QCA_DESIGN_FILE_EXTENSION] },
			],
		});
	}

	async function writeDesign(filename: string) {
		const designFile = await createQCADesignFile(
			await createDesign(
				layers,
				selected_model_id,
				simulation_models,
				cell_architectures,
				useCustomInputSequence,
				customInputSequence,
			),
			designViewProps,
		);
		await saveDesignToFile(filename, designFile);
		design_filename.set(filename);
		lastDirectoryManager.setDirectoryFromFilePath("design", filename);
	}

	function setSimulationModels(): Promise<void> {
		simulation_models.clear();
		return new Promise((resolve) => {
			loadSimulationModels().then((models) => {
				models.forEach((model) => {
					simulation_models.set(model.id, {
						id: model.id,
						name: model.name,
						model_option_list: model.model_option_list,
						model_settings: model.model_settings,
						clock_generator_option_list:
							model.clock_generator_option_list,
						clock_generator_settings:
							model.clock_generator_settings,
					});
				});
				simulation_models = new Map(simulation_models);
				resolve();
			});
		});
	}
</script>

<div class="h-full w-full flex flex-col">
	<DesignToolbar
		bind:selected_model_id
		bind:simulation_models
		bind:layers
		bind:cell_architectures
		bind:useCustomInputSequence
		bind:customInputSequence
	/>

	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={15}>
			<!-- Left side area -->
			<ScrollArea class="h-full bg-sidebar px-2">
				<Accordion.Root
					type="multiple"
					value={["layers", "cell-props"]}
				>
					<LayersPanel
						bind:layers
						bind:selectedLayer
						bind:cell_architectures
					/>
					<CellPropsPanel
						bind:layers
						{selectedCells}
						bind:this={cellPropsPanel}
						{propertyChangedCallback}
					/>
				</Accordion.Root>
			</ScrollArea>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane>
			<!-- Center area -->
			<div class="h-full w-full" bind:this={verticalPaneGroupEl}>
				<Resizable.PaneGroup direction="vertical">
					<Resizable.Pane defaultSize={90}>
						<Designer
							bind:this={designer}
							bind:designViewProps
							bind:selected_model_id
							bind:layers
							bind:simulation_models
							bind:cell_architectures
							bind:selectedLayer
							bind:selectedCells
							{cellPropsPanel}
							{propertyChangedCallback}
						/>
					</Resizable.Pane>
					<Resizable.Handle />
					{#if bottomPanels.some((panel) => panel.visible)}
						<Resizable.Pane bind:this={logPane}>
							<PanelContainer
								bind:panels={bottomPanels}
								bind:selectedPanelId={selectedBottomPanelId}
							/>
						</Resizable.Pane>
					{/if}
				</Resizable.PaneGroup>
			</div>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane defaultSize={0}>
			<!-- Right side area -->
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
