import type { CellTheme } from "./theme";

export class ThemeManager {
	private themes = new Map<string, CellTheme>();
	private activeId: string | null = null;
	private listeners = new Set<() => void>();

	register(theme: CellTheme): void {
		this.themes.set(theme.id, theme);
		if (!this.activeId) {
			this.activeId = theme.id;
			this.notify();
		}
	}

	getActive(): CellTheme {
		if (!this.activeId) throw new Error("No active theme set.");
		const theme = this.themes.get(this.activeId);
		if (!theme)
			throw new Error(
				`Active theme '${this.activeId}' is not registered.`,
			);
		return theme;
	}

	getActiveId(): string | null {
		return this.activeId;
	}

	getAllThemes(): CellTheme[] {
		return Array.from(this.themes.values());
	}

	hasTheme(id: string): boolean {
		return this.themes.has(id);
	}

	setActive(id: string): void {
		if (id === this.activeId) return;
		if (!this.themes.has(id))
			throw new Error(`Theme '${id}' not registered.`);
		this.activeId = id;
		this.notify();
	}

	onChange(cb: () => void): () => void {
		this.listeners.add(cb);
		return () => this.listeners.delete(cb);
	}

	private notify() {
		for (const cb of this.listeners) cb();
	}
}
