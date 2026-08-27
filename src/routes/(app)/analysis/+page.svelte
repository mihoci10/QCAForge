<!--
	This route exists only so `/analysis` is a valid navigable URL (used by `goto("/analysis")`
	and for sidebar active-state highlighting via `page.url.pathname`).

	The actual analysis view is rendered persistently from `+layout.svelte` (as
	`$lib/analysis/analysis-page.svelte`) and merely shown/hidden based on the current route,
	so that visualization/panel state survives switching back and forth between the Design
	and Analysis views.
-->
