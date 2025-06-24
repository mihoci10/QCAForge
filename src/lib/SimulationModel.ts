import { invoke } from "@tauri-apps/api/core";

export interface SimulationModel {
	id: string;
	name: string;
	model_option_list: any | undefined;
	model_settings: any | undefined;
	clock_generator_option_list: any | undefined;
	clock_generator_settings: any | undefined;
}

export function loadSimulationModels(): Promise<SimulationModel[]> {
	return invoke("get_sim_models").then((res: unknown) => {
		let model_list = res as any[];
		let models: SimulationModel[] = [];
		model_list.forEach((model) => {
			models.push({
				id: model["model_id"],
				name: model["model_name"],
				model_option_list: model["model_option_list"],
				model_settings: JSON.parse(model["model_settings"]),
				clock_generator_option_list:
					model["clock_generator_option_list"],
				clock_generator_settings: JSON.parse(
					model["clock_generator_settings"],
				),
			});
		});
		return models;
	});
}
