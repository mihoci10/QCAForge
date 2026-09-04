import { load, Store } from "@tauri-apps/plugin-store";

const LAST_SIMULATION_MODEL_STORE = "last-simulation-model.json";
const KEY = "modelId";

export class LastSimulationModelManager {
	private store: Store | null = null;
	private ready: Promise<void>;

	constructor() {
		this.ready = this.init();
	}

	private async init() {
		this.store = await load(LAST_SIMULATION_MODEL_STORE);
	}

	async getModelId(): Promise<string | undefined> {
		await this.ready;
		return (await this.store!.get<string>(KEY)) ?? undefined;
	}

	async setModelId(modelId: string) {
		await this.ready;
		await this.store!.set(KEY, modelId);
		await this.store!.save();
	}
}

export const lastSimulationModelManager = new LastSimulationModelManager();
