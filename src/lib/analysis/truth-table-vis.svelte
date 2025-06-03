<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import { getInputLabel, InputType, SignalType, type Input, type QCASimulation, type SignalIndex } from "$lib/qca-simulation";
    import BaseDataVis from "./base-data-vis.svelte";
    import { default as InputUI } from "$lib/components/ui/input/input.svelte";
    import * as Table from "$lib/components/ui/table/index.js"; 
    import type { TruthTableProps } from "./panels/truth-table-visual-props-panel.svelte";
    import type { ChangeEvent } from "sveltekit-superforms";
    
    type Props = {
        qcaSimulation: QCASimulation | undefined;
		title: string;
		inputs: Input[];
        props: TruthTableProps,
	};
 
	let {
        qcaSimulation,
		title,
		inputs,
        props,
	}: Props = $props();

    type ClockRegion = {
        start: number;
        end: number;    
    };    

    let clockRegions: ClockRegion[][];
    let logicalData: (number | undefined)[][];
    let calculatedLogicalData: (number | undefined)[][] = $state([]);

    onMount(() => {
    });

    onDestroy(() => {
    });

    function getNeededInputs(): Input[]{
        if (!qcaSimulation) {
            throw new Error("QCASimulation is not defined");
        }

        return qcaSimulation.getInputs(InputType.SIGNAL).filter((input) => {
            if (input.type === InputType.SIGNAL) {
                return input.index.type === SignalType.CLOCK;
            }
            return false;
        });
    }

    function beforeLoadData() {
        clockRegions = [];
        logicalData = [];
        calculatedLogicalData = [];
    }

    function loadClockData(input: Input, data: Float64Array[]) {
        if (!qcaSimulation) {
            throw new Error("QCASimulation is not defined");
        }

        const signalIndex = input.index as SignalIndex;
        if (signalIndex.type !== SignalType.CLOCK) {
            throw new Error("Input is not a clock signal");
        }

        const clockData = data[0];
        const clockHigh = Math.max(...clockData);
        const clockLow = Math.min(...clockData);
        const clockHighThreshold = clockHigh - (clockHigh - clockLow) * props.clockTreshold;

        const currentClockRegions: ClockRegion[] = [];
        let currentRegion: ClockRegion | null = null;
        for (let i = 0; i < clockData.length; i++) {
            if (clockData[i] > clockHighThreshold) {
                if (!currentRegion) {
                    currentRegion = { start: i, end: i };
                } else {
                    currentRegion.end = i;
                }
            } else if (currentRegion) {
                currentClockRegions.push(currentRegion);
                currentRegion = null;
            }
        }
        if (currentRegion) 
            currentClockRegions.push(currentRegion);
        
        clockRegions[signalIndex.index] = currentClockRegions;
    }

    function generateBinaryLogicalData(input: Input, data: Float64Array): (number | undefined)[] {
        const polarHighThreshold = 1 - (2 * props.logicalThreshold);
        const polarLowThreshold = -1 + (2 * props.logicalThreshold);

        const logicalData = new Array(data.length).fill(undefined);
        for (let i = 0; i < data.length; i++) {
            if (data[i] > polarHighThreshold) {
                logicalData[i] = 1;
            } else if (data[i] < polarLowThreshold) {
                logicalData[i] = 0;
            }
        }

        return logicalData;
    }

    function generateTernaryLogicalData(input: Input, data1: Float64Array, data2: Float64Array): (number | undefined)[] {
        const polarHighThreshold = 1 - (2 * props.logicalThreshold);
        const polarLowThreshold = -1 + (2 * props.logicalThreshold);

        const logicalData = new Array(data1.length).fill(undefined);
        for (let i = 0; i < data1.length; i++) {
            if (data1[i] > polarHighThreshold || data1[i] < polarLowThreshold) {
                logicalData[i] = 0.5;
            } else if (data2[i] > polarHighThreshold) {
                logicalData[i] = 1;
            } else if (data2[i] < polarLowThreshold) {
                logicalData[i] = 0;
            }
        }

        return logicalData;
    }

    function loadCellData(input: Input, data: Float64Array[]) {
        switch (data.length){
            case 1:
                logicalData.push(generateBinaryLogicalData(input, data[0]));
                break;
            case 2:
                logicalData.push(generateTernaryLogicalData(input, data[0], data[1]));
                break;
        }
    }

    function loadInputData(input: Input, data: Float64Array[]) {
        switch (input.type) {
            case InputType.SIGNAL:
                loadClockData(input, data);
                break;
            case InputType.CELL:
                loadCellData(input, data);
                break;
        }
    }

    function afterLoadData() {
        calculate();
    }

    function cleanUpClockRegions() {
        for (let i = clockRegions.length - 1; i >= 0; i--) {
            const currentRegion = clockRegions[i];
            for (let j = i - 1; j >= 0; j--){
                const otherRegion = clockRegions[j];
                if (currentRegion[0].start < otherRegion[0].start)
                    clockRegions[i] = currentRegion.slice(1);
            }
        }
    }

    function calculate(){
        cleanUpClockRegions();
        calculatedLogicalData = new Array(inputs.length).fill(
            new Array(Math.max(...clockRegions.map((regions) => regions.length)))
                .fill(undefined)
        );
        for (let i = 0; i < inputs.length; i++) {
            const inputPhaseShift = props.inputPhaseShift.get(inputs[i].index.toString()) || 0;
            const clockInd = Math.floor((inputPhaseShift % 360) / 90);
            const skipRegions = Math.floor(inputPhaseShift / 360);
            calculatedLogicalData[i] = new Array(skipRegions).fill(undefined).concat(
                clockRegions[clockInd].slice(skipRegions).map((region) => {
                    const values = logicalData[i].slice(region.start, region.end + 1);
                    const counts = new Map<number | undefined, number>();
                    for (const value of values) {
                        counts.set(value, (counts.get(value) || 0) + 1);
                    }
                    let mostCommonValue: number | undefined = undefined;
                    let mostCommonCount = 0;
                    for (const [value, count] of counts.entries()) {
                        if (count > mostCommonCount) {
                            mostCommonValue = value;
                            mostCommonCount = count;
                        }
                    }
                    return mostCommonValue;
                })
            );
        }
    }

    function getDisplayData() {
        if (calculatedLogicalData.length === 0) return [];
        
        const maxLength = Math.max(...calculatedLogicalData.map(subArray => subArray.length));
        const result = Array(maxLength).fill(undefined).map(() => Array(calculatedLogicalData.length).fill(undefined));
        
        for (let i = 0; i < calculatedLogicalData.length; i++) {
            for (let j = 0; j < calculatedLogicalData[i].length; j++) {
            result[j][i] = calculatedLogicalData[i][j];
            }
        }
        
        return result;
    }

    function onCellPhaseChanged(event: Event) {
        if (!event.target) return;
        const inputIndex = (event.target as HTMLInputElement).id.split("-").slice(1).join("-");
        const inputPhaseShift = parseFloat((event.target as HTMLInputElement).value);
        console.log(`Phase shift for input ${inputIndex} changed to ${inputPhaseShift}`);
        props.inputPhaseShift.set(inputIndex, inputPhaseShift);
        calculate();
    }

</script>

<BaseDataVis {qcaSimulation} {title} {inputs} {beforeLoadData} {loadInputData} {afterLoadData} {getNeededInputs}>
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
                                    <label for="phase-{input.index.toString()}" class="text-xs text-gray-600">
                                        Phase:
                                    </label>
                                    <InputUI
                                        id="phase-{input.index.toString()}"
                                        type="number"
                                        min="0"
                                        step="90"
                                        class="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                        value={props.inputPhaseShift.get(input.index.toString()) || 0}
                                        onchange={onCellPhaseChanged}
                                    />
                                    <span class="text-xs text-gray-500">°</span>
                                </div>
                            </div>
                        </Table.Head>
                    {/each}
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#each getDisplayData() as row, rowIndex}
                    <Table.Row>
                        {#if props.showRowNumbers}
                            <Table.Cell>{rowIndex}</Table.Cell>
                        {/if}
                        {#each row as cell, i}
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