import { basename } from "@tauri-apps/api/path";

export async function fileStem(path: string): Promise<string> {
	return (await basename(path)).replace(/\.[^./\\]+$/, "");
}
