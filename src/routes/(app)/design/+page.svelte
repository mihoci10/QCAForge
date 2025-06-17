<script lang="ts">
	import Designer, { type DesignerProps } from "$lib/design/designer.svelte";
	import { onMount } from "svelte";
	import { startSimulation } from "$lib/Simulation";
	import {
		loadSimulationModels,
		type SimulationModel,
	} from "$lib/SimulationModel";
	import { toast } from "svelte-sonner";
	import { listen } from "@tauri-apps/api/event";
	import { EVENT_SAVE_FILE, EVENT_SAVE_FILE_AS } from "$lib/utils/events";
	import {
		createDesign,
		createQCADesignFile,
		serializeQCADesignFile,
		type QCADesignFile,
	} from "$lib/qca-design";
	import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";
	import { save } from "@tauri-apps/plugin-dialog";
	import { design, design_filename } from "$lib/globals";
	import { get } from "svelte/store";
	import { type Layer } from "$lib/Layer.js";
	import { type CellArchitecture } from "$lib/CellArchitecture";
	import Button from "$lib/components/ui/button/button.svelte";
	import SimulationProgressToast from "$lib/toasts/simulation-progress-toast.svelte";

	let selected_model_id: string | undefined = $state();
	let layers: Layer[] = $state([]);

	let simulation_models: Map<string, SimulationModel> = $state(
		new Map<string, SimulationModel>(),
	);
	let cell_architectures: Map<string, CellArchitecture> = $state(
		new Map<string, CellArchitecture>(),
	);
	let designerProps: DesignerProps | undefined = $state(undefined);
	let designer: Designer | undefined = $state();

	design.subscribe((cur_design_file) => {
		const cur_design = cur_design_file.design;
		designerProps = cur_design_file.designer_properties;
		layers = cur_design.layers;
		cell_architectures = cur_design.cell_architectures;
		setSimulationModels().then(() => {
			selected_model_id = cur_design.selected_simulation_model_id;
			cur_design.simulation_model_settings.forEach((val, key, map) => {
				const model = simulation_models.get(key);
				if (model) {
					model.settings = val;
					simulation_models.set(key, model);
				}
			});
			simulation_models = new Map(simulation_models);
		});
		if (designer) designer.drawCurrentLayer();
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
						designerProps,
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
						designerProps,
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
						option_list: model.option_list,
						settings: model.settings,
					});
				});
				simulation_models = new Map(simulation_models);
				resolve();
			});
		});
	}

	function executeSimulation() {
		if (!selected_model_id) console.error("invalid simulation model id!");

		if (!simulation_models.has(selected_model_id!))
			console.error("invalid simulation model!");

		let simulation_toast = toast(SimulationProgressToast, {
			duration: Infinity,
			action: { label: "Cancel", onClick: (e) => {} },
		});

		createDesign(
			layers,
			selected_model_id,
			simulation_models,
			cell_architectures,
		)
			.then((design) => {
				startSimulation(design)
					.then((res) => {
						toast.success("Simulation finished successfully.", {
							id: simulation_toast,
							duration: 5000,
							action: undefined,
						});
					})
					.catch((err) => {
						console.error(err);
						toast.error("Simulation failed.", {
							id: simulation_toast,
							duration: 5000,
							action: undefined,
						});
					});
			})
			.catch((err) => {
				console.error(err);
				toast.error("Simulation failed.", {
					id: simulation_toast,
					duration: 5000,
					action: undefined,
				});
			});
	}
</script>

<div class="w-full flex flex-col">
	<div class="my-1">
		<div class="flex flex-row float-right">
			<Button
				disabled={!selected_model_id}
				onclick={() => executeSimulation()}
			>
				Run
			</Button>
		</div>
	</div>
	<Designer
		bind:this={designer}
		bind:designer_props={designerProps}
		bind:selected_model_id
		bind:layers
		bind:simulation_models
		bind:cell_architectures
	/>
</div>
