<script lang="ts">
	import Label from "$lib/components/ui/label/label.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import Icon from "@iconify/svelte";
	import { onMount } from "svelte";
    import { openUrl } from '@tauri-apps/plugin-opener';
	import { getAppInfo, type AppInfo } from "$lib/utils/app-info";
	import LicenseModal from "$lib/settings/license-modal.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";

    let appInfo: AppInfo | undefined = $state();
	let showLicenseModal = $state(false);

	onMount(async () => {
		appInfo = await getAppInfo();
	});

	function openExternal(url: string) {
		openUrl(url);
	}

	function checkForUpdates() {
		console.log('Checking for updates...');
		// Implementation would check for updates
	}

	function viewLicense() {
		showLicenseModal = true;
	}

	function openRepository() {
		openExternal('https://github.com/mihoci10/QCAForge');
	}

	function sendFeedback() {
		openExternal('mailto:miha.krajnc8@gmail.com?subject=QCA Forge Feedback');
	}
</script>

{#if !appInfo}
    <p class="text-center text-muted-foreground">Loading application information...</p>
{:else}
<div class="space-y-6">
	<div class="text-center space-y-2">
		<h1 class="text-3xl font-bold">{appInfo.name}</h1>
		<p class="text-muted-foreground">Quantum-dot Cellular Automata Design & Simulation</p>
		<div class="flex justify-center gap-2">
			<Badge variant="default">v{appInfo.buildInfo.version}</Badge>
            {#if appInfo.buildInfo.debug}
                <Badge variant="secondary">Debug Build</Badge>
            {/if}
            {#if appInfo.buildInfo.git_branch !== 'main'}
                <Badge variant="secondary">{appInfo.buildInfo.git_branch}</Badge>
            {/if}
		</div>
	</div>

	<Separator />

	<!-- Version Information -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Version Information</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label>Application Version</Label>
				<p class="text-sm text-muted-foreground font-mono">{appInfo.buildInfo.version}</p>
			</div>
			<div class="space-y-2">
				<Label>QCACore Version</Label>
				<p class="text-sm text-muted-foreground font-mono">{appInfo.buildInfo.qca_core_version}</p>
			</div>
			<div class="space-y-2">
				<Label>Build Number</Label>
				<p class="text-sm text-muted-foreground font-mono">{appInfo.buildInfo.git_sha}</p>
			</div>
			<div class="space-y-2">
				<Label>Build Date</Label>
				<p class="text-sm text-muted-foreground">{appInfo.buildInfo.timestamp}</p>
			</div>
		</div>
	</div>

	<Separator />

	<!-- Application Details -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Application Details</h2>
		<div class="grid gap-4">
			<div class="space-y-2">
				<Label>Author</Label>
				<p class="text-sm text-muted-foreground">{appInfo.author}</p>
			</div>
			<div class="space-y-2">
				<Label>License</Label>
				<p class="text-sm text-muted-foreground">{appInfo.license}</p>
			</div>
			<div class="space-y-2">
				<Label>Description</Label>
                <ScrollArea class="h-24 p-4 whitespace-pre-wrap">
                    {appInfo.description}
                </ScrollArea>
			</div>
		</div>
	</div>

	<Separator />

	<!-- Actions -->
	<div class="space-y-4">
		<h2 class="text-xl font-semibold">Get Involved</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<Button variant="outline" onclick={checkForUpdates} disabled={true}>
				<Icon icon="mdi:earth"/>
				Check for Updates
			</Button>
			
			<Button variant="outline" onclick={viewLicense}>
				<Icon icon="mdi:link-variant"/>
				View License
			</Button>
			
			<Button variant="outline" onclick={openRepository}>
				<Icon icon="mdi:github"/>
				View Source Code
			</Button>
			
			<Button variant="outline" onclick={sendFeedback}>
				<Icon icon="mdi:email"/>
				Send Feedback
			</Button>
		</div>
	</div>

	<!-- Credits -->
	<div class="text-center pt-6 border-t">
		<p class="text-sm text-muted-foreground flex items-center justify-center gap-1">
			Made with <Icon icon="mdi:heart" /> for the QCA research community
		</p>
		<p class="text-xs text-muted-foreground mt-1">
			© {new Date().getFullYear()} {appInfo.author}. All rights reserved.
		</p>
	</div>
</div>
{/if}

<!-- License Modal -->
<LicenseModal bind:open={showLicenseModal} />