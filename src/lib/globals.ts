import { writable, type Writable } from "svelte/store";

export const design_filename: Writable<string|undefined> = writable(undefined);