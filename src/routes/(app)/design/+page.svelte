<script lang="ts">
	import Designer from "$lib/design/designer.svelte";
	import DesignToolbar from "$lib/design/design-toolbar.svelte";
	import { onMount } from "svelte";
	import {
		loadSimulationModels,
		type SimulationModel,
	} from "$lib/SimulationModel";
	import { listen } from "@tauri-apps/api/event";
	import { EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from "$lib/utils/events";
	import {
		createDefaultDesignViewProps,
		createDesign,
		createQCADesignFile,
		saveDesignToFile,
		serializeQCADesignFile,
		type QCADesignFile,
	} from "$lib/qca-design";
	import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
	import { save } from "@tauri-apps/plugin-dialog";
	import { design, design_filename } from "$lib/globals";
	import { get } from "svelte/store";
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

	design.subscribe((cur_design_file) => {
		console.log("Design file updated:", cur_design_file);
		const cur_design = cur_design_file.design;
		designViewProps = cur_design_file.designer_properties;
		layers = cur_design.layers;
		cell_architectures = cur_design.cell_architectures;
		setSimulationModels().then(() => {
			selected_model_id =
				cur_design.simulation_settings.selected_simulation_model_id;
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
		if (designer) designer.redraw();
	});

	onMount(() => {
		const unlistenSave = listen(EVENT_SAVE_FILE, () => {
			new Promise((resolve: (value: string) => void, reject) => {
				let filename = get(design_filename);
				if (!filename) {
					save({
						defaultPath: "New design.qcd",
						title: "Save design as",
						filters: [{ name: "Design", extensions: ["qcd"] }],
					}).then((filename) =>
						filename ? resolve(filename as string) : reject(),
					);
				} else resolve(filename);
			}).then((filename) => {
				new Promise(async (resolve: (value: QCADesignFile) => void) => {
					const design = await createDesign(
						layers,
						selected_model_id,
						simulation_models,
						cell_architectures,
					);
					const designFile = await createQCADesignFile(
						design,
						designViewProps,
					);
					resolve(designFile);
				}).then((designFile) => {
					saveDesignToFile(filename, designFile);
					design_filename.set(filename);
				});
			});
		});
		const unlistenSaveAs = listen(EVENT_SAVE_FILE_AS, () => {
			save({
				defaultPath: "New design.qcd",
				title: "Save design as",
				filters: [{ name: "Design", extensions: ["qcd"] }],
			}).then((filename) => {
				if (!filename) return;

				new Promise(async (resolve: (value: QCADesignFile) => void) => {
					const design = await createDesign(
						layers,
						selected_model_id,
						simulation_models,
						cell_architectures,
					);
					const designFile = await createQCADesignFile(
						design,
						designViewProps,
					);
					resolve(designFile);
				}).then((designFile) => {
					writeTextFile(
						filename,
						serializeQCADesignFile(designFile),
						{ baseDir: BaseDirectory.Desktop },
					);
					design_filename.set(filename);
				});
			});
		});

		return () => {
			unlistenSave.then((f) => f());
			unlistenSaveAs.then((f) => f());
		};
	});

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

<div class="w-full flex flex-col">
	<DesignToolbar
		bind:selected_model_id
		bind:simulation_models
		bind:layers
		bind:cell_architectures
	/>

	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={15}>
			<!-- Left side area -->
			<ScrollArea class="h-full bg-sidebar px-2">
			<Accordion.Root type="multiple" value={["layers", "cell-props"]}>
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
			 <Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={80}>
					<Designer
						bind:this={designer}
						bind:designViewProps
						bind:selected_model_id
						bind:layers
						bind:simulation_models
						bind:cell_architectures
						bind:selectedLayer
						bind:selectedCells
						cellPropsPanel={cellPropsPanel}
						propertyChangedCallback={propertyChangedCallback}
					/>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane>
					<PanelContainer panels={ [{ id: "log", title: "Log", visible: true }] } selectedPanelId={"log"}/>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
		<Resizable.Handle />
		<Resizable.Pane defaultSize={0}>
			<!-- Right side area -->
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
