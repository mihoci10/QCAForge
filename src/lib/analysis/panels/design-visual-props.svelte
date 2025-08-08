<script lang="ts">
	export interface AnalysisDesignProps {
		selectedLayer: number | undefined;
	}

	interface Props {
		props: AnalysisDesignProps;
	}

	let { props = $bindable() }: Props = $props();
</script>

<div class="flex flex-col gap-4"></div>
