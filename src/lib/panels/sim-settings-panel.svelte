<script lang="ts">
    import type { SimulationModel } from "$lib/SimulationModel";
    import Icon from "@iconify/svelte";
    import { TreeViewItem, getModalStore, type ModalSettings } from "@skeletonlabs/skeleton";
    
    const modalStore = getModalStore();

    function openModelOptions(){
        if (!selected_model_id)
            console.error('invalid simulation model id!');

        if (!simulation_models.has(selected_model_id!))
            console.error('invalid simulation model!');

        let model = simulation_models.get(selected_model_id!)!;

        return new Promise((resolve) => {
            const modal: ModalSettings = {
                type: 'component',
                component: 'simModelOptions',
                title: `${model.name} settings`,
                meta: {model: model},
                response: (r:any) => resolve(r),
            };
            modalStore.trigger(modal);
            })
        .then((res: any) => {
            if (res)
                model.settings = res;
        });
    }

    export let selected_model_id: string | undefined;
    export let simulation_models: Map<string, SimulationModel>;
</script>

<TreeViewItem>
    Simulation settings
    <svelte:fragment slot="lead"><Icon icon="material-symbols:science"/></svelte:fragment>
    <svelte:fragment slot="children">
        <form>
            <label class="label">
                <span>Model</span>
                <div class="flex">
                    <select bind:value={selected_model_id} class="select">
                        {#each simulation_models.values() as model}
                            <option value={model.id}>{model.name}</option>
                        {/each}
                    </select>
                    <button type="button" class="btn-icon variant-filled ml-2" disabled={!selected_model_id} on:click={openModelOptions}>
                        <Icon icon="material-symbols:settings" />
                    </button>
                </div>
            </label>
        </form>
    </svelte:fragment>
</TreeViewItem>