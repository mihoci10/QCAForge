import { invoke } from "@tauri-apps/api/core";
import type { SimulationModel } from "./SimulationModel";
import { type Layer } from "./Layer";
import {
	generate_default_cell_architectures,
	get_default_cell_architecture_id,
	type CellArchitecture,
} from "./CellArchitecture";
import { getVersion } from "@tauri-apps/api/app";
import type { DesignViewProps } from "./components/design/design-view.svelte";

export const QCA_DESIGN_FILE_EXTENSION = "qcd";

export interface CommonSimulationModelSettings {
	max_iterations: number;
	convergence_tolerance: number;
}

export interface SimulationModelSettings {
	model_settings: Object;
	clock_generator_settings: Object;
}

export interface SimulationSettings {
	selected_simulation_model_id: string | undefined;
	simulation_model_settings: Map<string, SimulationModelSettings>;
}

export interface QCADesign {
	qca_core_version: string;
	layers: Layer[];
	cell_architectures: Map<string, CellArchitecture>;
	simulation_settings: SimulationSettings;
}

export interface QCADesignFile {
	qca_forge_version: string;
	design: QCADesign;
	designer_properties: DesignViewProps;
}

export interface NewDesignConfig {
	sim_model_id: string;
	cell_architecture_id: string;
}

export function serializeQCADesignFile(qcaDesignFile: QCADesignFile): string {
	const obj: any = { ...qcaDesignFile };
	obj.design = {
		...qcaDesignFile.design,
		simulation_settings: {
			...qcaDesignFile.design.simulation_settings,
			simulation_model_settings: Object.fromEntries(
				qcaDesignFile.design.simulation_settings
					.simulation_model_settings,
			),
		},
		cell_architectures: Object.fromEntries(
			qcaDesignFile.design.cell_architectures,
		),
	};
	return JSON.stringify(obj, null, 2);
}

export function deserializeQCADesignFile(str: string): QCADesignFile {
	const obj = JSON.parse(str);
	obj.design.simulation_settings.simulation_model_settings = new Map(
		Object.entries(
			obj.design.simulation_settings.simulation_model_settings,
		),
	);
	obj.design.cell_architectures = new Map(
		Object.entries(obj.design.cell_architectures),
	);
	return obj as QCADesignFile;
}

export function deserializeQCADesign(str: string): QCADesign {
	const obj = JSON.parse(str);
	obj.simulation_settings.simulation_model_settings = new Map(
		Object.entries(obj.simulation_settings.simulation_model_settings),
	);
	obj.cell_architectures = new Map(Object.entries(obj.cell_architectures));
	return obj as QCADesign;
}

export async function createDesign(
	layers: Layer[],
	selected_simulation_model_id: string | undefined,
	simulation_models: Map<string, SimulationModel>,
	cell_architectures: Map<string, CellArchitecture>,
): Promise<QCADesign> {
	let simulation_model_settings: Map<string, SimulationModelSettings> =
		new Map();
	simulation_models.forEach((val, key, _) => {
		simulation_model_settings.set(key, {
			model_settings: val.model_settings,
			clock_generator_settings: val.clock_generator_settings,
		});
	});

	const qca_core_ver = (await invoke("get_sim_version")) as string;

	return {
		qca_core_version: qca_core_ver,
		layers: layers,
		cell_architectures: cell_architectures,
		simulation_settings: {
			selected_simulation_model_id: selected_simulation_model_id,
			simulation_model_settings: simulation_model_settings,
		},
	};
}

export function createDefaultDesignViewProps(): DesignViewProps {
	return {
		camera_rotate_enabled: false,
		camera_zoom_enabled: true,
		camera_zoom_range: [1, 200],
		cell_edit_enabled: true,
		cell_snapping_enabled: true,
	};
}

export async function createQCADesignFile(
	design: QCADesign,
	designerProps: DesignViewProps | undefined,
): Promise<QCADesignFile> {
	const qca_forge_ver = await getVersion();
	const qca_design_view_props =
		designerProps ?? createDefaultDesignViewProps();
	return {
		qca_forge_version: qca_forge_ver,
		design: design,
		designer_properties: qca_design_view_props,
	};
}

export async function createDefaultQCADesignFile(
	newDesignConfig: NewDesignConfig | undefined = undefined,
): Promise<QCADesignFile> {
	const layers: Layer[] = [
		{
			name: "Main Layer",
			visible: true,
			cell_architecture_id:
				newDesignConfig?.cell_architecture_id ??
				get_default_cell_architecture_id(),
			cells: [],
			z_position: 0,
		},
	];
	const selected_simulation_model_id: string | undefined =
		newDesignConfig?.sim_model_id ?? undefined;
	const simulation_models: Map<string, SimulationModel> = new Map();
	const cell_architectures: Map<string, CellArchitecture> =
		generate_default_cell_architectures();

	const design = await createDesign(
		layers,
		selected_simulation_model_id,
		simulation_models,
		cell_architectures,
	);
	return await createQCADesignFile(design, undefined);
}

export function loadDesignFromFile(filename: string): Promise<QCADesignFile> {
	return new Promise((resolve, reject) => {
		invoke("load_design_file", { filename: filename })
			.then((result: unknown) => {
				const resignRaw = result as string;
				const designFile = deserializeQCADesignFile(resignRaw);
				resolve(designFile);
			})
			.catch((error: any) => {
				reject(error);
			});
	});
}

export function saveDesignToFile(
	filename: string,
	designFile: QCADesignFile,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const serializedDesign = serializeQCADesignFile(designFile);
		invoke("save_design_file", { filename, serializedDesign })
			.then(() => {
				resolve();
			})
			.catch((error: any) => {
				reject(error);
			});
	});
}
