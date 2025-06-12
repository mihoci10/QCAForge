import { invoke } from "@tauri-apps/api/core";
import type { QCADesign } from "./qca-design";

export function startSimulation(design: QCADesign): Promise<any> {
	return invoke("run_sim_model", {
		qcaDesign: design,
	});
}
