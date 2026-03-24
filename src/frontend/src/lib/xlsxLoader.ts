// Dynamically load xlsx from CDN to avoid bundling it as a hard dependency
let xlsxCache: any = null;

export async function loadXlsx(): Promise<any> {
  if (xlsxCache) return xlsxCache;

  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) {
      xlsxCache = (window as any).XLSX;
      resolve(xlsxCache);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => {
      xlsxCache = (window as any).XLSX;
      resolve(xlsxCache);
    };
    script.onerror = () => reject(new Error("Failed to load xlsx library"));
    document.head.appendChild(script);
  });
}
