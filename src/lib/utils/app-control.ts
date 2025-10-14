import { QCA_DESIGN_FILE_EXTENSION } from "$lib/qca-design";
import { QCA_SIMULATION_FILE_EXTENSION } from "$lib/qca-simulation";
import { emit } from "@tauri-apps/api/event";
import {
	EVENT_NEW_FILE,
	EVENT_OPEN_DESIGN_FILE,
	EVENT_OPEN_SIMULATION_FILE,
} from "./events";
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from "@tauri-apps/plugin-notification";

export class AppControl {
	static loadDesignFile(filename: string) {
		emit(EVENT_OPEN_DESIGN_FILE, filename);
	}

	static loadSimulationFile(filename: string) {
		emit(EVENT_OPEN_SIMULATION_FILE, filename);
	}

	static loadFileFromPath(filename: string) {
		const extension = filename.split(".").pop()?.toLowerCase();
		if (extension === QCA_DESIGN_FILE_EXTENSION)
			AppControl.loadDesignFile(filename);
		else if (extension === QCA_SIMULATION_FILE_EXTENSION)
			AppControl.loadSimulationFile(filename);
		else throw new Error("Unsupported file type: " + extension);
	}

	static newDesign() {
		emit(EVENT_NEW_FILE);
	}

	static sendSystemNotification(title: string, body: string) {
		isPermissionGranted().then((permissionGranted) => {
			if (permissionGranted) {
				sendNotification({ title, body });
			} else {
				requestPermission().then((permission) => {
					if (permission === "granted") {
						sendNotification({ title, body });
					}
				});
			}
		});
	}
}
