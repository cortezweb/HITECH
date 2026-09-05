import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function POS() {
  const {
    substates,
    setSubstate,
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    checkoutCart,
    lastSaleReceipt,
    sales,
    shopInfo,
    currentUser,
    attendanceLogs,
    lastClosingTimestamp,
    clockInUser,
    clockOutUser,
    performCierreZ,
    returnSale,
    users
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [cashReceived, setCashReceived] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // 'Cash' | 'Card' | 'QR'
  const [printSize, setPrintSize] = useState('80mm'); // '80mm' | '50mm' | 'A4'

  // History states
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryReceipt, setSelectedHistoryReceipt] = useState(null);

  // Discount states
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);
  const [showDiscountInput, setShowDiscountInput] = useState(false);

  // Attendance, closures and authorization modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showCierreModal, setShowCierreModal] = useState(false);
  const [cierreStep, setCierreStep] = useState(1); // 1: Arqueo, 2: Reporte
  const [physicalCash, setPhysicalCash] = useState('0');
  const [expectedCaja, setExpectedCaja] = useState({ cash: 0, card: 0, qr: 0, total: 0, count: 0 });
  const [cierreReport, setCierreReport] = useState(null);
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authAction, setAuthAction] = useState(null);

  // Attendance details for today
  const todayStr = new Date().toLocaleDateString('es-ES');
  const myAttendance = attendanceLogs ? attendanceLogs.filter(log => log.userId === currentUser?.email && log.date === todayStr) : [];
  const hasClockedIn = myAttendance.some(log => log.type === 'entrada');
  const hasClockedOut = myAttendance.some(log => log.type === 'salida');
  
  const lastClockIn = myAttendance.find(log => log.type === 'entrada')?.time || '--:--';
  const lastClockOut = myAttendance.find(log => log.type === 'salida')?.time || '--:--';

  // Cart math
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount = discountType === 'percent'
    ? (subtotal * discountValue / 100)
    : discountValue;
  const subtotalWithDiscount = Math.max(0, subtotal - discountAmount);
  const tax = subtotalWithDiscount * 0.08;
  const total = subtotalWithDiscount + tax;

  // Filter products based on search
  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  // Sync state transitions
  useEffect(() => {
    if (searchQuery && substates.pos === 'moderno') {
      setSubstate('pos', 'search');
    } else if (!searchQuery && substates.pos === 'search') {
      setSubstate('pos', 'moderno');
    }
  }, [searchQuery]);

  // Numpad handlers for Cash payment
  const handleNumpadPress = (val) => {
    setCashReceived(prev => {
      if (prev === '0' && val !== '.') {
        return val;
      }
      if (val === '.' && prev.includes('.')) {
        return prev;
      }
      return prev + val;
    });
  };

  const handleClearCash = () => {
    setCashReceived('0');
  };

  const handleSetExactCash = (val) => {
    setCashReceived(val.toString());
  };

  const handleCompleteTransaction = () => {
    checkoutCart(paymentMethod, discountAmount);
  };

  const currentSubstate = substates.pos;

  // Success view
  if (currentSubstate === 'success') {
    const receipt = lastSaleReceipt || {
      id: 'TX-000000',
      total: 0,
      paymentMethod: 'Cash',
      items: [],
      date: 'now'
    };
    const changeDue = Math.max(0, parseFloat(cashReceived) - receipt.total);

    return (
      <div className="w-full flex flex-col items-center justify-center">
        {/* Visual Confirmation Screen (Hidden in print) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-primary/95 min-h-[80vh] rounded-3xl text-white space-y-6 relative overflow-hidden print:hidden">
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="relative text-center text-white space-y-6 max-w-md">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-primary animate-bounce">
              <span className="material-symbols-outlined text-[48px] fill-current">check_circle</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-[32px] font-bold font-sans leading-tight">¡Venta Exitosa!</h2>
              <p className="text-[16px] opacity-85">La transacción se ha completado correctamente.</p>
            </div>
            
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20 text-left space-y-4">
              <div className="flex justify-between items-center text-[14px]">
                <span className="opacity-75">ID Transacción</span>
                <span className="font-mono font-bold">{receipt.id}</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="opacity-75">Método de Pago</span>
                <span>
                  {receipt.paymentMethod === 'Cash' 
                    ? 'Efectivo' 
                    : receipt.paymentMethod === 'Card' 
                      ? 'Tarjeta' 
                      : 'QR / Yape'}
                </span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between items-center text-[14px] text-emerald-400 font-semibold">
                  <span>Descuento</span>
                  <span>-${receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="text-[16px] font-bold">Total Pagado</span>
                <span className="text-[20px] font-bold">${receipt.total.toFixed(2)}</span>
              </div>
              {receipt.paymentMethod === 'Cash' && (
                <div className="flex justify-between items-center text-[16px]">
                  <span className="opacity-75">Cambio Entregado</span>
                  <span className="text-[20px] font-black">${changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Format Selector Button Group */}
            <div className="flex items-center justify-center gap-2 bg-white/10 p-2.5 rounded-xl border border-white/20 mt-2">
              <span className="text-[12px] font-semibold opacity-95">Formato Impresión:</span>
              {['50mm', '80mm', 'A4'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPrintSize(size)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                    printSize === size 
                      ? 'bg-white text-primary shadow' 
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => window.print()}
                className="py-4 bg-white/20 border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                <span>Imprimir Recibo</span>
              </button>
              <button
                onClick={() => {
                  setCashReceived('0');
                  setSearchQuery('');
                  setSubstate('pos', 'moderno');
                }}
                className="py-4 bg-white text-primary rounded-xl font-semibold hover:bg-opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>Nueva Venta</span>
              </button>
            </div>
          </div>
        </div>

        {/* 50mm Thermal Receipt Layout (Visible ONLY during print) */}
        {printSize === '50mm' && (
          <div className="hidden print:block w-[50mm] mx-auto p-1 bg-white text-black font-mono text-[9px] leading-tight">
            <div className="text-center border-b border-dashed border-slate-400 pb-1.5 mb-2">
              <h2 className="text-[11px] font-bold uppercase tracking-wide">{shopInfo.name}</h2>
              <p className="text-[8px] text-slate-700">RUC: {shopInfo.ruc}</p>
              <p className="text-[8px] text-slate-700">Telf: {shopInfo.phone}</p>
            </div>

            <div className="space-y-0.5 mb-2 text-[8px] text-slate-800 border-b border-dashed border-slate-400 pb-1.5">
              <p><strong>Nro:</strong> {receipt.id}</p>
              <p><strong>Fecha:</strong> {receipt.date.split(',')[0]}</p>
              <p><strong>Pago:</strong> {receipt.paymentMethod === 'Cash' ? 'Efectivo' : 'Tarjeta/QR'}</p>
            </div>

            <table className="w-full text-left mb-2 text-[8px]">
              <thead>
                <tr className="border-b border-dashed border-slate-400 text-slate-900 font-bold">
                  <th className="pb-0.5 w-6 text-center">Cant</th>
                  <th className="pb-0.5">Item</th>
                  <th className="pb-0.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr key={item.id} className="border-b border-dotted border-slate-200/50">
                    <td className="py-0.5 text-center font-bold">{item.qty}</td>
                    <td className="py-0.5 truncate max-w-[80px]">{item.name}</td>
                    <td className="py-0.5 text-right">${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-0.5 pt-1 text-right text-[8px] text-slate-800 border-t border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>Subtot:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Desc:</span>
                  <span>-${receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-950">
                <span>TOTAL:</span>
                <span>${receipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center mt-3 border-t border-dashed border-slate-400 pt-1.5 text-[7px] text-slate-500">
              <p>¡Gracias por su compra!</p>
              <p>Conservar comprobante.</p>
            </div>
          </div>
        )}

        {/* 80mm Thermal Receipt Layout (Visible ONLY during print) */}
        {printSize === '80mm' && (
          <div className="hidden print:block w-[80mm] mx-auto p-4 bg-white text-black font-mono text-[12px] leading-relaxed">
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="text-[16px] font-bold uppercase tracking-wide">{shopInfo.name}</h2>
              <p className="text-[10px] text-slate-700">{shopInfo.address}</p>
              <p className="text-[10px] text-slate-700">RUC: {shopInfo.ruc}</p>
              <p className="text-[10px] text-slate-700 mt-1">Telf: {shopInfo.phone}</p>
            </div>

            <div className="space-y-1 mb-3 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3">
              <p><strong>Nro. Venta:</strong> {receipt.id}</p>
              <p><strong>Fecha:</strong> {receipt.date}</p>
              <p><strong>Cajero:</strong> {currentUser?.name || "Hamilton Cortez"}</p>
              <p><strong>Medio Pago:</strong> {receipt.paymentMethod === 'Cash' ? 'Efectivo' : receipt.paymentMethod === 'Card' ? 'Tarjeta' : 'QR / Yape'}</p>
            </div>

            <table className="w-full text-left mb-3 text-[11px]">
              <thead>
                <tr className="border-b border-dashed border-slate-400 text-slate-900 font-bold">
                  <th className="pb-1 w-12 text-center">Cant</th>
                  <th className="pb-1">Descripción</th>
                  <th className="pb-1 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr key={item.id} className="border-b border-dotted border-slate-200/50">
                    <td className="py-1 text-center font-bold">{item.qty}</td>
                    <td className="py-1 truncate max-w-[140px]">{item.name}</td>
                    <td className="py-1 text-right">${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 pt-2 text-right text-[11px] text-slate-800 border-t border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Descuento:</span>
                  <span>-${receipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>IGV (18%):</span>
                <span>${receipt.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-bold text-slate-950 border-t border-double border-slate-900 pt-1.5 mt-1.5">
                <span>TOTAL NETO:</span>
                <span>${receipt.total.toFixed(2)}</span>
              </div>
              {receipt.paymentMethod === 'Cash' && (
                <>
                  <div className="flex justify-between pt-1">
                    <span>Efectivo Entregado:</span>
                    <span>${parseFloat(cashReceived).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-950 font-semibold">
                    <span>Cambio Entregado:</span>
                    <span>${changeDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center mt-6 border-t border-dashed border-slate-400 pt-3 text-[9px] text-slate-600">
              <p className="font-semibold">¡Gracias por su compra en {shopInfo.name}!</p>
              <p className="mt-1">{shopInfo.warranty}</p>
            </div>
          </div>
        )}

        {/* A4 Invoice Layout (Visible ONLY during print) */}
        {printSize === 'A4' && (
          <div className="hidden print:block w-[210mm] mx-auto p-8 bg-white text-black font-sans text-[13px] leading-relaxed">
            <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
              <div className="text-left">
                <h1 className="text-[28px] font-black text-primary tracking-wide">{shopInfo.name}</h1>
                <p className="text-[11px] text-slate-500">{shopInfo.address}</p>
                <p className="text-[11px] text-slate-500">Telf: {shopInfo.phone}</p>
              </div>
              <div className="text-right border-2 border-primary/20 rounded-xl p-4 bg-slate-50 text-left min-w-[220px]">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">R.U.C. {shopInfo.ruc}</p>
                <h2 className="text-[15px] font-black text-primary mt-1">COMPROBANTE DE COMPRA</h2>
                <p className="text-[14px] font-mono font-bold mt-1 text-slate-800">Nº: {receipt.id}</p>
                <p className="text-[11px] text-slate-500 mt-2">Fecha: {receipt.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <h3 className="font-bold text-[12px] text-slate-500 uppercase tracking-wider mb-2">Detalles del Cliente</h3>
                <p className="font-semibold text-slate-800">Cliente General / Ventas Varias</p>
                <p className="text-slate-600">Dirección: Lima, Perú</p>
              </div>
              <div>
                <h3 className="font-bold text-[12px] text-slate-500 uppercase tracking-wider mb-2">Detalles del Pago</h3>
                <p className="text-slate-800"><strong>Método de Pago:</strong> {receipt.paymentMethod === 'Cash' ? 'Efectivo' : receipt.paymentMethod === 'Card' ? 'Tarjeta' : 'QR / Yape'}</p>
                <p className="text-slate-800"><strong>Cajero responsable:</strong> {currentUser?.name || "Hamilton Cortez"}</p>
              </div>
            </div>

            <table className="w-full text-left border-collapse mb-8 text-[13px]">
              <thead>
                <tr className="bg-primary/5 text-slate-900 border-b border-primary/20 font-bold">
                  <th className="py-3 px-4 w-20 text-center">Código</th>
                  <th className="py-3 px-4">Descripción del Producto</th>
                  <th className="py-3 px-4 w-24 text-center">Cantidad</th>
                  <th className="py-3 px-4 w-28 text-right">Precio Unitario</th>
                  <th className="py-3 px-4 w-28 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {receipt.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 text-center font-mono text-[12px]">{item.id}</td>
                    <td className="py-3 px-4 font-semibold">{item.name}</td>
                    <td className="py-3 px-4 text-center">{item.qty}</td>
                    <td className="py-3 px-4 text-right">${item.price.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-semibold">${(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <div className="w-80 space-y-2 border-t border-slate-200 pt-4 text-right text-[13px] text-slate-800">
                <div className="flex justify-between px-2">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-semibold">${receipt.subtotal.toFixed(2)}</span>
                </div>
                {receipt.discount > 0 && (
                  <div className="flex justify-between px-2 text-emerald-600 font-semibold">
                    <span>Descuento:</span>
                    <span>-${receipt.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between px-2">
                  <span className="text-slate-500">Impuesto (IGV 18%):</span>
                  <span className="font-semibold">${receipt.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between bg-primary/5 px-3 py-2 rounded-lg text-[15px] font-black text-slate-950 border-t border-primary/20 mt-2">
                  <span>TOTAL NETO ($):</span>
                  <span>${receipt.total.toFixed(2)}</span>
                </div>
                {receipt.paymentMethod === 'Cash' && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between px-2 text-[12px]">
                      <span className="text-slate-500">Efectivo Entregado:</span>
                      <span>${parseFloat(cashReceived).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-2 text-[13px] font-bold text-slate-950">
                      <span>Cambio Entregado:</span>
                      <span>${changeDue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-16 text-center text-[10px] text-slate-500 space-y-8 border-t border-slate-200 pt-6">
              <p className="font-semibold">¡Muchas gracias por su preferencia! {shopInfo.name} es garantía de confianza. {shopInfo.warranty}</p>
              <div className="flex justify-around pt-8">
                <div className="w-56 border-t border-slate-300 text-center pt-2 mt-4 text-slate-700">
                  Entregado por (Firma)
                </div>
                <div className="w-56 border-t border-slate-300 text-center pt-2 mt-4 text-slate-700">
                  Recibido por (Firma)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Payment view
  if (currentSubstate === 'payment') {
    const receivedAmount = parseFloat(cashReceived) || 0;
    const isPayable = receivedAmount >= total || paymentMethod !== 'Cash';
    const changeDue = Math.max(0, receivedAmount - total);

    return (
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-xl border border-outline-variant/20 max-w-5xl mx-auto flex flex-col md:flex-row min-h-[500px]">
        {/* Left pane: Cart Summary */}
        <div className="w-full md:w-2/5 bg-surface-container-low p-8 border-r border-outline-variant/30 flex flex-col justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <button 
                onClick={() => setSubstate('pos', 'moderno')}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h3 className="text-[18px] font-bold text-on-surface">Resumen de Venta</h3>
            </div>
            
            <div className="divide-y divide-outline-variant/20 overflow-y-auto max-h-[220px] pr-2">
              {cart.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-[14px]">
                  <div>
                    <p className="font-bold text-on-surface truncate max-w-[150px]">{item.name}</p>
                    <p className="text-[12px] text-on-surface-variant">Cant: {item.qty} x ${item.price}</p>
                  </div>
                  <span className="font-bold">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/30 pt-6 space-y-3">
            <div className="flex justify-between text-[14px] text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[14px] text-on-surface-variant">
              <span>Impuesto (8%)</span>
              <span className="font-semibold">${tax.toFixed(2)}</span>
            </div>
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 mt-2 flex justify-between items-center">
              <span className="text-[15px] font-bold text-primary">Monto Total</span>
              <span className="text-[22px] font-black text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right pane: Payment inputs */}
        <div className="w-full md:w-3/5 p-8 flex flex-col bg-white text-left justify-between">
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-[20px] font-bold">Proceso de Pago</h3>
                <p className="text-[12px] text-on-surface-variant">Elige el método de pago e introduce los datos</p>
              </div>
              <button 
                onClick={() => setSubstate('pos', 'moderno')}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {['Cash', 'Card', 'QR'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 rounded-xl border text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === method 
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {method === 'Cash' ? 'payments' : method === 'Card' ? 'credit_card' : 'qr_code_2'}
                  </span>
                  <span>{method === 'Cash' ? 'Efectivo' : method === 'Card' ? 'Tarjeta' : 'QR / Yape'}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'Cash' ? (
              <>
                {/* Cash received display */}
                <div className="bg-surface-container-low rounded-2xl p-4 mb-6 text-right border-2 border-transparent focus-within:border-primary/20 transition-all">
                  <span className="text-on-surface-variant text-[13px] block mb-1">Monto Recibido</span>
                  <div className="flex items-baseline justify-end gap-1.5">
                    <span className="text-[24px] font-bold text-on-surface-variant opacity-45">$</span>
                    <span className="text-[36px] font-black tracking-tight text-primary leading-none">
                      {parseFloat(cashReceived).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Keypad & Quick selects */}
                <div className="flex gap-6">
                  {/* Grid Keypad */}
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleNumpadPress(num.toString())}
                        className="py-3.5 rounded-xl bg-white border border-outline-variant/20 font-bold text-[18px] hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button 
                      onClick={handleClearCash}
                      className="py-3.5 rounded-xl bg-error/15 text-error font-bold text-[16px] hover:bg-error/20 active:scale-95 transition-all cursor-pointer"
                    >
                      C
                    </button>
                    <button 
                      onClick={() => handleNumpadPress('0')}
                      className="py-3.5 rounded-xl bg-white border border-outline-variant/20 font-bold text-[18px] hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                    >
                      0
                    </button>
                    <button 
                      onClick={() => handleNumpadPress('.')}
                      className="py-3.5 rounded-xl bg-white border border-outline-variant/20 font-bold text-[18px] hover:bg-primary/5 active:scale-95 transition-all cursor-pointer"
                    >
                      .
                    </button>
                  </div>
                  
                  {/* Quick Select Panel */}
                  <div className="w-28 flex flex-col gap-2.5">
                    <button
                      onClick={() => handleSetExactCash(total)}
                      className="flex-1 bg-primary-fixed text-primary border border-primary/20 rounded-xl text-[12px] font-bold flex flex-col items-center justify-center hover:brightness-95 active:scale-95 transition-all cursor-pointer"
                    >
                      <span className="text-[10px] opacity-80 uppercase leading-none mb-1">Exacto</span>
                      <span className="font-bold">${total.toFixed(2)}</span>
                    </button>
                    {[Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100].map((val) => (
                      <button
                        key={val}
                        onClick={() => handleSetExactCash(val)}
                        className="flex-1 bg-surface-container-high text-on-surface rounded-xl font-bold text-[14px] hover:bg-surface-container-highest active:scale-95 transition-all cursor-pointer"
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border border-outline-variant/20 my-4 flex-1">
                {paymentMethod === 'Card' ? (
                  <>
                    <span className="material-symbols-outlined text-[48px] text-primary">contactless</span>
                    <div>
                      <p className="text-[15px] font-bold text-on-surface">Procesa el pago en la terminal física</p>
                      <p className="text-[12px] text-on-surface-variant max-w-[240px] mx-auto mt-1">
                        Inserta o acerca la tarjeta del cliente en el lector POS externo.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-28 h-28 bg-white p-2 rounded-xl border border-outline-variant/30 flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[80px] text-on-surface">qr_code_2</span>
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-on-surface">Escanea el código QR de Yape / Plin</p>
                      <p className="text-[12px] text-on-surface-variant max-w-[240px] mx-auto mt-1">
                        Muestra este código al cliente para recibir el pago móvil al instante.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={() => alert('Métodos de pago divididos - Próximamente')}
              className="flex-1 py-4 rounded-xl bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-all cursor-pointer text-center text-[14px]"
            >
              Pago Dividido
            </button>
            <button
              onClick={handleCompleteTransaction}
              disabled={!isPayable}
              className="flex-[2] py-4 rounded-xl bg-primary text-white font-bold text-[15px] shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none cursor-pointer text-center"
            >
              Completar Transacción
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Sales History substate view
  if (currentSubstate === 'sales_history') {
    const activeReceipt = selectedHistoryReceipt;
    const filteredSales = sales
      .filter(sale => {
        if (historySearch.trim() === '') return true;
        return sale.id.toLowerCase().includes(historySearch.toLowerCase());
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return (
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-6 print:hidden">
          <div>
            <h2 className="text-[22px] font-black text-on-surface">Historial de Ventas</h2>
            <p className="text-on-surface-variant text-[13px] mt-0.5">
              Consulta transacciones anteriores y reimprime comprobantes de venta.
            </p>
          </div>
          <button
            onClick={() => setSubstate('pos', 'moderno')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-on-surface rounded-xl text-[13px] font-semibold transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver al POS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
          {/* Left Column: Sales list */}
          <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-[15px] font-bold text-on-surface">Lista de Transacciones</h3>
              
              <div className="relative w-full md:max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar por ID de venta..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[12px] outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
              {filteredSales.length === 0 ? (
                <div className="py-20 text-center text-on-surface-variant text-[13px] space-y-2">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/40">history</span>
                  <p>No se encontraron transacciones pasadas.</p>
                </div>
              ) : (
                filteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => {
                      setSelectedHistoryReceipt(sale);
                      setCashReceived('0'); // Reset cash received for reprinting calculations
                    }}
                    className={`py-3 px-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-all flex justify-between items-center mt-1 border ${
                      activeReceipt?.id === sale.id ? 'bg-primary/5 border-primary/20' : 'border-transparent'
                    }`}
                  >
                    <div>
                      <p className="font-mono font-bold text-[13px] text-primary">{sale.id}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{sale.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[14px] text-on-surface">${sale.total.toFixed(2)}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase">{sale.paymentMethod}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Selected sale detail & print */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm text-left">
            {!activeReceipt ? (
              <div className="py-32 text-center text-on-surface-variant space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline-variant/40">receipt</span>
                <p className="text-[13px] max-w-[200px] mx-auto">Selecciona una transacción para ver su detalle e imprimir copia.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-[16px] text-on-surface">Detalle de Transacción</h3>
                    <p className="text-[12px] text-primary font-mono font-bold mt-0.5">{activeReceipt.id}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold rounded-full uppercase">
                    {activeReceipt.paymentMethod}
                  </span>
                </div>

                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Fecha:</span>
                    <span className="font-semibold text-on-surface">{activeReceipt.date}</span>
                  </div>
                  
                  <div className="border-t border-b border-slate-100 py-3 space-y-2">
                    <p className="font-bold text-on-surface-variant text-[12px]">Productos:</p>
                    {activeReceipt.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-[12px]">
                        <span className="text-on-surface-variant">{item.qty} x {item.name}</span>
                        <span className="font-semibold text-on-surface">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Subtotal:</span>
                      <span className="font-semibold">${activeReceipt.subtotal.toFixed(2)}</span>
                    </div>
                    {activeReceipt.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Descuento aplicado:</span>
                        <span>-${activeReceipt.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Impuesto (8%):</span>
                      <span className="font-semibold">${activeReceipt.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[16px] font-black text-primary border-t border-slate-100 pt-2.5 mt-2">
                      <span>Total Neto:</span>
                      <span>${activeReceipt.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Print Format Selector */}
                <div className="flex items-center justify-between gap-2 bg-slate-100 p-2.5 rounded-xl border border-outline-variant/15">
                  <span className="text-[11px] font-bold text-on-surface-variant">Tamaño Copia:</span>
                  <div className="flex gap-1">
                    {['50mm', '80mm', 'A4'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPrintSize(size)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          printSize === size 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-white border border-slate-200 text-on-surface-variant hover:bg-slate-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reprint Trigger Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl text-[13px] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Imprimir Copia de Recibo</span>
                </button>

                {/* Return/Anular Sale Button (Admin Protected) */}
                <button
                  type="button"
                  onClick={() => {
                    const handleAnular = async () => {
                      if (window.confirm(`¿Estás seguro de que deseas anular y devolver la transacción ${activeReceipt.id}?`)) {
                        await returnSale(activeReceipt.id);
                        setSelectedHistoryReceipt(null);
                        alert('Transacción devuelta y stock restaurado en el sistema.');
                      }
                    };

                    if (currentUser?.role === 'admin') {
                      handleAnular();
                    } else {
                      // Request admin credentials
                      setAuthAction(() => handleAnular);
                      setAuthPassword('');
                      setAuthError('');
                      setAuthModalOpen(true);
                    }
                  }}
                  className="w-full mt-2.5 py-3 bg-error-container text-error font-bold rounded-xl text-[13px] hover:bg-error-container/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-error/15"
                >
                  <span className="material-symbols-outlined text-[18px]">assignment_return</span>
                  <span>Anular / Devolver Venta</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Printable Section for sales history */}
        {activeReceipt && (
          <div className="hidden print:block text-black">
            {/* 50mm Thermal */}
            {printSize === '50mm' && (
              <div className="w-[50mm] mx-auto p-1 bg-white font-mono text-[9px] leading-tight">
                <div className="text-center border-b border-dashed border-slate-400 pb-1.5 mb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-wide">{shopInfo.name} (COPIA)</h2>
                  <p className="text-[8px] text-slate-700">RUC: {shopInfo.ruc}</p>
                </div>
                <div className="space-y-0.5 mb-2 text-[8px] text-slate-800 border-b border-dashed border-slate-400 pb-1.5">
                  <p><strong>Nro:</strong> {activeReceipt.id}</p>
                  <p><strong>Fecha:</strong> {activeReceipt.date?.split(',')[0]}</p>
                  <p><strong>Pago:</strong> {activeReceipt.paymentMethod}</p>
                </div>
                <table className="w-full text-left mb-2 text-[8px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400 text-slate-900 font-bold">
                      <th className="pb-0.5 w-6 text-center">Cant</th>
                      <th className="pb-0.5">Item</th>
                      <th className="pb-0.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReceipt.items.map((item) => (
                      <tr key={item.id} className="border-b border-dotted border-slate-200/50">
                        <td className="py-0.5 text-center font-bold">{item.qty}</td>
                        <td className="py-0.5 truncate max-w-[80px]">{item.name}</td>
                        <td className="py-0.5 text-right">${(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-0.5 pt-1 text-right text-[8px] text-slate-800 border-t border-dashed border-slate-400">
                  <div className="flex justify-between">
                    <span>Subtot:</span>
                    <span>${activeReceipt.subtotal.toFixed(2)}</span>
                  </div>
                  {activeReceipt.discount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Desc:</span>
                      <span>-${activeReceipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-950">
                    <span>TOTAL:</span>
                    <span>${activeReceipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 80mm Thermal */}
            {printSize === '80mm' && (
              <div className="w-[80mm] mx-auto p-4 bg-white font-mono text-[12px] leading-relaxed">
                <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
                  <h2 className="text-[16px] font-bold uppercase tracking-wide">{shopInfo.name} (COPIA)</h2>
                  <p className="text-[10px] text-slate-700 font-bold">{shopInfo.address}</p>
                  <p className="text-[10px] text-slate-700">RUC: {shopInfo.ruc}</p>
                </div>
                <div className="space-y-1 mb-3 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3">
                  <p><strong>Nro. Venta:</strong> {activeReceipt.id}</p>
                  <p><strong>Fecha:</strong> {activeReceipt.date}</p>
                  <p><strong>Cajero:</strong> {currentUser?.name || "Hamilton Cortez"}</p>
                  <p><strong>Medio Pago:</strong> {activeReceipt.paymentMethod}</p>
                </div>
                <table className="w-full text-left mb-3 text-[11px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400 text-slate-900 font-bold">
                      <th className="pb-1 w-12 text-center">Cant</th>
                      <th className="pb-1">Descripción</th>
                      <th className="pb-1 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReceipt.items.map((item) => (
                      <tr key={item.id} className="border-b border-dotted border-slate-200/50">
                        <td className="py-1 text-center font-bold">{item.qty}</td>
                        <td className="py-1 truncate max-w-[140px]">{item.name}</td>
                        <td className="py-1 text-right">${(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="space-y-1 pt-2 text-right text-[11px] text-slate-800 border-t border-dashed border-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${activeReceipt.subtotal.toFixed(2)}</span>
                  </div>
                  {activeReceipt.discount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Descuento:</span>
                      <span>-${activeReceipt.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>IGV (18%):</span>
                    <span>${activeReceipt.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-bold text-slate-950 border-t border-double border-slate-900 pt-1.5 mt-1.5">
                    <span>TOTAL NETO:</span>
                    <span>${activeReceipt.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* A4 Invoice */}
            {printSize === 'A4' && (
              <div className="w-[210mm] mx-auto p-8 bg-white text-black font-sans text-[13px] leading-relaxed">
                <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-6">
                  <div className="text-left">
                    <h1 className="text-[28px] font-black text-primary tracking-wide">{shopInfo.name}</h1>
                    <p className="text-[12px] font-semibold text-slate-600 mt-1">{shopInfo.name} (COPIA DE ARCHIVO)</p>
                    <p className="text-[11px] text-slate-500">{shopInfo.address} | Telf: {shopInfo.phone}</p>
                  </div>
                  <div className="text-right border-2 border-primary/20 rounded-xl p-4 bg-slate-50 text-left min-w-[220px]">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">R.U.C. {shopInfo.ruc}</p>
                    <h2 className="text-[15px] font-black text-primary mt-1">COMPROBANTE DE COMPRA</h2>
                    <p className="text-[14px] font-mono font-bold mt-1 text-slate-800">Nº: {activeReceipt.id}</p>
                    <p className="text-[11px] text-slate-500 mt-2">Fecha original: {activeReceipt.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8 text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <h3 className="font-bold text-[12px] text-slate-500 uppercase tracking-wider mb-2">Detalles del Cliente</h3>
                    <p className="font-semibold text-slate-800">Cliente General / Ventas Varias</p>
                    <p className="text-slate-600">Dirección: Lima, Perú</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-[12px] text-slate-500 uppercase tracking-wider mb-2">Detalles del Pago</h3>
                    <p className="text-slate-800"><strong>Método de Pago:</strong> {activeReceipt.paymentMethod}</p>
                    <p className="text-slate-800"><strong>Cajero responsable:</strong> {currentUser?.name || "Hamilton Cortez"}</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse mb-8 text-[13px]">
                  <thead>
                    <tr className="bg-primary/5 text-slate-900 border-b border-primary/20 font-bold">
                      <th className="py-3 px-4 w-20 text-center">Código</th>
                      <th className="py-3 px-4">Descripción del Producto</th>
                      <th className="py-3 px-4 w-24 text-center">Cantidad</th>
                      <th className="py-3 px-4 w-28 text-right">Precio Unitario</th>
                      <th className="py-3 px-4 w-28 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {activeReceipt.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 text-center font-mono text-[12px]">{item.id}</td>
                        <td className="py-3 px-4 font-semibold">{item.name}</td>
                        <td className="py-3 px-4 text-center">{item.qty}</td>
                        <td className="py-3 px-4 text-right">${item.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-semibold">${(item.price * item.qty).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mt-4">
                  <div className="w-80 space-y-2 border-t border-slate-200 pt-4 text-right text-[13px] text-slate-800">
                    <div className="flex justify-between px-2">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-semibold">${activeReceipt.subtotal.toFixed(2)}</span>
                    </div>
                    {activeReceipt.discount > 0 && (
                      <div className="flex justify-between px-2 text-emerald-600 font-semibold">
                        <span>Descuento:</span>
                        <span>-${activeReceipt.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-2">
                      <span className="text-slate-500">Impuesto (IGV 18%):</span>
                      <span className="font-semibold">${activeReceipt.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between bg-primary/5 px-3 py-2 rounded-lg text-[15px] font-black text-slate-950 border-t border-primary/20 mt-2">
                      <span>TOTAL NETO ($):</span>
                      <span>${activeReceipt.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modern / Search views
  return (
    <div className="flex-1 flex overflow-hidden -m-8 h-[calc(100vh-64px)]">
      {/* Left Pane: Product Selection */}
      <div className="flex-1 overflow-y-auto p-8 scroll-smooth text-left">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-on-surface">
              {searchQuery ? 'Resultados de Búsqueda' : 'Punto de Venta (POS)'}
            </h1>
            <p className="text-[13px] text-on-surface-variant mt-1">
              {searchQuery 
                ? <>Se encontraron <span className="font-bold text-primary">{filteredProducts.length}</span> coincidencias para "<span className="font-bold text-primary">{searchQuery}</span>"</>
                : 'Busca y agrega productos para facturar'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Clock-in / Attendance Button */}
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-on-surface rounded-xl font-bold text-[12px] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              <span>Reloj Checador</span>
            </button>

            {/* Shift closing / Arqueo Button */}
            <button
              onClick={() => {
                const shiftSales = sales ? sales.filter(s => s.timestamp > lastClosingTimestamp) : [];
                const cashSales = shiftSales.filter(s => s.paymentMethod === 'Cash').reduce((sum, s) => sum + s.total, 0);
                const cardSales = shiftSales.filter(s => s.paymentMethod === 'Card').reduce((sum, s) => sum + s.total, 0);
                const qrSales = shiftSales.filter(s => s.paymentMethod === 'QR').reduce((sum, s) => sum + s.total, 0);
                const totalSales = shiftSales.reduce((sum, s) => sum + s.total, 0);
                
                setExpectedCaja({
                  cash: cashSales,
                  card: cardSales,
                  qr: qrSales,
                  total: totalSales,
                  count: shiftSales.length
                });
                setPhysicalCash('0');
                setCierreStep(1);
                setShowCierreModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-on-surface rounded-xl font-bold text-[12px] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
              <span>Cierre de Caja</span>
            </button>

            {/* Historial de Ventas Button */}
            <button
              onClick={() => {
                setSelectedHistoryReceipt(null);
                setHistorySearch('');
                setSubstate('pos', 'sales_history');
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-on-surface rounded-xl font-bold text-[12px] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Historial de Ventas</span>
            </button>
            
            {/* Local Search Input */}
            <div className="flex items-center bg-white border border-outline-variant/30 rounded-xl px-4 py-2 w-72">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[13px] w-full"
                placeholder="Buscar por nombre o categoría..."
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-outline-variant/60">inventory_2</span>
            <div>
              <p className="text-[16px] font-bold text-on-surface-variant">No se encontraron productos</p>
              <p className="text-[13px] text-outline">Intenta ajustar tu búsqueda o agregar productos al inventario.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => {
              const isOut = product.stock === 0;
              const isLow = product.stock > 0 && product.stock <= 15;
              
              if (index === 0) {
                // Feature Card (Large horizontal card - MacBook Pro style)
                return (
                  <div key={product.id} className="col-span-1 md:col-span-2 xl:col-span-2 group relative overflow-hidden bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 border border-outline-variant/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col md:flex-row h-full min-h-[240px]">
                      <div className="w-full md:w-1/2 h-48 md:h-auto relative overflow-hidden bg-surface-container-low flex items-center justify-center p-4">
                        <img className="max-h-full max-w-full object-contain transform group-hover:scale-105 transition-transform duration-500" alt={product.name} src={product.image} />
                        <div className="absolute top-4 left-4">
                          <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-[10px] font-bold shadow-lg">Bestseller</span>
                        </div>
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between text-left">
                        <div>
                          <h3 className="text-[18px] font-bold text-on-surface mb-2">{product.name}</h3>
                          <p className="text-[12px] text-on-surface-variant mb-4 leading-relaxed">{product.desc}</p>
                          <div className="flex items-center space-x-2 mb-6">
                            <span className="text-[20px] font-black text-primary">${product.price.toFixed(2)}</span>
                            <span className="text-on-surface-variant text-[12px] line-through opacity-50">${(product.price * 1.1).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => addToCart(product)}
                            disabled={isOut}
                            className="flex-1 bg-primary text-on-primary font-bold text-[13px] py-3 rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                          >
                            Agregar al Carrito
                          </button>
                          <button 
                            onClick={() => alert(`Detalles de ${product.name}: SKU ${product.id}`)}
                            className="p-3 border border-outline-variant/30 rounded-xl hover:bg-surface-container-low transition-all text-primary cursor-pointer flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-[20px]">info</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular Cards (Vertical)
              return (
                <div 
                  key={product.id}
                  className={`bg-white rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/10 hover:shadow-md transition-all p-card-padding flex flex-col group relative ${isLow ? 'border-error/20' : ''}`}
                >
                  {isOut ? (
                    <span className="absolute top-4 right-4 bg-outline-variant/30 text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold">Agotado</span>
                  ) : isLow ? (
                    <div className="absolute top-4 right-4 flex items-center text-error space-x-1 animate-pulse">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span className="text-[10px] font-bold">Sólo {product.stock} disp.</span>
                    </div>
                  ) : null}

                  <div className="h-36 rounded-xl overflow-hidden mb-4 bg-surface-container-low flex items-center justify-center p-2">
                    <img className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" alt={product.name} src={product.image} />
                  </div>
                  <h3 className="text-[15px] font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="text-[12px] text-on-surface-variant truncate mb-4">{product.desc}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[18px] font-black text-on-surface">${product.price.toFixed(2)}</span>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={isOut}
                      className="w-9 h-9 rounded-full bg-secondary disabled:bg-outline-variant/30 text-on-secondary disabled:text-on-surface-variant/40 flex items-center justify-center hover:scale-105 active:scale-90 disabled:scale-100 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Pane: Cart Sidebar */}
      <aside className="w-[380px] bg-white border-l border-outline-variant/30 flex flex-col shadow-[-10px_0px_30px_rgba(0,0,0,0.01)] text-left">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-on-surface">Carrito de Compras</h2>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold">
            {cart.reduce((acc, item) => acc + item.qty, 0)} Items
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-outline-variant/40">shopping_basket</span>
              <p className="text-[13px] text-on-surface-variant">El carrito está vacío</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 items-center group">
                <div className="w-14 h-14 rounded-xl bg-surface-container-low overflow-hidden p-1.5 flex-shrink-0 flex items-center justify-center">
                  <img className="w-full h-full object-contain" alt={item.name} src={item.image} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-on-surface truncate">{item.name}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">${item.price.toFixed(2)}</p>
                  <div className="flex items-center space-x-3 mt-1.5">
                    <div className="flex items-center bg-surface-container rounded-lg border border-outline-variant/10">
                      <button 
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                        className="p-1 hover:text-primary transition-colors flex items-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">remove</span>
                      </button>
                      <span className="px-1.5 text-[12px] font-bold text-on-surface">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                        className="p-1 hover:text-primary transition-colors flex items-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </div>
                    <span className="text-[13px] font-bold text-primary">${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="text-outline-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout Actions */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant/30 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[13px] text-on-surface-variant">
              <span>Subtotal</span>
              <span className="font-semibold text-on-surface">${subtotal.toFixed(2)}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-[13px] text-emerald-600 font-semibold">
                <span>Descuento ({discountType === 'percent' ? `${discountValue}%` : `$${discountValue}`})</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="pt-1.5 pb-2">
              {!showDiscountInput ? (
                <button
                  type="button"
                  onClick={() => setShowDiscountInput(true)}
                  className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">percent</span>
                  <span>Aplicar Descuento</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-outline-variant/30 mt-1">
                  <select
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value);
                      setDiscountValue(0);
                    }}
                    className="text-[11px] font-bold text-on-surface bg-transparent border-none outline-none cursor-pointer"
                  >
                    <option value="flat">$ (Fijo)</option>
                    <option value="percent">% (Porc.)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? '100' : subtotal}
                    value={discountValue || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setDiscountValue(val);
                    }}
                    placeholder="Monto"
                    className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-right outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDiscountInput(false)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountValue(0);
                      setShowDiscountInput(false);
                    }}
                    className="text-[11px] font-bold text-error hover:text-error-hover cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between text-[13px] text-on-surface-variant">
              <span>Impuesto (8%)</span>
              <span className="font-semibold text-on-surface">${tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-outline-variant/20 pt-3 flex justify-between items-center">
              <span className="text-[14px] font-bold text-on-surface">Total</span>
              <span className="text-[20px] font-black text-primary">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setSubstate('pos', 'payment')}
              disabled={cart.length === 0}
              className="w-full py-3.5 mt-2 bg-primary disabled:bg-slate-100 text-on-primary disabled:text-slate-400 rounded-2xl font-bold text-[14px] hover:brightness-105 active:scale-95 disabled:scale-100 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Proceder al Pago</span>
            </button>
          </div>
        </div>
      </aside>

        {/* Printable Cierre Z Layout */}
        {cierreReport && (
          <div className="hidden print:block text-black font-mono text-[12px] leading-relaxed p-4 bg-white w-[80mm] mx-auto">
            <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
              <h2 className="text-[15px] font-black uppercase tracking-wide">CIERRE DE CAJA (Z)</h2>
              <p className="text-[11px] font-bold text-slate-700">{shopInfo.name}</p>
              <p className="text-[10px] text-slate-700">{shopInfo.address}</p>
              <p className="text-[10px] text-slate-700">RUC: {shopInfo.ruc}</p>
            </div>
            
            <div className="space-y-1 mb-3 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3 text-left">
              <p><strong>Nro. Cierre:</strong> {cierreReport.id}</p>
              <p><strong>Fecha/Hora:</strong> {cierreReport.date}</p>
              <p><strong>Cajero:</strong> {cierreReport.cajero}</p>
              <p><strong>Transacciones:</strong> {cierreReport.count} ventas</p>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3 text-left">
              <p className="font-bold border-b border-slate-100 pb-1">Ventas Esperadas por Sistema:</p>
              <div className="flex justify-between">
                <span>Efectivo Esperado:</span>
                <span>${cierreReport.efectivoEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarjetas Esperadas:</span>
                <span>${cierreReport.tarjetaEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>QR / Yape Esperado:</span>
                <span>${cierreReport.qrEsperado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-100 pt-1 mt-1">
                <span>TOTAL ESPERADO:</span>
                <span>${cierreReport.totalVentas.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3 text-left">
              <p className="font-bold border-b border-slate-100 pb-1">Arqueo Físico y Conciliación:</p>
              <div className="flex justify-between">
                <span>Efectivo Contado:</span>
                <span>${cierreReport.efectivoReal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Diferencia (Efectivo):</span>
                <span className={cierreReport.diferencia < 0 ? 'text-red-700' : cierreReport.diferencia > 0 ? 'text-amber-700' : 'text-slate-900'}>
                  {cierreReport.diferencia === 0 ? '$0.00 (Cuadrada)' : `$${cierreReport.diferencia.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="text-center mt-6 pt-3 text-[9px] text-slate-500">
              <p>Comprobante de cierre de turno.</p>
              <p className="mt-4 border-t border-slate-400 w-28 mx-auto pt-1">Firma Cajero</p>
            </div>
          </div>
        )}

        {/* Attendance Modal */}
        {showAttendanceModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-xl space-y-6 text-left">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[18px] font-black text-on-surface">Reloj Checador (Asistencia)</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Registra tu horario laboral del día.</p>
                </div>
                <button 
                  onClick={() => setShowAttendanceModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={currentUser?.avatar} className="w-10 h-10 rounded-full border border-slate-200" alt="" />
                  <div>
                    <p className="font-bold text-[14px] text-on-surface">{currentUser?.name}</p>
                    <p className="text-[11px] text-on-surface-variant uppercase font-bold">{currentUser?.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-on-surface-variant font-bold block">Marcación Entrada</span>
                    <span className="text-[14px] font-black text-primary mt-0.5 block">{lastClockIn}</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-on-surface-variant font-bold block">Marcación Salida</span>
                    <span className="text-[14px] font-black text-secondary mt-0.5 block">{lastClockOut}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  disabled={hasClockedIn}
                  onClick={async () => {
                    await clockInUser(currentUser.email, currentUser.name, currentUser.role);
                    alert('¡Entrada registrada con éxito!');
                  }}
                  className="flex-1 py-3 bg-primary disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl text-[13px] hover:brightness-105 active:scale-95 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Marcar Entrada</span>
                </button>
                <button
                  disabled={!hasClockedIn || hasClockedOut}
                  onClick={async () => {
                    await clockOutUser(currentUser.email, currentUser.name, currentUser.role);
                    alert('¡Salida registrada con éxito!');
                  }}
                  className="flex-1 py-3 bg-secondary disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl text-[13px] hover:brightness-105 active:scale-95 disabled:scale-100 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Marcar Salida</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cierre Caja Modal */}
        {showCierreModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-outline-variant/30 shadow-xl space-y-6 text-left">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[18px] font-black text-on-surface">Arqueo y Cierre de Caja</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Conciliación de dinero físico con el sistema.</p>
                </div>
                <button 
                  onClick={() => setShowCierreModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {cierreStep === 1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-center">
                      <span className="text-[10px] text-on-surface-variant font-bold block">Efectivo Esperado</span>
                      <span className="text-[16px] font-extrabold text-slate-800 block mt-0.5">${expectedCaja.cash.toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-center">
                      <span className="text-[10px] text-on-surface-variant font-bold block">Tarjetas Esperadas</span>
                      <span className="text-[16px] font-extrabold text-slate-800 block mt-0.5">${expectedCaja.card.toFixed(2)}</span>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl text-center">
                      <span className="text-[10px] text-on-surface-variant font-bold block">QR / Yape Esperado</span>
                      <span className="text-[16px] font-extrabold text-slate-800 block mt-0.5">${expectedCaja.qr.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                      <span className="text-[12px] font-bold text-primary block">Total Ventas del Turno</span>
                      <span className="text-[11px] text-primary/70">{expectedCaja.count} Transacciones</span>
                    </div>
                    <span className="text-[22px] font-black text-primary">${expectedCaja.total.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[12px] font-black text-on-surface">Efectivo Físico Contado en Caja ($) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={physicalCash}
                      onChange={(e) => setPhysicalCash(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[18px] font-black outline-none focus:border-primary text-right"
                    />
                  </div>

                  {/* Reconciliation math */}
                  {(() => {
                    const expected = expectedCaja.cash;
                    const physical = parseFloat(physicalCash) || 0;
                    const diff = physical - expected;
                    const isPerfect = Math.abs(diff) < 0.01;
                    
                    return (
                      <div className={`p-4 rounded-2xl border text-[13px] font-bold flex items-center gap-2 ${
                        isPerfect 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                          : diff < 0 
                            ? 'bg-red-50 border-red-100 text-red-700' 
                            : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <span className="material-symbols-outlined">
                          {isPerfect ? 'check_circle' : diff < 0 ? 'report' : 'warning_amber'}
                        </span>
                        <div className="text-left flex-1">
                          <p>{isPerfect ? 'Caja Cuadrada' : diff < 0 ? `Faltante detectado: -$${Math.abs(diff).toFixed(2)}` : `Sobrante detectado: +$${diff.toFixed(2)}`}</p>
                          <p className="text-[10px] opacity-75 font-semibold">
                            {isPerfect 
                              ? 'El dinero físico en caja coincide perfectamente con el sistema.' 
                              : 'Verifica los comprobantes de venta o cobros erróneos antes de realizar el Cierre Z.'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        const physical = parseFloat(physicalCash) || 0;
                        const diff = physical - expectedCaja.cash;
                        const report = {
                          id: `REP-X-${Date.now()}`,
                          cajero: currentUser.name,
                          count: expectedCaja.count,
                          efectivoEsperado: expectedCaja.cash,
                          tarjetaEsperado: expectedCaja.card,
                          qrEsperado: expectedCaja.qr,
                          totalVentas: expectedCaja.total,
                          efectivoReal: physical,
                          diferencia: diff,
                          date: new Date().toLocaleString('es-ES')
                        };
                        setCierreReport(report);
                        setTimeout(() => {
                          window.print();
                        }, 150);
                      }}
                      className="flex-1 py-3.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">print</span>
                      <span>Reporte X (Parcial)</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const physical = parseFloat(physicalCash) || 0;
                        const diff = physical - expectedCaja.cash;
                        const report = {
                          id: `REP-Z-${Date.now()}`,
                          cajero: currentUser.name,
                          count: expectedCaja.count,
                          efectivoEsperado: expectedCaja.cash,
                          tarjetaEsperado: expectedCaja.card,
                          qrEsperado: expectedCaja.qr,
                          totalVentas: expectedCaja.total,
                          efectivoReal: physical,
                          diferencia: diff
                        };
                        await performCierreZ(report);
                        setCierreReport({
                          ...report,
                          date: new Date().toLocaleString('es-ES')
                        });
                        setCierreStep(2);
                      }}
                      className="flex-1 py-3.5 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Hacer Cierre Z</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <span className="material-symbols-outlined text-[36px] font-bold">check</span>
                  </div>
                  <div>
                    <h4 className="text-[18px] font-black text-on-surface">¡Cierre Z Completado!</h4>
                    <p className="text-[13px] text-on-surface-variant max-w-sm mx-auto mt-1">
                      El turno ha sido cerrado con éxito. El informe financiero definitivo fue guardado en el historial de auditoría.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="py-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">print</span>
                      <span>Imprimir Comprobante</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowCierreModal(false);
                      }}
                      className="py-3 bg-primary text-white rounded-xl font-bold text-[13px] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                      Aceptar y Salir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Authorization Modal */}
        {authModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-outline-variant/30 shadow-xl space-y-6 text-left">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-[18px] font-black text-on-surface">Autorización Requerida</h3>
                  <p className="text-[12px] text-on-surface-variant mt-0.5">Se requiere clave de Administrador.</p>
                </div>
                <button 
                  onClick={() => setAuthModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Validate if password matches any admin user or generic mockup password
                  const adminUser = users.find(u => u.role === 'admin' && u.password === authPassword);
                  if (adminUser || authPassword === 'admin123') {
                    setAuthModalOpen(false);
                    if (authAction) authAction();
                  } else {
                    setAuthError('Contraseña incorrecta o el usuario no es Administrador.');
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Contraseña de Administrador *</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => {
                      setAuthPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Digita la clave de admin"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] outline-none focus:border-primary"
                  />
                  {authError && <p className="text-[10px] text-error font-bold mt-1">{authError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Autorizar Acción</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

