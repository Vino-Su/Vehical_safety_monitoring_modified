import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const file = "04-交付文档/outputs/20260817_role_page_permission_matrix/智能网联汽车安全监测平台_角色与页面权限矩阵.xlsx";
const outDir = "04-交付文档/outputs/20260817_role_page_permission_matrix/verification";
const input = await FileBlob.load(file);
const workbook = await SpreadsheetFile.importXlsx(input);

const roles = await workbook.inspect({ kind: "table", range: "角色定义!A1:G17", include: "values,formulas", tableMaxRows: 18, tableMaxCols: 7, maxChars: 8000 });
const matrix = await workbook.inspect({ kind: "table", range: "页面权限矩阵!A1:O14", include: "values,formulas", tableMaxRows: 14, tableMaxCols: 15, maxChars: 12000 });
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan", maxChars: 3000 });
console.log("ROLES\n" + roles.ndjson);
console.log("MATRIX\n" + matrix.ndjson);
console.log("ERRORS\n" + errors.ndjson);

await fs.mkdir(outDir, { recursive: true });
for (const [sheetName, range, name] of [["角色定义", "A1:G17", "roles"], ["页面权限矩阵", "A1:O24", "matrix"], ["依据与差异", "A1:F16", "gaps"]]) {
  const image = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  const bytes = new Uint8Array(await image.arrayBuffer());
  console.log(`${name}: ${bytes.length} bytes`);
  await fs.writeFile(`${outDir}/${name}.png`, bytes);
}
