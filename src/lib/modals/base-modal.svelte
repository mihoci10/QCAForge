<script lang="ts">
	import { onMount, type Snippet } from "svelte";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import type { WithoutChild, DialogRootProps } from "bits-ui";
	import Button from "$lib/components/ui/button/button.svelte";
	import Label from "$lib/components/ui/label/label.svelte";

	type ModalType = "confirm" | "alert" | "blank";

	type Props = DialogRootProps & {
		title?: Snippet | undefined;
		description?: Snippet | undefined;
		footer?: Snippet | undefined;
		type: ModalType;
		applyCallback?: (data: any) => void;
		customContentClass?: string;
	};

	let {
		open = $bindable(false),
		type,
		applyCallback,
		children,
		title,
		description,
		footer,
		customContentClass,
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
		<Dialog.Content class={customContentClass ?? ""}>
			<form class="flex flex-col gap-2" onsubmit={formSubmit}>
				{#if title || description}
					<Dialog.Header>
						{#if title}
							<Dialog.Title>
								{@render title()}
							</Dialog.Title>
						{/if}
						{#if description}
							<Dialog.Description>
								{@render description()}
							</Dialog.Description>
						{/if}
					</Dialog.Header>
				{/if}
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
					{:else if type === "blank"}
						<!-- No buttons -->
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