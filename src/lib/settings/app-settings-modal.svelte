<script lang="ts">
	import BaseModal from "$lib/modals/base-modal.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Icon from "@iconify/svelte";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
	import GeneralSettings from "./general-settings.svelte";
	import AppearanceSettings from "./appearance-settings.svelte";
	import AboutSettings from "./about-settings.svelte";

	// Settings state
	let isOpen = $state(false);
	let currentSection = $state('general');
	let settings = $state({
		// General settings
		appName: 'QCA Forge',
		autoSave: true,
		autoSaveInterval: 5,
		checkUpdates: true,
		showWelcomeScreen: true,
		
		// Appearance settings
		theme: 'system',
		accentColor: 'blue',
		fontSize: 14,
		showGrid: true,
		showRuler: false,
		
		// Performance settings
		maxUndoLevels: 50,
		enableHardwareAcceleration: true,
		memoryLimit: 512,
		
		// Simulation settings
		defaultClockSpeed: 1000,
		maxIterations: 10000,
		enableParallelProcessing: true,
		
		// Privacy settings
		sendTelemetry: false,
		crashReports: true,
		
		// Advanced settings
		developerMode: false,
		debugLogging: false,
		customConfigPath: ''
	});

	interface SidebarItem {
		id: string;
		label: string;
		iconName: string;
	}

	const GENERAL_TAB = 'general';
	const APPEARANCE_TAB = 'appearance';
	const ABOUT_TAB = 'about';

	const sidebarItems = [
		{ id: GENERAL_TAB, label: 'General', iconName: 'mdi:cog-outline' },
		{ id: APPEARANCE_TAB, label: 'Appearance', iconName: 'mdi:palette-outline' },
		{ id: ABOUT_TAB, label: 'About', iconName: 'mdi:information-outline' },
	];

	function applyCallback(data: any) {
		console.log('Applying settings:', { ...settings, ...data });
		// Here you would typically save settings to storage or send to backend
	}

	function resetToDefaults() {
		if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
			settings = {
				appName: 'QCA Forge',
				autoSave: true,
				autoSaveInterval: 5,
				checkUpdates: true,
				showWelcomeScreen: true,
				theme: 'system',
				accentColor: 'blue',
				fontSize: 14,
				showGrid: true,
				showRuler: false,
				maxUndoLevels: 50,
				enableHardwareAcceleration: true,
				memoryLimit: 512,
				defaultClockSpeed: 1000,
				maxIterations: 10000,
				enableParallelProcessing: true,
				sendTelemetry: false,
				crashReports: true,
				developerMode: false,
				debugLogging: false,
				customConfigPath: ''
			};
		}
	}

	export function openSettings(navigateToTab: string = GENERAL_TAB) {
		isOpen = true;
		currentSection = navigateToTab;
	}
</script>

<BaseModal bind:open={isOpen} type="blank" {applyCallback} customContentClass="max-w-full w-6/12 !p-0">
	<div class="flex rounded-lg border bg-background overflow-hidden max-h-[80vh] h-[80vh]">
		<!-- Sidebar Navigation -->
		<div class="w-48 border-r bg-sidebar flex flex-col">
			<div class="p-4 border-b">
				<h3 class="font-medium text-sidebar-foreground">Settings</h3>
			</div>
			<nav class="flex-1 p-2">
				<ul class="space-y-1">
					{#each sidebarItems as item}
						<li>
							<Button
								variant="ghost"
								size="icon"
								onclick={() => currentSection = item.id}
								class="w-full justify-start data-[state=on]:bg-sidebar-ring pl-5"
								data-state={currentSection === item.id ? 'on' : 'off'}
							>
								<Icon icon={item.iconName} width={24} />
								<span class="ml-2">{item.label}</span>
							</Button>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<!-- Content Area -->
		<div class="flex-1 flex flex-col">
			<ScrollArea class="flex-1 p-6">
				<div class="space-y-6">
					{#if currentSection === GENERAL_TAB}
						<GeneralSettings />
					{:else if currentSection === APPEARANCE_TAB}
						<AppearanceSettings />
					{:else if currentSection === ABOUT_TAB}
						<AboutSettings />	
					{/if}
				</div>
			</ScrollArea>
		</div>
	</div>
</BaseModal>
