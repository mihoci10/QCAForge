<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import {
		getInputLabel,
		InputType,
		SignalType,
		type PanelInput,
		type QCASimulation,
		type SignalIndex,
	} from "$lib/qca-simulation";
	import BaseDataVis from "./base-data-vis.svelte";
	import { default as InputUI } from "$lib/components/ui/input/input.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import type { TruthTableProps } from "./panels/truth-table-visual-props-panel.svelte";
	import { parseCellIndex, type CellIndex } from "$lib/Cell";
	import { invoke } from "@tauri-apps/api/core";

	type Props = {
		qcaSimulation: QCASimulation | undefined;
		currentSample: number;
		title: string;
		inputs: PanelInput[];
		props: TruthTableProps;
	};

	let { qcaSimulation, currentSample, title, inputs, props }: Props =
		$props();

	let displayData: string[][] = $state([]);
	// calculate() can be triggered twice for what's semantically the same
	// input selection - e.g. a freshly-created panel's `inputs` prop gets
	// reassigned to a new (but equal) array shortly after mount as
	// Analyzer's selectedInputs/updatePanelProps round-trip settles - and
	// both invocations' async `calculate_truth_table` calls can end up in
	// flight together. Each resolution only ever appends, never replaces,
	// so an overlapping pair doubles every row instead of the second one
	// superseding the first. Track which call is the latest one and ignore
	// any result that arrives after it's been superseded.
	let calculationId = 0;

	$effect(() => {
		if (qcaSimulation) {
			calculate();
		}
	});

	function getInputCellIndecies(): CellIndex[] {
		return inputs
			.filter((input) => input.type === InputType.CELL)
			.map((input) => input.index);
	}

	function onCellClockDelayChanged(event: Event) {
		const input = event.target as HTMLInputElement;
		const input_index = input.id.split(":")[1];

		const index = parseCellIndex(input_index);
		if (!index) return;
		const value = parseFloat(input.value);
		if (isNaN(value)) return;

		props.cellClockDelay.set(index.toString(), Math.round(value));
		calculate();
	}

	function calculate() {
		if (!qcaSimulation) return;
		const thisCalculationId = ++calculationId;
		displayData = [];

		const params = {
			filename: qcaSimulation.filename,
			cells: getInputCellIndecies(),
			cellClockDelay: Object.fromEntries([
				...props.cellClockDelay.entries(),
			]),
			clockThreshold: props.clockTreshold,
			logicalThreshold: props.logicalThreshold,
			valueThreshold: props.valueThreshold,
		};

		invoke("calculate_truth_table", params)
			.then((result) => {
				if (thisCalculationId !== calculationId) return;

				const truth_table = result.entries as [string, number[]][];
				const max_len = Math.max(
					...truth_table.map((row) => row[1].length),
				);

				const rows: string[][] = [];
				for (let i = 0; i < max_len; i++) {
					const row: string[] = truth_table.map(([_, values]) => {
						if (i >= values.length) return "";
						const value = values[i];
						if (value === undefined || value === null) return "NaN";
						return value.toString();
					});
					rows.push(row);
				}
				displayData = rows;
			})
			.catch((error) => {
				console.error("Error calculating truth table:", error);
			});
	}
</script>

<BaseDataVis {qcaSimulation} {title} {inputs} needDataLoad={false}>
	<div class="my-4 flex-1 min-h-0 overflow-auto pb-10">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#if props.showRowNumbers}
						<Table.Head>#</Table.Head>
					{/if}
					{#each inputs as input}
						<Table.Head>
							<div class="flex flex-col gap-2">
								<div class="text-center font-semibold">
									{getInputLabel(qcaSimulation!, input)}
								</div>
								<div class="flex items-center gap-1">
									<label
										for="phase:{input.index.toString()}"
										class="text-xs text-muted-foreground"
									>
										Delay:
									</label>
									<InputUI
										id="phase:{input.index.toString()}"
										type="number"
										min="0"
										step="1"
										class="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
										value={props.cellClockDelay.get(
											input.index.toString(),
										) || 0}
										onchange={onCellClockDelayChanged}
									/>
								</div>
							</div>
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each displayData as row, rowIndex}
					<Table.Row>
						{#if props.showRowNumbers}
							<Table.Cell>{rowIndex}</Table.Cell>
						{/if}
						{#each row as cell}
							<Table.Cell>
								{cell}
							</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
</BaseDataVis>
