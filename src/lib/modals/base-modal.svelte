<script lang="ts">
	import type { Snippet } from "svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import type { WithoutChild, DialogRootProps } from "bits-ui";
	import Button from "$lib/components/ui/button/button.svelte";
	import Label from "$lib/components/ui/label/label.svelte";

	type ModalType = "confirm" | "alert";

	type Props = DialogRootProps & {
		title: Snippet;
		description: Snippet;
		footer?: Snippet | undefined;
		type: ModalType;
		applyCallback?: (data: any) => void;
	};

	let {
		open = $bindable(false),
		type,
		applyCallback,
		children,
		title,
		description,
		footer,
		...restProps
	}: Props = $props();

	function formSubmit(event: SubmitEvent) {
		event.preventDefault();

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const formEntries = Object.fromEntries(formData);

		if (applyCallback) applyCallback(formEntries);

		open = false;
	}
</script>

<Dialog.Root bind:open {...restProps}>
	<Dialog.Portal>
		<Dialog.Overlay />
		<Dialog.Content>
			<form class="flex flex-col gap-2" onsubmit={formSubmit}>
				<Dialog.Header>
					<Dialog.Title>
						{@render title()}
					</Dialog.Title>
					<Dialog.Description>
						{@render description()}
					</Dialog.Description>
				</Dialog.Header>
				{@render children?.()}
				<Dialog.Footer>
					{#if footer}
						{@render footer()}
					{:else if type === "confirm"}
						<Button
							variant="secondary"
							onclick={() => (open = false)}
						>
							Cancel
						</Button>
						<Button type="submit">Ok</Button>
					{:else if type === "alert"}
						<Button type="submit">Ok</Button>
					{:else}
						<Label class="text-destructive"
							>Invalid modal type: {type}</Label
						>
					{/if}
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
