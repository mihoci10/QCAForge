<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import {
		getInputLabel,
		InputType,
		SignalType,
		type Input,
		type QCASimulation,
		type SignalIndex,
	} from "$lib/qca-simulation";
	import BaseDataVis from "./base-data-vis.svelte";
	import { default as InputUI } from "$lib/components/ui/input/input.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import type { TruthTableProps } from "./panels/truth-table-visual-props-panel.svelte";
	import type { ChangeEvent } from "sveltekit-superforms";
	import { parseCellIndex, type CellIndex } from "$lib/Cell";
	import { invoke } from "@tauri-apps/api/core";

	type Props = {
		qcaSimulation: QCASimulation | undefined;
		title: string;
		inputs: Input[];
		props: TruthTableProps;
	};

	let { qcaSimulation, title, inputs, props }: Props = $props();

	let displayData: string[][] = $state([]);

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
				const truth_table = result.entries as [string, number[]][];
				const max_len = Math.max(
					...truth_table.map((row) => row[1].length),
				);

				for (let i = 0; i < max_len; i++) {
					const row: string[] = truth_table.map(([_, values]) => {
						if (i >= values.length) return "";
						const value = values[i];
						if (value === undefined || value === null) return "NaN";
						return value.toString();
					});
					displayData.push(row);
				}
			})
			.catch((error) => {
				console.error("Error calculating truth table:", error);
			});
	}
</script>

<BaseDataVis {qcaSimulation} {title} {inputs} needDataLoad={false}>
	<div class="my-4 overflow-x-auto">
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
										class="text-xs text-gray-600"
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
