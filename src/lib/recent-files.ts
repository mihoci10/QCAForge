import { load, Store } from '@tauri-apps/plugin-store';
import { QCA_DESIGN_FILE_EXTENSION } from './qca-design';
import { QCA_SIMULATION_FILE_EXTENSION } from './qca-simulation';

export type RecentFileType = "design" | "simulation" | "other";

export interface RecentFile {
	fullPath: string;
	name: string;
	type: RecentFileType;
	lastOpened: Date;
}

const MAX_RECENT_FILES = 10;
const RECENT_FILES_STORE = "recent-files.json";

export class RecentFilesManager {
    private store: Store;
    private recentDesignFiles: RecentFile[] = [];
    private recentSimulationFiles: RecentFile[] = [];

    constructor() {
        this.store = null as any;
        this.init();
    }

    private async init() {
        this.store = await load(RECENT_FILES_STORE);
        this.recentDesignFiles = await this.store.get('recentDesignFiles') || [];
        this.recentSimulationFiles = await this.store.get('recentSimulationFiles') || [];
    }

    private getDefaults() {
        return {
            recentDesignFiles: [],
            recentSimulationFiles: []
        };
    }

    private getFileType(filename: string): RecentFileType {
        if (filename.endsWith(QCA_DESIGN_FILE_EXTENSION)) {
            return 'design';
        } else if (filename.endsWith(QCA_SIMULATION_FILE_EXTENSION)) {
            return 'simulation';
        }
        return 'other';
    }

    private save() {
        this.store.set('recentDesignFiles', this.recentDesignFiles);
        this.store.set('recentSimulationFiles', this.recentSimulationFiles);
        this.store.save();
    }

    fileOpened(filename: string){
        const fileType = this.getFileType(filename);
        const baseName = filename.split(/[/\\]/).pop() || filename;
        const recentFile: RecentFile = {
            fullPath: filename,
            name: baseName,
            type: fileType,
            lastOpened: new Date()
        };
        let recentFilesList = fileType === 'design' ? this.recentDesignFiles : this.recentSimulationFiles;
        recentFilesList = recentFilesList.filter(file => file.fullPath !== filename);
        recentFilesList.unshift(recentFile);
        if (recentFilesList.length > MAX_RECENT_FILES) {
            recentFilesList.pop();
        }
        if (fileType === 'design') {
            this.recentDesignFiles = recentFilesList;
        } else if (fileType === 'simulation') {
            this.recentSimulationFiles = recentFilesList;
        }
        this.save();
    }

    getRecentDesignFiles(): RecentFile[] {
        return this.recentDesignFiles;
    }

    getRecentSimulationFiles(): RecentFile[] {
        return this.recentSimulationFiles;
    }

    getAllRecentFiles(): RecentFile[] {
        const allRecentFiles = [
            ...this.recentDesignFiles,
            ...this.recentSimulationFiles
        ];
        allRecentFiles.sort((a, b) => b.lastOpened.getTime() - a.lastOpened.getTime());
        return allRecentFiles;
    }
}