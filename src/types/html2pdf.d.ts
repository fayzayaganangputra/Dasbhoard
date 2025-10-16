declare module 'html2pdf.js' {
  export interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: 'portrait' | 'landscape' };
  }

  const html2pdf: any;
  export default html2pdf;
}
