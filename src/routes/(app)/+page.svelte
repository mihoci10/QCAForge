<script lang="ts">
	import { invoke } from "@tauri-apps/api/core";
	import { onMount } from "svelte";

	onMount(() => {
		invoke("startup_frontend_ready");
	});
</script>

<div>Main page</div>
<a href="/design">Link to Designer</a>
