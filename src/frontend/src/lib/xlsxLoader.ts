// Load xlsx from CDN to avoid bundling it
declare global {
  interface Window {
    XLSX_LOADED?: any;
  }
}

export async function loadXlsx(): Promise<any> {
  if (window.XLSX_LOADED) return window.XLSX_LOADED;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => {
      window.XLSX_LOADED = (window as any).XLSX;
      resolve((window as any).XLSX);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
