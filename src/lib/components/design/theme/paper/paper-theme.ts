import type { CellGeometryProps, CellTheme, ICellGeometry } from "../theme";
import { PaperCellGeometry } from "./paper-geometry";

export class PaperCellTheme implements CellTheme {
	id = "paper";
	title = "Paper";

	createGeometry(props: CellGeometryProps): ICellGeometry {
		return new PaperCellGeometry(props);
	}
}
