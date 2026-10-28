<script lang="ts">
	import type { Layer } from "$lib/Layer";
	import { CellType } from "$lib/Cell";
	import type { CellArchitecture } from "$lib/CellArchitecture";
	import BaseModal from "./base-modal.svelte";
	import { Label } from "$lib/components/ui/label";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import * as Select from "$lib/components/ui/select";
	import { Button } from "$lib/components/ui/button";
	import Icon from "@iconify/svelte";
	import { get } from "svelte/store";
	import { toast } from "svelte-sonner";
	import { open, save } from "@tauri-apps/plugin-dialog";
	import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
	import { basename, join } from "@tauri-apps/api/path";
	import { design_filename } from "$lib/globals";
	import { lastDirectoryManager } from "$lib/last-directory";
	import {
		INPUT_SEQUENCE_FILE_EXTENSIONS,
		parseInputSequence,
		serializeInputSequence,
	} from "$lib/input-sequence-file";

	interface Props {
		isOpen: boolean;
		layers: Layer[];
		cell_architectures: Map<string, CellArchitecture>;
		useCustomInputSequence: boolean;
		customInputSequence: number[][];
		onApply: (useCustom: boolean, sequence: number[][]) => void;
	}

	let {
		isOpen = $bindable(),
		layers,
		cell_architectures,
		useCustomInputSequence,
		customInputSequence,
		onApply,
	}: Props = $props();

	const LETTERS = ["A", "B", "C", "D"];

	interface InputCellInfo {
		label: string;
		numStates: number;
	}

	// Must enumerate input cells in exactly the same order qca-core's
	// get_num_inputs does (layer by layer, cell index order within a layer)
	// so a vector's positions line up with the right inputs.
	function getInputCells(): InputCellInfo[] {
		const result: InputCellInfo[] = [];
		layers.forEach((layer) => {
			const architecture = cell_architectures.get(
				layer.cell_architecture_id,
			);
			const numStates = architecture
				? (architecture.dot_count / 4) * 2
				: 2;
			layer.cells.forEach((cell) => {
				if (cell.typ === CellType.Input) {
					result.push({
						label: cell.label || `Input ${result.length + 1}`,
						numStates,
					});
				}
			});
		});
		return result;
	}

	let inputCells: InputCellInfo[] = $state([]);
	let workingUseCustom: boolean = $state(false);
	let workingSequence: number[][] = $state([]);

	// Reset the working draft from the current values whenever the modal
	// opens, so an edit-then-cancel doesn't leak, and so it always reflects
	// whichever design is currently open (its inputs can differ between
	// opens).
	$effect(() => {
		if (isOpen) {
			inputCells = getInputCells();
			workingUseCustom = useCustomInputSequence;
			workingSequence = customInputSequence.map((vector) => [...vector]);
		}
	});

	function addVector() {
		workingSequence = [...workingSequence, inputCells.map(() => 0)];
	}

	function duplicateVector(index: number) {
		const copy = [...workingSequence[index]];
		workingSequence = [
			...workingSequence.slice(0, index + 1),
			copy,
			...workingSequence.slice(index + 1),
		];
	}

	function removeVector(index: number) {
		workingSequence = workingSequence.filter((_, i) => i !== index);
	}

	function setValue(rowIndex: number, cellIndex: number, value: string) {
		workingSequence[rowIndex][cellIndex] = parseInt(value);
	}

	const FILE_FILTERS = [
		{
			name: "Input sequence (CSV)",
			extensions: INPUT_SEQUENCE_FILE_EXTENSIONS,
		},
	];

	async function openSequenceFile() {
		const filename = await open({
			title: "Open input sequence",
			filters: FILE_FILTERS,
			defaultPath: await lastDirectoryManager.getDirectory("design"),
		});
		if (!filename) return;
		try {
			const sequence = parseInputSequence(
				await readTextFile(filename as string),
				inputCells,
			);
			workingSequence = sequence;
			workingUseCustom = true;
			lastDirectoryManager.setDirectoryFromFilePath(
				"design",
				filename as string,
			);
			toast.success(
				`Loaded ${sequence.length} vector${sequence.length === 1 ? "" : "s"} from ${await basename(filename as string)}`,
			);
		} catch (error) {
			toast.error(
				`Could not open input sequence: ${error instanceof Error ? error.message : error}`,
			);
		}
	}

	async function saveSequenceFile() {
		const designFile = get(design_filename);
		const defaultName = designFile
			? (await basename(designFile)).replace(/\.[^./\\]+$/, "") +
				"_inputs.csv"
			: "inputs.csv";
		const dir = await lastDirectoryManager.getDirectory("design");
		const filename = await save({
			title: "Save input sequence",
			defaultPath: dir ? await join(dir, defaultName) : defaultName,
			filters: FILE_FILTERS,
		});
		if (!filename) return;
		try {
			await writeTextFile(
				filename,
				serializeInputSequence(inputCells, workingSequence),
			);
			lastDirectoryManager.setDirectoryFromFilePath("design", filename);
			toast.success(
				`Saved input sequence to ${await basename(filename)}`,
			);
		} catch (error) {
			toast.error(`Could not save input sequence: ${error}`);
		}
	}

	function handleApply() {
		// An empty sequence can't be simulated - silently fall back to
		// exhaustive rather than leaving the design in an unrunnable state.
		const finalUseCustom = workingUseCustom && workingSequence.length > 0;
		onApply(finalUseCustom, workingSequence);
		isOpen = false;
	}
