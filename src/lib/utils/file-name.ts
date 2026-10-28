import { basename } from "@tauri-apps/api/path";

/** File name of `path` without its directory and extension. */
export async function fileStem(path: string): Promise<string> {
	return (await basename(path)).replace(/\.[^./\\]+$/, "");
}
