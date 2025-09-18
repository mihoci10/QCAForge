<script lang="ts">
	import { onMount } from "svelte";
	import Label from "$lib/components/ui/label/label.svelte";
	import * as Select from "$lib/components/ui/select";
	import {Switch} from "$lib/components/ui/switch";
	import { themeManager } from "$lib/globals";
	import type { CellTheme } from "$lib/components/design/theme/theme";
	import { mode, setMode, setTheme, theme } from "mode-watcher";
	
	let availableThemes = $state<CellTheme[]>([]);
	let currentThemeId = $state<string | null>(null);
	let isSystemMode = $state<boolean>(false);
	
	// CSS Theme options
	const cssThemes = [
		{ value: "", label: "Standard" },
		{ value: "high-contrast", label: "High Contrast" },
	];
    const cssThemeModes = [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
    ];
	
	// Load available themes and current selection
	onMount(() => {
		availableThemes = themeManager.getAllThemes();
		currentThemeId = themeManager.getActiveId();
		
		// Initialize system mode based on current mode
		// We'll start with false and let the user toggle it
		isSystemMode = false;
		
		// Listen for theme changes from other parts of the app
		const unsubscribe = themeManager.onChange(() => {
			currentThemeId = themeManager.getActiveId();
		});
		
		return unsubscribe;
	});
	
	// Handle designer theme selection change
	function onDesignerThemeChange(newThemeId: string) {
		if (newThemeId && newThemeId !== currentThemeId) {
			try {
				themeManager.setActive(newThemeId);
				currentThemeId = newThemeId;
			} catch (error) {
				console.error("Failed to change designer theme:", error);
			}
		}
	}
	
	function onCssThemeChange(newTheme: string) {
        setTheme(newTheme);
	}

    function onCssModeChange(newMode: string) {
        if (newMode === "light" || newMode === "dark") {
            setMode(newMode);
            isSystemMode = false;
        }
    }

    function onSystemModeToggle(enabled: boolean) {
        isSystemMode = enabled;
        if (enabled) {
            setMode("system");
        }
    }

</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-4">
		<h3 class="text-lg font-semibold">Application Theme</h3>
		
		<!-- System Mode Toggle -->
		<div class="flex items-center gap-2">
			<Switch bind:checked={isSystemMode} onCheckedChange={onSystemModeToggle} />
			<Label>Use system preference</Label>
		</div>
		
		<!-- Theme Controls in One Line -->
		<div class="flex items-center gap-4">
			<div class="flex flex-col gap-2 min-w-[200px]">
				<Label for="app-theme">Interface Theme</Label>
				<Select.Root
					type="single"
					value={theme.current}
					onValueChange={onCssThemeChange}
				>
					<Select.Trigger id="app-theme" class="w-full">
						{cssThemes.find(option => option.value === theme.current)?.label || "Standard"}
					</Select.Trigger>
					<Select.Content>
						{#each cssThemes as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			
			<div class="flex flex-col gap-2 min-w-[200px]">
				<Label for="theme-mode">Color Mode</Label>
				<Select.Root
					type="single"
					value={!mode.current ? "light" : mode.current}
					onValueChange={onCssModeChange}
					disabled={isSystemMode}
				>
					<Select.Trigger id="theme-mode" class="w-full">
						{cssThemeModes.find(option => option.value === (!mode.current ? "light" : mode.current))?.label || "Light"}
					</Select.Trigger>
					<Select.Content>
						{#each cssThemeModes as option (option.value)}
							<Select.Item value={option.value} label={option.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
		
		{#if isSystemMode}
			<p class="text-sm text-muted-foreground">
				Color mode will automatically match your system preference.
			</p>
		{/if}
	</div>
	
	<div class="flex flex-col gap-4">
		<h3 class="text-lg font-semibold">Designer Theme</h3>
		<div class="flex flex-col gap-2">
			<Label for="designer-theme">Cell Rendering Theme</Label>
			<Select.Root
				type="single"
				value={currentThemeId || ""}
				onValueChange={onDesignerThemeChange}
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