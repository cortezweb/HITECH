import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import OfficialServiceReceipt from '../components/OfficialServiceReceipt';

export default function ServiceRegistry() {
  const {
    substates,
    setSubstate,
    tickets,
    addServiceTicket,
    updateServiceTicket,
    lastCreatedTicket,
    onDutyTeam,
    shopInfo,
    addServicePaymentToCart
  } = useApp();

  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('Laptops');
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [printSize, setPrintSize] = useState('A4'); // 'A4' | '80mm' | '50mm'
  const [previewReceiptTicket, setPreviewReceiptTicket] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    brand: '',
    model: '',
    issue: '',
    estimate: '',
    advancePayment: '',
    commonFaults: []
  });

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'In Progress' | 'Completed'

  const [manualData, setManualData] = useState({
    id: '',
    customerName: '',
    phone: '',
    brand: '',
    model: '',
    issue: '',
    estimate: '',
    advancePayment: '',
    date: '',
    commonFaults: []
  });

  const currentSubstate = substates.service_registry;

  // Initialize manual ticket defaults when entering manual generator
  useEffect(() => {
    if (currentSubstate === 'manual_generator') {
      const randomId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
      const currentDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      setManualData({
        id: randomId,
        customerName: '',
        phone: '',
        brand: '',
        model: '',
        issue: '',
        estimate: '',
        advancePayment: '',
        date: currentDate,
        commonFaults: []
      });
    }
  }, [currentSubstate]);

  const getPrintTicket = () => {
    if (previewReceiptTicket) {
      return previewReceiptTicket;
    }
    if (currentSubstate === 'manual_generator') {
      return {
        id: manualData.id || 'WO-0000',
        address: manualData.customerName || 'Cliente General',
        city: manualData.phone || '',
        systemType: `${manualData.brand || ''} ${manualData.model || ''}`.trim() || 'Dispositivo',
        price: parseFloat(manualData.estimate) || 0,
        advancePayment: parseFloat(manualData.advancePayment) || 0,
        date: manualData.date || new Date().toLocaleString(),
        desc: manualData.issue || 'Sin detalles.',
        commonFaults: manualData.commonFaults || [],
        status: 'Manual',
        timeline: []
      };
    } else if (currentSubstate === 'success') {
      return lastCreatedTicket || {
        id: 'WO-0000',
        address: 'Cliente General',
        city: '',
        systemType: 'Dispositivo',
        price: 0,
        date: 'hoy',
        desc: 'Sin detalles.'
      };
    } else {
      const activeTicket = tickets.find(t => t.id === selectedTicket?.id);
      return activeTicket || null;
    }
  };

  const handleNextStep = () => {
    if (step === 1 && (!formData.customerName || !formData.phone)) {
      alert('Por favor completa el nombre del cliente y teléfono.');
      return;
    }
    if (step === 2 && !formData.brand) {
      alert('Por favor introduce la marca y modelo del dispositivo.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.issue || !formData.estimate) {
      alert('Por favor introduce el diagnóstico y el precio estimado.');
      return;
    }

    addServiceTicket({
      ...formData,
      deviceType: selectedCategory
    });
    
    // Reset form
    setFormData({
      customerName: '',
      phone: '',
      brand: '',
      model: '',
      issue: '',
      estimate: '',
      advancePayment: '',
      commonFaults: []
    });
    setStep(1);
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    await updateServiceTicket(selectedTicket.id, newStatus, newNote.trim() || null);
    setNewNote('');
  };

  // Device Categories
  const categories = [
    { name: 'Smartphones', icon: 'smartphone', desc: 'iPhone, Samsung, Pixel' },
    { name: 'Laptops', icon: 'laptop_mac', desc: 'MacBook, Dell, HP' },
    { name: 'Tablets', icon: 'tablet_android', desc: 'iPad, Galaxy Tab' },
    { name: 'Consoles', icon: 'videogame_asset', desc: 'PS5, Xbox, Switch' },
    { name: 'Audio', icon: 'headphones', desc: 'AirPods, Bose, Sony' },
    { name: 'Smart Home', icon: 'nest_eco_leaf', desc: 'IoT, Cámaras, Hubs' },
    { name: 'Peripherals', icon: 'keyboard', desc: 'Teclados, Monitores' },
    { name: 'Wearables', icon: 'watch', desc: 'Apple Watch, Fitbit' }
  ];

  // SUCCESS SUBSTATE
  if (currentSubstate === 'success') {
    const ticket = lastCreatedTicket || {
      id: 'WO-0000',
      address: 'Cliente General',
      city: '555-0100',
      systemType: 'Dispositivo',
      price: 0,
      date: 'hoy',
      desc: 'Sin detalles.'
    };

    return (
      <div className="w-full flex flex-col items-center justify-center">
        {/* Visual Confirmation Card (Hidden in print) */}
        <div className="w-full flex-1 flex flex-col items-center justify-center p-8 bg-surface min-h-[80vh] print:hidden">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-xl border border-outline-variant/20 text-left space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-outline-variant/20 pb-6">
              <div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase tracking-wider">
                  Orden Registrada
                </span>
                <h2 className="text-[24px] font-black mt-2 text-on-surface">Ticket {ticket.id}</h2>
                <p className="text-[12px] text-on-surface-variant mt-0.5">HITECH Technical Service POS</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px] fill-current">check_circle</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-on-surface-variant">Cliente</h4>
                  <p className="text-[14px] font-semibold text-on-surface mt-0.5">{ticket.address}</p>
                  <p className="text-on-surface-variant">{ticket.city}</p>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface-variant">Dispositivo</h4>
                  <p className="text-[14px] font-semibold text-on-surface mt-0.5">{ticket.systemType}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-on-surface-variant">Fecha de Registro</h4>
                  <p className="text-on-surface mt-0.5">{ticket.date}</p>
                </div>
                <div>
                  <h4 className="font-bold text-on-surface-variant">Costo Estimado</h4>
                  <p className="text-[16px] font-bold text-on-surface mt-0.5">${ticket.price.toFixed(2)}</p>
                  {ticket.advancePayment > 0 && (
                    <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Adelanto: ${ticket.advancePayment.toFixed(2)} ({ticket.advancePaid ? 'Cobrado' : 'Pendiente Cobro'})</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-b border-outline-variant/10 py-4">
              <h4 className="font-bold text-on-surface-variant text-[13px] mb-1">Diagnóstico Inicial</h4>
              <p className="text-[13px] text-on-surface leading-relaxed">{ticket.desc}</p>
            </div>

            {/* Format Selector Button Group */}
            <div className="flex items-center justify-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-outline-variant/15">
              <span className="text-[12px] font-bold text-on-surface-variant">Formato Impresión:</span>
              {['50mm', '80mm', 'A4'].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPrintSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${
                    printSize === size 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-on-surface-variant hover:bg-slate-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {ticket.advancePayment > 0 && !ticket.advancePaid && (
                <button
                  onClick={() => addServicePaymentToCart(ticket, 'advance')}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 hover:bg-amber-600 active:scale-95 transition-all cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
                  <span>Cobrar Adelanto (${ticket.advancePayment.toFixed(2)})</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => setPreviewReceiptTicket(ticket)}
                className="flex-1 py-3 bg-[#0e2a47] hover:bg-[#13375c] text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>Constancia y Recibo A4</span>
              </button>
              <button 
                onClick={() => window.print()}
                className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold rounded-xl text-[13px] flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setSubstate('service_registry', 'moderno')}
                className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">assignment</span>
                <span>Lista de Órdenes</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Ticket Layout (visible ONLY in print) */}
        <PrintableTicket ticket={ticket} printSize={printSize} />
      </div>
    );
  }

  // MANUAL TICKET GENERATOR
  if (currentSubstate === 'manual_generator') {
    const ticketPreview = {
      id: manualData.id || 'WO-0000',
      address: manualData.customerName || 'Cliente General',
      city: manualData.phone || '',
      systemType: `${manualData.brand || ''} ${manualData.model || ''}`.trim() || 'Dispositivo',
      price: parseFloat(manualData.estimate) || 0,
      date: manualData.date || new Date().toLocaleString(),
      desc: manualData.issue || 'Sin detalles.',
      commonFaults: manualData.commonFaults || [],
      status: 'Manual',
      timeline: []
    };

    return (
      <div className="space-y-6 text-left">
        {/* Visual Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-6 print:hidden">
          <div>
            <h2 className="text-[22px] font-black text-on-surface">Generador de Tickets Manual</h2>
            <p className="text-on-surface-variant text-[13px] mt-0.5">
              Llena los campos para generar e imprimir una orden de servicio con copia de respaldo.
            </p>
          </div>
          <button
            onClick={() => setSubstate('service_registry', 'moderno')}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-[13px] font-semibold transition-all cursor-pointer border border-outline-variant/35"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Volver a la Lista</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:hidden">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 space-y-6">
            <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              <span>Datos del Ticket</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Número de Ticket *</label>
                <input
                  type="text"
                  required
                  value={manualData.id}
                  onChange={(e) => setManualData({ ...manualData, id: e.target.value })}
                  placeholder="ej. WO-1024"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none font-mono font-bold text-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Fecha / Hora *</label>
                <input
                  type="text"
                  required
                  value={manualData.date}
                  onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                  placeholder="ej. 24 de jun 2026, 15:30"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={manualData.customerName}
                  onChange={(e) => setManualData({ ...manualData, customerName: e.target.value })}
                  placeholder="ej. Hamilton Cortez"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Teléfono / Contacto *</label>
                <input
                  type="text"
                  required
                  value={manualData.phone}
                  onChange={(e) => setManualData({ ...manualData, phone: e.target.value })}
                  placeholder="ej. +591 76543210"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Marca del Dispositivo *</label>
                <input
                  type="text"
                  required
                  value={manualData.brand}
                  onChange={(e) => setManualData({ ...manualData, brand: e.target.value })}
                  placeholder="ej. Apple"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Modelo *</label>
                <input
                  type="text"
                  required
                  value={manualData.model}
                  onChange={(e) => setManualData({ ...manualData, model: e.target.value })}
                  placeholder="ej. iPhone 15 Pro Max"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Diagnóstico Inicial / Falla Reportada *</label>
                <textarea
                  required
                  value={manualData.issue}
                  onChange={(e) => setManualData({ ...manualData, issue: e.target.value })}
                  placeholder="Describe detalladamente el problema..."
                  rows="3"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-2">Componentes / Fallas Comunes</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-outline-variant/15">
                  {['Pantalla', 'Teclado', 'Batería', 'Placa Madre', 'Pin de Carga', 'Software', 'Otros'].map((fault) => {
                    const isChecked = manualData.commonFaults.includes(fault);
                    return (
                      <label key={fault} className="flex items-center space-x-2 text-[12px] text-on-surface cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setManualData(prev => ({
                              ...prev,
                              commonFaults: isChecked
                                ? prev.commonFaults.filter(f => f !== fault)
                                : [...prev.commonFaults, fault]
                            }));
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant/35 accent-primary cursor-pointer"
                        />
                        <span>{fault}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Costo Estimado ($) *</label>
                <input
                  type="number"
                  required
                  value={manualData.estimate}
                  onChange={(e) => setManualData({ ...manualData, estimate: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Monto de Adelanto ($) (Opcional)</label>
                <input
                  type="number"
                  value={manualData.advancePayment}
                  onChange={(e) => setManualData({ ...manualData, advancePayment: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-outline-variant/10">
              <button
                type="button"
                onClick={() => {
                  setManualData(prev => ({
                    ...prev,
                    id: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
                    customerName: '',
                    phone: '',
                    brand: '',
                    model: '',
                    issue: '',
                    estimate: '',
                    date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) + `, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`
                  }));
                }}
                className="px-5 py-3 bg-surface-container text-on-surface rounded-xl text-[13px] font-semibold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Limpiar
              </button>
              
              <button
                type="button"
                onClick={() => {
                  if (!manualData.customerName || !manualData.phone || !manualData.brand || !manualData.issue || !manualData.estimate) {
                    alert('Por favor completa todos los campos marcados con * antes de imprimir.');
                    return;
                  }
                  window.print();
                }}
                className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                <span>Sólo Imprimir</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!manualData.customerName || !manualData.phone || !manualData.brand || !manualData.issue || !manualData.estimate) {
                    alert('Por favor completa todos los campos marcados con * antes de guardar e imprimir.');
                    return;
                  }
                  
                  // Add to database
                  await addServiceTicket(manualData);
                  
                  // Instantly open browser print dialog too
                  setTimeout(() => {
                    window.print();
                  }, 300);
                }}
                className="flex-[1.5] py-3 bg-primary text-on-primary rounded-xl font-bold text-[13px] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Guardar e Imprimir</span>
              </button>
            </div>
          </div>

          {/* Right Column: Preview & Size select */}
          <div className="lg:col-span-5 space-y-6">
            {/* Format Selector */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-sm space-y-4">
              <h4 className="text-[13px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">aspect_ratio</span>
                <span>Tamaño de Impresión</span>
              </h4>
              
              <div className="grid grid-cols-3 gap-2">
                {['50mm', '80mm', 'A4'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPrintSize(size)}
                    className={`py-2 px-3 rounded-xl border text-[12px] font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      printSize === size 
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'border-outline-variant/30 text-on-surface-variant hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-[14px]">{size}</span>
                    <span className="text-[8px] opacity-75">
                      {size === '50mm' ? 'Slim' : size === '80mm' ? 'Estándar' : 'A4 Duplicado'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="bg-slate-100 p-6 rounded-3xl border border-outline-variant/10 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h4 className="text-[12px] font-bold text-on-surface-variant">Vista Previa ({printSize})</h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-inner max-h-[380px] overflow-y-auto font-mono text-[10px] text-black">
                {printSize === '50mm' && (
                  <div className="w-full p-1 leading-tight space-y-1">
                    <div className="text-center border-b border-dashed border-slate-400 pb-1 mb-1">
                      <h2 className="text-[11px] font-bold uppercase">ORDEN SERVICIO</h2>
                      <p className="text-[7px]">Telf: {shopInfo.phone}</p>
                    </div>
                    <div className="space-y-0.5 text-[8px] border-b border-dashed border-slate-400 pb-1">
                      <p><strong>Ticket:</strong> {manualData.id || 'WO-XXXX'}</p>
                      <p><strong>Fecha:</strong> {manualData.date || '...'}</p>
                      <p><strong>Cliente:</strong> {manualData.customerName || '...'}</p>
                    </div>
                    <div className="space-y-1 text-[8px]">
                      <p><strong>Equipo:</strong> {manualData.brand} {manualData.model}</p>
                      <p><strong>Falla:</strong> {manualData.issue || '...'}</p>
                      <p className="font-bold text-right mt-1">Est: ${parseFloat(manualData.estimate || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {printSize === '80mm' && (
                  <div className="w-full p-2 leading-relaxed space-y-2">
                    <div className="text-center border-b border-dashed border-slate-400 pb-2 mb-2">
                      <h2 className="text-[12px] font-bold uppercase">ORDEN DE SERVICIO</h2>
                      <p className="text-[9px]">{shopInfo.name}</p>
                    </div>
                    <div className="space-y-1 text-[9px] border-b border-dashed border-slate-400 pb-2">
                      <p><strong>Nro. Ticket:</strong> {manualData.id || 'WO-XXXX'}</p>
                      <p><strong>Fecha Reg:</strong> {manualData.date || '...'}</p>
                      <p><strong>Cliente:</strong> {manualData.customerName || '...'}</p>
                      <p><strong>Telf:</strong> {manualData.phone || '...'}</p>
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <p><strong>Dispositivo:</strong> {manualData.brand} {manualData.model}</p>
                      <p><strong>Problema / Diagnóstico:</strong></p>
                      <p className="pl-1.5 border-l-2 border-slate-400 italic text-slate-700">{manualData.issue || '...'}</p>
                      <p className="text-[11px] font-bold text-right mt-1">Costo Estimado: ${parseFloat(manualData.estimate || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {printSize === 'A4' && (
                  <div className="w-full p-1 space-y-3 font-sans text-[8px]">
                    <div className="border border-slate-200 p-2 rounded bg-slate-50/50">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="font-bold uppercase text-[9px] text-primary">{shopInfo.name} - COPIA TALLER</span>
                        <span className="font-bold font-mono text-[9px] text-primary">{manualData.id || 'WO-XXXX'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-0.5 mt-1 text-[8px]">
                        <p><strong>Cliente:</strong> {manualData.customerName || '...'}</p>
                        <p><strong>Equipo:</strong> {manualData.brand} {manualData.model}</p>
                        <p><strong>Teléfono:</strong> {manualData.phone || '...'}</p>
                        <p><strong>Costo:</strong> ${parseFloat(manualData.estimate || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-[7px] mt-1 border-t border-slate-100 pt-1 italic text-slate-600"><strong>Falla:</strong> {manualData.issue || '...'}</p>
                    </div>

                    <div className="py-0.5 border-y border-dashed border-slate-300 text-center text-[7px] text-slate-400 select-none">
                      ✂️ - - - - - CORTE AQUÍ - - - - -
                    </div>

                    <div className="border border-slate-200 p-2 rounded bg-slate-50/50">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                        <span className="font-bold uppercase text-[9px] text-primary">{shopInfo.name} - COMPROBANTE DE RECOJO</span>
                        <span className="font-bold font-mono text-[9px] text-primary">{manualData.id || 'WO-XXXX'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-0.5 mt-1 text-[8px]">
                        <p><strong>Cliente:</strong> {manualData.customerName || '...'}</p>
                        <p><strong>Equipo:</strong> {manualData.brand} {manualData.model}</p>
                        <p><strong>Teléfono:</strong> {manualData.phone || '...'}</p>
                        <p><strong>Costo:</strong> ${parseFloat(manualData.estimate || 0).toFixed(2)}</p>
                      </div>
                      <p className="text-[7px] text-slate-500 mt-1 leading-tight">Para el recojo es obligatorio presentar este comprobante físico. {shopInfo.warranty}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Printable Ticket Layout (visible ONLY in print) */}
        <PrintableTicket ticket={ticketPreview} printSize={printSize} />
      </div>
    );
  }

  // NEW TICKET MULTI-STEP FORM
  if (currentSubstate === 'seleccion') {
    return (
      <div className="space-y-6 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-6">
          <div>
            <h2 className="text-[22px] font-black text-on-surface">Nueva Orden de Servicio</h2>
            <p className="text-on-surface-variant text-[13px] mt-0.5">
              {step === 1 && 'Paso 1: Información del cliente.'}
              {step === 2 && 'Paso 2: Especificaciones del dispositivo.'}
              {step === 3 && 'Paso 3: Diagnóstico y cotización preliminar.'}
            </p>
          </div>
          
          {/* Stepper Header */}
          <div className="flex items-center gap-2 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/20">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold ${step >= 1 ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant/40'}`}>
              <span className="material-symbols-outlined text-[16px]">{step > 1 ? 'check_circle' : 'person'}</span>
              <span>Cliente</span>
            </div>
            <div className="w-6 h-[2px] bg-outline-variant/30"></div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold ${step >= 2 ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant/45'}`}>
              <span className="material-symbols-outlined text-[16px]">{step > 2 ? 'check_circle' : 'devices'}</span>
              <span>Equipo</span>
            </div>
            <div className="w-6 h-[2px] bg-outline-variant/30"></div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold ${step === 3 ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant/45'}`}>
              <span className="material-symbols-outlined text-[16px]">biotech</span>
              <span>Diagnóstico</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant/10 max-w-4xl mx-auto">
          {/* Step 1: Customer Details */}
          {step === 1 && (
            <div className="space-y-6 max-w-md mx-auto">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                <span>Datos del Cliente</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="ej. Hamilton Cortez"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Teléfono de Contacto *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ej. +591 76543210"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Device Category Selection */}
          {step === 2 && (
            <div className="space-y-8">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">devices</span>
                <span>Selección de Dispositivo</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categories.map((cat) => {
                  const isSel = selectedCategory === cat.name;
                  return (
                    <div
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`group cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center ${
                        isSel 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-white border-outline-variant/15 hover:border-outline-variant/30'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform ${isSel ? 'bg-primary text-on-primary scale-105' : 'bg-surface-container text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold leading-tight">{cat.name}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-outline-variant/10 pt-6 max-w-md mx-auto">
                <h4 className="text-[13px] font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">edit_note</span>
                  <span>Detalles del Modelo</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Marca *</label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="ej. Apple, Dyson"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="ej. MacBook Pro M3 14"
                      className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Diagnosis details */}
          {step === 3 && (
            <div className="space-y-6 max-w-md mx-auto">
              <h3 className="text-[16px] font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">biotech</span>
                <span>Diagnóstico y Cotización</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Diagnóstico Inicial / Falla reportada *</label>
                  <textarea
                    required
                    value={formData.issue}
                    onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
                    placeholder="Describe a detalle el problema del equipo..."
                    rows="3"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-2">Componentes / Fallas Comunes</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-outline-variant/15">
                    {['Pantalla', 'Teclado', 'Batería', 'Placa Madre', 'Pin de Carga', 'Software', 'Otros'].map((fault) => {
                      const isChecked = formData.commonFaults.includes(fault);
                      return (
                        <label key={fault} className="flex items-center space-x-2 text-[12px] text-on-surface cursor-pointer py-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                commonFaults: isChecked
                                  ? prev.commonFaults.filter(f => f !== fault)
                                  : [...prev.commonFaults, fault]
                              }));
                            }}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-outline-variant/35 accent-primary cursor-pointer"
                          />
                          <span>{fault}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Cotización Estimada ($) *</label>
                  <input
                    type="number"
                    required
                    value={formData.estimate}
                    onChange={(e) => setFormData({ ...formData, estimate: e.target.value })}
                    placeholder="Monto aproximado en $"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-on-surface-variant mb-1">Monto de Adelanto ($) (Opcional)</label>
                  <input
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => setFormData({ ...formData, advancePayment: e.target.value })}
                    placeholder="Dejar vacío si no hay adelanto"
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-10 pt-6 border-t border-outline-variant/10 flex justify-between gap-4">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setSubstate('service_registry', 'moderno')}
                className="px-6 py-2.5 bg-surface-container text-on-surface rounded-xl text-[13px] font-semibold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-2.5 bg-surface-container text-on-surface rounded-xl text-[13px] font-semibold hover:bg-surface-container-high transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                <span>Atrás</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                className="px-8 py-2.5 bg-primary text-on-primary rounded-xl text-[13px] font-bold hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
                <span>Registrar Servicio</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT / LIST VIEW
  return (
    <div className="w-full">
      {/* Screen layout (hidden in print) */}
      <div className="space-y-6 text-left print:hidden">
      {/* Top Header Controls */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-[24px] font-black text-on-surface leading-tight">Órdenes de Servicio</h2>
          <p className="text-[13px] text-on-surface-variant mt-1">Administra los tickets de mantenimiento técnico</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setSubstate('service_registry', 'manual_generator')}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-semibold text-[13px] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            <span>Generar Ticket Manual</span>
          </button>
          <button
            onClick={() => setSubstate('service_registry', 'seleccion')}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-[13px] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Registrar Servicio</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-card-padding rounded-[20px] shadow-sm border border-outline-variant/10 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-outline-variant/10 pb-4 mb-4">
              <h3 className="text-[16px] font-bold">Mesa de Servicio</h3>
              
              {/* Buscador */}
              <div className="relative w-full md:max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar ticket, cliente o equipo..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[12px] outline-none"
                />
              </div>
              
              {/* Filtros de Estado */}
              <div className="flex flex-wrap gap-1">
                {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'bg-white border-outline-variant/30 text-on-surface-variant hover:bg-slate-50'
                    }`}
                  >
                    {status === 'All' ? 'Todos' : status === 'Pending' ? 'Pendientes' : status === 'In Progress' ? 'En Progreso' : 'Completados'}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="divide-y divide-outline-variant/10">
              {tickets
                .filter((ticket) => {
                  if (statusFilter !== 'All' && ticket.status !== statusFilter) return false;
                  if (searchQuery.trim() === '') return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    ticket.id.toLowerCase().includes(query) ||
                    ticket.address.toLowerCase().includes(query) ||
                    ticket.systemType.toLowerCase().includes(query)
                  );
                })
                .map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNewStatus(ticket.status);
                    setNewNote('');
                  }}
                  className={`py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer group rounded-xl px-4 hover:bg-surface-container-low transition-all ${
                    selectedTicket?.id === ticket.id ? 'bg-primary/5 border border-primary/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container overflow-hidden p-1.5 flex-shrink-0 flex items-center justify-center">
                      <img className="w-full h-full object-cover rounded-lg" alt={ticket.address} src={ticket.image} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[14px] text-on-surface">{ticket.systemType}</span>
                        <span className="font-mono text-[11px] text-primary bg-primary-fixed/20 px-2 py-0.5 rounded-full font-bold">{ticket.id}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <p className="text-[12px] text-on-surface-variant">Cliente: {ticket.address} • {ticket.city}</p>
                        {ticket.assignedTech && (
                          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-700">
                            <img src={ticket.assignedTech.img} alt="" className="w-4 h-4 rounded-full object-cover" />
                            <span>{ticket.assignedTech.name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewReceiptTicket(ticket);
                      }}
                      className="px-2.5 py-1.5 bg-[#0e2a47]/10 hover:bg-[#0e2a47] text-[#0e2a47] hover:text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-[#0e2a47]/20"
                      title="Ver e Imprimir Constancia y Recibo Oficial A4"
                    >
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      <span className="hidden sm:inline">Recibo A4</span>
                    </button>
                    <div className="text-right">
                      <p className="text-[14px] font-black text-on-surface">${ticket.price.toFixed(2)}</p>
                      <p className="text-[11px] text-on-surface-variant">{ticket.date}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      ticket.status === 'Completed'
                        ? 'bg-primary-fixed/20 border-primary/10 text-primary'
                        : ticket.status === 'Pending'
                          ? 'bg-error-container/20 border-error/10 text-error'
                          : 'bg-secondary-fixed/30 border-secondary/15 text-secondary'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Ticket Details Drawer/Drawer side view */}
        <div className="lg:col-span-4 bg-white p-card-padding rounded-[20px] border border-outline-variant/10 shadow-sm text-left">
          {(() => {
            const activeTicket = tickets.find(t => t.id === selectedTicket?.id);
            if (!activeTicket) {
              return (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/40">assignment_turned_in</span>
                  <p className="text-[13px] text-on-surface-variant max-w-[200px]">Selecciona una orden de servicio para ver los detalles e historial.</p>
                </div>
              );
            }
            
            return (
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-outline-variant/10 pb-4">
                  <div>
                    <h3 className="font-bold text-[16px]">{activeTicket.systemType}</h3>
                    <p className="text-[12px] text-primary font-mono font-bold mt-0.5">{activeTicket.id}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    activeTicket.status === 'Completed'
                      ? 'bg-primary-fixed/20 border-primary/10 text-primary'
                      : activeTicket.status === 'Pending'
                        ? 'bg-error-container/20 border-error/10 text-error'
                        : 'bg-secondary-fixed/30 border-secondary/15 text-secondary'
                  }`}>
                    {activeTicket.status}
                  </span>
                </div>

                <div className="space-y-4 text-[13px]">
                  <div>
                    <h4 className="font-bold text-on-surface-variant">Cliente</h4>
                    <p className="font-semibold text-on-surface mt-0.5">{activeTicket.address}</p>
                    <p className="text-on-surface-variant">{activeTicket.city}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface-variant">Falla Reportada</h4>
                    <p className="text-on-surface leading-relaxed mt-0.5">{activeTicket.desc}</p>
                  </div>
                  {activeTicket.commonFaults && activeTicket.commonFaults.length > 0 && (
                    <div>
                      <h4 className="font-bold text-on-surface-variant">Fallas Detectadas</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {activeTicket.commonFaults.map((fault) => (
                          <span key={fault} className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-on-surface-variant text-[11px] font-medium rounded-md">
                            {fault}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                    <h4 className="font-bold text-on-surface-variant text-[11px] uppercase tracking-wider mb-1">Desglose de Pagos</h4>
                    
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-on-surface-variant">Costo Estimado:</span>
                      <span className="font-black text-on-surface">${activeTicket.price.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-on-surface-variant">Adelanto Dejado:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-on-surface">${(activeTicket.advancePayment || 0).toFixed(2)}</span>
                        {(activeTicket.advancePayment || 0) > 0 ? (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                            activeTicket.advancePaid 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {activeTicket.advancePaid ? 'Cobrado' : 'Impago'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-semibold">(Ninguno)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[12px] border-t border-slate-200/80 pt-2">
                      <span className="font-bold text-on-surface">Saldo Restante:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[15px] text-primary">
                          ${((activeTicket.price || 0) - (activeTicket.advancePaid ? (activeTicket.advancePayment || 0) : 0)).toFixed(2)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          activeTicket.fullyPaid 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {activeTicket.fullyPaid ? 'Liquidado' : 'Pendiente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment POS Action Buttons */}
                  <div className="space-y-2 mt-2">
                    {activeTicket.advancePayment > 0 && !activeTicket.advancePaid && (
                      <button
                        type="button"
                        onClick={() => addServicePaymentToCart(activeTicket, 'advance')}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-[12px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        <span>Cobrar Adelanto en POS (${activeTicket.advancePayment.toFixed(2)})</span>
                      </button>
                    )}

                    {!activeTicket.fullyPaid && (
                      <button
                        type="button"
                        onClick={() => addServicePaymentToCart(activeTicket, 'balance')}
                        className="w-full py-2.5 bg-primary hover:brightness-105 text-on-primary rounded-xl font-bold text-[12px] shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">point_of_sale</span>
                        <span>Cobrar Saldo en POS (${((activeTicket.price || 0) - (activeTicket.advancePaid ? (activeTicket.advancePayment || 0) : 0)).toFixed(2)})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Técnico Asignado */}
                <div className="border-t border-outline-variant/10 pt-4 space-y-3">
                  <h4 className="font-bold text-on-surface-variant text-[13px]">Técnico Asignado</h4>
                  {activeTicket.assignedTech ? (
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <img 
                          src={activeTicket.assignedTech.img} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover border border-primary/20"
                        />
                        <div>
                          <p className="text-[12px] font-bold text-on-surface">{activeTicket.assignedTech.name}</p>
                          <p className="text-[9px] text-on-surface-variant">{activeTicket.assignedTech.role || 'Técnico Encargado'}</p>
                        </div>
                      </div>
                      <select
                        value={activeTicket.assignedTech.name}
                        onChange={async (e) => {
                          const selectedName = e.target.value;
                          if (selectedName === 'none') {
                            await updateServiceTicket(activeTicket.id, activeTicket.status, 'Técnico desasignado del equipo.', null);
                          } else {
                            const techObj = onDutyTeam.find(t => t.name === selectedName);
                            if (techObj) {
                              await updateServiceTicket(activeTicket.id, activeTicket.status, `Reasignado a técnico: ${techObj.name}`, techObj);
                            }
                          }
                        }}
                        className="text-[11px] font-semibold text-primary bg-transparent border-none outline-none cursor-pointer max-w-[90px]"
                      >
                        <option value="none">Quitar...</option>
                        {onDutyTeam.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-dashed border-outline-variant/40">
                      <p className="text-[11px] text-on-surface-variant">Sin técnico asignado a este equipo.</p>
                      <select
                        defaultValue="none"
                        onChange={async (e) => {
                          const selectedName = e.target.value;
                          if (selectedName !== 'none') {
                            const techObj = onDutyTeam.find(t => t.name === selectedName);
                            if (techObj) {
                              await updateServiceTicket(activeTicket.id, activeTicket.status, `Técnico asignado: ${techObj.name}`, techObj);
                            }
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-xl text-[11px] font-semibold outline-none focus:border-primary cursor-pointer text-on-surface-variant"
                      >
                        <option value="none">-- Seleccionar Técnico --</option>
                        {onDutyTeam.map(t => (
                          <option key={t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="border-t border-outline-variant/10 pt-4 space-y-4">
                  <h4 className="font-bold text-on-surface-variant text-[13px]">Historial de Progreso</h4>
                  
                  <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-outline-variant/20">
                    {activeTicket.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-primary ring-2 ring-white"></div>
                        <div>
                          <p className="text-[11px] text-on-surface-variant font-bold leading-none">{event.date}</p>
                          <p className="text-[12px] text-on-surface mt-0.5">{event.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technician Update Panel */}
                <form onSubmit={handleUpdateTicket} className="border-t border-outline-variant/10 pt-4 space-y-4">
                  <h4 className="font-bold text-on-surface-variant text-[13px]">Actualizar Estado y Bitácora</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Estado de la Orden</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] font-medium outline-none focus:border-primary"
                      >
                        <option value="Pending">Pendiente (Pending)</option>
                        <option value="In Progress">En Progreso (In Progress)</option>
                        <option value="Completed">Completado (Completed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Agregar Nota al Historial</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Ej. Diagnóstico listo, repuesto instalado..."
                          className="w-full pl-3 pr-10 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary"
                        />
                        <button
                          type="submit"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:brightness-105 active:scale-90 transition-all cursor-pointer border-none"
                          title="Enviar actualización"
                        >
                          <span className="material-symbols-outlined text-[16px]">send</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Format Selector Button Group */}
                <div className="flex items-center justify-between gap-2 bg-slate-100 p-2 rounded-xl border border-outline-variant/15 mt-4">
                  <span className="text-[11px] font-bold text-on-surface-variant">Formato:</span>
                  <div className="flex gap-1">
                    {['50mm', '80mm', 'A4'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setPrintSize(size)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
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

                {/* Print buttons for active ticket */}
                <div className="space-y-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setPreviewReceiptTicket(activeTicket)}
                    className="w-full py-3 bg-[#0e2a47] hover:bg-[#13375c] text-white rounded-xl font-bold text-[13px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">description</span>
                    <span>Ver Constancia y Recibo (A4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface rounded-xl font-bold text-[12px] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">print</span>
                    <span>Imprimir según Formato ({printSize})</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      </div>

      {/* Official Receipt Preview Modal */}
      {previewReceiptTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 print:hidden overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0e2a47] text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-amber-400">description</span>
                <div>
                  <h3 className="text-[16px] font-black uppercase tracking-wide">
                    Constancia y Recibo Oficial (A4)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Documento de respaldo técnico y comercial - Válido para trámites administrativos y bancarios
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPrintSize('A4');
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewReceiptTicket(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Paper Preview */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200/70">
              <div className="bg-white shadow-2xl rounded-sm border border-slate-300 transform scale-95 origin-top">
                <OfficialServiceReceipt ticket={previewReceiptTicket} shopInfo={shopInfo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Ticket Layout (visible ONLY in print) */}
      <PrintableTicket ticket={getPrintTicket()} printSize={printSize} />
    </div>
  );
}

// Reusable Printable Ticket Component for 50mm, 80mm and A4 Formats
function PrintableTicket({ ticket, printSize }) {
  const { shopInfo } = useApp();
  if (!ticket) return null;
  
  const price = typeof ticket.price === 'number' ? ticket.price : parseFloat(ticket.price) || 0;
  
  return (
    <div className="hidden print:block text-black">
      {/* 50mm Thermal Print Format */}
      {printSize === '50mm' && (
        <div className="w-[50mm] mx-auto p-1 bg-white font-mono text-[9px] leading-tight">
          <div className="text-center border-b border-dashed border-slate-400 pb-1.5 mb-2">
            <h2 className="text-[11px] font-bold uppercase tracking-wide">ORDEN SERVICIO</h2>
            <p className="text-[8px] text-slate-700">Telf: {shopInfo.phone}</p>
          </div>
          <div className="space-y-0.5 mb-2 text-[8px] text-slate-800 border-b border-dashed border-slate-400 pb-1.5">
            <p><strong>Ticket:</strong> {ticket.id}</p>
            <p><strong>Fecha:</strong> {ticket.date?.split(',')[0]}</p>
            <p><strong>Cliente:</strong> {ticket.address?.split(' ')[0]}</p>
            {ticket.city && <p><strong>Telf:</strong> {ticket.city}</p>}
            {ticket.assignedTech && <p><strong>Téc:</strong> {ticket.assignedTech.name.split(' ')[0]}</p>}
          </div>
          <div className="space-y-1 mb-2 text-[8px]">
            <p><strong>Equipo:</strong> {ticket.systemType}</p>
            {ticket.commonFaults && ticket.commonFaults.length > 0 && (
              <p><strong>Fallas:</strong> {ticket.commonFaults.join(', ')}</p>
            )}
            <p><strong>Falla:</strong> {ticket.desc}</p>
            <p className="text-right mt-1">Est: ${price.toFixed(2)}</p>
            {ticket.advancePayment > 0 && (
              <>
                <p className="text-right">Adelanto: ${(ticket.advancePayment || 0).toFixed(2)} ({ticket.advancePaid ? 'Pagado' : 'Impago'})</p>
                <p className="font-bold text-right">Saldo: ${(price - (ticket.advancePaid ? (ticket.advancePayment || 0) : 0)).toFixed(2)}</p>
              </>
            )}
          </div>
          <div className="text-center mt-3 border-t border-dashed border-slate-400 pt-1.5 text-[7px] text-slate-500">
            <p>SISTECH Servicios Técnicos</p>
          </div>
        </div>
      )}

      {/* 80mm Thermal Print Format */}
      {printSize === '80mm' && (
        <div className="w-[80mm] mx-auto p-4 bg-white font-mono text-[12px] leading-relaxed">
          <div className="text-center border-b border-dashed border-slate-400 pb-3 mb-3">
            <h2 className="text-[15px] font-bold uppercase tracking-wide">ORDEN DE SERVICIO</h2>
            <p className="text-[10px] text-slate-700">{shopInfo.name}</p>
            <p className="text-[10px] text-slate-700">{shopInfo.address}</p>
            <p className="text-[10px] text-slate-700">RUC: {shopInfo.ruc}</p>
            <p className="text-[10px] text-slate-700 mt-0.5">Telf: {shopInfo.phone}</p>
          </div>

          <div className="space-y-1 mb-3 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3">
            <p><strong>Nro. Ticket:</strong> {ticket.id}</p>
            <p><strong>Fecha Reg:</strong> {ticket.date}</p>
            <p><strong>Cliente:</strong> {ticket.address}</p>
            <p><strong>Telf/Contacto:</strong> {ticket.city}</p>
            <p><strong>Estado:</strong> {ticket.status?.toUpperCase() || 'PENDIENTE'}</p>
            {ticket.assignedTech && <p><strong>Técnico:</strong> {ticket.assignedTech.name}</p>}
          </div>

          <div className="space-y-2 mb-3 text-[11px] text-slate-800 border-b border-dashed border-slate-400 pb-3">
            <p><strong>Dispositivo:</strong> {ticket.systemType}</p>
            {ticket.commonFaults && ticket.commonFaults.length > 0 && (
              <p><strong>Fallas Comunes:</strong> {ticket.commonFaults.join(', ')}</p>
            )}
            <p><strong>Problema / Diagnóstico:</strong></p>
            <p className="pl-2 border-l-2 border-slate-400 italic text-slate-700 leading-normal">{ticket.desc}</p>
            <div className="text-right mt-2 space-y-0.5 text-black">
              <p className="text-[11px]">Costo Estimado: ${price.toFixed(2)}</p>
              {ticket.advancePayment > 0 && (
                <>
                  <p className="text-[11px]">Adelanto Dejado: ${(ticket.advancePayment || 0).toFixed(2)} ({ticket.advancePaid ? 'Cobrado' : 'Impago'})</p>
                </>
              )}
              <p className="text-[13px] font-bold border-t border-dashed border-slate-300 pt-1">
                Saldo Pendiente: ${(price - (ticket.advancePaid ? (ticket.advancePayment || 0) : 0)).toFixed(2)}
              </p>
            </div>
          </div>

          {ticket.timeline && ticket.timeline.length > 0 && (
            <div className="mb-3 text-[10px] text-slate-800 border-b border-dashed border-slate-400 pb-3">
              <p className="font-bold mb-1">Bitácora de Progreso:</p>
              <div className="space-y-1 pl-1">
                {ticket.timeline.map((event, idx) => (
                  <div key={idx} className="flex justify-between border-b border-dotted border-slate-200 py-0.5">
                    <span className="font-semibold w-16">{event.date}:</span>
                    <span className="flex-1 text-slate-700">{event.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center mt-6 pt-3 text-[9px] text-slate-600 space-y-6">
            <div className="flex justify-between pt-6">
              <div className="w-[45%] border-t border-slate-400 text-center pt-1 mt-4">
                Firma Cliente
              </div>
              <div className="w-[45%] border-t border-slate-400 text-center pt-1 mt-4">
                Firma Técnico
              </div>
            </div>
            <p className="mt-4 font-semibold text-[8px]">{shopInfo.warranty}</p>
          </div>
        </div>
      )}

      {/* A4 Constancia y Recibo Oficial */}
      {printSize === 'A4' && (
        <OfficialServiceReceipt ticket={ticket} shopInfo={shopInfo} />
      )}
    </div>
  );
}
