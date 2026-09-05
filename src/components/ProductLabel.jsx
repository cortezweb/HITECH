import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export default function ProductLabel({ product }) {
  const barcodeRef = useRef(null);
  const qrcodeRef = useRef(null);

  useEffect(() => {
    if (barcodeRef.current && product?.id) {
      try {
        JsBarcode(barcodeRef.current, product.id, {
          format: 'CODE128',
          width: 1.5,
          height: 35,
          displayValue: true,
          fontSize: 9,
          font: 'monospace',
          textMargin: 2,
          margin: 4,
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
      }
    }
  }, [product?.id]);

  useEffect(() => {
    if (qrcodeRef.current && product?.id) {
      const qrData = JSON.stringify({
        sku: product.id,
        name: product.name,
        price: product.price
      });
      
      QRCode.toCanvas(qrcodeRef.current, qrData, {
        width: 80,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (err) => {
        if (err) console.error('Error generating QR code:', err);
      });
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="hidden print:block w-[50mm] h-[30mm] mx-auto bg-white text-black p-1.5 font-sans leading-none relative overflow-hidden select-none border border-slate-200">
      {/* Dynamic print settings just for this label */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: 50mm 30mm;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Hide scrollbars, top bars and other app elements */
          #root > *:not(.print\\:block) {
            display: none !important;
          }
        }
      `}} />

      {/* Label Header */}
      <div className="flex justify-between items-start border-b border-black pb-0.5 mb-1">
        <span className="text-[7px] font-black tracking-wide uppercase text-slate-800">SISTECH SOLUCIONES</span>
        <span className="text-[7px] font-bold text-slate-600">{product.category}</span>
      </div>

      {/* Product Information */}
      <div className="text-left space-y-0.5 mb-1 pr-[80px]">
        <h4 className="text-[9px] font-extrabold truncate text-slate-900 leading-tight" title={product.name}>
          {product.name}
        </h4>
        <div className="text-[8px] font-semibold text-slate-700">
          SKU: <span className="font-mono">{product.id}</span>
        </div>
        <div className="text-[11px] font-black text-black pt-0.5">
          ${product.price.toFixed(2)}
        </div>
      </div>

      {/* QR Code (Floated right) */}
      <div className="absolute right-1.5 top-[14px]">
        <canvas ref={qrcodeRef} className="w-[45px] h-[45px] block border border-slate-100" />
        <span className="text-[5px] block text-center mt-0.5 font-bold uppercase text-slate-500">Info QR</span>
      </div>

      {/* Barcode (Centered bottom) */}
      <div className="absolute bottom-1 left-1.5 right-1.5 flex justify-center">
        <svg ref={barcodeRef} className="max-w-full h-[28px] block" />
      </div>
    </div>
  );
}
