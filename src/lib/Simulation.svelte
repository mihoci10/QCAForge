<script lang="ts">
	import Designer from "$lib/Designer.svelte";
    import { getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';

    const modalStore = getModalStore();

    function openModelOptions(){
        const modal: ModalSettings = {
            type: 'component',
            component: 'simModelOptions',
        };
        modalStore.trigger(modal);
    }
</script>

<div class="h-screen flex flex-col">
    <div class="flex flex-row">
        <span class="mx-2 my-auto">Simulation model</span>
        <select class="select w-48">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
            <option value="5">Option 5</option>
        </select>
        <button type="button" class="btn variant-filled" on:click={openModelOptions}>
            Options
        </button>
    </div>
    <Designer/>
</div>