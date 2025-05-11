// @ts-ignore
import * as XLSX from "xlsx/xlsx.mjs";

/* load the codepage support library for extended support with older formats  */
// @ts-ignore
import * as cpexcel from "xlsx/dist/cpexcel.full.mjs";
XLSX.set_cptable(cpexcel);

export const exportToExcel = (
  fileName: string,
  sheetName: string,
  data: any[],
) => {
  const jsonData = XLSX.utils.json_to_sheet(data);
  const wb = {
    SheetNames: [sheetName],
    Sheets: {
      [sheetName]: jsonData,
    },
  };
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};
