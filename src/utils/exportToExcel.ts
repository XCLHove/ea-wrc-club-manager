// @ts-ignore
import * as XLSX from 'xlsx/xlsx.mjs'

/* load the codepage support library for extended support with older formats  */
// @ts-ignore
import * as cpexcel from 'xlsx/dist/cpexcel.full.mjs'
XLSX.set_cptable(cpexcel)

export const exportToExcel = (fileName: string, sheetName: string, data: any[]) => {
  const jsonData = XLSX.utils.json_to_sheet(data)
  const wb: Parameters<typeof XLSX.writeFile>[0] = {
    SheetNames: [sheetName],
    Sheets: {
      [sheetName]: jsonData,
    },
  }
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

export type Cell = {
  value: any
  name: string
}

export type Row = Cell[]

export const exportToExcelV2 = (fileName: string, sheetName: string, data: Row[]) => {
  const worksheet = transformDataToSheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  // 导出Excel文件
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

function transformDataToSheet(data: Row[]) {
  const sheetData = []
  const headers = data?.[0].map((column) => column.name) || []
  // 添加表头
  sheetData.push(headers)
  // 添加数据行
  data.forEach((row) => {
    const rowData = row.map((column) => column.value)
    sheetData.push(rowData)
  })
  return XLSX.utils.aoa_to_sheet(sheetData)
}
