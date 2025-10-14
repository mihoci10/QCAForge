<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { onMount } from "svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { recentFilesManager } from "$lib/globals";
	import type { RecentFile } from "$lib/recent-files";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
	import { openUrl } from "@tauri-apps/plugin-opener";
	import { AppControl } from "$lib/utils/app-control";

	let recentFiles: RecentFile[] = $state([]);

	function formatDate(date: Date): string {
		const now = new Date();
		const today = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		const fileDate = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);

		if (fileDate.getTime() === today.getTime()) {
			return "Today";
		} else if (fileDate.getTime() === yesterday.getTime()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString();
		}
	}

	function getFileIcon(type: string): string {
		switch (type) {
			case "design":
				return "🎨";
			case "simulation":
				return "📊";
			default:
				return "📄";
		}
	}

	function getFileTypeLabel(type: string): string {
		switch (type) {
			case "design":
				return "Design";
			case "simulation":
				return "Simulation";
			default:
				return "File";
		}
	}

	onMount(() => {
		invoke("startup_frontend_ready");

		// Load recent files
		recentFiles = recentFilesManager.getAllRecentFiles();
	});
</script>

<ScrollArea
	class="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
>
	<!-- Hero Section -->
	<div class="container mx-auto px-6 py-16">
		<div class="text-center mb-16">
			<h1 class="text-5xl font-bold text-slate-900 dark:text-white mb-6">
				QCAForge
			</h1>
			<p
				class="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto"
			>
				A modern desktop application for designing and simulating
				<span class="font-semibold text-slate-800 dark:text-slate-200"
					>Quantum Cellular Automata (QCA)</span
				>
				circuits. Built with cutting-edge technology for researchers and
				engineers.
			</p>

			<!-- Main Action Buttons -->
			<div
				class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
			>
				<Button
					onclick={() => AppControl.newDesign()}
					class="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
				>
					🔧 Start Designing
				</Button>
				<Button
					href="/analysis"
					variant="outline"
					class="px-8 py-3 text-lg border-slate-300 dark:border-slate-600 min-w-[200px]"
				>
					📊 View Analysis
				</Button>
			</div>
		</div>

		<!-- Section -->
		<div class="mb-16 grid lg:grid-cols-2 gap-4">
			<!-- Recent Files Section -->
			<div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
				<h3
					class="text-lg font-semibold mb-4 text-slate-900 dark:text-white"
				>
					Recent Files
				</h3>
				{#if recentFiles.length > 0}
					<div class="space-y-2">
						{#each recentFiles.slice(0, 5) as file}
							<button
								class="flex justify-between items-center py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group w-full text-left"
								onclick={() =>
									AppControl.loadFileFromPath(file.fullPath)}
							>
								<div class="flex-1 min-w-0">
									<p
										class="text-sm font-medium text-slate-900 dark:text-white truncate"
									>
										{file.name}
									</p>
									<p
										class="text-xs text-slate-500 dark:text-slate-400"
									>
										{getFileTypeLabel(file.type)}
									</p>
								</div>
								<div
									class="text-xs text-slate-500 dark:text-slate-400"
								>
									{formatDate(new Date(file.lastOpened))}
								</div>
							</button>
						{/each}
					</div>
				{:else}
					<p
						class="text-sm text-slate-500 dark:text-slate-400 text-center py-4"
					>
						No recent files
					</p>
				{/if}
			</div>
			<!--Shortcuts Section-->
			<div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
				<h3
					class="text-lg font-semibold mb-4 text-slate-900 dark:text-white"
				>
					Getting Started
				</h3>
				<div class="space-y-3">
					<a
						href="/design"
						class="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
					>
						<div
							class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-3"
						>
							<span class="text-blue-600 dark:text-blue-400"
								>🎨</span
							>
						</div>
						<div>
							<p
								class="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400"
							>
								Create Your First Design
							</p>
							<p
								class="text-xs text-slate-500 dark:text-slate-400"
							>
								Learn to create QCA designs
							</p>
						</div>
					</a>

					<a
						href="/analysis"
						class="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
					>
						<div
							class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mr-3"
						>
							<span class="text-green-600 dark:text-green-400"
								>📊</span
							>
						</div>
						<div>
							<p
								class="text-sm font-medium text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400"
							>
								Analyze Simulation Results
							</p>
							<p
								class="text-xs text-slate-500 dark:text-slate-400"
							>
								Interpret your simulation data
							</p>
						</div>
					</a>

					<a
						href="/examples"
						class="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
					>
						<div
							class="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mr-3"
						>
							<span class="text-purple-600 dark:text-purple-400"
								>💡</span
							>
						</div>
						<div>
							<p
								class="text-sm font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400"
							>
								Examples
							</p>
							<p
								class="text-xs text-slate-500 dark:text-slate-400"
							>
								Explore sample circuits
							</p>
						</div>
					</a>

					<button
						onclick={() => openUrl("https://missing.docs.com")}
						class="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group w-full text-left"
					>
						<div
							class="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mr-3"
						>
							<span class="text-orange-600 dark:text-orange-400"
								>📚</span
							>
						</div>
						<div>
							<p
								class="text-sm font-medium text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400"
							>
								Documentation
							</p>
							<p
								class="text-xs text-slate-500 dark:text-slate-400"
							>
								Complete reference guide
							</p>
						</div>
					</button>
				</div>
			</div>
		</div>
		<!-- Footer -->
	</div></ScrollArea
>
