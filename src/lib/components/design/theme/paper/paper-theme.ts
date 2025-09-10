import type { CellGeometryProps, CellTheme, ICellGeometry } from "../theme";
import { PaperCellGeometry } from "./paper-geometry";

export class PaperCellTheme implements CellTheme {
	id = "default";
	title = "Default";

	createGeometry(props: CellGeometryProps): ICellGeometry {
		return new PaperCellGeometry(props);
	}
}
