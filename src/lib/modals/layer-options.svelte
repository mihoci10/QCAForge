<script lang="ts">
    import Icon from '@iconify/svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
	export let parent: any;

    function openArchitectureOptions(){

		return new Promise((resolve) => {
			const modal: ModalSettings = {
				type: 'component',
				component: 'cellArchitectureOptions',
				title: `Cell arhitecture settings`,
				meta: {},
				response: (r:any) => resolve(r),
			};
			modalStore.trigger(modal);
			})
		.then((res: any) => {
			console.log(res);
		});
	}

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
		<form class="modal-form" on:submit|preventDefault={formSubmit}>
			<label class="label">
				<span>Cell architecture</span>
				
				<div class="input-group input-group-divider grid-cols-[1fr_auto]">
					<select id='cellArchitecture'>
						<option>Arch 1</option>
						<option>Arch 2</option>
						<option>Arch 3</option>
					</select>
					<button type="button" class="btn-icon w-full" on:click={(e) => openArchitectureOptions()}>
                        <Icon width={16} icon="material-symbols:settings"/>
                    </button>
				</div>
			</label>
			<hr>
			<button class="input" type="submit">Ok</button>
		</form>
	</div>
{/if}	