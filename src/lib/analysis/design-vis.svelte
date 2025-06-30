<script lang="ts">
	import {
		type Input,
		type QCASimulation,
	} from "$lib/qca-simulation";
	import BaseDataVis from "./base-data-vis.svelte";
	import { type CellIndex } from "$lib/Cell";
	import DesignView, { type DesignViewProps } from "$lib/components/design-view.svelte";
	import { Set } from "typescript-collections";
	import type { CellArchitecture } from "$lib/CellArchitecture";
	import { type Layer } from "$lib/Layer";
	import type { AnalysisDesignProps } from "./panels/design-visual-props.svelte";

	type Props = {
		qcaSimulation: QCASimulation | undefined;
		currentSample: number;
		title: string;
		props: AnalysisDesignProps;
	};

	let { qcaSimulation, currentSample, title, props }: Props =
		$props();

    let selectedCells: Set<CellIndex> = $state(new Set<CellIndex>());
    let cell_architectures: Map<string, CellArchitecture> = $derived(
        qcaSimulation
            ? qcaSimulation.design.cell_architectures
            : new Map<string, CellArchitecture>(),
    );
    let layers: Layer[] = $derived(
        qcaSimulation ? qcaSimulation.design.layers : [],
    );
    let analysisDesignProps: DesignViewProps = $derived(
        {
            camera_position: [0, 0, 20],
            camera_rotation: [0, 0, 0],
            camera_rotate_enabled: false,
            camera_zoom_enabled: true,
            camera_zoom_range: [1, 100],
            cell_edit_enabled: false,
            cell_snapping_enabled: true,
        } as DesignViewProps,
    );

    function beforeLoadData() {
        selectedCells.clear();
    }

    function loadInputData(input: Input, data: Float64Array[]) {
        if (!qcaSimulation) return;

        
    }

    function afterLoadData() {
    }
	
</script>

<BaseDataVis {qcaSimulation} {title} inputs={undefined}
	needDataLoad={true}
	{beforeLoadData}
	{loadInputData}
	{afterLoadData}>
	<DesignView
        {cell_architectures}
        {layers}
        selectedLayer={props.selectedLayer}
        bind:selectedCells
        properties={analysisDesignProps}
    />
</BaseDataVis>
