<script lang="ts">
	import "../../app.css";
	import { Toaster } from "$lib/components/ui/sonner";

	import { page } from "$app/state";
	import { listen } from "@tauri-apps/api/event";
	import {
		EVENT_NEW_FILE,
		EVENT_OPEN_DESIGN,
		EVENT_OPEN_SIMULATION,
	} from "$lib/utils/events";
	import { goto } from "$app/navigation";
	import { open } from "@tauri-apps/plugin-dialog";
	import {
		design,
		design_filename,
		simulation,
		simulation_filename,
	} from "$lib/globals";
	import {
		createDefaultQCADesignFile,
		deserializeQCADesignFile,
	} from "$lib/qca-design";
	import { readTextFile } from "@tauri-apps/plugin-fs";
	import { onMount } from "svelte";
	import { basename } from "@tauri-apps/api/path";
	import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
	import { Button } from "$lib/components/ui/button";
	import Icon from "@iconify/svelte";
	import { loadSimulationFromFile } from "$lib/qca-simulation";
	import AppSettingsModal from "$lib/settings/app-settings-modal.svelte";

	let { children } = $props();
	const appWindow = getCurrentWebviewWindow();

	onMount(() =>
		createDefaultQCADesignFile().then((qcaDesignFile) => {
			design.set(qcaDesignFile);
		}),
	);

	design_filename.subscribe((value) => {
		const DESIGN_MODE = page.url.pathname.startsWith("/design");
		if (value)
			basename(value).then((name) =>
				appWindow.setTitle(`QCAForge - ${name}`),
			);
		else appWindow.setTitle(`QCAForge`);
	});

	simulation_filename.subscribe((value) => {
		const ANALYSIS_MODE = page.url.pathname.startsWith("/analysis");
		if (value)
			basename(value).then((name) =>
				appWindow.setTitle(`QCAForge - ${name}`),
			);
		else appWindow.setTitle(`QCAForge`);
	});

	listen(EVENT_NEW_FILE, () => {
		createDefaultQCADesignFile().then((qcaDesignFile) => {
			design.set(qcaDesignFile);
		});
		design_filename.set(undefined);
		goto(`/design`);
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

	let settingsOpen = $state(false);
</script>

<Toaster />

<div class="flex flex-row h-full">
	<div class="flex flex-col h-full bg-sidebar gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="data-[state=on]:bg-sidebar-ring"
			href="/design"
			data-state={page.url.pathname.startsWith("/design") ? "on" : "off"}
		>
			<Icon width={30} icon="material-symbols:design-services-outline" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="data-[state=on]:bg-sidebar-ring"
			href="/analysis"
			data-state={page.url.pathname.startsWith("/analysis")
				? "on"
				: "off"}
		>
			<Icon width={30} icon="material-symbols:search-insights-rounded" />
		</Button>
		<div class="grow"></div>
		<Button variant="ghost" size="icon" onclick={() => (settingsOpen = true)}>
			<Icon width={30} icon="material-symbols:settings" />
		</Button>
	</div>
	<div class="flex h-full w-full overflow-auto">
		{@render children()}
	</div>
	<AppSettingsModal bind:isOpen={settingsOpen} />
</div>
