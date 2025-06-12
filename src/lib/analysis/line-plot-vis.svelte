<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import * as d3 from "d3";
	import type { Input, QCASimulation } from "$lib/qca-simulation";
	import { getInputLabel } from "$lib/qca-simulation";
	import BaseDataVis from "./base-data-vis.svelte";
	import { COLORS } from "$lib/utils/visual-colors";
	import type { LinePlotProps } from "./panels/line-plot-visual-props-panel.svelte";
	import Label from "$lib/components/ui/label/label.svelte";

	type Props = {
		qcaSimulation: QCASimulation | undefined;
		title: string;
		inputs: Input[];
		props: LinePlotProps;
	};

	let { qcaSimulation, title, inputs, props }: Props = $props();

	let svgElement: SVGSVGElement;
	let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
	let clipRect: d3.Selection<SVGRectElement, unknown, null, undefined>;
	let interactionRect: d3.Selection<SVGRectElement, unknown, null, undefined>;

	let xAxisElement: d3.Selection<SVGGElement, unknown, null, undefined>;
	let yAxisElement: d3.Selection<SVGGElement, unknown, null, undefined>;
	let xGridElement: d3.Selection<SVGGElement, unknown, null, undefined>;
	let yGridElement: d3.Selection<SVGGElement, unknown, null, undefined>;

	interface SignalSVG {
		line: d3.Selection<SVGPathElement, unknown, null, undefined>;
		dots: d3.Selection<SVGGElement, unknown, null, undefined>;
	}

	let signalSvgs: SignalSVG[] = [];
	let lineGenerator: d3.Line<[number, number]>;

	const CROSS_SIZE = 10;
	let tooltipMarker: [
		d3.Selection<SVGLineElement, unknown, null, undefined>,
		d3.Selection<SVGLineElement, unknown, null, undefined>,
	];

	const margin = { top: 20, right: 30, bottom: 40, left: 40 };
	let width = $state(0);
	let height = $state(0);

	let xAxis: d3.ScaleLinear<number, number>;
	let yAxis: d3.ScaleLinear<number, number>;

	let resizeObserver: ResizeObserver;

	let drawData: [number, number][][];
	let filteredDrawData: [number, number][][];
	let display_range: [number, number] | undefined = $state();

	onMount(() => {
		svg = d3
			.select(svgElement)
			.append("g")
			.attr("transform", `translate(${margin.left},${margin.top})`);

		// fix for wheel event not firing on svg
		d3.select(document.body).on("wheel.body", (e) => {});

		clipRect = svg
			.append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);

		interactionRect = svg
			.append("rect")
			.on("mousemove", onMouseMove)
			.on("wheel", onWheel)
			.on("mouseleave", onMouseLeave);

		signalSvgs = [];

		tooltipMarker = [
			svg.append("line").attr("class", "tooltip-marker"),
			svg.append("line").attr("class", "tooltip-marker"),
		];

		xAxis = d3.scaleLinear();
		yAxis = d3.scaleLinear();

		xAxisElement = svg
			.append("g")
			.attr("transform", `translate(0,${height})`);
		yAxisElement = svg.append("g");
		xGridElement = svg.append("g").attr("class", "grid-lines");
		yGridElement = svg.append("g").attr("class", "grid-lines");

		lineGenerator = d3
			.line()
			.x((d: [number, number]) => xAxis(d[0]))
			.y((d: [number, number]) => yAxis(d[1]));

		resizeObserver = new ResizeObserver(() => {
			windowResize();
		});
		resizeObserver.observe(svgElement);

		drawData = [];
		filteredDrawData = [];
	});

	onDestroy(() => {
		resizeObserver.disconnect();
	});

	function beforeLoadData() {
		drawData = [];
		filteredDrawData = [];
	}

	function loadInputData(input: Input, data: Float64Array[]) {
		data.forEach((signal, _) => {
			const signalData: [number, number][] = [];
			for (let i = 0; i < signal.length; i++) {
				signalData.push([i + 1, signal[i]]);
			}
			drawData.push(signalData);
		});
	}

	function afterLoadData() {
		filterData();
	}

	function windowResize() {
		width = Math.max(
			0,
			svgElement.clientWidth - margin.left - margin.right,
		);
		height = Math.max(
			0,
			svgElement.clientHeight - margin.top - margin.bottom,
		);

		clipRect.attr("width", width).attr("height", height);
		interactionRect.attr("width", width).attr("height", height);

		xAxis.range([0, width]);
		yAxis.range([height, 0]);

		draw();
	}

	function calculateAxesExtent() {
		let xExtents: [number, number][] = [];
		let yExtents: [number, number][] = [];
		filteredDrawData.forEach((data, i) => {
			xExtents.push(d3.extent(data, (d) => d[0]) as [number, number]);
			yExtents.push(d3.extent(data, (d) => d[1]) as [number, number]);
		});
		const xDomain = [
			d3.min(xExtents, (d) => d[0]),
			d3.max(xExtents, (d) => d[1]),
		];
		const yDomain = [
			d3.min(yExtents, (d) => d[0]),
			d3.max(yExtents, (d) => d[1]),
		];

		xAxis.domain(xDomain as [number, number]);
		yAxis.domain(yDomain as [number, number]);
	}
	function drawAxes() {
		xAxisElement
			.attr("transform", `translate(0,${height})`)
			.call(d3.axisBottom(xAxis).ticks(props.numTicksX));

		yAxisElement.call(d3.axisLeft(yAxis).ticks(props.numTicksY));

		xGridElement
			.selectAll("line")
			.data(xAxis.ticks(props.numTicksX))
			.join("line")
			.attr("x1", (d: number) => xAxis(d))
			.attr("x2", (d: number) => xAxis(d))
			.attr("y1", 0)
			.attr("y2", height);

		yGridElement
			.selectAll("line")
			.data(yAxis.ticks(props.numTicksY))
			.join("line")
			.attr("x1", 0)
			.attr("x2", width)
			.attr("y1", (d: number) => yAxis(d))
			.attr("y2", (d: number) => yAxis(d));
	}

	function draw() {
		drawAxes();

		while (signalSvgs.length > filteredDrawData.length) {
			let signalSvg = signalSvgs.pop();
			if (signalSvg) {
				signalSvg.line.remove();
				signalSvg.dots.remove();
			}
		}
		while (signalSvgs.length < filteredDrawData.length) {
			signalSvgs.push({
				line: svg.append("path").attr("clip-path", "url(#clip)"),
				dots: svg.append("g"),
			});
		}
		filteredDrawData.forEach((data, i) => {
			signalSvgs[i].line
				.attr("clip-path", "url(#clip)")
				.attr("d", lineGenerator(data))
				.attr("fill", "none")
				.attr("stroke", COLORS[i])
				.attr("stroke-width", props.lineWidth);

			if (data.length <= width / 10 && props.showDots) {
				signalSvgs[i].dots
					.selectAll("circle")
					.data(data)
					.join("circle")
					.attr("cx", (d: [number, number]) => xAxis(d[0]))
					.attr("cy", (d: [number, number]) => yAxis(d[1]))
					.attr("r", props.lineWidth + 1.5)
					.attr("fill", COLORS[i])
					.attr("clip-path", "url(#clip)");
			} else {
				signalSvgs[i].dots.selectAll("circle").remove();
			}
		});

		tooltipMarker.forEach((marker) => {
			marker.raise();
		});
	}

	function onMouseMove(event: MouseEvent) {
		const [x, y] = d3.pointer(event, interactionRect.node());

		let minDistance = Infinity;
		let nearestPoint: [number, number] | undefined = undefined;
		let nearestLine = undefined;

		filteredDrawData.forEach((data, i) => {
			data.forEach((point) => {
				const pointX = xAxis(point[0]);
				const pointY = yAxis(point[1]);
				const distance = Math.sqrt(
					Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2),
				);
				if (distance < minDistance) {
					minDistance = distance;
					nearestPoint = point;
					nearestLine = i;
				}
			});
		});

		if (nearestPoint === undefined || nearestLine === undefined) return;

		const xValue = nearestPoint[0];
		const yValue = nearestPoint[1];

		const xPos = xAxis(xValue);
		const yPos = yAxis(yValue);

		tooltipMarker[0]
			.attr("x1", xPos - CROSS_SIZE)
			.attr("x2", xPos + CROSS_SIZE)
			.attr("y1", yPos)
			.attr("y2", yPos)
			.style("opacity", 0.7);
		tooltipMarker[1]
			.attr("x1", xPos)
			.attr("x2", xPos)
			.attr("y1", yPos - CROSS_SIZE)
			.attr("y2", yPos + CROSS_SIZE)
			.style("opacity", 0.7);
	}

	$effect(() => {
		filterData();
	});

	// Add legend positioning logic
	let legendClasses = $derived.by(() => {
		const baseClasses =
			"absolute p-2 bg-background/80 backdrop-blur-sm rounded border";
	});

	function filterData() {
		if (display_range === undefined) {
			filteredDrawData = drawData;
		} else {
			const [min, max] = display_range;
			filteredDrawData = drawData.map((data) => {
				return data.filter((point) => {
					return point[0] >= min && point[0] <= max;
				});
			});
		}

		calculateAxesExtent();
		draw();
	}

	function onWheel(event: WheelEvent) {
		event.preventDefault();
		const [x, y] = d3.pointer(event, interactionRect.node());
		const width = svgElement.clientWidth - margin.left - margin.right;

		const delta = event.deltaY > 0 ? -1 : 1;

		const currentRange = xAxis.domain() as [number, number];
		const rangeExtent = currentRange[1] - currentRange[0];

		const xRatio = x / width;
		const newDisplayRange = [
			Math.floor(currentRange[0] + delta * rangeExtent * 0.1 * xRatio),
			Math.ceil(
				currentRange[1] - delta * rangeExtent * 0.1 * (1 - xRatio),
			),
		] as [number, number];

		display_range = newDisplayRange;
	}

	function onMouseLeave() {
		tooltipMarker.forEach((marker) => {
			marker.style("opacity", 0);
		});
	}

	function getLegendPosition(legendPosition: string) {
		if (legendPosition === "best") return getLegendPosition("upper right");

		const LEGEND_PADDING = 10;
		let positionStyle = "";

		if (legendPosition.includes("upper")) {
			positionStyle += `top: ${margin.top + LEGEND_PADDING}px; `;
		} else if (legendPosition.includes("lower")) {
			positionStyle += `bottom: ${margin.bottom + LEGEND_PADDING}px; `;
		} else if (legendPosition.includes("center")) {
			positionStyle += `top: 50%; transform: translateY(-50%); `;
		}

		if (legendPosition.includes("left")) {
			positionStyle += `left: ${margin.left + LEGEND_PADDING}px; `;
		} else if (legendPosition.includes("right")) {
			positionStyle += `right: ${margin.right + LEGEND_PADDING}px; `;
		} else if (legendPosition.includes("center")) {
			positionStyle += `left: 50%; `;
		}

		return positionStyle.trimEnd();
	}
</script>

<BaseDataVis
	{qcaSimulation}
	{title}
	{inputs}
	needDataLoad={true}
	{beforeLoadData}
	{loadInputData}
	{afterLoadData}
>
	<svg bind:this={svgElement} class="bg-background w-full h-full"> </svg>
	{#if props.showLegend}
		<div
			class={`absolute z-10 p-2 backdrop-blur-lg rounded border`}
			style={getLegendPosition(props.legendPosition)}
		>
			<div class="flex flex-col gap-2">
				{#each inputs as input, i}
					<div class="flex gap-2">
						<div
							class="w-3 h-0.5 rounded"
							style="background-color: {COLORS[i]}"
						></div>
						<Label class="text-lg"
							>{getInputLabel(qcaSimulation!, input)}</Label
						>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</BaseDataVis>

<style>
	:global(.tooltip-marker) {
		pointer-events: none;
		stroke-width: 2;
		opacity: 0;
		stroke: #ffffff;
	}
	:global(.grid-lines line) {
		stroke: gray;
		stroke-opacity: 0.5;
	}
	:global(rect) {
		pointer-events: all;
		fill-opacity: 0;
		stroke-opacity: 0;
		z-index: 1;
	}
</style>
