<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Icon from "@iconify/svelte";
	import { page } from "$app/state";
	import AppSettingsModal from "$lib/settings/app-settings-modal.svelte";
	import { listen } from "@tauri-apps/api/event";
	import { EVENT_ABOUT, EVENT_OPEN_SETTINGS } from "$lib/utils/events";
	import { onMount } from "svelte";

	let settingsModal: AppSettingsModal | undefined = $state();

	onMount(() => {
		listen(EVENT_ABOUT, () => {
			settingsModal?.openSettings("about");
		});
		listen(EVENT_OPEN_SETTINGS, () => {
			settingsModal?.openSettings();
		});
	});
</script>

<div class="flex flex-col h-full bg-sidebar-accent gap-1">
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
	<Button
		variant="ghost"
		size="icon"
		onclick={() => settingsModal?.openSettings()}
	>
		<Icon width={30} icon="material-symbols:settings" />
	</Button>
</div>

<AppSettingsModal bind:this={settingsModal} />