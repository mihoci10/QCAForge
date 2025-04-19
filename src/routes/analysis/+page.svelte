<script lang="ts">
    import { convertFileSrc } from "@tauri-apps/api/core";
    import { onMount } from "svelte";

    let display = $state('')
    let url = $state('')

    onMount(() => {
        url = convertFileSrc('', 'load-sim') + `?filename=file.qcs&indices=[0]`
        fetch(url, {
            method: 'GET'
        })
        .then(response => {
            if (response.status === 200) {
                const arrayBuffer = response.arrayBuffer();
                arrayBuffer.then(buffer => {
                    const floatArray = new Float64Array(buffer);
                    let result = floatArray.toString();
                    display = ('Request succeeded: ' + result);
                });
            } else {let contents = response.body;
                if (!contents) {
                    display = ('Request failed: ' + response.statusText);
                    return;
                }
                let reader = contents.getReader();
                let decoder = new TextDecoder('utf-8');
                let result = '';
                reader.read().then(function processText({ done, value }) {
                    if (done) {
                        display = ('Request failed: ' + result);
                        return;
                    }
                    result += decoder.decode(value, { stream: true });
                    return reader.read().then(processText);
                });
            }
        })
        .catch(error => {
            display = ('Error during fetch: ' + error);
        });
    });
</script>
<div>
<div>{url}</div>
<hr>
<div>{display}</div></div>