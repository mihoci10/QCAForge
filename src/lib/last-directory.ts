import { load, Store } from "@tauri-apps/plugin-store";
import { dirname } from "@tauri-apps/api/path";

export type DirectoryCategory = "design" | "simulation" | "figure";

const LAST_DIRECTORIES_STORE = "last-directories.json";

export class LastDirectoryManager {
	private store: Store | null = null;
	private ready: Promise<void>;

	constructor() {
		this.ready = this.init();
	}

	private async init() {
		this.store = await load(LAST_DIRECTORIES_STORE);
	}

	async getDirectory(
		category: DirectoryCategory,
	): Promise<string | undefined> {
		await this.ready;
		return (await this.store!.get<string>(category)) ?? undefined;
	}

	async setDirectoryFromFilePath(
		category: DirectoryCategory,
		filePath: string,
	) {
		const dir = await dirname(filePath);
		await this.ready;
		await this.store!.set(category, dir);
		await this.store!.save();
	}
}

export const lastDirectoryManager = new LastDirectoryManager();
