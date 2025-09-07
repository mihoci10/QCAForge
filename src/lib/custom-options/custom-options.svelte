<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Slider } from "$lib/components/ui/slider";
	import { Switch } from "$lib/components/ui/switch";
	import type { OptionsList, OptionValuesMap } from "$lib/custom-options/custom-options";

    interface Props {
        optionList: OptionsList;
        optionValues: OptionValuesMap;
	}

	let {
		optionList,
		optionValues = $bindable(),
	}: Props = $props();

    function valueChanged(optionId: string, value: any) {
        optionValues.set(optionId, value);
        optionValues = new Map(optionValues); // Trigger reactivity
    }

</script>
{#each optionList as option}
    {#if option.type === "header"}
        <p class="text-lg font-bold">{option.label}</p>
    {:else if option.type === "break"}
        <hr />
    {:else if option.type === "input"}
        <div class="flex flex-col gap-1.5">
        {#if option.descriptor.type === "slider"}
                <Label for={option.id}>{option.name}</Label>
                <div class="flex items-center gap-2">
                    <Slider
                        type='single'
                        id={option.id}
                        value={optionValues.get(option.id) as number || option.descriptor.default}
                        min={option.descriptor.min}
                        max={option.descriptor.max}
                        step={option.descriptor.step}
                        onValueChange={(val) => valueChanged(option.id, val)}
                        class="flex-1"/>
                    <span class="min-w-16 text-right">
                        {(optionValues.get(option.id) as number || option.descriptor.default).toFixed(1)}
                        {#if option.descriptor.unit}
                            {option.descriptor.unit}
                        {/if}
                    </span>
                </div>
        {:else if option.descriptor.type === "boolean"}
                <Label for={option.id}>{option.name}</Label>
                <Switch
                    id={option.id}
                    checked={optionValues.get(option.id) as boolean || option.descriptor.default}
                    onCheckedChange={(val) => valueChanged(option.id, val)}
                />
        {/if}
        </div>
    {/if}
{/each}