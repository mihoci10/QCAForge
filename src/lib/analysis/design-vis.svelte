<script lang="ts">
	import {
		InputType,
		type CellInput,
		type PanelInput,
		type QCASimulation,
	} from "$lib/qca-simulation";
	import BaseDataVis from "./base-data-vis.svelte";
	import { generateDotDistribution, type CellIndex } from "$lib/Cell";
	import DesignView, {
		type DesignViewProps,
	} from "$lib/components//design/design-view.svelte";
	import { Set } from "typescript-collections";
	import type { CellArchitecture } from "$lib/CellArchitecture";
	import { type Layer } from "$lib/Layer";
	import type { AnalysisDesignProps } from "./panels/design-visual-props.svelte";
	import { onMount } from "svelte";

	type Props = {
		qcaSimulation: QCASimulation | undefined;
		currentSample: number;
		title: string;
		props: AnalysisDesignProps;
	};

	let { qcaSimulation, currentSample, title, props }: Props = $props();

	let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
	let cell_architectures: Map<string, CellArchitecture> = $derived(
		qcaSimulation
			? qcaSimulation.design.cell_architectures
			: new Map<string, CellArchitecture>(),
	);
	let layers: Layer[] = $derived(
		qcaSimulation ? qcaSimulation.design.layers : [],
	);
	let cellsData: Map<CellIndex, Float64Array[]>;
	let designView: DesignView | undefined = $state();

	onMount(() => {});

	function beforeLoadData() {
		cellsData = new Map<CellIndex, Float64Array[]>();
	}

	function loadInputData(input: PanelInput, data: Float64Array[]) {
		if (!qcaSimulation) return;
		if (input.type !== InputType.CELL)
			throw new Error("Input type must be CELL");

		cellsData.set((input as CellInput).index, data);
	}

	function afterLoadData() {
		applyCellData();
	}

	$effect(() => {
		currentSample;
		applyCellData();
	});

	function applyCellData() {
		if (!qcaSimulation) return;

		for (const [cellIndex, data] of cellsData.entries()) {
			const cell = layers[0].cells[cellIndex.cell];
			const cell_polarization = data.map((d) => d[currentSample]);
			const cell_distribution =
				generateDotDistribution(cell_polarization);
			cell.dot_probability_distribution = cell_distribution;
		}
		if (designView) {
			designView.drawCurrentLayer();
		}
	}
</script>

<BaseDataVis
	{qcaSimulation}
	{title}
	inputs={undefined}
	needDataLoad={true}
	{beforeLoadData}
	{loadInputData}
	{afterLoadData}
>
	<DesignView
		bind:this={designView}
		{cell_architectures}
		{layers}
		selectedLayer={props.selectedLayer}
		bind:selectedCells
		properties={{
			camera_position: [0, 0, 20],
			camera_rotation: [0, 0, 0],
			camera_rotate_enabled: false,
			camera_zoom_enabled: true,
			camera_zoom_range: [1, 100],
			cell_edit_enabled: false,
			cell_snapping_enabled: true,
			cell_snapping_divider: 20,
		} as DesignViewProps}
	/>
</BaseDataVis>
