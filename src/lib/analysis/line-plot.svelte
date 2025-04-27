<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import * as d3 from 'd3';
    import type { QCASimulation, SignalIndex } from "$lib/qca-simulation";
    import BaseDataVis from "./base-data-vis.svelte";
    import { COLORS } from "$lib/utils/visual-colors";
    import { number } from "zod";

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
    let tooltip: HTMLDivElement;

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    let width = $state(0);
    let height = $state(0);

    let xAxis: d3.ScaleLinear<number, number>;
    let yAxis: d3.ScaleLinear<number, number>;

    let resizeObserver: ResizeObserver;

    let drawData: [number, number][][];

    onMount(() => {
        svg = d3.select(svgElement);

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
            .call(d3.axisBottom(xAxis).ticks(5));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yAxis).ticks(5));
    }

    function drawTooltip(){

    }

    function draw(){
        svg.selectAll("*").remove(); // Clear previous content

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
    }

    function mouseMoved(event: MouseEvent) {
        const [x, y] = d3.pointer(event, svgElement);

        const xAxisBisector = d3.bisector((d: [number, number]) => d[0]).center;
        const xInverted = xAxis.invert(x - margin.left);
        const yInverted = yAxis.invert(y - margin.top);

        const bisectedValue = drawData.reduce((acc, data) => {
            const xIndex = xAxisBisector(data, xInverted, 1);
            const bisectedValue = data[xIndex];
            const diff = Math.abs(bisectedValue[1] - yInverted);
            if (diff < acc[0]) {
                acc[0] = diff;
                acc[1] = bisectedValue;
            }
            return acc;
        }, [Number.MAX_VALUE, undefined] as [number, [number, number] | undefined])[1]!;

        const xValue = bisectedValue[0];
        const yValue = bisectedValue[1];

        const xPos = xAxis(xValue);
        const yPos = yAxis(yValue);

        tooltip.style.left = `${xPos + 10}px`;
        tooltip.style.top = `${yPos + 10}px`;
        tooltip.innerHTML = `X: ${xValue.toFixed(2)}, Y: ${yValue.toFixed(2)}`;
    }

</script>

<BaseDataVis {title} {shownSignals} {beforeLoadData} {loadSignalData} {afterLoadData} onmousemove={mouseMoved}>
    <div bind:this={tooltip} class='absolute bg-black'>A</div>
    <svg bind:this={svgElement}
        class='bg-background' 
        width='100%' height='100%'>
    </svg>
</BaseDataVis>