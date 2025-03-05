<script lang="ts">
    import type { SimulationModel } from "$lib/SimulationModel";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import * as Select from "$lib/components/ui/select";
    import SimModelOptions from "$lib/modals/sim-model-options.svelte";

    function openModelOptions(){
        if (!selected_model_id)
            console.error('invalid simulation model id!');

        if (!simulation_models.has(selected_model_id!))
            console.error('invalid simulation model!');

        let model = simulation_models.get(selected_model_id!)!;
        openModal = true;
        return;

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

    interface Props {
        selected_model_id: string | undefined;
        simulation_models: Map<string, SimulationModel>;
    }

    let { selected_model_id = $bindable(), simulation_models }: Props = $props();
    const selected_model_display = $derived(
        selected_model_id ? (simulation_models.get(selected_model_id)?.name) : 'Select model'
    );

    let openModal: boolean = $state(false);
    
    let selectedModel: SimulationModel | undefined = $derived(
        selected_model_id ? simulation_models.get(selected_model_id) : undefined
    );
</script>

<Accordion.Item value="simulation-settings">
    <Accordion.Trigger>
        Simulation settings
        <Icon icon="material-symbols:science"/>
    </Accordion.Trigger>
    <Accordion.Content>
        <form>
            <label class="label">
                <span>Model</span>
                <div class="flex">
                    <Select.Root type="single" bind:value={selected_model_id}>
                        <Select.Trigger>
                            {selected_model_display}
                        </Select.Trigger>
                        <Select.Content>
                            {#each simulation_models.values() as model}
                                <Select.Item value={model.id} label={model.name}/>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                    
                    <button type="button" class="btn-icon variant-filled ml-2" disabled={!selected_model_id} onclick={openModelOptions}>
                        <Icon icon="material-symbols:settings" />
                    </button>
                    <SimModelOptions bind:isOpen={openModal} model={selectedModel!} response={(data) => {console.log(data)}}/>
                </div>
            </label>
        </form>
    </Accordion.Content>
</Accordion.Item>