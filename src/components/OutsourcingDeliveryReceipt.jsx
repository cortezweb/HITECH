import React from 'react';

export default function OutsourcingDeliveryReceipt({ deliveryData, agency, shopInfo, onClose }) {
  if (!deliveryData || !agency) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 w-full max-w-[800px] rounded-2xl shadow-2xl p-8 border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none">
        
        {/* Actions bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">description</span>
            <span className="font-bold text-slate-900 text-base">Comprobante de Entrega de Tóners (Outsourcing)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow-md hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 border border-slate-300 rounded-xl print:border-0 print:p-2 text-xs leading-relaxed">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 uppercase">
                {shopInfo?.name || 'SERVICIO TÉCNICO ESPECIALIZADO'}
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">
                {shopInfo?.subtitle || 'Mantenimiento, Reparación y Soporte Integral - Tarija, Bolivia'}
              </p>
              <p className="text-[10px] text-slate-500">
                Dirección: {shopInfo?.address || 'Av. Principal #1234, Zona Central'} • Tel: {shopInfo?.phone || '+591 70000000'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono font-bold text-xs rounded-md">
                REMITO Nº {deliveryData.id || `REM-2026-${Math.floor(100 + Math.random() * 900)}`}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Fecha: {deliveryData.date || new Date().toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>

          <div className="text-center my-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 bg-slate-100 py-1 rounded">
              Acta de Recepción y Entrega de Tóners / Insumos en Reserva
            </h2>
          </div>

          {/* Client & Agency Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 text-[11px]">
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Cliente Corporativo:</span>
              <span className="font-extrabold text-slate-900 text-xs">{agency.clientName}</span>
              <span className="block text-slate-600 mt-1">
                <strong>Sucursal / Agencia:</strong> {agency.agencyName}
              </span>
              <span className="block text-slate-600">
                <strong>Dirección:</strong> {agency.address} ({agency.city})
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-500 block text-[9px] uppercase">Receptor / Responsable:</span>
              <span className="font-bold text-slate-900">{agency.contactPerson}</span>
              <span className="block text-slate-600 mt-1">
                <strong>Teléfono / WhatsApp:</strong> {agency.contactPhone}
              </span>
              <span className="block text-slate-600">
                <strong>Técnico SISTECH Responsable:</strong> {deliveryData.technician || 'Ing. Milton Berthy Choque Canaviri'}
              </span>
            </div>
          </div>

          {/* Toners Delivered Table */}
          <div className="mb-4">
            <h3 className="font-bold text-[11px] text-slate-700 uppercase mb-1.5">
              Detalle de Cartuchos y Tóners Entregados para Backup
            </h3>
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-y border-slate-300">
                  <th className="py-1.5 px-2 text-left font-bold w-12">#</th>
                  <th className="py-1.5 px-2 text-left font-bold">Modelo de Tóner / Cartucho</th>
                  <th className="py-1.5 px-2 text-left font-bold">Color</th>
                  <th className="py-1.5 px-2 text-left font-bold">Impresora Compatible</th>
                  <th className="py-1.5 px-2 text-center font-bold w-20">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {(deliveryData.tonersDelivered || []).map((t, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-2 font-bold text-slate-900">{t.model}</td>
                    <td className="py-2 px-2 text-slate-600">{t.color || 'Negro'}</td>
                    <td className="py-2 px-2 text-slate-600">{t.compatiblePrinter || 'Flota Asignada'}</td>
                    <td className="py-2 px-2 text-center font-extrabold text-slate-900 bg-slate-50">
                      {t.quantity} un.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Observaciones */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg mb-6 text-[10px] text-slate-600">
            <strong>Observaciones de la Entrega:</strong> {deliveryData.notes || 'Insumos verificados en caja sellada con precinto de seguridad original. Quedan depositados en el armario de suministros de la agencia como stock de contingencia.'}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-[10px]">
            <div>
              <div className="h-12 border-b border-slate-400 mx-auto max-w-[200px]" />
              <p className="font-bold text-slate-900 mt-2">
                {deliveryData.technician || 'Ing. Milton Berthy Choque Canaviri'}
              </p>
              <p className="text-slate-500">Por SISTECH Outsourcing</p>
              <p className="text-slate-400">Entregué Conforme</p>
            </div>
            <div>
              <div className="h-12 border-b border-slate-400 mx-auto max-w-[200px]" />
              <p className="font-bold text-slate-900 mt-2">
                {agency.contactPerson}
              </p>
              <p className="text-slate-500">{agency.clientName} - {agency.agencyName}</p>
              <p className="text-slate-400">Recibí Conforme (Sello y Firma)</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
