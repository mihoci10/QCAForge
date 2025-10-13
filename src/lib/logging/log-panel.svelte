<script lang="ts">
	import { onMount, onDestroy, tick } from "svelte";
	import { EVENT_LOG_ENTRY_ADDED } from "$lib/utils/events";
	import { listen } from "@tauri-apps/api/event";
	import { invoke } from "@tauri-apps/api/core";
	import { deserializeLogEntry, getPrettyLogLevel, LOG_LEVELS, type LogEntry, type LogLevel } from "./log";

	// UI components
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Select from "$lib/components/ui/select";
	import Input from "$lib/components/ui/input/input.svelte";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
	import Table from "$lib/components/ui/table/table.svelte";
	import TableHeader from "$lib/components/ui/table/table-header.svelte";
	import TableHead from "$lib/components/ui/table/table-head.svelte";
	import TableBody from "$lib/components/ui/table/table-body.svelte";
	import TableRow from "$lib/components/ui/table/table-row.svelte";
	import TableCell from "$lib/components/ui/table/table-cell.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Toggle from "$lib/components/ui/toggle/toggle.svelte";

	// Icons
	import Trash2 from "lucide-svelte/icons/trash-2";
	import Clipboard from "lucide-svelte/icons/clipboard";
	import RefreshCw from "lucide-svelte/icons/refresh-cw";
	import Pause from "lucide-svelte/icons/pause";
	import Play from "lucide-svelte/icons/play";
	import { Label } from "$lib/components/ui/label";

	// State
	let entries: LogEntry[] = $state([]);
	let filtered: LogEntry[] = $state([]);

	let filteredLevels: LogLevel[] = $state(["INFO", "WARN", "ERROR"]);
	let search = $state('');
	let autoScroll = $state(true);

	// handle listener unlisten
	let unlisten: (() => void) | null = null;

	function applyFilters() {
		const s = search.trim().toLowerCase();
		filtered = entries.filter((e) => {
			if (!filteredLevels.includes(e.level)) return false;
			if (s) {
				const hay = `${e.message}\n${e.target}`.toLowerCase();
				if (!hay.includes(s)) return false;
			}
			return true;
		});
	}

	$effect(() => {
		// recompute filtered whenever inputs change
		void filteredLevels; void search; void entries;
		applyFilters();
		// schedule autoscroll if enabled
		if (autoScroll) scrollToBottomSoon();
	});

	let bottomEl: HTMLDivElement | null = null;
	async function scrollToBottomSoon() {
		await tick();
		bottomEl?.scrollIntoView({ behavior: 'auto', block: 'end' });
	}

	function formatTime(ts: Date) {
		try {
			const d = new Date(ts);
			return d.toLocaleTimeString(undefined, { hour12: false }) +
				"." + String(d.getMilliseconds()).padStart(3, '0');
		} catch {
			return '' + ts;
		}
	}

	function getLogLevelVariant(level: LogLevel): "destructive" | "warn" | "default" | "outline" {
		switch (level) {
			case "ERROR": return "destructive";
			case "WARN": return "warn";
			case "INFO": return "default";
			case "DEBUG": return "outline";
			case "TRACE": return "outline";
		}
	}

	async function loadInitial() {
		try {
			const raw = (await invoke("get_log", { filter: null })) as any[];
			entries = raw.map(deserializeLogEntry);
		} catch (e) {
			// ignore
		}
	}

	async function clearLogs() {
		await invoke("clear_log");
		entries = [];
	}

	async function copyVisible() {
		const text = filtered
			.map((e) => `[${formatTime(e.timestamp)}] ${e.level.toUpperCase()} ${e.target} - ${e.message}`)
			.join("\n");
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// ignore
		}
	}

	onMount(async () => {
		await loadInitial();
		// live updates
		unlisten = await listen(EVENT_LOG_ENTRY_ADDED, (event) => {
			const logEntry = deserializeLogEntry((event as any).payload);
			entries = [...entries, logEntry];
		});
	});

	onDestroy(() => {
		if (unlisten) unlisten();
	});
</script>

<div class="flex h-full min-h-0 flex-col gap-1 overflow-hidden">
	<!-- Controls -->
	<div class="flex flex-wrap items-center px-2">
		<div class="flex items-center gap-2">
			<Label class="text-sm text-muted-foreground">Level filter</Label>
			<Select.Root type="multiple" bind:value={filteredLevels}>
				<Select.Trigger class="w-32">
					{#if filteredLevels.length === 0}
						None
					{:else if filteredLevels.length === LOG_LEVELS.length}
						All
					{:else if filteredLevels.length === 1}
						{getPrettyLogLevel(filteredLevels[0])}
					{:else}
						{filteredLevels.length} selected
					{/if}
				</Select.Trigger>
				<Select.Content>
					{#each LOG_LEVELS as lvl}
						<Select.Item value={lvl}>{getPrettyLogLevel(lvl)}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<Input placeholder="Search message/target…" class="min-w-56 flex-1" bind:value={search} />

		<div class="ml-auto flex items-center gap-2">
			<Toggle pressed={autoScroll} onclick={() => (autoScroll = !autoScroll)} title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}>
				{#if autoScroll}
					<Pause />
				{:else}
					<Play />
				{/if}
				Auto-scroll
			</Toggle>

			<Button variant="outline" onclick={copyVisible} title="Copy visible logs">
				<Clipboard class="size-4" /> Copy
			</Button>
			<Button variant="destructive" onclick={clearLogs} title="Clear all logs">
				<Trash2 class="size-4" /> Clear
			</Button>
		</div>
	</div>

	<!-- Table -->
	<ScrollArea orientation="vertical" class="flex-1 min-h-0">
		<Table class="min-w-full">
			<TableHeader>
				<tr>
					<TableHead class="w-32">Time</TableHead>
					<TableHead class="w-24">Level</TableHead>
					<TableHead class="w-64">Target</TableHead>
					<TableHead>Message</TableHead>
				</tr>
			</TableHeader>
			<TableBody>
				{#if filtered.length === 0}
					<TableRow>
						<TableCell colspan={4} class="text-center text-sm text-muted-foreground">No log entries</TableCell>
					</TableRow>
				{:else}
					{#each filtered as e, index (index)}
						<TableRow>
							<TableCell class="font-mono text-xs text-muted-foreground">{formatTime(e.timestamp)}</TableCell>
							<TableCell>
								<Badge variant={getLogLevelVariant(e.level)}>{getPrettyLogLevel(e.level)}</Badge>
							</TableCell>
							<TableCell class="font-mono text-xs">{e.target}</TableCell>
							<TableCell class="whitespace-pre-wrap">{e.message}</TableCell>
						</TableRow>
					{/each}
				{/if}
			</TableBody>
		</Table>
		<div bind:this={bottomEl}></div>
	</ScrollArea>
</div>

<style>
	/* minimal tweaks if needed */
</style>
