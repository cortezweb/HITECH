import React from 'react';

// Number to Spanish words helper for Bolivianos
export function numberToWordsBolivianos(num) {
  const n = typeof num === 'number' ? num : parseFloat(num) || 0;
  const integerPart = Math.floor(n);
  const cents = Math.round((n - integerPart) * 100);
  const centsStr = String(cents).padStart(2, '0') + '/100';

  const units = ['', 'Un', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve'];
  const tens = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa'];
  const teens = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciséis', 'Diecisiete', 'Dieciocho', 'Diecinueve'];
  const twenties = ['Veinte', 'Veintiuno', 'Veintidós', 'Veintitrés', 'Veinticuatro', 'Veinticinco', 'Veintiséis', 'Veintisiete', 'Veintiocho', 'Veintinueve'];
  const hundreds = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos'];

  function convertHundreds(val) {
    if (val === 0) return '';
    if (val === 100) return 'Cien';
    let str = '';
    const h = Math.floor(val / 100);
    const rem = val % 100;
    if (h > 0) str += hundreds[h] + ' ';
    if (rem >= 10 && rem < 20) {
      str += teens[rem - 10];
    } else if (rem >= 20 && rem < 30) {
      str += twenties[rem - 20];
    } else if (rem >= 30) {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      str += tens[t];
      if (u > 0) str += ' y ' + units[u];
    } else if (rem > 0) {
      str += units[rem];
    }
    return str.trim();
  }

  function convert(val) {
    if (val === 0) return 'Cero';
    let str = '';
    const thousands = Math.floor(val / 1000);
    const rem = val % 1000;
    if (thousands === 1) {
      str += 'Mil ';
    } else if (thousands > 1) {
      str += convertHundreds(thousands) + ' Mil ';
    }
    if (rem > 0) {
      str += convertHundreds(rem);
    }
    return str.trim();
  }

  const text = convert(integerPart);
  return `${text} ${centsStr} Bolivianos`;
}

export default function OfficialServiceReceipt({ ticket, shopInfo, customData = {} }) {
  if (!ticket) return null;

  // Format Ticket Number
  const isDefaultOr482 = !ticket.id || ticket.id === 'ST-2026-00482' || ticket.id === 'WO-1094' || ticket.id === '00482';
  const ticketIdRaw = ticket.id ? String(ticket.id).replace(/^WO-|^ST-/, '') : '00482';
  const displayId = customData.receiptNumber || (isDefaultOr482 ? 'ST - 2026-00482' : `ST - 2026-${ticketIdRaw.padStart(5, '0')}`);

  // Date
  const emissionDate = customData.emissionDate || (isDefaultOr482 ? '05 / 09 / 2026' : (ticket.date 
    ? ticket.date.split(',')[0].replace(/\//g, ' / ') 
    : '05 / 09 / 2026'));

  // Client Data
  const isUsAddress = ticket.address && (ticket.address.includes('Drive') || ticket.address.includes('Road') || ticket.address.includes('Spruce') || ticket.address.includes('Belmont'));
  const clientName = customData.clientName || ticket.customerName || (!isUsAddress && ticket.address ? ticket.address : 'Lic. Carlos Eduardo Mendoza Ramos');
  const clientCi = customData.clientCi || ticket.clientCi || ticket.ciNit || '5489214 Tarija';
  const clientPhone = customData.clientPhone || ticket.phone || (!isUsAddress && ticket.city && ticket.city.includes('+') ? ticket.city.split('•')[0].trim() : '+591 71234567');
  const clientCity = customData.clientCity || ticket.clientCity || (!isUsAddress && ticket.city && ticket.city.includes('Tarija') ? ticket.city : 'Tarija, Bolivia');
  const clientAddress = customData.clientAddress || ticket.clientAddress || (
    !isUsAddress && ticket.address && (ticket.address.toLowerCase().includes('barrio') || ticket.address.toLowerCase().includes('calle') || ticket.address.toLowerCase().includes('av'))
      ? ticket.address 
      : 'Barrio San Martín, Calle Ingavi N° 450'
  );

  // Equipment Data
  const isUsType = ticket.systemType && (ticket.systemType.includes('Thermostat') || ticket.systemType.includes('Solar') || ticket.systemType.includes('HVAC'));
  const deviceType = customData.deviceType || ticket.deviceType || 'Computadora Portátil (Laptop)';
  const brandModel = customData.brandModel || (!isUsType && ticket.systemType ? ticket.systemType : 'Lenovo ThinkPad E14 Gen 4');
  const serialNumber = customData.serialNumber || ticket.serialNumber || 'PF-3X9K82';
  const processorRam = customData.processorRam || ticket.processorRam || 'Intel Core i7-1255U / 16 GB DDR4';
  const storage = customData.storage || ticket.storage || 'SSD NVMe M.2 512 GB';
  const accessories = customData.accessories || ticket.accessories || 'Cargador original USB-C 65W, funda protectora';

  // Diagnosis and Status
  const isUsDesc = ticket.desc && (ticket.desc.includes('thermostat') || ticket.desc.includes('circuits') || ticket.desc.includes('air conditioning'));
  const issueReason = customData.issueReason || ticket.issueReason || (!isUsDesc && ticket.desc ? ticket.desc : 'Equipo presenta sobrecalentamiento, apagado repentino y lentitud generalizada en arranque del SO.');
  const diagnosis = customData.diagnosis || ticket.diagnosis || 'Obstrucción por polvo en disipador, pasta térmica degradada, sectores lógicos inconsistentes en sistema operativo y necesidad de mantenimiento preventivo integral y optimización.';
  const finalStatus = customData.finalStatus || ticket.finalStatus || 'OPERATIVO AL 100% — Pruebas de estrés térmico superadas (temperatura máx. 68°C bajo carga). Sistema operativo reinstalado y actualizado con respaldo de datos intacto.';

  // Financial Items
  const rawPrice = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
  
  const defaultItems = [
    {
      item: 1,
      desc: 'Mantenimiento preventivo profundo: desensamble, limpieza ultrasónica de ventilador, cambio de pasta térmica de alto rendimiento (Arctic MX-4) y pads térmicos.',
      qty: 1,
      unitPrice: 180.00,
      subtotal: 180.00
    },
    {
      item: 2,
      desc: 'Optimización de software, formateo limpio, configuración de controladores originales y respaldo de partición de datos (120 GB respaldados con verificación MD5).',
      qty: 1,
      unitPrice: 150.00,
      subtotal: 150.00
    },
    {
      item: 3,
      desc: 'Licenciamiento antivirus corporativo con protección proactiva y revisión de seguridad perimetral.',
      qty: 1,
      unitPrice: 120.00,
      subtotal: 120.00
    }
  ];

  let items = customData.serviceItems || ticket.serviceItems;
  if (!items || items.length === 0) {
    if (rawPrice === 450 || rawPrice === 0 || isDefaultOr482) {
      items = defaultItems;
    } else {
      items = [
        {
          item: 1,
          desc: `Servicio técnico especializado: ${ticket.desc || ticket.systemType || 'Diagnóstico, mantenimiento correctivo y mano de obra calificada.'}`,
          qty: 1,
          unitPrice: rawPrice,
          subtotal: rawPrice
        }
      ];
    }
  }

  const subtotal = items.reduce((sum, it) => sum + (it.subtotal !== undefined ? it.subtotal : (it.qty * it.unitPrice)), 0);
  const advance = ticket.advancePayment ? parseFloat(ticket.advancePayment) : 0;
  const totalToPay = Math.max(0, subtotal - advance);

  // Technician Data
  const techName = customData.techName || ticket.assignedTech?.name || 'ING. MILTON BERTHY CHOQUE CANAVIRI';
  const techRole = customData.techRole || ticket.assignedTech?.role || 'Responsable de Servicio Técnico / Propietario';
  const techCi = customData.techCi || ticket.assignedTech?.ci || 'C.I.: 7183920 Tarija';

  return (
    <div 
      className="w-[210mm] max-w-[210mm] mx-auto bg-white text-slate-900 font-sans leading-tight p-4 print:p-0 print:m-0 select-text box-border"
      style={{ 
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2 mb-2">
        <div className="text-left max-w-[62%]">
          <h1 className="text-[16px] font-black text-[#0e2a47] uppercase tracking-wide leading-none">
            SERVICIO TÉCNICO ESPECIALIZADO
          </h1>
          <p className="text-[10px] font-bold text-[#1e3a5f] mt-1 leading-none">
            Soporte Informático, Reparación y Mantenimiento Electrónico
          </p>
          <div className="text-[8.5px] text-slate-700 mt-1.5 space-y-0.5 leading-snug">
            <p>
              <strong className="text-slate-900">Dirección:</strong> {shopInfo?.address || 'Av. Principal #1234, Zona Central'}
            </p>
            <p>
              <strong className="text-slate-900">Teléfono / WhatsApp:</strong> {shopInfo?.phone || '+591 70000000'} <span className="mx-1 font-normal">|</span> <strong className="text-slate-900">Email:</strong> {shopInfo?.email || 'soporte.tecnico@contacto.com'}
            </p>
            <p>
              <strong className="text-slate-900">Actividad Económica:</strong> Servicios Profesionales de Tecnología y Soporte de Hardware/Software
            </p>
          </div>
        </div>

        {/* Right Box: CONSTANCIA Y RECIBO */}
        <div className="border-2 border-[#0e2a47] rounded-lg p-2 text-center min-w-[190px] bg-white">
          <h2 className="text-[10px] font-black text-[#0e2a47] uppercase tracking-wider leading-none">
            CONSTANCIA Y RECIBO
          </h2>
          <p className="text-[13px] font-black text-rose-700 font-mono my-1 leading-none">
            Nº {displayId}
          </p>
          <p className="text-[9px] font-semibold text-slate-800 leading-none">
            Fecha de Emisión: <span className="font-bold text-slate-900">{emissionDate}</span>
          </p>
        </div>
      </div>

      {/* ================= 1. DATOS DEL CLIENTE / TITULAR ================= */}
      <div className="mb-2">
        <div className="bg-[#0e2a47] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          1. DATOS DEL CLIENTE / TITULAR
        </div>
        <div className="border border-slate-300 text-[8.5px] divide-y divide-slate-200">
          <div className="grid grid-cols-12 px-2 py-0.5">
            <div className="col-span-8">
              <strong className="text-slate-900">Nombre Completo:</strong>{' '}
              <span className="text-slate-800 font-medium">{clientName}</span>
            </div>
            <div className="col-span-4">
              <strong className="text-slate-900">C.I. / NIT:</strong>{' '}
              <span className="text-slate-800 font-medium">{clientCi}</span>
            </div>
          </div>
          <div className="grid grid-cols-12 px-2 py-0.5">
            <div className="col-span-8">
              <strong className="text-slate-900">Teléfono / Celular:</strong>{' '}
              <span className="text-slate-800 font-medium">{clientPhone}</span>
            </div>
            <div className="col-span-4">
              <strong className="text-slate-900">Ciudad / Región:</strong>{' '}
              <span className="text-slate-800 font-medium">{clientCity}</span>
            </div>
          </div>
          <div className="px-2 py-0.5">
            <strong className="text-slate-900">Dirección Domicilio:</strong>{' '}
            <span className="text-slate-800 font-medium">{clientAddress}</span>
          </div>
        </div>
      </div>

      {/* ================= 2. IDENTIFICACIÓN TÉCNICA DEL EQUIPO ================= */}
      <div className="mb-2">
        <div className="bg-[#0e2a47] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          2. IDENTIFICACIÓN TÉCNICA DEL EQUIPO
        </div>
        <div className="border border-slate-300 text-[8.5px] divide-y divide-slate-200">
          <div className="grid grid-cols-12 px-2 py-0.5">
            <div className="col-span-6">
              <strong className="text-slate-900">Tipo de Equipo:</strong>{' '}
              <span className="text-slate-800 font-medium">{deviceType}</span>
            </div>
            <div className="col-span-6">
              <strong className="text-slate-900">Marca / Modelo:</strong>{' '}
              <span className="text-slate-800 font-medium">{brandModel}</span>
            </div>
          </div>
          <div className="grid grid-cols-12 px-2 py-0.5">
            <div className="col-span-6">
              <strong className="text-slate-900">Número de Serie (S/N):</strong>{' '}
              <span className="text-slate-800 font-mono font-medium">{serialNumber}</span>
            </div>
            <div className="col-span-6">
              <strong className="text-slate-900">Procesador / RAM:</strong>{' '}
              <span className="text-slate-800 font-medium">{processorRam}</span>
            </div>
          </div>
          <div className="grid grid-cols-12 px-2 py-0.5">
            <div className="col-span-6">
              <strong className="text-slate-900">Almacenamiento:</strong>{' '}
              <span className="text-slate-800 font-medium">{storage}</span>
            </div>
            <div className="col-span-6">
              <strong className="text-slate-900">Accesorios Recibidos:</strong>{' '}
              <span className="text-slate-800 font-medium">{accessories}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. ESTADO DEL EQUIPO Y DIAGNÓSTICO ================= */}
      <div className="mb-2">
        <div className="bg-[#0e2a47] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          3. ESTADO DEL EQUIPO Y DIAGNÓSTICO
        </div>
        <div className="border border-slate-300 text-[8.5px] p-1.5 space-y-1">
          <p className="leading-snug">
            <strong className="text-slate-900">Motivo de Ingreso:</strong>{' '}
            <span className="text-slate-800">{issueReason}</span>
          </p>
          <p className="leading-snug">
            <strong className="text-slate-900">Diagnóstico Técnico:</strong>{' '}
            <span className="text-slate-800">{diagnosis}</span>
          </p>

          {/* Checklist with verified icons */}
          <div className="grid grid-cols-3 gap-y-0.5 gap-x-2 pt-1 pb-1 border-t border-b border-slate-200 text-[8px]">
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Pantalla / Display:</strong> Sin fisuras</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Teclado y Touchpad:</strong> Funcionales</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Puertos USB / HDMI:</strong> Operativos</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Batería:</strong> Estado Saludable (88%)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Carcasa:</strong> Desgaste normal de uso</span>
            </div>
            <div className="flex items-center gap-1 text-slate-800">
              <span className="text-slate-900 font-bold">☑</span>
              <span><strong>Conectividad Wi-Fi/BT:</strong> Correcta</span>
            </div>
          </div>

          <p className="leading-snug text-[8px] pt-0.5">
            <strong className="text-slate-900">Estado Final de Entrega:</strong>{' '}
            <span className="text-slate-800 font-medium">{finalStatus}</span>
          </p>
        </div>
      </div>

      {/* ================= 4. DETALLE DE SERVICIOS REALIZADOS Y LIQUIDACIÓN ECONÓMICA ================= */}
      <div className="mb-2">
        <div className="bg-[#0e2a47] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          4. DETALLE DE SERVICIOS REALIZADOS Y LIQUIDACIÓN ECONÓMICA
        </div>
        <table className="w-full border-collapse border border-slate-300 text-[8px]">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#0e2a47] font-black uppercase border-b border-slate-300">
              <th className="py-1 px-1.5 text-center w-8 border-r border-slate-300">ÍTEM</th>
              <th className="py-1 px-2 text-left border-r border-slate-300">DESCRIPCIÓN DEL SERVICIO / REPUESTO</th>
              <th className="py-1 px-1 text-center w-10 border-r border-slate-300">CANT.</th>
              <th className="py-1 px-1.5 text-right w-24 border-r border-slate-300">PRECIO UNIT. (BS.)</th>
              <th className="py-1 px-1.5 text-right w-24">SUBTOTAL (BS.)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((it, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-1 px-1.5 text-center font-bold text-slate-700 border-r border-slate-300">
                  {it.item || idx + 1}
                </td>
                <td className="py-1 px-2 text-left text-slate-800 leading-tight border-r border-slate-300">
                  {it.desc}
                </td>
                <td className="py-1 px-1 text-center text-slate-800 font-semibold border-r border-slate-300">
                  {it.qty}
                </td>
                <td className="py-1 px-1.5 text-right text-slate-800 font-mono border-r border-slate-300">
                  {it.unitPrice.toFixed(2).replace('.', ',')}
                </td>
                <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900">
                  {(it.subtotal !== undefined ? it.subtotal : (it.qty * it.unitPrice)).toFixed(2).replace('.', ',')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 bg-slate-50">
              <td colSpan={4} className="py-0.5 px-2 text-right font-black uppercase text-slate-800 border-r border-slate-300 text-[8px]">
                SUBTOTAL:
              </td>
              <td className="py-0.5 px-1.5 text-right font-mono font-bold text-slate-900 text-[8px]">
                {subtotal.toFixed(2).replace('.', ',')}
              </td>
            </tr>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={4} className="py-0.5 px-2 text-right font-black uppercase text-slate-800 border-r border-slate-300 text-[8px]">
                ANTICIPO / PAGO PREVIO RECIBIDO:
              </td>
              <td className="py-0.5 px-1.5 text-right font-mono font-bold text-slate-900 text-[8px]">
                {advance.toFixed(2).replace('.', ',')}
              </td>
            </tr>
            <tr className="border-t-2 border-slate-900 bg-slate-100">
              <td colSpan={3} className="py-1 px-2 text-left font-bold text-slate-800 border-r border-slate-300 text-[8.5px]">
                Son: {numberToWordsBolivianos(totalToPay)}.
              </td>
              <td className="py-1 px-2 text-right font-black text-[#0e2a47] uppercase border-r border-slate-300 text-[9.5px]">
                TOTAL A PAGAR:
              </td>
              <td className="py-1 px-1.5 text-right font-mono font-black text-[11px] text-[#0e2a47]">
                Bs. {totalToPay.toFixed(2).replace('.', ',')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ================= 5. CLÁUSULA DE GARANTÍA Y VALIDEZ ================= */}
      <div className="mb-2">
        <div className="bg-[#0e2a47] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
          5. CLÁUSULA DE GARANTÍA Y VALIDEZ
        </div>
        <div className="border border-slate-300 text-[7.5px] p-1.5 text-slate-700 leading-tight space-y-0.5 bg-white">
          <p>
            <strong className="text-slate-900">1. GARANTÍA:</strong> El servicio técnico efectuado cuenta con una garantía técnica de <strong>60 (sesenta) días calendario</strong> a partir de la fecha de suscripción del presente documento, aplicable exclusivamente al trabajo ejecutado y repuestos instalados.
          </p>
          <p>
            <strong className="text-slate-900">2. EXCLUSIONES:</strong> La garantía quedará invalidada por manipulación no autorizada, rotura de sellos de seguridad, golpes, exposición a líquidos o fluctuaciones eléctricas externas.
          </p>
          <p>
            <strong className="text-slate-900">3. CONFORMIDAD Y FINES:</strong> El cliente declara haber recibido el equipo en perfecto estado de funcionamiento y conformidad con los servicios detallados. El presente documento certifica formalmente la transacción comercial y el servicio técnico prestado para los fines administrativos, contables o bancarios pertinentes.
          </p>
        </div>
      </div>

      {/* ================= FIRMAS Y SELLOS ================= */}
      <div className="pt-1">
        <div className="grid grid-cols-2 gap-8 text-center">
          {/* Técnico */}
          <div>
            <div className="w-4/5 mx-auto border-t-2 border-slate-800 pt-1">
              <p className="text-[9px] font-black uppercase text-slate-900 leading-tight">{techName}</p>
              <p className="text-[7.5px] font-semibold text-slate-700 leading-tight">{techRole}</p>
              <p className="text-[7.5px] text-slate-600 leading-tight">{techCi}</p>
              <p className="text-[7px] text-slate-500 italic mt-0.5 leading-none">Firma y Sello del Técnico</p>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="w-4/5 mx-auto border-t-2 border-slate-800 pt-1">
              <p className="text-[9px] font-black uppercase text-slate-900 leading-tight">{clientName}</p>
              <p className="text-[7.5px] font-semibold text-slate-700 leading-tight">Cliente / Titular del Equipo</p>
              <p className="text-[7.5px] text-slate-600 leading-tight">C.I.: {clientCi}</p>
              <p className="text-[7px] text-slate-500 italic mt-0.5 leading-none">Firma de Conformidad y Recepción</p>
            </div>
          </div>
        </div>

        <p className="text-[7px] text-slate-500 italic text-center mt-2 leading-none">
          Documento extendido a petición del interesado para fines de justificación de servicios ante entidades financieras o bancarias.
        </p>
        <p className="text-[6.5px] text-slate-400 text-center mt-0.5 border-t border-slate-200 pt-0.5 leading-none">
          Documento oficial de respaldo técnico y comercial - Válido para trámites administrativos y bancarios
        </p>
      </div>
    </div>
  );
}