</script>

<BaseModal bind:open={isOpen} type="blank" customContentClass="max-w-2xl">
	{#snippet title()}
		Input sequence settings
	{/snippet}
	{#snippet description()}
		Choose which input combinations get simulated, and in what order.
	{/snippet}

	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-2">
			<Checkbox
				id="use-custom-sequence"
				bind:checked={workingUseCustom}
			/>
			<Label for="use-custom-sequence">
				Use a custom input sequence instead of simulating every
				combination
			</Label>
		</div>

		{#if !workingUseCustom}
			<p class="text-sm text-muted-foreground">
				Every possible input combination will be simulated exhaustively
				(the default).
			</p>
		{:else if inputCells.length === 0}
			<p class="text-sm text-muted-foreground">
				This design has no input cells yet.
			</p>
		{:else}
			<p class="text-xs text-muted-foreground">
				The simulation runs through this list sequentially, in order, so
				the same vector can appear more than once and still produce a
				different output each time - in a circuit with memory (e.g. a
				flip-flop), the previous vector's ending state carries into the
				next one.
			</p>

			<div class="max-h-80 overflow-auto rounded-md border">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-background">
						<tr>
							<th class="w-10 p-2 text-left">#</th>
							{#each inputCells as inputCell}
								<th class="p-2 text-left">{inputCell.label}</th>
							{/each}
							<th class="w-20 p-2"></th>
						</tr>
					</thead>
					<tbody>
						{#each workingSequence as vector, rowIndex}
							<tr class="border-b last:border-0">
								<td class="p-2 text-muted-foreground"
									>{rowIndex}</td
								>
								{#each inputCells as inputCell, cellIndex}
									<td class="p-2">
										<Select.Root
											type="single"
											value={(
												vector[cellIndex] ?? 0
											).toString()}
											onValueChange={(value) =>
												setValue(
													rowIndex,
													cellIndex,
													value,
												)}
										>
											<Select.Trigger class="w-16">
												{LETTERS[
													vector[cellIndex] ?? 0
												]}
											</Select.Trigger>
											<Select.Content>
												{#each Array(inputCell.numStates) as _, stateIdx}
													<Select.Item
														value={stateIdx.toString()}
														label={LETTERS[
															stateIdx
														]}
													/>
												{/each}
											</Select.Content>
										</Select.Root>
									</td>
								{/each}
								<td class="flex justify-end gap-1 p-2">
									<Button
										variant="ghost"
										size="icon"
										onclick={() =>
											duplicateVector(rowIndex)}
										title="Duplicate vector"
									>
										<Icon
											icon="material-symbols:content-copy-outline"
											class="h-4 w-4"
										/>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onclick={() => removeVector(rowIndex)}
										title="Remove vector"
									>
										<Icon
											icon="material-symbols:remove"
											class="h-4 w-4"
										/>
									</Button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Button variant="outline" onclick={addVector}>
					<Icon icon="material-symbols:add" class="mr-1 h-4 w-4" />
					Add vector
				</Button>
				<div class="grow"></div>
				<Button
					variant="ghost"
					onclick={openSequenceFile}
					title="Replace the sequence with one read from a CSV file"
				>
					<Icon
						icon="material-symbols:folder-open-outline"
						class="mr-1 h-4 w-4"
					/>
					Open…
				</Button>
				<Button
					variant="ghost"
					onclick={saveSequenceFile}
					disabled={workingSequence.length === 0}
					title="Save the sequence to a CSV file"
				>
					<Icon
						icon="material-symbols:save-outline"
						class="mr-1 h-4 w-4"
					/>
					Save…
				</Button>
			</div>

			{#if workingSequence.length === 0}
				<p class="text-sm text-destructive">
					Add at least one vector, or turn off the custom sequence.
				</p>
			{/if}
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={() => (isOpen = false)}>
			Cancel
		</Button>
		<Button onclick={handleApply}>Ok</Button>
	{/snippet}
</BaseModal>
