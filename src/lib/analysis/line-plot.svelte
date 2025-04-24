<script lang='ts'>
    import { onDestroy, onMount } from "svelte";
    import * as d3 from 'd3';
    import type { QCASimulation } from "$lib/qca-simulation";
    import { simulation } from "$lib/globals";
    import { number } from "zod";
    import { get } from "svelte/store";
    import BaseDataVis from "./base-data-vis.svelte";
    
    let svgElement: SVGSVGElement;
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    let width = $state(0);
    let height = $state(0);

    let xAxis: d3.ScaleLinear<number, number>;
    let yAxis: d3.ScaleLinear<number, number>;

    let resizeObserver: ResizeObserver;

    let drawData: [number, number][][];

    onMount(() => {
        svg = d3.select(svgElement)

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

    simulation.subscribe((qcaSimulation: QCASimulation) => {
        if (qcaSimulation) {
            loadData(qcaSimulation);
        }
    });

    function loadData(qcaSimulation: QCASimulation) {
        qcaSimulation.getClockData().then((clockData) => {
            clockData.forEach((clockData) => {
                const data: [number, number][] = [];
                for (let i = 0; i < clockData.length; i++) {
                    data.push([i+1, clockData[i]]);
                }
                drawData.push(data);
            });
            draw();
        });
    }

    function windowResize() {
        width = svgElement.clientWidth;
        height = svgElement.clientHeight;

        xAxis.range([margin.left, width - margin.right]);
        yAxis.range([height - margin.bottom, margin.top]);

        draw();
    }

    function drawAxes() {
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xAxis).ticks(5));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yAxis).ticks(5));
    }

    function draw(){
        svg.selectAll("*").remove(); // Clear previous content

        drawAxes();
        
        drawData.forEach(data => {
            let line = d3.line()
                .x((x: [number, number]) => xAxis(x[0]))
                .y((x: [number, number]) => yAxis(x[1]));

            const xDomain = d3.extent(data, (d) => d[0]);
            const yDomain = d3.extent(data, (d) => d[1]);

            xAxis.domain([xDomain[0]!, xDomain[1]!]);
            yAxis.domain([yDomain[0]!, yDomain[1]!]);

            svg.append("path")
                .attr("d", line(data))
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5);
        });
    }

</script>

<BaseDataVis title="Line Plot">
    <svg bind:this={svgElement} 
        class='bg-background' 
        width='100%' height='100%'>
    </svg>
</BaseDataVis>