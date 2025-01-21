<script lang="ts">

	interface Props {
		parent: any;
	}

	let { parent }: Props = $props();

	function formSubmit(e: SubmitEvent){
		const form_data = new FormData(e.target as HTMLFormElement);
		let data_obj = {};

		for (var [key, value] of form_data.entries()) { 
			data_obj[key] = parseFloat(value);
		}

		if ($modalStore[0].response) {
			$modalStore[0].response(data_obj);
			modalStore.close();
		}
	}
</script>

{#if $modalStore[0]}
    <div class="card p-4 w-modal shadow-xl space-y-4">
        <header class="text-2xl font-bold">{$modalStore[0].title}</header>
		
		<form class="modal-form" onsubmit={formSubmit}>
		
		<button class="input" type="submit">Ok</button>
		</form>
	</div>
{/if}