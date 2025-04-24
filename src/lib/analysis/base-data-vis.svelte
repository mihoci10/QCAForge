<script lang="ts">
    import { Label } from "$lib/components/ui/label";
	import type { Snippet } from "svelte";
 
	type Props = {
		title: string;
        children: Snippet | undefined;
	};
 
	let {
		title,
        children
	}: Props = $props();
</script>

<div class='h-full flex flex-col items-center'>
    <Label class="text-lg font-semibold">{title}</Label>
    {@render children?.()}
</div>
