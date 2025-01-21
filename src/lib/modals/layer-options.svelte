<script lang="ts">
    import { type CellArchitecture, createCellArchitecture } from '$lib/CellArchitecture';
    import Icon from '@iconify/svelte';
	import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';

	const modalStore = getModalStore();
	export let parent: any;

	const DEFAULT_CELL_ARCHS : [string, CellArchitecture][] = [
		['Two state', createCellArchitecture(20, 5, 4, 6.36)],
		['Tri state 60', createCellArchitecture(60, 10, 8, 60*Math.sqrt(2)/2)],
		['Tri state 72', createCellArchitecture(72, 10, 8, (72*2/3)/(2*Math.sin(Math.PI/8)))],
		['Tri state 110', createCellArchitecture(110, 10, 8, 110/(2*Math.sin(Math.PI/8)))]
	];

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
			data_obj[key] = DEFAULT_CELL_ARCHS[parseInt(value)][1];
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
					<select id='cell_architecture' name='cell_architecture'>
						{#each DEFAULT_CELL_ARCHS as arcOption, i}
						<option value={i}>{arcOption[0]}</option>
						{/each}
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