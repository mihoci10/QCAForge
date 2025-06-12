import { writable, type Writable } from "svelte/store";
import { type QCADesignFile } from "./qca-design";
import type { QCASimulation } from "./qca-simulation";

export const design_filename: Writable<string | undefined> =
	writable(undefined);
export const design: Writable<QCADesignFile> = writable();

export const simulation_filename: Writable<string | undefined> =
	writable(undefined);
export const simulation: Writable<QCASimulation> = writable();
