<script lang="ts">
	import "../../app.css";
	import { Toaster } from "$lib/components/ui/sonner";
	import { ModeWatcher } from "mode-watcher";
	import { onMount, onDestroy } from "svelte";

	import { page } from "$app/state";
	import { emit, listen } from "@tauri-apps/api/event";
	import {
		EVENT_NEW_FILE,
		EVENT_OPEN_DESIGN,
		EVENT_OPEN_DESIGN_FILE,
		EVENT_OPEN_SIMULATION,
		EVENT_OPEN_SIMULATION_FILE,
		EVENT_SAVE_FILE,
		EVENT_SAVE_FILE_AS,
		EVENT_EXPORT_FIGURE,
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
		loadDesignFromFile,
		type NewDesignConfig,
	} from "$lib/qca-design";
	import { basename } from "@tauri-apps/api/path";
	import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
	import { loadSimulationFromFile } from "$lib/qca-simulation";
	import Sidebar from "$lib/components/sidebar.svelte";
	import NewDesignSetup from "$lib/modals/new-design-setup.svelte";
	import { lastDirectoryManager } from "$lib/last-directory";
	import { AppControl } from "$lib/utils/app-control";
	import { platform } from "@tauri-apps/plugin-os";
	import DesignPage from "$lib/design/design-page.svelte";
	import AnalysisPage from "$lib/analysis/analysis-page.svelte";

	let { children } = $props();
	const appWindow = getCurrentWebviewWindow();

	let isNewDesignOpen: boolean = $state(false);

	// Views are mounted here and only hidden on route change, so their state survives.
	let isDesignRoute = $derived(page.url.pathname.startsWith("/design"));
	let isAnalysisRoute = $derived(page.url.pathname.startsWith("/analysis"));

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

	listen(EVENT_OPEN_DESIGN, async () => {
		const filename = await open({
			title: "Load design",
			filters: [{ name: "Design", extensions: ["qcd"] }],
			defaultPath: await lastDirectoryManager.getDirectory("design"),
		});
		if (filename) AppControl.loadDesignFile(filename);
	});
	listen(EVENT_OPEN_SIMULATION, async () => {
		const filename = await open({
			title: "Load simulation",
			filters: [{ name: "Simulation", extensions: ["qcs"] }],
			defaultPath: await lastDirectoryManager.getDirectory("simulation"),
		});
		if (filename) AppControl.loadSimulationFile(filename);
	});

	listen(EVENT_OPEN_DESIGN_FILE, (event) => {
		const filename = event.payload as string;
		loadDesignFromFile(filename)
			.then((designFile) => {
				design_filename.set(filename);
				design.set(designFile);
				lastDirectoryManager.setDirectoryFromFilePath(
					"design",
					filename,
				);
				goto(`/design`);
			})
			.catch(() => {
				console.error("Failed to load design file:", filename);
			});
	});

	listen(EVENT_OPEN_SIMULATION_FILE, (event) => {
		const filename = event.payload as string;
		loadSimulationFromFile(filename as string)
			.then((qcaSimulation) => {
				simulation_filename.set(filename);
				simulation.set(qcaSimulation);
				lastDirectoryManager.setDirectoryFromFilePath(
					"simulation",
					filename,
				);
				goto("/analysis");
			})
			.catch((err) => {
				console.error(err);
			});
	});

	// WebView2 can swallow native accelerators, so mirror window_menu.rs on Windows only
	// (elsewhere this would emit every event twice).
	const MENU_SHORTCUTS: { key: string; shift?: boolean; event: string }[] = [
		{ key: "n", event: EVENT_NEW_FILE },
		{ key: "o", event: EVENT_OPEN_DESIGN },
		{ key: "s", event: EVENT_SAVE_FILE },
		{ key: "s", shift: true, event: EVENT_SAVE_FILE_AS },
		{ key: "e", event: EVENT_EXPORT_FIGURE },
	];

	function handleMenuShortcut(e: KeyboardEvent) {
		if (!(e.ctrlKey || e.metaKey) || e.repeat) return;
		const key = e.key.toLowerCase();
		const match = MENU_SHORTCUTS.find(
			(s) => s.key === key && !!s.shift === e.shiftKey,
		);
		if (!match) return;
		e.preventDefault();
		emit(match.event);
	}

	onMount(() => {
		if (platform() === "windows")
			window.addEventListener("keydown", handleMenuShortcut);
	});

	onDestroy(() => {
		window.removeEventListener("keydown", handleMenuShortcut);
	});
</script>

<Toaster />

<div class="flex flex-row h-full">
	<Sidebar />

	<div class="flex h-full w-full overflow-auto">
		{@render children()}

		{#if $design}
			<div
				class="h-full w-full flex flex-col"
				style:display={isDesignRoute ? "flex" : "none"}
			>
				<DesignPage active={isDesignRoute} />
			</div>
		{/if}

		{#if $simulation}
			<div
				class="h-full w-full flex flex-col"
				style:display={isAnalysisRoute ? "flex" : "none"}
			>
				<AnalysisPage />
			</div>
		{/if}
	</div>
</div>

<ModeWatcher />
<Toaster />
<NewDesignSetup bind:isOpen={isNewDesignOpen} {onCreateNewDesign} />
