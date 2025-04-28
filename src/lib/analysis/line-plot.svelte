<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import * as d3 from 'd3';
    import type { QCASimulation, SignalIndex } from "$lib/qca-simulation";
    import BaseDataVis from "./base-data-vis.svelte";
    import { COLORS } from "$lib/utils/visual-colors";

    type Props = {
		title: string;
		shownSignals: SignalIndex[];
	};
 
	let {
		title,
		shownSignals = $bindable([])
	}: Props = $props();
    
    let svgElement: SVGSVGElement;
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;

    const CROSS_SIZE = 10;
    let tooltipMarker: [
        d3.Selection<SVGLineElement, unknown, null, undefined>, 
        d3.Selection<SVGLineElement, unknown, null, undefined>];

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    let width = $state(0);
    let height = $state(0);

    let xAxis: d3.ScaleLinear<number, number>;
    let yAxis: d3.ScaleLinear<number, number>;

    let resizeObserver: ResizeObserver;

    let drawData: [number, number][][];

    onMount(() => {
        svg = d3.select(svgElement);
        tooltipMarker = [
            svg.append("line")
                .attr("class", "tooltip-marker"),
            svg.append("line")
                .attr("class", "tooltip-marker")
        ]

        xAxis = d3.scaleLinear();
        yAxis = d3.scaleLinear();        

        resizeObserver = new ResizeObserver(() => {
            windowResize();
        });
        resizeObserver.observe(svgElement);

        drawData = [];
    });

    onDestroy(() => {
        resizeObserver.disconnect();
    });

    function beforeLoadData() {
        drawData = [];
    }

    function loadSignalData(signal: SignalIndex, data: Float64Array) {
        const signalData: [number, number][] = [];
        for (let i = 0; i < data.length; i++) {
            signalData.push([i+1, data[i]]);
        }
        drawData.push(signalData);
    }

    function afterLoadData() {
        calculateAxesExtent();
        draw();
    }

    function windowResize() {
        width = svgElement.clientWidth;
        height = svgElement.clientHeight;

        xAxis.range([margin.left, width - margin.right]);
        yAxis.range([height - margin.bottom, margin.top]);

        draw();
    }

    function calculateAxesExtent() {
        let xExtents = [[0, 1]];
        let yExtents = [[0, 1]];
        drawData.forEach((data, i) => {
            xExtents.push(d3.extent(data, d => d[0]) as [number, number]);
            yExtents.push(d3.extent(data, d => d[1]) as [number, number]);
        });
        const xDomain = [d3.min(xExtents, d => d[0]), d3.max(xExtents, d => d[1])];
        const yDomain = [d3.min(yExtents, d => d[0]), d3.max(yExtents, d => d[1])];

        xAxis.domain(xDomain as [number, number]);
        yAxis.domain(yDomain as [number, number]);
    }

    function drawAxes() {
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xAxis).ticks(5))

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yAxis).ticks(5));
    }

    function drawTooltip(){

    }

    function draw(){
        svg.selectAll("g").remove();
        svg.selectAll("path").remove(); 

        drawAxes();
        
        drawData.forEach((data, i) => {
            let line = d3.line()
                .x((x: [number, number]) => xAxis(x[0]))
                .y((x: [number, number]) => yAxis(x[1]));

            svg.append("path")
                .attr("d", line(data))
                .attr("fill", "none")
                .attr("stroke", COLORS[i])
                .attr("stroke-width", 1.5);
        });

        tooltipMarker.forEach((marker) => {
            marker.raise()
        });
    }

    function mouseMoved(event: MouseEvent) {
        const [x, y] = d3.pointer(event, svgElement);

        let minDistance = Infinity;
        let nearestPoint: [number, number] | undefined = undefined;
        let nearestLine = undefined;
        
        drawData.forEach((data, i) => {
            data.forEach((point) => {
                const pointX = xAxis(point[0]);
                const pointY = yAxis(point[1]);
                const distance = Math.sqrt(Math.pow(pointX - x, 2) + Math.pow(pointY - y, 2));
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

</script>

<style>
    :global(.tooltip-marker) {
        stroke-width: 2;
        opacity: 0;
        stroke: #ffffff;
    }
    :global(.grid-lines line) {
        stroke: gray;
        stroke-opacity: 0.5;
    }
</style>

<BaseDataVis {title} {shownSignals} {beforeLoadData} {loadSignalData} {afterLoadData} onmousemove={mouseMoved}>
    <svg bind:this={svgElement}
        class='bg-background' 
        width='100%' height='100%'>
    </svg>
</BaseDataVis>