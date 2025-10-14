import { invoke } from "@tauri-apps/api/core";
import {
	arch,
	locale,
	platform,
	version,
	hostname,
} from "@tauri-apps/plugin-os";

export interface BuildInfo {
	timestamp: string;
	git_sha: string;
	git_branch: string;
	version: string;
	qca_core_version: string;
	debug: boolean;
}

export interface SystemInfo {
	platform: string;
	arch: string;
	version: string;
	hostname: string;
	locale: string;
}

export interface AppInfo {
	name: string;
	author: string;
	description: string;
	license: string;
	buildInfo: BuildInfo;
	systemInfo: SystemInfo;
}

async function getBuildInfo(): Promise<BuildInfo> {
	const buildInfo = (await invoke("get_build_info")) as BuildInfo;

	// version parse just the semver part if there are additional tags
	const semverMatch = buildInfo.version.match(/^v(\d+\.\d+\.\d+)/);
	if (semverMatch) {
		buildInfo.version = semverMatch[1];
	}

	// format build timestamp to yyy-mm-dd
	const date = new Date(buildInfo.timestamp).toISOString().split("T")[0];
	buildInfo.timestamp = date;

	return buildInfo;
}

async function getSystemInfo(): Promise<SystemInfo> {
	return {
		platform: platform(),
		arch: arch(),
		version: version(),
		hostname: (await hostname()) || "unknown",
		locale: (await locale()) || "unknown",
	};
}

export async function getAppInfo(): Promise<AppInfo> {
	const buildInfo = await getBuildInfo();
	const systemInfo = await getSystemInfo();

	return {
		name: "QCAForge",
		author: "Miha Krajnc",
		description:
			"QCA Forge is a powerful tool for designing and simulating Quantum-dot Cellular Automata (QCA) circuits. It provides an intuitive interface for creating complex QCA designs and analyzing their behavior through advanced simulation capabilities.",
		license: "MIT",
		buildInfo,
		systemInfo,
	};
}
