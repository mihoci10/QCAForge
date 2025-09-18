<script lang="ts">
	import { onMount } from "svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import * as Select from "$lib/components/ui/select";
	import { themeManager } from "$lib/globals";
	import type { CellTheme } from "$lib/components/design/theme/theme";
	
	let availableThemes = $state<CellTheme[]>([]);
	let currentThemeId = $state<string | null>(null);
	
	// Load available themes and current selection
	onMount(() => {
		availableThemes = themeManager.getAllThemes();
		currentThemeId = themeManager.getActiveId();
		
		// Listen for theme changes from other parts of the app
		const unsubscribe = themeManager.onChange(() => {
			currentThemeId = themeManager.getActiveId();
		});
		
		return unsubscribe;
	});
	
	// Handle theme selection change
	function onThemeChange(newThemeId: string) {
		if (newThemeId && newThemeId !== currentThemeId) {
			try {
				themeManager.setActive(newThemeId);
				currentThemeId = newThemeId;
			} catch (error) {
				console.error("Failed to change theme:", error);
			}
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-4">
		<h3 class="text-lg font-semibold">Designer Theme</h3>
		<div class="flex flex-col gap-2">
			<Label for="designer-theme">Cell Rendering Theme</Label>
			<Select.Root
				type="single"
				value={currentThemeId || ""}
				onValueChange={onThemeChange}
			>
				<Select.Trigger id="designer-theme" class="w-full max-w-[300px]">
					{availableThemes.find(theme => theme.id === currentThemeId)?.title || "Select a theme"}
				</Select.Trigger>
				<Select.Content>
					{#each availableThemes as theme (theme.id)}
						<Select.Item value={theme.id} label={theme.title} />
					{/each}
				</Select.Content>
			</Select.Root>
			<p class="text-sm text-muted-foreground">
				Choose how cells are rendered in the design viewer.
			</p>
		</div>
	</div>
	
	<div class="text-sm text-muted-foreground">
		<p>More appearance settings will be added in future updates.</p>
	</div>
</div>