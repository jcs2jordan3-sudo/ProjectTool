import * as XLSX from "xlsx";

export type RawRow = Record<string, string>;

/**
 * File → RawRow[] (헤더를 키로 사용)
 */
export async function parseFile(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", raw: false, dateNF: "yyyy-mm-dd" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<RawRow>(ws, {
    defval: "",
    raw: false,
  });
  return rows;
}
