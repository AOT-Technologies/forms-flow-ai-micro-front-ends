import tableColumnPresets from "../constants/tableColumnPresets.json";

// Sizing props a DataGrid column definition understands (ReusableTable / MUI DataGrid).
export interface ColumnPresetSizing {
  flex?: number;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sticky?: boolean;
}

type ColumnPresetName = keyof typeof tableColumnPresets;

/**
 * Resolves the sizing props (flex / width / minWidth / maxWidth / resizable / sticky)
 * for a named column preset defined in `constants/tableColumnPresets.json`.
 * The JSON's `description` field documents intended usage only and is never
 * part of the returned sizing props.
 */
export const getColumnPresetSizing = (
  preset: ColumnPresetName | (string & {})
): ColumnPresetSizing => {
  const { description: _description, ...sizing } =
    (tableColumnPresets as Record<string, ColumnPresetSizing & { description?: string }>)[
      preset
    ] ?? {};
  return sizing;
};

export default getColumnPresetSizing;
