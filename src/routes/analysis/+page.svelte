<script lang="ts">
    import { convertFileSrc } from "@tauri-apps/api/core";
    import { onMount } from "svelte";

    let display = $state('')
    let url = $state('')

    onMount(() => {
        url = convertFileSrc('', 'load-sim')
        fetch(url, {
            headers: {
                'mode': 'cors',
            },
            method: 'GET'
        })
        .then(response => {
            if (response.status === 200) {
                let contents = response.body;
                let reader = contents.getReader();
                let decoder = new TextDecoder('utf-8');
                let result = '';
                reader.read().then(function processText({ done, value }) {
                    if (done) {
                        display = ('Request was successful: ' + result);
                        return;
                    }
                    result += decoder.decode(value, { stream: true });
                    return reader.read().then(processText);
                });
            } else {
                display = ('Request failed with status:' + response.status);
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