import type { CellGeometryProps, CellTheme, ICellGeometry } from "../theme";
import { LegacyCellGeometry } from "./legacy-geometry";

export class LegacyCellTheme implements CellTheme {
	id = "legacy";
	title = "Legacy";

	createGeometry(props: CellGeometryProps): ICellGeometry {
		return new LegacyCellGeometry(props);
	}
}
