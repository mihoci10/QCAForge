import { invoke } from "@tauri-apps/api/core";
import type { QCADesign } from "./qca-design";

export function startSimulation(
	design: QCADesign,
	resultFilename: string,
): Promise<string> {
	return invoke("run_sim_model", {
		qcaDesign: design,
		resultFilename,
	});
}
