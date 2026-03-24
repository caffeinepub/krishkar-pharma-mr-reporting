// Use bundled xlsx package for reliability
import * as XLSX from "xlsx";

export async function loadXlsx(): Promise<typeof XLSX> {
  return XLSX;
}
