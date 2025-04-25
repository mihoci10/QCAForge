<script lang="ts">
    import LinePlot from "$lib/analysis/line-plot.svelte";
    import { SignalType } from "$lib/qca-simulation";

</script>

<div class="w-full flex flex-col">
    <LinePlot title='Line Plot' shownSignals={[{type: SignalType.CELL, index: 1, subindex: 0},{type: SignalType.CELL, index: 1, subindex: 1}]} />
</div>