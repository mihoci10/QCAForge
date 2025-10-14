<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Icon from "@iconify/svelte";
	import { page } from "$app/state";
	import AppSettingsModal from "$lib/settings/app-settings-modal.svelte";
	import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
	import {
		EVENT_ABOUT,
		EVENT_OPEN_SETTINGS,
		EVENT_OPEN_SIMULATION,
	} from "$lib/utils/events";
	import { onMount, onDestroy } from "svelte";
	import { design, simulation, visibleBottomPanels } from "$lib/globals";
	import { AppControl } from "$lib/utils/app-control";
	import { goto } from "$app/navigation";
	import { get } from "svelte/store";

	let settingsModal: AppSettingsModal | undefined = $state();
	let unlistenAbout: UnlistenFn | undefined;
	let unlistenSettings: UnlistenFn | undefined;

	onMount(async () => {
		unlistenAbout = await listen(EVENT_ABOUT, () => {
			settingsModal?.openSettings("about");
		});
		unlistenSettings = await listen(EVENT_OPEN_SETTINGS, () => {
			settingsModal?.openSettings();
		});
	});

	onDestroy(() => {
		unlistenAbout?.();
		unlistenSettings?.();
	});

	function togglePanel(panelId: string) {
		visibleBottomPanels.update((v) =>
			v.includes(panelId)
				? v.filter((id) => id !== panelId)
				: [...v, panelId],
		);
		isLogPanelVisible = isPanelVisible("log");
	}

	function isPanelVisible(panelId: string): boolean {
		return get(visibleBottomPanels).includes(panelId);
	}

	let isLogPanelVisible: boolean = $state(isPanelVisible("log"));
</script>

<nav
	class="flex flex-col h-full bg-sidebar-accent gap-1"
	aria-label="Main navigation"
>
	<Button
		variant="ghost"
		size="icon"
		class="data-[state=on]:bg-sidebar-ring"
		href="/"
		data-state={page.url.pathname === "/" ? "on" : "off"}
		aria-label="Navigate to home page"
		title="Home"
	>
		<Icon width={30} icon="material-symbols:home" />
	</Button>
	<hr />
	<Button
		variant="ghost"
		size="icon"
		class="data-[state=on]:bg-sidebar-ring"
		onclick={() => {
			if (get(design)) goto("/design");
			else AppControl.newDesign();
		}}
		data-state={page.url.pathname.startsWith("/design") ? "on" : "off"}
		aria-label="Navigate to design workspace"
		title="Design"
	>
		<Icon width={30} icon="material-symbols:design-services-outline" />
	</Button>
	<Button
		variant="ghost"
		size="icon"
		class="data-[state=on]:bg-sidebar-ring"
		onclick={() => {
			if (get(simulation)) goto("/analysis");
			else emit(EVENT_OPEN_SIMULATION);
		}}
		data-state={page.url.pathname.startsWith("/analysis") ? "on" : "off"}
		aria-label="Navigate to analysis and simulation results"
		title="Analysis"
	>
		<Icon width={30} icon="material-symbols:search-insights-rounded" />
	</Button>
	<div class="grow"></div>
	<Button
		variant="ghost"
		size="icon"
		class="data-[state=on]:bg-sidebar-ring"
		onclick={() => togglePanel("log")}
		data-state={isLogPanelVisible ? "on" : "off"}
		aria-label="Toggle logging console"
		title="Log"
	>
		<Icon width={30} icon="material-symbols:list-alt-outline-rounded" />
	</Button>
	<hr />
	<Button
		variant="ghost"
		size="icon"
		onclick={() => settingsModal?.openSettings()}
		aria-label="Open application settings"
		title="Settings"
	>
		<Icon width={30} icon="material-symbols:settings" />
	</Button>
</nav>

<AppSettingsModal bind:this={settingsModal} />
