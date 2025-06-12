<script lang="ts">
	import {
		createCellArchitecture,
		getDotRadius,
		type CellArchitecture,
	} from "$lib/CellArchitecture";
	import Input from "$lib/components/ui/input/input.svelte";
	import { Label } from "$lib/components/ui/label";
	import BaseModal from "./base-modal.svelte";

	interface Props {
		isOpen: boolean;
		cell_architecture: CellArchitecture;
		architecture_changed_callback: (
			cell_architecture: CellArchitecture,
		) => void;
	}

	let {
		isOpen = $bindable(),
		cell_architecture,
		architecture_changed_callback,
	}: Props = $props();

	function applyCallback(data: any) {
		let name = data.cell_architecture_name;
		let dot_count = parseInt(data.cell_architecture_dot_count);
		let dot_diameter = parseFloat(data.cell_architecture_dot_diameter);
		let side_length = parseFloat(data.cell_architecture_side_length);
		let position_radius = parseFloat(
			data.cell_architecture_position_radius,
		);

		const new_architecture = createCellArchitecture(
			name,
			side_length,
			dot_diameter,
			dot_count,
			position_radius,
			cell_architecture.id,
		);
		architecture_changed_callback(new_architecture);
	}
</script>

<BaseModal bind:open={isOpen} type="confirm" {applyCallback}>
	{#snippet title()}
		Cell Architecture settings
	{/snippet}
	{#snippet description()}
		Configure parameters for the selected cell architecture.
	{/snippet}
	<div class="flex flex-col gap-2">
		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture_name">Name</Label>
			<Input
				name="cell_architecture_name"
				value={cell_architecture.name}
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture_dot_count">Number of dots</Label>
			<Input
				name="cell_architecture_dot_count"
				type="number"
				inputmode="numeric"
				min="2"
				step="1"
				value={cell_architecture.dot_count}
			/>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture_dot_diameter">Dot diameter</Label>
			<div class="flex items-center gap-2">
				<Input
					name="cell_architecture_dot_diameter"
					type="number"
					inputmode="decimal"
					min="0"
					step="1e-3"
					value={cell_architecture.dot_diameter}
				/>
				<span>nm</span>
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture_position_radius"
				>Dot position radius</Label
			>
			<div class="flex items-center gap-2">
				<Input
					name="cell_architecture_position_radius"
					type="number"
					inputmode="decimal"
					min="0"
					step="1e-3"
					value={getDotRadius(cell_architecture)}
				/>
				<span>nm</span>
			</div>
		</div>
		<div class="flex flex-col gap-1.5">
			<Label for="cell_architecture_side_length">Cell side length</Label>
			<div class="flex items-center gap-2">
				<Input
					name="cell_architecture_side_length"
					type="number"
					inputmode="decimal"
					min="0"
					step="1e-3"
					value={cell_architecture.side_length}
				/>
				<span>nm</span>
			</div>
		</div>
	</div>
</BaseModal>
