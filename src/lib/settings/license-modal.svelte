<script lang="ts">
	import BaseModal from "../modals/base-modal.svelte";
	import { onMount } from "svelte";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";

	let { open = $bindable(false) } = $props();

	let licenseContent = $state("");
	let loading = $state(true);

	onMount(async () => {
		try {
			// Read the LICENSE file from the project root
			const response = await fetch("/LICENSE");
			if (response.ok) {
				licenseContent = await response.text();
			} else {
				licenseContent = `Failed to load license: ${response.status} ${response.statusText}`;
			}
		} catch (error) {
			const err = `Failed to load license: ${error}`;
			console.error(err);
			// Use the same fallback
			licenseContent = err;
		} finally {
			loading = false;
		}
	});
</script>

<BaseModal bind:open type="alert" customContentClass="max-w-4xl max-h-[80vh]">
	{#snippet title()}
		<span class="text-xl font-semibold">License</span>
	{/snippet}

	{#snippet description()}
		<span class="text-muted-foreground">QCA Forge License Agreement</span>
	{/snippet}

	<div class="space-y-4">
		{#if loading}
			<div class="flex items-center justify-center py-8">
				<p class="text-muted-foreground">Loading license...</p>
			</div>
		{:else}
			<ScrollArea
				class="h-[30vh] p-4 whitespace-pre-wrap font-mono text-sm"
			>
				{licenseContent}
			</ScrollArea>
		{/if}
	</div>
</BaseModal>
