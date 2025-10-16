import { useEffect, useRef, useState } from 'react';
import { OrderWithItems } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoicePrintProps {
  order: OrderWithItems;
  onClose: () => void;
}

export default function InvoicePrint({ order, onClose }: InvoicePrintProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<'lajutuju' | 'biggor'>('lajutuju');

  // 🔧 Nonaktifkan deteksi nomor otomatis di Safari
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'format-detection';
    meta.content = 'telephone=no';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  // 🔧 Tutup modal jika tekan ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 🔧 Format helper
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const safePhone = (phone: string) => phone.replace(/(\d)(?=\d)/g, '$1\u200B');

  const handlePrint = () => window.print();

  // 🧾 Download PDF tanpa rusak di HP
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;

    const invoiceElement = invoiceRef.current;
    const originalStyles = { ...invoiceElement.style };

    const watermark = document.createElement('img');
    watermark.src = template === 'lajutuju' ? '/logo.png' : '/biggor.png';
    watermark.style.position = 'absolute';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%)';
    watermark.style.opacity = '0.08';
    watermark.style.width = '350px';
    watermark.style.zIndex = '0';
    invoiceElement.appendChild(watermark);

    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.width = '794px';
    invoiceElement.style.maxWidth = '794px';
    invoiceElement.style.padding = '40px';
    invoiceElement.style.background = '#fff';

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#fff',
      } as any);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const ratio = canvas.width / canvas.height;
      const pdfHeight = pdfWidth / ratio;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
      pdf.save(
        `${template === 'lajutuju' ? 'Invoice-LajuTuju' : 'Invoice-Biggor'}-${
          order.id.substring(0, 8).toUpperCase()
        }.pdf`
      );
    } catch (error) {
      console.error('PDF error:', error);
      alert('Gagal membuat PDF. Coba lagi.');
    } finally {
      watermark.remove();
      Object.assign(invoiceElement.style, originalStyles);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl my-8 rounded-lg shadow-2xl overflow-y-auto max-h-[95vh]">
        {/* Header Controls */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center print:hidden">
          <h2 className="text-xl font-bold text-gray-900">Preview Invoice</h2>
          <div className="flex gap-2 items-center">
            <select
              value={template}
              onChange={(e) =>
                setTemplate(e.target.value as 'lajutuju' | 'biggor')
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600"
            >
              <option value="lajutuju">Invoice Laju Tuju</option>
              <option value="biggor">Invoice Biggor</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
            >
              Cetak
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6 print:p-12 relative" ref={invoiceRef}>
          {template === 'lajutuju' ? (
            // 🟠 LAJU TUJU
            <div className="border-4 border-orange-600 rounded-lg p-6 relative z-10">
              <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-orange-600">
                <div>
                  <img src="/logo.png" alt="Laju Tuju" className="w-44 mb-2" />
                  <p className="text-sm text-gray-600">
                    Soka Asri Permai, Kadisoka, Purwomartani, Kalasan Sleman<br />
                    Telp: +62 821 3856 8822<br />
                    Email: contact@lajutuju.com<br />
                    Website: lajutuju.com
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    INVOICE
                  </h2>
                  <p className="text-sm text-gray-600">
                    <strong>No.:</strong> #{order.id.substring(0, 8).toUpperCase()}<br />
                    <strong>Tanggal:</strong> {formatDate(order.order_date)}
                  </p>
                </div>
              </div>

              {/* Informasi Pelanggan dan Periode */}
              <div className="grid grid-cols-2 gap-6 mb-6 border-b border-gray-300 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-orange-600 uppercase mb-2">
                    Informasi Pelanggan
                  </h3>
                  <p className="font-semibold text-gray-800">{order.customer_name}</p>
                  <p>{safePhone(order.customer_phone)}</p>
                  {order.customer_address && <p>{order.customer_address}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-orange-600 uppercase mb-2">
                    Periode Sewa
                  </h3>
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-sm">
                    <p><strong>Mulai:</strong> {formatDate(order.rental_start_date)}</p>
                    <p><strong>Selesai:</strong> {formatDate(order.rental_end_date)}</p>
                  </div>
                </div>
              </div>

              {/* Tabel Item */}
              <table className="w-full text-sm border-2 border-gray-300 rounded-lg overflow-hidden mb-6">
                <thead className="bg-orange-600 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Tipe Mobil</th>
                    <th className="px-3 py-2 text-center">Unit</th>
                    <th className="px-3 py-2 text-center">Hari</th>
                    <th className="px-3 py-2 text-right">Harga/Hari</th>
                    <th className="px-3 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">{item.car_type}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-center">{item.days}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.daily_rate)}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end mb-6">
                <div className="bg-orange-600 text-white p-4 rounded-lg w-full max-w-md flex justify-between items-center">
                  <span className="font-bold uppercase">Total</span>
                  <span className="text-xl font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-6">
                <p><strong>Bank:</strong> BCA</p>
                <p><strong>No. Rekening:</strong> 4561059637</p>
                <p><strong>Atas Nama:</strong> Moh Fajar Yogyaning Praharu</p>
              </div>

              <div className="text-center">
                <QRCodeCanvas value="Processed by Laju Tuju System" size={80} />
              </div>
            </div>
          ) : (
            // 🔴 BIGGOR
            <div className="border-4 border-[#d14545] rounded-lg p-6 bg-gradient-to-b from-[#fdecec] via-[#fffafa] to-[#ffffff] relative z-10">
              <div className="flex flex-col items-center text-center mb-6 pb-4 border-b-2 border-[#d14545]">
                <img
                  src="/biggor.png"
                  alt="Biggor"
                  className="w-40 h-auto mb-3 object-contain"
                />
                <h2 className="text-3xl font-bold text-[#d14545] mb-1">
                  BIGGOR TRANSPORT & TRAVEL
                </h2>
                <p className="text-gray-700 text-sm leading-tight">
                  Soka Asri Permai, Kadisoka, Purwomartani, Kalasan Sleman<br />
                  Telp: 0813 2751 0494 ·{' '}
                  <a
                    href="mailto:contact@biggor.com"
                    className="text-[#d14545] underline hover:text-red-700"
                  >
                    contact@biggor.com
                  </a>{' '}
                  ·{' '}
                  <a
                    href="https://biggortransport.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#d14545] underline hover:text-red-700"
                  >
                    biggortransport.com
                  </a>
                </p>
              </div>

              {/* Informasi Pelanggan & Periode Sewa */}
              <div className="grid grid-cols-2 gap-6 mb-6 pb-4 border-b border-[#d14545]/30">
                <div>
                  <h3 className="text-sm font-bold text-[#d14545] mb-2 uppercase tracking-wide">
                    Informasi Pelanggan
                  </h3>
                  <p className="font-semibold text-gray-800">{order.customer_name}</p>
                  <p className="text-gray-700 text-sm">{safePhone(order.customer_phone)}</p>
                  {order.customer_address && (
                    <p className="text-gray-700 text-sm">{order.customer_address}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#d14545] mb-2 uppercase tracking-wide">
                    Periode Sewa
                  </h3>
                  <div className="bg-[#fff4f4] border border-[#d14545]/30 rounded-lg p-3 space-y-1 text-sm">
                    <p>
                      <strong>Mulai:</strong> {formatDate(order.rental_start_date)}
                    </p>
                    <p>
                      <strong>Selesai:</strong> {formatDate(order.rental_end_date)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabel Item */}
              <table className="w-full border-collapse mb-4 text-sm shadow-sm">
                <thead className="bg-[#d14545] text-white">
                  <tr>
                    <th className="p-2 text-left">Tipe Mobil</th>
                    <th className="p-2 text-center">Unit</th>
                    <th className="p-2 text-center">Hari</th>
                    <th className="p-2 text-right">Harga/Hari</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.order_items.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}>
                      <td className="p-2">{item.car_type}</td>
                      <td className="p-2 text-center">{item.quantity}</td>
                      <td className="p-2 text-center">{item.days}</td>
                      <td className="p-2 text-right">{formatCurrency(item.daily_rate)}</td>
                      <td className="p-2 text-right font-semibold text-[#d14545]">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end mt-4 mb-6">
                <div className="bg-[#d14545] text-white px-4 py-3 rounded-lg shadow">
                  <p className="text-sm font-bold uppercase">Total Pembayaran</p>
                  <p className="text-lg font-bold">{formatCurrency(order.total_amount)}</p>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-[#fdecec] border border-[#d14545]/30 rounded-lg p-3 text-sm text-gray-800 space-y-1 mb-6">
                <p><strong>Payment Method:</strong> Transfer Bank Mandiri</p>
                <p><strong>No. Rekening:</strong> 1370018835948</p>
                <p><strong>Atas Nama:</strong> Fayzaya Ganang Putra</p>
              </div>

              <div className="text-center mt-4">
                <p className="text-sm text-gray-600">
                  Terima kasih telah mempercayakan perjalanan Anda kepada <strong>Biggor</strong>
                </p>
                <div className="flex justify-center mt-3">
                  <QRCodeCanvas value="Processed by Biggor System" size={80} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
