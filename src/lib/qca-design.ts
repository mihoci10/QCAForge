import { invoke } from "@tauri-apps/api/core";
import type { SimulationModel } from "./SimulationModel";
import { type Layer } from "./Layer";
import {
	generate_default_cell_architectures,
	get_default_cell_architecture_id,
	type CellArchitecture,
} from "./CellArchitecture";
import { getVersion } from "@tauri-apps/api/app";
import type { DesignViewProps } from "./components/design-view.svelte";

export interface CommonSimulationModelSettings {
	max_iterations: number;
	convergence_tolerance: number;
}

export interface QCADesign {
	qca_core_version: string;
	layers: Layer[];
	simulation_model_settings: Map<string, Object>;
	selected_simulation_model_id: string | undefined;
	cell_architectures: Map<string, CellArchitecture>;
}

export interface QCADesignFile {
	qca_forge_version: string;
	design: QCADesign;
	designer_properties: DesignViewProps;
}

export function serializeQCADesignFile(qcaDesignFile: QCADesignFile): string {
	const obj: any = { ...qcaDesignFile };
	obj.design = {
		...qcaDesignFile.design,
		simulation_model_settings: Object.fromEntries(
			qcaDesignFile.design.simulation_model_settings,
		),
		cell_architectures: Object.fromEntries(
			qcaDesignFile.design.cell_architectures,
		),
	};
	return JSON.stringify(obj, null, 2);
}

export function deserializeQCADesignFile(str: string): QCADesignFile {
	const obj = JSON.parse(str);
	obj.design.simulation_model_settings = new Map(
		Object.entries(obj.design.simulation_model_settings),
	);
	obj.design.cell_architectures = new Map(
		Object.entries(obj.design.cell_architectures),
	);
	return obj as QCADesignFile;
}

export function deserializeQCADesign(str: string): QCADesign {
	const obj = JSON.parse(str);
	obj.simulation_model_settings = new Map(
		Object.entries(obj.simulation_model_settings),
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
	let simulation_model_settings: Map<string, string> = new Map();
	simulation_models.forEach((val, key, _) => {
		simulation_model_settings.set(key, val.model_settings);
	});

	const qca_core_ver = (await invoke("get_sim_version")) as string;

	return {
		qca_core_version: qca_core_ver,
		layers: layers,
		selected_simulation_model_id: selected_simulation_model_id,
		simulation_model_settings: simulation_model_settings,
		cell_architectures: cell_architectures,
	};
}

export function createDefaultDesignViewProps(): DesignViewProps {
	return {
		camera_position: [0, 0, 20],
		camera_rotation: [0, 0, 0],
		camera_rotate_enabled: false,
		camera_zoom_enabled: true,
		camera_zoom_range: [1, 100],
		cell_edit_enabled: true,
		cell_snapping_enabled: true,
	};
}

export async function createQCADesignFile(
	design: QCADesign,
	designerProps: DesignViewProps | undefined,
): Promise<QCADesignFile> {
	const qca_forge_ver = await getVersion();
	const qca_design_view_props = designerProps ?? createDefaultDesignViewProps();
	return {
		qca_forge_version: qca_forge_ver,
		design: design,
		designer_properties: qca_design_view_props,
	};
}

export async function createDefaultQCADesignFile(): Promise<QCADesignFile> {
	const layers: Layer[] = [
		{
			name: "Main Layer",
			visible: true,
			cell_architecture_id: get_default_cell_architecture_id(),
			cells: [],
			z_position: 0,
		},
	];
	const selected_simulation_model_id: string | undefined = undefined;
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
