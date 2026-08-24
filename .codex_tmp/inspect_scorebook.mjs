import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = '评分表-酷哇备注0715.xls';
const input = await FileBlob.load(inputPath);
const wb = await SpreadsheetFile.importXlsx(input);
const summary = await wb.inspect({kind:'workbook,sheet,table', maxChars:12000, tableMaxRows:10, tableMaxCols:20, tableMaxCellChars:120});
console.log('SUMMARY\n' + summary.ndjson);
const sheets = await wb.inspect({kind:'sheet', include:'id,name', maxChars:8000});
console.log('SHEETS\n' + sheets.ndjson);
for (const sh of wb.worksheets.items) {
  const used = sh.getUsedRange();
  console.log(`USED ${sh.name}`, used ? used.address : 'none');
  if (used) {
    const region = await wb.inspect({kind:'region', sheetId:sh.name, range:used.address, maxChars:30000, tableMaxRows:80, tableMaxCols:30, tableMaxCellChars:200});
    console.log(`REGION ${sh.name}\n` + region.ndjson);
    const formulas = await wb.inspect({kind:'formula', sheetId:sh.name, range:used.address, maxChars:12000, options:{maxResults:200}});
    console.log(`FORMULAS ${sh.name}\n` + formulas.ndjson);
  }
}
