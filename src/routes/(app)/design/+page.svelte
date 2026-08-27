<!--
	This route exists only so `/design` is a valid navigable URL (used by `goto("/design")`
	and for sidebar active-state highlighting via `page.url.pathname`).

	The actual design view is rendered persistently from `+layout.svelte` (as
	`$lib/design/design-page.svelte`) and merely shown/hidden based on the current route,
	so that camera position, layer/cell selection, and panel state survive switching
	back and forth between the Design and Analysis views.
-->
