declare module "xlsx" {
  export function read(data: any, opts?: any): any;
  export const utils: {
    sheet_to_json: (sheet: any, opts?: any) => any[];
    json_to_sheet: (data: any[], opts?: any) => any;
    book_new: () => any;
    book_append_sheet: (wb: any, ws: any, name: string) => void;
    aoa_to_sheet: (data: any[][], opts?: any) => any;
  };
  export function writeFile(wb: any, filename: string, opts?: any): void;
  export const write: (wb: any, opts?: any) => any;
}
