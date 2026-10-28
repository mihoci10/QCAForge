import { LazyStore } from "@tauri-apps/plugin-store";

const KEY = "modelId";

export class LastSimulationModelManager {
	private store = new LazyStore("last-simulation-model.json");

	async getModelId(): Promise<string | undefined> {
		return (await this.store.get<string>(KEY)) ?? undefined;
	}

	async setModelId(modelId: string) {
		if ((await this.getModelId()) === modelId) return;
		await this.store.set(KEY, modelId);
		await this.store.save();
	}
}

export const lastSimulationModelManager = new LastSimulationModelManager();
