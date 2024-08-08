import { writable, type Writable } from "svelte/store";
import { type QCADesign } from "./qca-design";

export const design_filename: Writable<string|undefined> = writable(undefined);
export const design: Writable<QCADesign> = writable();