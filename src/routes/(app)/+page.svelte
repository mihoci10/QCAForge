<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { onMount } from "svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { recentFilesManager } from "$lib/globals";
	import type { RecentFile } from "$lib/recent-files";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";

	let recentDesignFiles: RecentFile[] = $state([]);
	let recentSimulationFiles: RecentFile[] = $state([]);

	function formatDate(date: Date): string {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);
		
		const fileDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		
		if (fileDate.getTime() === today.getTime()) {
			return "Today";
		} else if (fileDate.getTime() === yesterday.getTime()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString();
		}
	}

	onMount(() => {
		invoke("startup_frontend_ready");
		
		// Load recent files
		recentDesignFiles = recentFilesManager.getRecentDesignFiles();
		recentSimulationFiles = recentFilesManager.getRecentSimulationFiles();
	});
</script>

<ScrollArea class="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
	<!-- Hero Section -->
	<div class="container mx-auto px-6 py-16">
		<div class="text-center mb-16">
			<h1 class="text-5xl font-bold text-slate-900 dark:text-white mb-6">
				QCAForge
			</h1>
			<p class="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
				A modern desktop application for designing and simulating 
				<span class="font-semibold text-slate-800 dark:text-slate-200">Quantum Cellular Automata (QCA)</span> 
				circuits. Built with cutting-edge technology for researchers and engineers.
			</p>
			
			<!-- Main Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
				<Button 
					href="/design" 
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

		<!-- Recent Files Section -->
		<div class="grid md:grid-cols-2 gap-8 mb-16">
			<!-- Recent Design Files -->
			<div class="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
				<div class="flex items-center mb-4">
					<div class="text-2xl mr-3">🎨</div>
					<h3 class="text-xl font-semibold text-slate-900 dark:text-white">
						Recent Design Files
					</h3>
				</div>
				
				{#if recentDesignFiles.length > 0}
					<div class="space-y-2">
						{#each recentDesignFiles.slice(0, 5) as file}
							<div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-900 dark:text-white truncate">
										{file.name}
									</p>
									<p class="text-xs text-slate-500 dark:text-slate-400">
										{formatDate(new Date(file.lastOpened))}
									</p>
								</div>
								<Button 
									variant="ghost" 
									size="sm"
									class="text-blue-600 hover:text-blue-700 ml-2"
									onclick={() => {
										// TODO: Implement file opening logic
										console.log('Opening design file:', file.fullPath);
									}}
								>
									Open
								</Button>
							</div>
						{/each}
					</div>
					
					{#if recentDesignFiles.length > 5}
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
							And {recentDesignFiles.length - 5} more files...
						</p>
					{/if}
				{:else}
					<div class="text-center py-8">
						<p class="text-slate-500 dark:text-slate-400 mb-4">
							No recent design files found
						</p>
						<Button 
							href="/design" 
							variant="outline"
							size="sm"
						>
							Create New Design
						</Button>
					</div>
				{/if}
			</div>

			<!-- Recent Simulation Files -->
			<div class="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
				<div class="flex items-center mb-4">
					<div class="text-2xl mr-3">📊</div>
					<h3 class="text-xl font-semibold text-slate-900 dark:text-white">
						Recent Simulation Files
					</h3>
				</div>
				
				{#if recentSimulationFiles.length > 0}
					<div class="space-y-2">
						{#each recentSimulationFiles.slice(0, 5) as file}
							<div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-slate-900 dark:text-white truncate">
										{file.name}
									</p>
									<p class="text-xs text-slate-500 dark:text-slate-400">
										{formatDate(new Date(file.lastOpened))}
									</p>
								</div>
								<Button 
									variant="ghost" 
									size="sm"
									class="text-blue-600 hover:text-blue-700 ml-2"
									onclick={() => {
										// TODO: Implement file opening logic
										console.log('Opening simulation file:', file.fullPath);
									}}
								>
									Open
								</Button>
							</div>
						{/each}
					</div>
					
					{#if recentSimulationFiles.length > 5}
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
							And {recentSimulationFiles.length - 5} more files...
						</p>
					{/if}
				{:else}
					<div class="text-center py-8">
						<p class="text-slate-500 dark:text-slate-400 mb-4">
							No recent simulation files found
						</p>
						<Button 
							href="/analysis" 
							variant="outline"
							size="sm"
						>
							View Analysis
						</Button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Quick Start Section -->
		<div class="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
			<h2 class="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">
				Quick Start Guide
			</h2>
			<div class="grid md:grid-cols-3 gap-6">
				<div class="text-center">
					<div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
					</div>
					<h4 class="font-semibold mb-2 text-slate-900 dark:text-white">Design Your Circuit</h4>
					<p class="text-sm text-slate-600 dark:text-slate-300">
						Use the interactive designer to create your QCA circuit layout
					</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-xl font-bold text-green-600 dark:text-green-400">2</span>
					</div>
					<h4 class="font-semibold mb-2 text-slate-900 dark:text-white">Run Simulation</h4>
					<p class="text-sm text-slate-600 dark:text-slate-300">
						Configure simulation parameters and execute your design
					</p>
				</div>
				<div class="text-center">
					<div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
						<span class="text-xl font-bold text-purple-600 dark:text-purple-400">3</span>
					</div>
					<h4 class="font-semibold mb-2 text-slate-900 dark:text-white">Analyze Results</h4>
					<p class="text-sm text-slate-600 dark:text-slate-300">
						Visualize and export your simulation data for further research
					</p>
				</div>
			</div>
		</div>
	</div>
</ScrollArea>