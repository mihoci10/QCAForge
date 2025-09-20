import { writable, type Writable } from "svelte/store";
import { type QCADesignFile } from "./qca-design";
import type { QCASimulation } from "./qca-simulation";
import { ThemeManager } from "./components/design/theme/theme-manager";
import { PaperCellTheme } from "./components/design/theme/paper/paper-theme";
import { LegacyCellTheme } from "./components/design/theme/legacy/legacy-theme";
import { RecentFilesManager } from "./recent-files";

export const design_filename: Writable<string | undefined> =
	writable(undefined);
export const design: Writable<QCADesignFile> = writable();

export const simulation_filename: Writable<string | undefined> =
	writable(undefined);
export const simulation: Writable<QCASimulation> = writable();

// Global theme manager instance
export const themeManager = new ThemeManager();

// Register available themes
themeManager.register(new PaperCellTheme());
themeManager.register(new LegacyCellTheme());

// Recent files manager instance
export const recentFilesManager = new RecentFilesManager();
