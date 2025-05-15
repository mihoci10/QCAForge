<script lang="ts">
    import type { SimulationModel } from "$lib/SimulationModel";
    import Icon from "@iconify/svelte";
    import * as Accordion from "$lib/components/ui/accordion";
    import * as Select from "$lib/components/ui/select";
    import SimModelOptions from "$lib/modals/sim-model-options.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Label } from "$lib/components/ui/label";

    function openModelOptions(){
        if (!selected_model_id)
            console.error('invalid simulation model id!');

        if (!simulation_models.has(selected_model_id!))
            console.error('invalid simulation model!');

        selectedModel = simulation_models.get(selected_model_id!)!;
        openModal = true;
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
        <div class="flex items-center gap-1.5">
            <span>Simulation settings</span>
            <Icon icon="material-symbols:science" />
        </div>
    </Accordion.Trigger>
    <Accordion.Content>
        <div class="flex flex-col gap-2 px-1">
            <div class="flex flex-col gap-1.5">
                <Label>Model</Label>
                <div class="flex gap-2">
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
            
                    <Button variant='outline' size='icon' disabled={!selected_model_id} onclick={openModelOptions}>
                        <Icon icon="material-symbols:settings" />
                    </Button>
                    <SimModelOptions bind:isOpen={openModal} model={selectedModel!}/>
                </div>
            </div>
        </div>
    </Accordion.Content>
</Accordion.Item>