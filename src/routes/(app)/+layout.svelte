<script lang="ts">
	import "../../app.css";
	import { Toaster } from "$lib/components/ui/sonner";
	import { ModeWatcher } from "mode-watcher";

	import { page } from "$app/state";
	import { listen } from "@tauri-apps/api/event";
	import {
		EVENT_LOG_ENTRY_ADDED,
		EVENT_NEW_FILE,
		EVENT_OPEN_DESIGN,
		EVENT_OPEN_DESIGN_FILE,
		EVENT_OPEN_SIMULATION,
		EVENT_OPEN_SIMULATION_FILE,
	} from "$lib/utils/events";
	import { goto } from "$app/navigation";
	import { open } from "@tauri-apps/plugin-dialog";
	import {
		design,
		design_filename,
		recentFilesManager,
		simulation,
		simulation_filename,
	} from "$lib/globals";
	import {
		createDefaultQCADesignFile,
		deserializeQCADesignFile,
		loadDesignFromFile,
		type NewDesignConfig,
	} from "$lib/qca-design";
	import { readTextFile } from "@tauri-apps/plugin-fs";
	import { basename } from "@tauri-apps/api/path";
	import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
	import { loadSimulationFromFile } from "$lib/qca-simulation";
	import Sidebar from "$lib/components/sidebar.svelte";
	import NewDesignSetup from "$lib/modals/new-design-setup.svelte";

	let { children } = $props();
	const appWindow = getCurrentWebviewWindow();

	let isNewDesignOpen: boolean = $state(false);

	design_filename.subscribe((value) => {
		const DESIGN_MODE = page.url.pathname.startsWith("/design");
		if (value) {
			basename(value).then((name) =>
				appWindow.setTitle(`QCAForge - ${name}`),
			);
			recentFilesManager.fileOpened(value);
		} else appWindow.setTitle(`QCAForge`);
	});

	simulation_filename.subscribe((value) => {
		const ANALYSIS_MODE = page.url.pathname.startsWith("/analysis");
		if (value) {
			basename(value).then((name) =>
				appWindow.setTitle(`QCAForge - ${name}`),
			);
			recentFilesManager.fileOpened(value);
		} else appWindow.setTitle(`QCAForge`);
	});

	function onCreateNewDesign(newDesignConfig: NewDesignConfig) {
		createDefaultQCADesignFile(newDesignConfig).then((qcaDesignFile) => {
			design.set(qcaDesignFile);
			design_filename.set(undefined);
			goto(`/design`);
		});
	}

	listen(EVENT_NEW_FILE, () => {
		isNewDesignOpen = true;
	});

	listen(EVENT_OPEN_DESIGN, () => {
		open({
			title: "Load design",
			filters: [{ name: "Design", extensions: ["qcd"] }],
		}).then((filename) => {
			if (!filename) return;
			readTextFile(filename as string).then((contents) => {
				design_filename.set(filename as string);
				design.set(deserializeQCADesignFile(contents));
				goto(`/design`);
			});
		});
	});
	listen(EVENT_OPEN_SIMULATION, () => {
		open({
			title: "Load siimulation",
			filters: [{ name: "Simulation", extensions: ["qcs"] }],
		}).then((filename) => {
			if (!filename) return;
			loadSimulationFromFile(filename)
				.then((qcaSimulation) => {
					simulation_filename.set(filename);
					simulation.set(qcaSimulation);
					goto("/analysis");
				})
				.catch((err) => {
					console.error(err);
				});
		});
	});

	listen(EVENT_OPEN_DESIGN_FILE, (event) => {
		const filename = event.payload as string;
		loadDesignFromFile(filename).then((designFile) => {
			design_filename.set(filename);
			design.set(designFile);
			goto(`/design`);
		}).catch(() => {
			console.error("Failed to load design file:", filename);
		});
	});

	listen(EVENT_OPEN_SIMULATION_FILE, (event) => {
		const filename = event.payload as string;
		loadSimulationFromFile(filename as string)
		.then((qcaSimulation) => {
			simulation_filename.set(filename);
			simulation.set(qcaSimulation);
			goto("/analysis");
		})
		.catch((err) => {
			console.error(err);
		});
	});

	listen(EVENT_LOG_ENTRY_ADDED, (event) => {
		const logEntry = event.payload;
		console.log(logEntry);
	});
</script>

<Toaster />

<div class="flex flex-row h-full">
	<Sidebar />
	<div class="flex h-full w-full overflow-auto">
		{@render children()}
	</div>
	<ModeWatcher />
	<Toaster />
</div>

<NewDesignSetup 
	bind:isOpen={isNewDesignOpen}
	{onCreateNewDesign}
/>