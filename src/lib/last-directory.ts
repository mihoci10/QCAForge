import { LazyStore } from "@tauri-apps/plugin-store";
import { dirname, join } from "@tauri-apps/api/path";

export type DirectoryCategory = "design" | "simulation" | "figure";

export class LastDirectoryManager {
	private store = new LazyStore("last-directories.json");

	async getDirectory(
		category: DirectoryCategory,
	): Promise<string | undefined> {
		return (await this.store.get<string>(category)) ?? undefined;
	}

	/** `filename` inside the last directory used for `category`, for a save dialog's defaultPath. */
	async defaultPath(
		category: DirectoryCategory,
		filename: string,
	): Promise<string> {
		const dir = await this.getDirectory(category);
		return dir ? join(dir, filename) : filename;
	}

	async setDirectoryFromFilePath(
		category: DirectoryCategory,
		filePath: string,
	) {
		await this.store.set(category, await dirname(filePath));
		await this.store.save();
	}
}

export const lastDirectoryManager = new LastDirectoryManager();
