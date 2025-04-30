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
    let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
    let clipRect: d3.Selection<SVGRectElement, unknown, null, undefined>;
    let interactionRect: d3.Selection<SVGRectElement, unknown, null, undefined>;

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
    let filteredDrawData: [number, number][][];

    onMount(() => {
        svg = d3.select(svgElement)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // fix for wheel event not firing on svg
        d3.select(document.body)
            .on('wheel.body', e => {});

        clipRect = svg.append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        interactionRect = svg.append("rect")
            .on("mousemove", onMouseMove)
            .on("wheel", onWheel);

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
        filteredDrawData = [];
    }

    function loadSignalData(signal: SignalIndex, data: Float64Array) {
        const signalData: [number, number][] = [];
        for (let i = 0; i < data.length; i++) {
            signalData.push([i+1, data[i]]);
        }
        drawData.push(signalData);
        filteredDrawData.push(signalData);
    }

    function afterLoadData() {
        calculateAxesExtent();
        draw();
    }

    function windowResize() {
        width = svgElement.clientWidth - margin.left - margin.right;
        height = svgElement.clientHeight - margin.top - margin.bottom;

        clipRect
            .attr("width", width)
            .attr("height", height);
        interactionRect
            .attr("width", width)
            .attr("height", height);

        xAxis.range([0, width]);
        yAxis.range([height, 0]);

        draw();
    }

    function calculateAxesExtent(transitionDuration = 0) {
        let xExtents: [number, number][] = [];
        let yExtents: [number, number][] = [];
        filteredDrawData.forEach((data, i) => {
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
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xAxis).ticks(5))

        svg.append("g")
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
                .attr('clip-path', 'url(#clip)')
                .attr("d", line(data))
                .attr("fill", "none")
                .attr("stroke", COLORS[i])
                .attr("stroke-width", 1.5);
        });

        tooltipMarker.forEach((marker) => {
            marker.raise()
        });
    }

    function onMouseMove(event: MouseEvent) {
        const [x, y] = d3.pointer(event, interactionRect.node());

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

    function onDisplayRangeChange(displayRange: [number, number]) {
        const [min, max] = displayRange;
        
        filteredDrawData = drawData.map((data) => {
            return data.filter((point) => {
                return point[0] >= min && point[0] <= max;
            });
        });

        calculateAxesExtent(300);
        //draw();
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
            Math.floor(currentRange[0] + (delta * rangeExtent * 0.1 * xRatio)),
            Math.ceil(currentRange[1] - (delta * rangeExtent * 0.1 * (1 - xRatio)))
        ] as [number, number];
        
        onDisplayRangeChange(newDisplayRange);
        draw();
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
    :global(rect) {
      pointer-events: all;
      fill-opacity: 0;
      stroke-opacity: 0;
      z-index: 1;
    }
</style>

<BaseDataVis {title} {shownSignals} {beforeLoadData} {loadSignalData} {afterLoadData}>
    <svg bind:this={svgElement}
        class='bg-background' 
        width='100%' height='100%'>
    </svg>
</BaseDataVis>