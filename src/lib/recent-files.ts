import { load, Store } from "@tauri-apps/plugin-store";
import { QCA_DESIGN_FILE_EXTENSION } from "./qca-design";
import { QCA_SIMULATION_FILE_EXTENSION } from "./qca-simulation";

export type RecentFileType = "design" | "simulation" | "other";

export interface RecentFile {
	fullPath: string;
	name: string;
	type: RecentFileType;
	lastOpened: Date;
}

const MAX_RECENT_FILES = 10;
const MAX_DISPLAYED_RECENT_FILES = 6;
const RECENT_FILES_STORE = "recent-files.json";

export class RecentFilesManager {
	private store: Store | null = null;
	private recentDesignFiles: RecentFile[] = [];
	private recentSimulationFiles: RecentFile[] = [];
	private ready: Promise<void>;

	constructor() {
		this.ready = this.init();
	}

	private async init() {
		this.store = await load(RECENT_FILES_STORE);
		const recentDesignsRaw: any[] =
			(await this.store.get("recentDesignFiles")) || [];
		this.recentDesignFiles = recentDesignsRaw.map((file: any) => ({
			...file,
			lastOpened: new Date(file.lastOpened),
		}));
		const recentSimulationsRaw: any[] =
			(await this.store.get("recentSimulationFiles")) || [];
		this.recentSimulationFiles = recentSimulationsRaw.map((file: any) => ({
			...file,
			lastOpened: new Date(file.lastOpened),
		}));
	}

	private getDefaults() {
		return {
			recentDesignFiles: [],
			recentSimulationFiles: [],
		};
	}

	private getFileType(filename: string): RecentFileType {
		if (filename.endsWith(QCA_DESIGN_FILE_EXTENSION)) {
			return "design";
		} else if (filename.endsWith(QCA_SIMULATION_FILE_EXTENSION)) {
			return "simulation";
		}
		return "other";
	}

	private async save() {
		await this.store!.set("recentDesignFiles", this.recentDesignFiles);
		await this.store!.set(
			"recentSimulationFiles",
			this.recentSimulationFiles,
		);
		await this.store!.save();
	}

	async fileOpened(filename: string) {
		await this.ready;
		const fileType = this.getFileType(filename);
		const baseName = filename.split(/[/\\]/).pop() || filename;
		const recentFile: RecentFile = {
			fullPath: filename,
			name: baseName,
			type: fileType,
			lastOpened: new Date(),
		};
		let recentFilesList =
			fileType === "design"
				? this.recentDesignFiles
				: this.recentSimulationFiles;
		recentFilesList = recentFilesList.filter(
			(file) => file.fullPath !== filename,
		);
		recentFilesList.unshift(recentFile);
		if (recentFilesList.length > MAX_RECENT_FILES) {
			recentFilesList.pop();
		}
		if (fileType === "design") {
			this.recentDesignFiles = recentFilesList;
		} else if (fileType === "simulation") {
			this.recentSimulationFiles = recentFilesList;
		}
		await this.save();
	}

	async getRecentDesignFiles(): Promise<RecentFile[]> {
		await this.ready;
		return this.recentDesignFiles;
	}

	async getRecentSimulationFiles(): Promise<RecentFile[]> {
		await this.ready;
		return this.recentSimulationFiles;
	}

	async getAllRecentFiles(): Promise<RecentFile[]> {
		await this.ready;
		const allRecentFiles = [
			...this.recentDesignFiles,
			...this.recentSimulationFiles,
		];
		return allRecentFiles
			.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime())
			.slice(0, MAX_DISPLAYED_RECENT_FILES);
	}

	async clear() {
		await this.ready;
		this.recentDesignFiles = [];
		this.recentSimulationFiles = [];
		await this.save();
	}
}
