	
<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
    import type { WithoutChild, DialogRootProps } from "bits-ui";
 
	type Props = DialogRootProps & {
		title: Snippet;
		description: Snippet;
	};
 
	let {
		open = $bindable(false),
		children,
		title,
		description,
		...restProps
	}: Props = $props();
</script>
 
<Dialog.Root bind:open {...restProps}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<Dialog.Title>
				{@render title()}
			</Dialog.Title>
			<Dialog.Description>
				{@render description()}
			</Dialog.Description>
			{@render children?.()}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

