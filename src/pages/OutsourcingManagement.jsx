import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import OutsourcingMap from '../components/OutsourcingMap';
import OutsourcingDeliveryReceipt from '../components/OutsourcingDeliveryReceipt';
import AgencyLocationPickerMap from '../components/AgencyLocationPickerMap';

export default function OutsourcingManagement() {
  const { 
    outsourcingAgencies = [], 
    outsourcingClients = [],
    addOutsourcingClient,
    updateOutsourcingClient,
    deleteOutsourcingClient,
    addAgencyTonerStock, 
    requestAgencyRestock, 
    addOutsourcingAgency,
    updateAgency,
    deleteAgency,
    consumeAgencyToner,
    shopInfo,
    currentUser 
  } = useApp();

  // Filters & Selection
  const [selectedClientId, setSelectedClientId] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);

  // Modals state
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isNewAgencyModalOpen, setIsNewAgencyModalOpen] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState(null);
  const [activeTab, setActiveTab] = useState('split'); // 'split', 'map', 'list'

  // Client Management Modals & State
  const [isClientsModalOpen, setIsClientsModalOpen] = useState(false);
  const [clientModalTab, setClientModalTab] = useState('list'); // 'list' | 'create'
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
    id: '',
    name: '',
    code: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    contractSla: '',
    city: '',
    address: '',
    notes: ''
  });

  const [newClientForm, setNewClientForm] = useState({
    name: '',
    code: '',
    contactPerson: '',
    contactPhone: '+591 ',
    contactEmail: '',
    contractSla: 'SLA Platino 24/7 (Reposición < 2 horas)',
    city: 'Tarija',
    address: '',
    notes: ''
  });

  // Agency Editing State
  const [isEditAgencyModalOpen, setIsEditAgencyModalOpen] = useState(false);
  const [editAgencyForm, setEditAgencyForm] = useState(null);

  // If user is a corporate client (e.g. Banco Unión), auto-lock to their client
  const isCorporateClient = currentUser?.role === 'cliente_outsourcing';
  const effectiveClientId = isCorporateClient ? (currentUser.clientId || 'CLI-BANCO-UNION') : selectedClientId;

  // Extract merged unique clients (from explicit clients and existing agencies)
  const clientOptions = useMemo(() => {
    const map = new Map();
    (outsourcingClients || []).forEach(c => {
      map.set(c.id, { id: c.id, name: c.name, code: c.code, ...c });
    });
    (outsourcingAgencies || []).forEach(a => {
      if (!map.has(a.clientId)) {
        map.set(a.clientId, { id: a.clientId, name: a.clientName, code: a.clientCode });
      }
    });
    return Array.from(map.values());
  }, [outsourcingClients, outsourcingAgencies]);

  // Filtered agencies
  const filteredAgencies = useMemo(() => {
    return outsourcingAgencies.filter(agency => {
      // Client filter
      if (effectiveClientId !== 'ALL' && agency.clientId !== effectiveClientId) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && agency.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = agency.agencyName.toLowerCase().includes(q);
        const matchesCity = agency.city.toLowerCase().includes(q);
        const matchesAddress = agency.address.toLowerCase().includes(q);
        const matchesClient = agency.clientName.toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesAddress && !matchesClient) {
          return false;
        }
      }
      return true;
    });
  }, [outsourcingAgencies, effectiveClientId, statusFilter, searchQuery]);

  // Selected agency object
  const selectedAgency = useMemo(() => {
    return outsourcingAgencies.find(a => a.id === selectedAgencyId) || null;
  }, [outsourcingAgencies, selectedAgencyId]);

  // KPI calculations
  const stats = useMemo(() => {
    const relevant = effectiveClientId === 'ALL' 
      ? outsourcingAgencies 
      : outsourcingAgencies.filter(a => a.clientId === effectiveClientId);

    const totalAgencies = relevant.length;
    let totalToners = 0;
    let criticalCount = 0;
    let alertCount = 0;
    let optimalCount = 0;

    relevant.forEach(a => {
      const backup = a.toners?.reduce((s, t) => s + (t.currentStock || 0), 0) ?? 0;
      totalToners += backup;
      if (backup === 0 || a.status === 'critico') criticalCount++;
      else if (backup <= 2 || a.status === 'alerta') alertCount++;
      else optimalCount++;
    });

    return { totalAgencies, totalToners, criticalCount, alertCount, optimalCount };
  }, [outsourcingAgencies, effectiveClientId]);

  // State for recording a new delivery
  const [deliveryForm, setDeliveryForm] = useState({
    tonerId: '',
    quantity: 2,
    technician: 'Ing. Milton Berthy Choque Canaviri',
    serialNumber: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    consumableType: 'Tóner',
    notes: 'Entrega regular según contrato de reposición preventiva.'
  });

  // State for installing / consuming toner in a printer
  const [installForm, setInstallForm] = useState({
    tonerId: '',
    printerModel: '',
    printerSerial: '',
    serialNumber: '',
    consumableType: 'Tóner',
    installDate: new Date().toISOString().split('T')[0],
    installedBy: '',
    notes: 'Sustitución de cartucho agotado en impresora.',
    quantity: 1
  });

  const handleOpenDeliveryModal = (t = null) => {
    const defaultToner = t || selectedAgency?.toners?.[0];
    setDeliveryForm({
      tonerId: defaultToner ? defaultToner.id : '',
      quantity: 2,
      technician: currentUser?.name && currentUser.role === 'tecnico' ? currentUser.name : 'Ing. Milton Berthy Choque Canaviri',
      serialNumber: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      consumableType: defaultToner?.type || 'Tóner',
      notes: 'Entrega regular según contrato de reposición preventiva.'
    });
    setIsDeliveryModalOpen(true);
  };

  const handleOpenInstallModal = (t = null) => {
    const defaultToner = t || selectedAgency?.toners?.[0];
    const defaultPrinter = selectedAgency?.printers?.find(p => p.model === defaultToner?.compatiblePrinter) || selectedAgency?.printers?.[0];
    setInstallForm({
      tonerId: defaultToner ? defaultToner.id : '',
      printerModel: defaultPrinter ? `${defaultPrinter.model} (${defaultPrinter.location})` : (defaultToner?.compatiblePrinter || ''),
      printerSerial: defaultPrinter?.serial || '',
      serialNumber: '',
      consumableType: defaultToner?.type || 'Tóner',
      installDate: new Date().toISOString().split('T')[0],
      installedBy: currentUser?.name || 'Personal de Agencia',
      notes: 'Sustitución de cartucho agotado en impresora.',
      quantity: 1
    });
    setIsInstallModalOpen(true);
  };

  const handleInstallToner = (e) => {
    e.preventDefault();
    if (!selectedAgency || !installForm.tonerId) return;

    const matchedToner = selectedAgency.toners?.find(t => t.id === installForm.tonerId);
    const itemConsumableType = installForm.consumableType || matchedToner?.type || 'Tóner';
    const itemSerial = installForm.serialNumber?.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemDate = installForm.installDate || new Date().toISOString().split('T')[0];

    const success = consumeAgencyToner(
      selectedAgency.id,
      installForm.tonerId,
      installForm.printerModel,
      installForm.installedBy || currentUser?.name || 'Personal de Agencia',
      installForm.notes,
      parseInt(installForm.quantity, 10) || 1,
      {
        serialNumber: itemSerial,
        installDate: itemDate,
        consumableType: itemConsumableType,
        printerSerial: installForm.printerSerial || ''
      }
    );

    if (success) {
      setIsInstallModalOpen(false);
    }
  };

  // State for new agency form
  const [newAgencyForm, setNewAgencyForm] = useState({
    clientId: 'CLI-BANCO-UNION',
    clientName: 'Banco Unión S.A.',
    clientCode: 'BUN',
    agencyName: '',
    city: 'Tarija',
    address: '',
    lat: -21.5332,
    lng: -64.7339,
    contactPerson: '',
    contactPhone: '+591 ',
    printerModel: 'HP LaserJet Enterprise M507dn',
    tonerModel: 'HP 89A (CF289A)',
    consumableType: 'Tóner',
    color: 'Negro',
    initialStock: 2,
    minStock: 2
  });

  // Handle Delivery Submission
  const handleRecordDelivery = (e) => {
    e.preventDefault();
    if (!selectedAgency || !deliveryForm.tonerId) return;

    const matchedToner = selectedAgency.toners.find(t => t.id === deliveryForm.tonerId);
    if (!matchedToner) return;

    const qty = parseInt(deliveryForm.quantity, 10) || 1;
    const itemConsumableType = deliveryForm.consumableType || matchedToner.type || 'Tóner';
    const itemSerial = deliveryForm.serialNumber?.trim() || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    const itemDate = deliveryForm.deliveryDate || new Date().toISOString().split('T')[0];

    addAgencyTonerStock(
      selectedAgency.id,
      deliveryForm.tonerId,
      qty,
      deliveryForm.technician,
      deliveryForm.notes,
      {
        serialNumber: itemSerial,
        deliveryDate: itemDate,
        consumableType: itemConsumableType
      }
    );

    // Prepare receipt
    setCurrentReceiptData({
      id: `REM-2026-${Math.floor(100 + Math.random() * 900)}`,
      date: itemDate,
      technician: deliveryForm.technician,
      serialNumber: itemSerial,
      consumableType: itemConsumableType,
      notes: deliveryForm.notes,
      tonersDelivered: [
        {
          model: matchedToner.model,
          color: matchedToner.color,
          compatiblePrinter: matchedToner.compatiblePrinter,
          quantity: qty,
          serialNumber: itemSerial,
          consumableType: itemConsumableType
        }
      ]
    });

    setIsDeliveryModalOpen(false);
  };

  // Handle New Agency Submission
  const handleCreateAgency = (e) => {
    e.preventDefault();
    if (!newAgencyForm.agencyName || !newAgencyForm.address) return;

    const matchedClient = clientOptions.find(c => c.id === newAgencyForm.clientId) || {
      id: 'CLI-CUSTOM',
      name: newAgencyForm.clientName,
      code: 'EMP'
    };

    const newAgency = {
      id: `AG-${matchedClient.code}-${Math.floor(10 + Math.random() * 90)}`,
      clientId: matchedClient.id,
      clientName: matchedClient.name,
      clientCode: matchedClient.code,
      agencyName: newAgencyForm.agencyName,
      city: newAgencyForm.city,
      address: newAgencyForm.address,
      lat: parseFloat(newAgencyForm.lat) || -21.5332,
      lng: parseFloat(newAgencyForm.lng) || -64.7339,
      contactPerson: newAgencyForm.contactPerson || 'Encargado de Agencia',
      contactPhone: newAgencyForm.contactPhone || '+591 70000000',
      status: parseInt(newAgencyForm.initialStock, 10) === 0 ? 'critico' : parseInt(newAgencyForm.initialStock, 10) <= 2 ? 'alerta' : 'optimo',
      lastReplenished: new Date().toLocaleDateString('es-ES'),
      printers: [
        { model: newAgencyForm.printerModel, location: 'Área Principal / Cajas', serial: `EQ-${Math.floor(1000 + Math.random() * 9000)}` }
      ],
      toners: [
        {
          id: `TON-${Math.floor(100 + Math.random() * 900)}`,
          model: newAgencyForm.tonerModel,
          type: newAgencyForm.consumableType || 'Tóner',
          color: newAgencyForm.color || 'Negro',
          yieldPages: '10,000 págs',
          currentStock: parseInt(newAgencyForm.initialStock, 10) || 0,
          minStock: parseInt(newAgencyForm.minStock, 10) || 2,
          compatiblePrinter: newAgencyForm.printerModel
        }
      ],
      deliveryHistory: []
    };

    addOutsourcingAgency(newAgency);
    setIsNewAgencyModalOpen(false);
    setSelectedAgencyId(newAgency.id);
  };

  // Handle New Corporate Client Submission
  const handleCreateClient = (e) => {
    e.preventDefault();
    if (!newClientForm.name.trim() || !newClientForm.code.trim()) {
      alert('Por favor introduce el nombre y código del cliente corporativo.');
      return;
    }
    addOutsourcingClient(newClientForm);
    setNewClientForm({
      name: '',
      code: '',
      contactPerson: '',
      contactPhone: '+591 ',
      contactEmail: '',
      contractSla: 'SLA Platino 24/7 (Reposición < 2 horas)',
      city: 'Tarija',
      address: '',
      notes: ''
    });
    setClientModalTab('list');
  };

  const handleOpenEditClient = (client) => {
    setEditClientForm({
      id: client.id,
      name: client.name,
      code: client.code,
      contactPerson: client.contactPerson || '',
      contactPhone: client.contactPhone || '',
      contactEmail: client.contactEmail || '',
      contractSla: client.contractSla || 'SLA Estándar 24/7',
      city: client.city || 'Tarija',
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsEditClientModalOpen(true);
  };

  const handleSaveEditClient = (e) => {
    e.preventDefault();
    if (!editClientForm.name.trim() || !editClientForm.code.trim()) return;
    updateOutsourcingClient(editClientForm.id, editClientForm);
    setIsEditClientModalOpen(false);
  };

  const handleDeleteClient = (client) => {
    deleteOutsourcingClient(client.id);
  };

  // Agency Editing Handlers
  const handleOpenEditAgency = (agency) => {
    setEditAgencyForm({
      id: agency.id,
      clientId: agency.clientId,
      clientName: agency.clientName,
      clientCode: agency.clientCode,
      agencyName: agency.agencyName,
      city: agency.city,
      address: agency.address,
      lat: agency.lat,
      lng: agency.lng,
      contactPerson: agency.contactPerson || '',
      contactPhone: agency.contactPhone || '',
      contactEmail: agency.contactEmail || '',
      printers: JSON.parse(JSON.stringify(agency.printers || [])),
      toners: JSON.parse(JSON.stringify(agency.toners || []))
    });
    setIsEditAgencyModalOpen(true);
  };

  const handleAddConsumableToEditAgency = (preset = null) => {
    const defaultConsumable = preset || {
      id: `TON-${Math.floor(100 + Math.random() * 900)}`,
      model: 'Bolsa de Tinta Epson T11A Black',
      type: 'Bolsa de Tinta',
      color: 'Negro',
      yieldPages: '10,000 págs',
      currentStock: 2,
      minStock: 1,
      compatiblePrinter: 'Epson WorkForce Enterprise AM-C400'
    };
    setEditAgencyForm(prev => ({
      ...prev,
      toners: [...(prev.toners || []), { ...defaultConsumable, id: `TON-${Date.now()}-${Math.floor(Math.random() * 100)}` }]
    }));
  };

  const handleRemoveConsumableFromEditAgency = (index) => {
    setEditAgencyForm(prev => ({
      ...prev,
      toners: (prev.toners || []).filter((_, i) => i !== index)
    }));
  };

  const handleAddPrinterToEditAgency = () => {
    const newPrinter = {
      model: 'Epson WorkForce Enterprise AM-C400',
      location: 'Cajas / Mostrador',
      serial: `EQ-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setEditAgencyForm(prev => ({
      ...prev,
      printers: [...(prev.printers || []), newPrinter]
    }));
  };

  const handleRemovePrinterFromEditAgency = (index) => {
    setEditAgencyForm(prev => ({
      ...prev,
      printers: (prev.printers || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveEditAgency = (e) => {
    e.preventDefault();
    if (!editAgencyForm || !editAgencyForm.agencyName || !editAgencyForm.address) return;
    const client = clientOptions.find(c => c.id === editAgencyForm.clientId);
    
    // Recalculate status based on current stock of toners
    const totalBackup = (editAgencyForm.toners || []).reduce((s, t) => s + (parseInt(t.currentStock, 10) || 0), 0);
    const hasZero = (editAgencyForm.toners || []).some(t => (parseInt(t.currentStock, 10) || 0) === 0);
    const hasLow = (editAgencyForm.toners || []).some(t => (parseInt(t.currentStock, 10) || 0) <= (parseInt(t.minStock, 10) || 2));
    let newStatus = 'optimo';
    if (totalBackup === 0 || hasZero) newStatus = 'critico';
    else if (totalBackup <= 2 || hasLow) newStatus = 'alerta';

    updateAgency(editAgencyForm.id, {
      ...editAgencyForm,
      status: newStatus,
      clientName: client?.name || editAgencyForm.clientName,
      clientCode: client?.code || editAgencyForm.clientCode,
      lat: parseFloat(editAgencyForm.lat) || -21.5332,
      lng: parseFloat(editAgencyForm.lng) || -64.7339
    });
    setIsEditAgencyModalOpen(false);
  };

  const handleDeleteAgency = (agency) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la sucursal "${agency.agencyName}"? Esta acción no se puede deshacer.`)) {
      deleteAgency(agency.id);
      if (selectedAgencyId === agency.id) {
        setSelectedAgencyId(null);
      }
    }
  };

  // Direct WhatsApp Restock Alert
  const openWhatsAppRestock = (agency) => {
    const tonersText = (agency.toners || [])
      .map(t => `• ${t.model}: ${t.currentStock} un. en reserva (mínimo: ${t.minStock})`)
      .join('%0A');

    const msg = `*SOLICITUD DE REPOSICIÓN DE TÓNERS*%0A%0A` +
      `*Cliente:* ${agency.clientName}%0A` +
      `*Agencia:* ${agency.agencyName}%0A` +
      `*Dirección:* ${agency.address} (${agency.city})%0A` +
      `*Contacto:* ${agency.contactPerson} (${agency.contactPhone})%0A%0A` +
      `*Estado de Reserva de Tóners:*%0A${tonersText}%0A%0A` +
      `_Favor coordinar la remesa con SISTECH Outsourcing._`;

    requestAgencyRestock(agency.id, 'Alerta emitida por WhatsApp');
    const cleanShopPhone = (shopInfo?.phone || '+59170000000').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanShopPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-fixed mb-2">
            <span className="material-symbols-outlined text-[18px]">hub</span>
            <span>Portal de Outsourcing y Suministros</span>
            {isCorporateClient && (
              <span className="bg-primary px-2 py-0.5 rounded-full text-white text-[10px]">
                Vista de Cliente: {currentUser.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Monitoreo de Tóners & Sucursales
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Supervisa el nivel de stock en reserva (backup) en cada agencia bancaria y empresarial con geolocalización en mapa y alertas de reposición inmediata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 relative z-10">
          {!isCorporateClient && (
            <button
              onClick={() => {
                setClientModalTab('list');
                setIsClientsModalOpen(true);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 border border-white/15 transition-all cursor-pointer shadow-sm"
              title="Administrar empresas y clientes corporativos"
            >
              <span className="material-symbols-outlined text-[18px]">business</span>
              <span>Clientes ({outsourcingClients.length})</span>
            </button>
          )}

          {!isCorporateClient && (
            <button
              onClick={() => setIsNewAgencyModalOpen(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
              <span>+ Nueva Agencia</span>
            </button>
          )}

          <div className="bg-white/10 p-1 rounded-xl flex items-center border border-white/10 w-full sm:w-auto justify-around sm:justify-start">
            <button
              onClick={() => setActiveTab('split')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'split' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}
              title="Vista Dividida (Mapa y Lista)"
            >
              <span className="material-symbols-outlined text-[16px]">view_sidebar</span>
              <span>Dividida</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'map' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}
              title="Solo Mapa Geoespacial"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Mapa</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${activeTab === 'list' ? 'bg-white text-slate-900 shadow' : 'text-slate-300 hover:text-white'}`}
              title="Solo Lista de Agencias"
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Agencias */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">domain</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Agencias</span>
            <span className="text-2xl font-black text-on-surface">{stats.totalAgencies}</span>
            <span className="text-[10px] text-slate-500 block">Monitoreadas</span>
          </div>
        </div>

        {/* Tóners en Reserva Total */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">inventory_2</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tóners Reserva</span>
            <span className="text-2xl font-black text-on-surface">{stats.totalToners}</span>
            <span className="text-[10px] text-slate-500 block">Cartuchos en agencias</span>
          </div>
        </div>

        {/* Críticos (Rojo) */}
        <div className={`bg-surface-container-lowest border rounded-2xl p-4 shadow-sm flex items-center gap-3 ${stats.criticalCount > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-outline-variant/30'}`}>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 relative">
            {stats.criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping" />
            )}
            <span className="material-symbols-outlined text-[24px]">warning</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">Crítico (0 Tóners)</span>
            <span className="text-2xl font-black text-rose-600">{stats.criticalCount}</span>
            <span className="text-[10px] text-rose-500 font-bold block">Reposición urgente</span>
          </div>
        </div>

        {/* Alerta (Amarillo) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">notification_important</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">Alerta (1-2 un.)</span>
            <span className="text-2xl font-black text-amber-600">{stats.alertCount}</span>
            <span className="text-[10px] text-slate-500 block">Por reponer pronto</span>
          </div>
        </div>

        {/* Óptimo (Verde) */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Óptimo (≥ 3 un.)</span>
            <span className="text-2xl font-black text-emerald-600">{stats.optimalCount}</span>
            <span className="text-[10px] text-slate-500 block">Reserva asegurada</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Client filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!isCorporateClient && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="relative min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                  account_balance
                </span>
                <select
                  value={effectiveClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                >
                  <option value="ALL">🏢 Todos los Clientes</option>
                  {clientOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 pointer-events-none text-[18px]">
                  arrow_drop_down
                </span>
              </div>

              {effectiveClientId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    const clientToEdit = clientOptions.find(c => c.id === effectiveClientId);
                    if (clientToEdit) handleOpenEditClient(clientToEdit);
                  }}
                  className="px-2.5 py-2 bg-surface-container hover:bg-surface-container-high text-primary border border-outline-variant/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Modificar nombre y datos de este cliente"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span className="hidden sm:inline">Modificar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setClientModalTab('create');
                  setIsClientsModalOpen(true);
                }}
                className="px-2.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                title="Registrar nuevo cliente corporativo"
              >
                <span className="material-symbols-outlined text-[15px]">add_business</span>
                <span className="hidden sm:inline">+ Cliente</span>
              </button>
            </div>
          )}

          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap py-1">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${statusFilter === 'ALL' ? 'bg-primary text-white shadow-sm' : 'bg-surface-container text-on-surface hover:bg-surface-container-high'}`}
            >
              Todos ({stats.totalAgencies})
            </button>
            <button
              onClick={() => setStatusFilter('critico')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${statusFilter === 'critico' ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Crítico ({stats.criticalCount})
            </button>
            <button
              onClick={() => setStatusFilter('alerta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${statusFilter === 'alerta' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Alerta ({stats.alertCount})
            </button>
            <button
              onClick={() => setStatusFilter('optimo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${statusFilter === 'optimo' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Óptimo ({stats.optimalCount})
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar sucursal, ciudad o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 hover:text-slate-600 text-[16px] cursor-pointer"
            >
              close
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout (Map & Agency List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Map Container */}
        {(activeTab === 'split' || activeTab === 'map') && (
          <div className={`${activeTab === 'map' ? 'lg:col-span-12' : 'lg:col-span-7'} h-[360px] sm:h-[480px] lg:h-[620px] bg-surface-container-lowest rounded-3xl p-3 border border-outline-variant/30 shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-2 px-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">explore</span>
                <span className="font-bold text-sm text-on-surface">Mapa Geoespacial de Sucursales</span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {filteredAgencies.length} sucursales ubicadas
              </span>
            </div>
            
            <div className="flex-1 w-full h-full min-h-0">
              <OutsourcingMap 
                agencies={filteredAgencies}
                selectedAgencyId={selectedAgencyId}
                onSelectAgency={(agency) => setSelectedAgencyId(agency.id)}
                filterClient={effectiveClientId}
              />
            </div>
          </div>
        )}

        {/* Agency Cards List Container */}
        {(activeTab === 'split' || activeTab === 'list') && (
          <div className={`${activeTab === 'list' ? 'lg:col-span-12' : 'lg:col-span-5'} flex flex-col gap-4 max-h-[620px] overflow-y-auto pr-1`}>
            {filteredAgencies.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/30 text-slate-400">
                <span className="material-symbols-outlined text-[48px] mb-2 opacity-40">location_off</span>
                <p className="font-bold text-sm text-on-surface">No se encontraron agencias</p>
                <p className="text-xs mt-1">Prueba cambiando los filtros de cliente o búsqueda.</p>
              </div>
            ) : (
              filteredAgencies.map((agency) => {
                const isSelected = selectedAgencyId === agency.id;
                const totalBackup = agency.toners?.reduce((s, t) => s + (t.currentStock || 0), 0) ?? 0;
                
                // Color badges
                let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                let statusDot = 'bg-emerald-500';
                let statusText = 'Óptimo';

                if (totalBackup === 0 || agency.status === 'critico') {
                  badgeBg = 'bg-rose-100 text-rose-800 border-rose-200';
                  statusDot = 'bg-rose-500 animate-pulse';
                  statusText = 'Crítico (0 Tóners)';
                } else if (totalBackup <= 2 || agency.status === 'alerta') {
                  badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
                  statusDot = 'bg-amber-500';
                  statusText = 'Alerta Stock Bajo';
                }

                return (
                  <div
                    key={agency.id}
                    onClick={() => setSelectedAgencyId(agency.id)}
                    className={`bg-surface-container-lowest rounded-2xl p-4 border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/[0.02]' 
                        : 'border-outline-variant/30 hover:border-primary/50'
                    }`}
                  >
                    {/* Left color bar */}
                    <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                      agency.status === 'critico' ? 'bg-rose-500' : agency.status === 'alerta' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    <div className="flex items-start justify-between gap-2 pl-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {agency.clientName}
                        </span>
                        <h3 className="font-extrabold text-sm text-on-surface">
                          {agency.agencyName}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 flex-shrink-0 ${badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                        {statusText}
                      </span>
                    </div>

                    <div className="pl-2 text-xs text-slate-500 space-y-1 mb-3">
                      <p className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                        <span>{agency.city} • {agency.address}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                        <span className="font-medium text-slate-700">{agency.contactPerson}</span>
                      </p>
                    </div>

                    {/* Toner items preview */}
                    <div className="pl-2 bg-surface-container-low rounded-xl p-2.5 mb-3 border border-outline-variant/15 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Tóners en Backup</span>
                        <span className="text-on-surface font-extrabold">{totalBackup} un. total</span>
                      </div>
                      <div className="space-y-1">
                        {(agency.toners || []).map((t) => (
                          <div key={t.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 truncate max-w-[170px] font-medium">{t.model}</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              t.currentStock === 0 
                                ? 'bg-rose-100 text-rose-700' 
                                : t.currentStock <= t.minStock 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {t.currentStock} / {t.minStock} mín.
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pl-2 flex items-center justify-end gap-2 pt-1 border-t border-outline-variant/10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openWhatsAppRestock(agency);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Enviar alerta directa por WhatsApp"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgencyId(agency.id);
                          setDeliveryForm(prev => ({
                            ...prev,
                            tonerId: agency.toners?.[0]?.id || ''
                          }));
                          setIsDeliveryModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                        <span>Registrar Entrega</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected Agency Full Detail Drawer / Modal */}
      {selectedAgency && (
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed">
                  {selectedAgency.clientName}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {selectedAgency.id}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-on-surface">
                {selectedAgency.agencyName}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">pin_drop</span>
                {selectedAgency.city} • {selectedAgency.address}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => openWhatsAppRestock(selectedAgency)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Alerta WhatsApp</span>
              </button>

              <button
                onClick={() => handleOpenDeliveryModal()}
                className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                <span>+ Entregar Suministros</span>
              </button>

              <button
                onClick={() => handleOpenInstallModal()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                title="Registrar que se sacó un cartucho o bolsa de tinta del armario de contingencia y se colocó en la impresora"
              >
                <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                <span>- Instalar en Impresora</span>
              </button>

              {!isCorporateClient && (
                <button
                  onClick={() => handleOpenEditAgency(selectedAgency)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  title="Modificar datos, dirección o flota de la sucursal"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_location_alt</span>
                  <span>Editar Sucursal</span>
                </button>
              )}

              {!isCorporateClient && (
                <button
                  onClick={() => handleDeleteAgency(selectedAgency)}
                  className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Eliminar esta sucursal"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  <span>Eliminar</span>
                </button>
              )}

              <button
                onClick={() => setSelectedAgencyId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-surface-container cursor-pointer"
                title="Cerrar Ficha"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Grid Layout: Printers Fleet, Toner Stock, & Delivery History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* 1. Tóners en Reserva & Insumos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inventory</span>
                  <h3 className="font-extrabold text-sm text-on-surface">
                    Inventario de Tóners en Reserva (Backup en Sucursal)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Última reposición: {selectedAgency.lastReplenished || 'Reciente'}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Modelo de Insumo</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Color</th>
                      <th className="py-2.5 px-3">Impresora Compatible</th>
                      <th className="py-2.5 px-3 text-center">Rendimiento</th>
                      <th className="py-2.5 px-3 text-center">Stock Reserva</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {(selectedAgency.toners || []).map((t) => {
                      const isZero = t.currentStock === 0;
                      const isLow = t.currentStock <= t.minStock;

                      return (
                        <tr key={t.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="py-3 px-3 font-bold text-on-surface">
                            <span>{t.model}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              {t.type || 'Tóner'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="inline-flex items-center gap-1.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${
                                t.color === 'Negro' ? 'bg-slate-900' : t.color === 'Cian' ? 'bg-cyan-500' : t.color === 'Magenta' ? 'bg-pink-500' : t.color === 'Amarillo' ? 'bg-amber-400' : 'bg-slate-400'
                              }`} />
                              {t.color || 'Negro'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {t.compatiblePrinter || 'Flota Asignada'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500 font-mono">
                            {t.yieldPages || 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">
                            <span className={`font-black text-sm px-2.5 py-1 rounded-xl ${
                              isZero 
                                ? 'bg-rose-100 text-rose-700' 
                                : isLow 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {t.currentStock} un.
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">mínimo: {t.minStock}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isZero ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                                Agotado (0)
                              </span>
                            ) : isLow ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                Stock Bajo
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                                Óptimo
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                disabled={isZero}
                                onClick={() => handleOpenInstallModal(t)}
                                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  isZero 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 cursor-pointer shadow-sm active:scale-95'
                                }`}
                                title={isZero ? 'Sin stock para instalar' : 'Instalar insumo en impresora'}
                              >
                                <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                                <span>Instalar</span>
                              </button>
                              <button
                                onClick={() => handleOpenDeliveryModal(t)}
                                className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                title="Registrar entrega de este modelo"
                              >
                                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                                <span>+ Entregar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Delivery History */}
              <div className="pt-4 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">receipt_long</span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                      Historial de Entregas & Remitos (SLA)
                    </h4>
                  </div>
                </div>

                {(selectedAgency.deliveryHistory || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-surface-container-low rounded-xl">
                    No se registran entregas recientes en esta agencia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAgency.deliveryHistory.map((d, idx) => (
                      <div key={idx} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 flex items-center justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{d.id}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 font-medium">{d.date}</span>
                            {d.consumableType && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                {d.consumableType}
                              </span>
                            )}
                            {d.serialNumber && (
                              <span className="font-mono text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                                S/N: {d.serialNumber}
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-slate-800 text-xs">
                            {d.tonersDelivered?.map((t, tIdx) => (
                              <span key={tIdx} className="mr-2">
                                • {t.quantity} un. <strong>{t.model}</strong> {t.serialNumber ? `(Serie: ${t.serialNumber})` : ''}
                              </span>
                            ))}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Entregado por: {d.technician} • Recibió: {d.receiver || selectedAgency.contactPerson}
                            {d.notes && <span className="italic"> — "{d.notes}"</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentReceiptData(d)}
                          className="px-2.5 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-xl font-bold text-slate-700 flex items-center gap-1 cursor-pointer border border-outline-variant/20 flex-shrink-0"
                          title="Ver Comprobante Oficial"
                        >
                          <span className="material-symbols-outlined text-[15px]">print</span>
                          <span>Comprobante</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consumable Installation / Consumption History */}
              <div className="pt-4 border-t border-outline-variant/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">published_with_changes</span>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
                      Historial de Insumos / Tóners Instalados en Equipos (Consumo Real)
                    </h4>
                  </div>
                </div>

                {(selectedAgency.changeHistory || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 bg-surface-container-low rounded-xl">
                    No se registran instalaciones de insumos aún en esta agencia.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedAgency.changeHistory.map((c, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-amber-900">
                              - {c.quantity} un. {c.tonerModel}
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              {c.consumableType || 'Tóner'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                              Equipo: {c.printerModel}
                            </span>
                            {c.serialNumber && (
                              <span className="font-mono text-[11px] bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                                S/N Insumo: {c.serialNumber}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Fecha: <strong>{c.date}</strong> • Responsable: <strong>{c.installedBy}</strong>
                            {c.notes && <span className="text-slate-500 italic"> — "{c.notes}"</span>}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-amber-600 text-[22px] flex-shrink-0">check_circle</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Flota de Impresoras & Contacto en Sucursal */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                  <span>Responsable en Sucursal</span>
                </div>
                <div>
                  <p className="font-extrabold text-sm text-on-surface">{selectedAgency.contactPerson}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Encargado / Jefe de Operaciones</p>
                </div>
                <div className="pt-2 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-mono font-bold text-primary">{selectedAgency.contactPhone}</span>
                </div>
              </div>

              {/* Printers fleet */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-primary text-[18px]">print</span>
                  <span>Parque de Impresoras Instalado</span>
                </div>

                <div className="space-y-2">
                  {(selectedAgency.printers || []).map((p, idx) => (
                    <div key={idx} className="p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/15 text-xs">
                      <div className="font-bold text-slate-800">{p.model}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>Ubicación: <strong>{p.location}</strong></span>
                        <span className="font-mono text-slate-400">S/N: {p.serial || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Cambio / Instalación de Tóner / Insumo */}
      {isInstallModalOpen && selectedAgency && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start sm:items-center">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">build_circle</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-on-surface">Instalar Insumo / Tóner en Impresora</h3>
                  <p className="text-xs text-slate-400">Descuenta 1 unidad de la reserva de {selectedAgency.agencyName}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsInstallModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleInstallToner} className="space-y-4">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600 flex-shrink-0">info</span>
                <span>
                  Al confirmar, el cartucho o bolsa de tinta se registrará como instalado con su número de serie y fecha, descontándose de la reserva de la sucursal y sincronizándose con Supabase.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Modelo de Insumo a Instalar *
                </label>
                <select
                  required
                  value={installForm.tonerId}
                  onChange={(e) => {
                    const toner = selectedAgency.toners?.find(t => t.id === e.target.value);
                    const matchedPrinter = selectedAgency.printers?.find(p => p.model === toner?.compatiblePrinter) || selectedAgency.printers?.[0];
                    setInstallForm({
                      ...installForm,
                      tonerId: e.target.value,
                      consumableType: toner?.type || 'Tóner',
                      printerModel: matchedPrinter ? `${matchedPrinter.model} (${matchedPrinter.location})` : (toner?.compatiblePrinter || installForm.printerModel),
                      printerSerial: matchedPrinter?.serial || ''
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Seleccione el modelo --</option>
                  {(selectedAgency.toners || []).map(t => (
                    <option key={t.id} value={t.id} disabled={t.currentStock === 0}>
                      [{t.type || 'Tóner'}] {t.model} ({t.color}) - Reserva: {t.currentStock} un. {t.currentStock === 0 ? '(AGOTADO)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Tipo de Insumo *
                  </label>
                  <select
                    value={installForm.consumableType}
                    onChange={(e) => setInstallForm({ ...installForm, consumableType: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bolsa de Tinta">Bolsa de Tinta (Epson)</option>
                    <option value="Tóner">Tóner (Láser HP / Brother / Kyocera)</option>
                    <option value="Tambor / Drum">Tambor / Drum (Brother)</option>
                    <option value="Botella de Tinta">Botella de Tinta</option>
                    <option value="Caja de Mantenimiento">Caja de Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Fecha de Instalación *
                  </label>
                  <input
                    type="date"
                    required
                    value={installForm.installDate}
                    onChange={(e) => setInstallForm({ ...installForm, installDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Nº de Serie / Código del Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SN-T11A-981204 / SN-TN3615-5591"
                    value={installForm.serialNumber}
                    onChange={(e) => setInstallForm({ ...installForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Cantidad a Instalar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={installForm.quantity}
                    onChange={(e) => setInstallForm({ ...installForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Impresora de Destino *
                </label>
                <select
                  value={installForm.printerModel}
                  onChange={(e) => {
                    const selPrinter = selectedAgency.printers?.find(p => `${p.model} (${p.location})` === e.target.value);
                    setInstallForm({
                      ...installForm,
                      printerModel: e.target.value,
                      printerSerial: selPrinter?.serial || installForm.printerSerial
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {(selectedAgency.printers || []).map((p, idx) => (
                    <option key={idx} value={`${p.model} (${p.location})`}>
                      {p.model} - {p.location} {p.serial ? `[S/N: ${p.serial}]` : ''}
                    </option>
                  ))}
                  <option value="Otra impresora de la sucursal">Otra impresora de la sucursal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Responsable del Cambio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Carlos Mendoza (Cajero)"
                    value={installForm.installedBy}
                    onChange={(e) => setInstallForm({ ...installForm, installedBy: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Notas / Contador de Páginas
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Contador: 45,120 págs"
                    value={installForm.notes}
                    onChange={(e) => setInstallForm({ ...installForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsInstallModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Confirmar Instalación de Insumo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Entrega de Tóners / Suministros */}
      {isDeliveryModalOpen && selectedAgency && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 flex justify-center items-start sm:items-center">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-on-surface">Registrar Entrega de Suministros / Tintas / Tóners</h3>
                  <p className="text-xs text-slate-400">{selectedAgency.agencyName} ({selectedAgency.clientName})</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDeliveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRecordDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Seleccionar Modelo de Insumo a Entregar *
                </label>
                <select
                  required
                  value={deliveryForm.tonerId}
                  onChange={(e) => {
                    const toner = selectedAgency.toners?.find(t => t.id === e.target.value);
                    setDeliveryForm({
                      ...deliveryForm,
                      tonerId: e.target.value,
                      consumableType: toner?.type || 'Tóner'
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Seleccione el modelo --</option>
                  {(selectedAgency.toners || []).map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.type || 'Tóner'}] {t.model} ({t.color}) - Stock actual: {t.currentStock} un.
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Tipo de Insumo *
                  </label>
                  <select
                    value={deliveryForm.consumableType}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, consumableType: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Bolsa de Tinta">Bolsa de Tinta (Epson)</option>
                    <option value="Tóner">Tóner (Láser HP / Brother / Kyocera)</option>
                    <option value="Tambor / Drum">Tambor / Drum (Brother)</option>
                    <option value="Botella de Tinta">Botella de Tinta</option>
                    <option value="Caja de Mantenimiento">Caja de Mantenimiento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Fecha de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryForm.deliveryDate}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Nº de Serie / Lote del Insumo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SN-T11A-981204 / LOTE-2026-09"
                    value={deliveryForm.serialNumber}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    Cantidad a Entregar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={deliveryForm.quantity}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Técnico Responsable *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryForm.technician}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, technician: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Notas de Despacho / Observaciones
                </label>
                <textarea
                  rows="2"
                  value={deliveryForm.notes}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
                  placeholder="Detalles sobre precintos de seguridad, cajas o requerimiento especial..."
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsDeliveryModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Confirmar & Emitir Acta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nueva Agencia / Sucursal */}
      {isNewAgencyModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-on-surface">Dar de Alta Nueva Agencia</h3>
                  <p className="text-xs text-slate-400">Registra una sucursal para monitoreo de tóners</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewAgencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500">Cliente / Empresa *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewAgencyModalOpen(false);
                        setClientModalTab('create');
                        setIsClientsModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      + Nuevo Cliente
                    </button>
                  </div>
                  <select
                    value={newAgencyForm.clientId}
                    onChange={(e) => {
                      const selected = clientOptions.find(c => c.id === e.target.value);
                      setNewAgencyForm({
                        ...newAgencyForm,
                        clientId: e.target.value,
                        clientName: selected?.name || 'Cliente Empresarial',
                        clientCode: selected?.code || 'EMP'
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {clientOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre de Sucursal *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Agencia San Martín"
                    value={newAgencyForm.agencyName}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, agencyName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Ciudad / Municipio *</label>
                  <input
                    type="text"
                    required
                    value={newAgencyForm.city}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Dirección Exacta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Calle o Avenida y Número"
                    value={newAgencyForm.address}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              <AgencyLocationPickerMap
                lat={parseFloat(newAgencyForm.lat) || -21.5332}
                lng={parseFloat(newAgencyForm.lng) || -64.7339}
                agencyName={newAgencyForm.agencyName}
                city={newAgencyForm.city}
                address={newAgencyForm.address}
                onChange={(newLat, newLng) => {
                  setNewAgencyForm(prev => ({
                    ...prev,
                    lat: newLat,
                    lng: newLng
                  }));
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Latitud (GPS) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newAgencyForm.lat}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, lat: parseFloat(e.target.value) || e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Longitud (GPS) *</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newAgencyForm.lng}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, lng: parseFloat(e.target.value) || e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Responsable en Sucursal</label>
                  <input
                    type="text"
                    placeholder="Nombre del encargado"
                    value={newAgencyForm.contactPerson}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+591 70000000"
                    value={newAgencyForm.contactPhone}
                    onChange={(e) => setNewAgencyForm({ ...newAgencyForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                    Equipamiento & Insumo Inicial
                  </span>
                  <span className="text-[10px] text-slate-400">Podrás añadir más insumos luego de crear</span>
                </div>

                {/* Presets */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setNewAgencyForm({
                      ...newAgencyForm,
                      printerModel: 'Epson WorkForce Enterprise AM-C400',
                      tonerModel: 'Bolsa de Tinta Epson T11A Black',
                      consumableType: 'Bolsa de Tinta',
                      color: 'Negro'
                    })}
                    className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-outline-variant/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Epson AM-C400 (Tinta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAgencyForm({
                      ...newAgencyForm,
                      printerModel: 'Epson WorkForce Pro WF-M5899',
                      tonerModel: 'Bolsa de Tinta Epson T11U Black',
                      consumableType: 'Bolsa de Tinta',
                      color: 'Negro'
                    })}
                    className="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-800 border border-outline-variant/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Epson WF-M5899 (Tinta)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAgencyForm({
                      ...newAgencyForm,
                      printerModel: 'BROTHER MFC-L6915DW',
                      tonerModel: 'Tóner Brother TN-3615 / TN-3615XXL',
                      consumableType: 'Tóner',
                      color: 'Negro'
                    })}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-outline-variant/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + Brother MFC-L6915DW (Tóner)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAgencyForm({
                      ...newAgencyForm,
                      printerModel: 'HP LaserJet Enterprise M507dn',
                      tonerModel: 'HP 89A (CF289A)',
                      consumableType: 'Tóner',
                      color: 'Negro'
                    })}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-outline-variant/30 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    + HP M507dn
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Modelo de Impresora</label>
                    <input
                      type="text"
                      required
                      value={newAgencyForm.printerModel}
                      onChange={(e) => setNewAgencyForm({ ...newAgencyForm, printerModel: e.target.value })}
                      placeholder="ej. Epson AM-C400 / Brother MFC-L6915DW"
                      className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipo de Insumo</label>
                    <select
                      value={newAgencyForm.consumableType || 'Tóner'}
                      onChange={(e) => setNewAgencyForm({ ...newAgencyForm, consumableType: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold"
                    >
                      <option value="Bolsa de Tinta">Bolsa de Tinta (Epson)</option>
                      <option value="Tóner">Tóner (Láser)</option>
                      <option value="Tambor / Drum">Tambor / Drum</option>
                      <option value="Botella de Tinta">Botella de Tinta</option>
                      <option value="Caja de Mantenimiento">Caja de Mantenimiento</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Modelo de Insumo</label>
                    <input
                      type="text"
                      required
                      value={newAgencyForm.tonerModel}
                      onChange={(e) => setNewAgencyForm({ ...newAgencyForm, tonerModel: e.target.value })}
                      placeholder="ej. T11A Black / TN-3615"
                      className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Stock Reserva Inicial</label>
                    <input
                      type="number"
                      min="0"
                      value={newAgencyForm.initialStock}
                      onChange={(e) => setNewAgencyForm({ ...newAgencyForm, initialStock: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Mínimo (Alerta)</label>
                    <input
                      type="number"
                      min="1"
                      value={newAgencyForm.minStock}
                      onChange={(e) => setNewAgencyForm({ ...newAgencyForm, minStock: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-outline-variant/30 rounded-lg text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsNewAgencyModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  <span>Registrar Agencia</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Management Modal */}
      {isClientsModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">business</span>
                </div>
                <div>
                  <h3 className="font-black text-lg text-on-surface">Gestión de Clientes Corporativos</h3>
                  <p className="text-xs text-slate-400">Crea, modifica y gestiona empresas con contratos de Outsourcing y suministros</p>
                </div>
              </div>
              <button 
                onClick={() => setIsClientsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-2 mb-6 border-b border-outline-variant/20 pb-2">
              <button
                type="button"
                onClick={() => setClientModalTab('list')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  clientModalTab === 'list' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>Directorio de Clientes ({clientOptions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setClientModalTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  clientModalTab === 'create' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">add_business</span>
                <span>+ Registrar Nuevo Cliente</span>
              </button>
            </div>

            {/* Tab: LIST CLIENTS */}
            {clientModalTab === 'list' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {clientOptions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-4xl mb-2">business_center</span>
                    <p className="text-sm font-semibold">No hay clientes corporativos registrados aún.</p>
                  </div>
                ) : (
                  clientOptions.map((client) => {
                    const clientAgencies = outsourcingAgencies.filter(a => a.clientId === client.id);
                    const totalBackupToners = clientAgencies.reduce((acc, a) => {
                      return acc + (a.toners?.reduce((s, t) => s + (t.currentStock || 0), 0) || 0);
                    }, 0);

                    return (
                      <div 
                        key={client.id}
                        className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/20 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-fixed text-on-primary-fixed">
                              {client.code}
                            </span>
                            <h4 className="font-black text-sm text-on-surface">
                              {client.name}
                            </h4>
                            {client.contractSla && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                {client.contractSla}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                            <p className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                              <span>{client.contactPerson || 'Sin contacto asignado'}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[15px] text-slate-400">call</span>
                              <span>{client.contactPhone || 'Sin teléfono'}</span>
                            </p>
                            {client.contactEmail && (
                              <p className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">mail</span>
                                <span>{client.contactEmail}</span>
                              </p>
                            )}
                            {client.address && (
                              <p className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                                <span className="truncate">{client.city ? `${client.city} • ` : ''}{client.address}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 pt-1">
                            <span className="flex items-center gap-1 text-primary">
                              <span className="material-symbols-outlined text-[14px]">storefront</span>
                              {clientAgencies.length} {clientAgencies.length === 1 ? 'sucursal' : 'sucursales'}
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">
                              {totalBackupToners} tóners en reserva
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant/15 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setIsClientsModalOpen(false);
                            }}
                            className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Ver solo las sucursales de este cliente"
                          >
                            <span className="material-symbols-outlined text-[15px]">filter_alt</span>
                            <span>Ver Sucursales</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditClient(client)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Modificar datos de este cliente"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                            <span>Modificar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Eliminar cliente"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab: CREATE CLIENT */}
            {clientModalTab === 'create' && (
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Razón Social / Nombre de la Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="ej. Banco Mercantil Santa Cruz S.A."
                      value={newClientForm.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Auto-generate code acronym if empty
                        const autoCode = val.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase();
                        setNewClientForm(prev => ({
                          ...prev,
                          name: val,
                          code: prev.code ? prev.code : autoCode
                        }));
                      }}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Código Único (3-4 letras) *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="ej. BMSC"
                      value={newClientForm.code}
                      onChange={(e) => setNewClientForm({ ...newClientForm, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold uppercase text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Persona de Contacto Principal</label>
                    <input
                      type="text"
                      placeholder="ej. Lic. Roberto Carlos Mendoza"
                      value={newClientForm.contactPerson}
                      onChange={(e) => setNewClientForm({ ...newClientForm, contactPerson: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Teléfono / WhatsApp de Contacto</label>
                    <input
                      type="text"
                      placeholder="+591 71234567"
                      value={newClientForm.contactPhone}
                      onChange={(e) => setNewClientForm({ ...newClientForm, contactPhone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Correo Electrónico Corporativo</label>
                    <input
                      type="email"
                      placeholder="operaciones@empresa.com"
                      value={newClientForm.contactEmail}
                      onChange={(e) => setNewClientForm({ ...newClientForm, contactEmail: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Nivel de Contrato SLA</label>
                    <select
                      value={newClientForm.contractSla}
                      onChange={(e) => setNewClientForm({ ...newClientForm, contractSla: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="SLA Platino 24/7 (Reposición < 2 horas)">SLA Platino 24/7 (Reposición &lt; 2 horas)</option>
                      <option value="SLA Oro Reposición 24h">SLA Oro Reposición 24h</option>
                      <option value="SLA Estándar 48h">SLA Estándar 48h</option>
                      <option value="SLA Básico por Demanda">SLA Básico por Demanda</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Ciudad Sede</label>
                    <input
                      type="text"
                      placeholder="ej. Tarija"
                      value={newClientForm.city}
                      onChange={(e) => setNewClientForm({ ...newClientForm, city: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Dirección Matriz / Oficina Central</label>
                    <input
                      type="text"
                      placeholder="ej. Calle Sucre #120"
                      value={newClientForm.address}
                      onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Notas y Términos Comerciales</label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre facturación, horarios de atención, requerimientos especiales de seguridad..."
                    value={newClientForm.notes}
                    onChange={(e) => setNewClientForm({ ...newClientForm, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={() => setClientModalTab('list')}
                    className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Ver Directorio
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    <span>Guardar Cliente Corporativo</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditClientModalOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-on-surface">Modificar Cliente Corporativo</h3>
                  <p className="text-xs text-slate-400">Actualiza los datos del cliente y sincroniza sus sucursales</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] flex-shrink-0 text-amber-600">info</span>
                <span>Al modificar la razón social o el código, todas las sucursales vinculadas a este cliente se actualizarán automáticamente.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Razón Social / Nombre *</label>
                  <input
                    type="text"
                    required
                    value={editClientForm.name}
                    onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Código Único *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editClientForm.code}
                    onChange={(e) => setEditClientForm({ ...editClientForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold uppercase text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Persona de Contacto</label>
                  <input
                    type="text"
                    value={editClientForm.contactPerson}
                    onChange={(e) => setEditClientForm({ ...editClientForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editClientForm.contactPhone}
                    onChange={(e) => setEditClientForm({ ...editClientForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editClientForm.contactEmail}
                    onChange={(e) => setEditClientForm({ ...editClientForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Acuerdo SLA</label>
                  <select
                    value={editClientForm.contractSla}
                    onChange={(e) => setEditClientForm({ ...editClientForm, contractSla: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="SLA Platino 24/7 (Reposición < 2 horas)">SLA Platino 24/7 (Reposición &lt; 2 horas)</option>
                    <option value="SLA Oro Reposición 24h">SLA Oro Reposición 24h</option>
                    <option value="SLA Estándar 48h">SLA Estándar 48h</option>
                    <option value="SLA Básico por Demanda">SLA Básico por Demanda</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Ciudad</label>
                  <input
                    type="text"
                    value={editClientForm.city}
                    onChange={(e) => setEditClientForm({ ...editClientForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Dirección Matriz</label>
                  <input
                    type="text"
                    value={editClientForm.address}
                    onChange={(e) => setEditClientForm({ ...editClientForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Notas y Términos</label>
                <textarea
                  rows={2}
                  value={editClientForm.notes}
                  onChange={(e) => setEditClientForm({ ...editClientForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Agency Modal */}
      {isEditAgencyModalOpen && editAgencyForm && (
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center items-start">
          <div className="bg-surface-container-lowest rounded-3xl p-6 w-full max-w-3xl shadow-2xl border border-outline-variant/30 my-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">edit_location_alt</span>
                </div>
                <div>
                  <h3 className="font-black text-base text-on-surface">Modificar Sucursal / Agencia</h3>
                  <p className="text-xs text-slate-400">Edita datos de ubicación, contacto y equipamiento asignado</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditAgencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditAgency} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Cliente Asignado *</label>
                  <select
                    value={editAgencyForm.clientId}
                    onChange={(e) => {
                      const sel = clientOptions.find(c => c.id === e.target.value);
                      setEditAgencyForm({
                        ...editAgencyForm,
                        clientId: e.target.value,
                        clientName: sel?.name || editAgencyForm.clientName,
                        clientCode: sel?.code || editAgencyForm.clientCode
                      });
                    }}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {clientOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Nombre de Sucursal *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyForm.agencyName}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, agencyName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Ciudad *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyForm.city}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Dirección Completa *</label>
                  <input
                    type="text"
                    required
                    value={editAgencyForm.address}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, address: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Interactive Location Picker Map */}
              <AgencyLocationPickerMap
                lat={parseFloat(editAgencyForm.lat) || -21.5332}
                lng={parseFloat(editAgencyForm.lng) || -64.7339}
                agencyName={editAgencyForm.agencyName}
                city={editAgencyForm.city}
                address={editAgencyForm.address}
                onChange={(newLat, newLng) => {
                  setEditAgencyForm(prev => ({
                    ...prev,
                    lat: newLat,
                    lng: newLng
                  }));
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Latitud GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editAgencyForm.lat}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, lat: parseFloat(e.target.value) || e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Longitud GPS</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editAgencyForm.lng}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, lng: parseFloat(e.target.value) || e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Responsable en Sucursal</label>
                  <input
                    type="text"
                    value={editAgencyForm.contactPerson}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={editAgencyForm.contactPhone}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editAgencyForm.contactEmail}
                    onChange={(e) => setEditAgencyForm({ ...editAgencyForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Consumables Management (Toners, Ink Packs, Drums) */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
                      <span>Control & Configuración de Insumos (Tóners / Tintas / Tambores)</span>
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Personaliza modelos, tipo de insumo (tóner, bolsa de tinta Epson, drum Brother), stock y alertas
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddConsumableToEditAgency()}
                    className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1 self-start cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Añadir Insumo</span>
                  </button>
                </div>

                {/* Quick Presets for Epson, Brother, and HP */}
                <div className="p-2.5 bg-white/80 rounded-xl border border-outline-variant/20 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Plantillas Rápidas de Insumos:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddConsumableToEditAgency({
                        model: 'Bolsa de Tinta Epson T11A Black',
                        type: 'Bolsa de Tinta',
                        color: 'Negro',
                        yieldPages: '10,000 págs',
                        currentStock: 2,
                        minStock: 2,
                        compatiblePrinter: 'Epson WorkForce Enterprise AM-C400'
                      })}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir Tinta Negra para Epson AM-C400 (Ecofuturo)"
                    >
                      <span className="material-symbols-outlined text-[14px]">water_drop</span>
                      <span>+ Tinta Epson AM-C400 Black</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddConsumableToEditAgency({
                        model: 'Bolsa de Tinta Epson T11U Black',
                        type: 'Bolsa de Tinta',
                        color: 'Negro',
                        yieldPages: '40,000 págs',
                        currentStock: 2,
                        minStock: 1,
                        compatiblePrinter: 'Epson WorkForce Pro WF-M5899'
                      })}
                      className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir Tinta Negra para Epson WF-M5899 (Ecofuturo)"
                    >
                      <span className="material-symbols-outlined text-[14px]">water_drop</span>
                      <span>+ Tinta Epson WF-M5899 Black</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddConsumableToEditAgency({
                        model: 'Tóner Brother TN-3615 / TN-3615XXL',
                        type: 'Tóner',
                        color: 'Negro',
                        yieldPages: '18,000 págs',
                        currentStock: 3,
                        minStock: 2,
                        compatiblePrinter: 'BROTHER MFC-L6915DW'
                      })}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir Tóner para Brother MFC-L6915DW (Prodem)"
                    >
                      <span className="material-symbols-outlined text-[14px]">print</span>
                      <span>+ Tóner Brother TN-3615</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddConsumableToEditAgency({
                        model: 'Unidad de Tambor / Drum DR-3600',
                        type: 'Tambor / Drum',
                        color: 'Monocromático',
                        yieldPages: '75,000 págs',
                        currentStock: 2,
                        minStock: 1,
                        compatiblePrinter: 'BROTHER MFC-L6915DW'
                      })}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir Tambor de Imagen Brother DR-3600 (Prodem)"
                    >
                      <span className="material-symbols-outlined text-[14px]">cyclone</span>
                      <span>+ Tambor Brother DR-3600</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddConsumableToEditAgency({
                        model: 'HP 89A (CF289A)',
                        type: 'Tóner',
                        color: 'Negro',
                        yieldPages: '5,000 págs',
                        currentStock: 2,
                        minStock: 2,
                        compatiblePrinter: 'HP LaserJet Enterprise M507dn'
                      })}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Añadir Tóner HP 89A"
                    >
                      <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                      <span>+ Tóner HP 89A</span>
                    </button>
                  </div>
                </div>

                {/* List of Consumables */}
                <div className="space-y-3">
                  {(editAgencyForm.toners || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-outline-variant/30">
                      No hay insumos registrados para esta sucursal. Haz clic en "+ Añadir Insumo" o usa una de las plantillas rápidas.
                    </div>
                  ) : (
                    editAgencyForm.toners.map((toner, idx) => (
                      <div key={toner.id || idx} className="p-3.5 bg-white rounded-2xl border border-outline-variant/25 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-extrabold text-xs text-slate-800">
                              {toner.model || 'Nuevo Insumo'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              {toner.type || 'Tóner'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveConsumableFromEditAgency(idx)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar este insumo de la sucursal"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Modelo del Insumo / Cartucho / Tinta *
                            </label>
                            <input
                              type="text"
                              required
                              value={toner.model}
                              onChange={(e) => {
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], model: e.target.value };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              placeholder="ej. Bolsa de Tinta Epson T11A Black / Tóner Brother TN-3615"
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Tipo de Insumo *
                            </label>
                            <select
                              value={toner.type || 'Tóner'}
                              onChange={(e) => {
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], type: e.target.value };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold text-slate-800"
                            >
                              <option value="Bolsa de Tinta">Bolsa de Tinta (Epson)</option>
                              <option value="Tóner">Tóner (Láser HP / Brother / Kyocera)</option>
                              <option value="Tambor / Drum">Tambor / Drum (Brother / Lexmark)</option>
                              <option value="Botella de Tinta">Botella de Tinta</option>
                              <option value="Caja de Mantenimiento">Caja de Mantenimiento</option>
                              <option value="Cartucho de Tinta">Cartucho de Tinta Convencional</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Color</label>
                            <select
                              value={toner.color || 'Negro'}
                              onChange={(e) => {
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], color: e.target.value };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-bold"
                            >
                              <option value="Negro">Negro (Black)</option>
                              <option value="Cian">Cian (Cyan)</option>
                              <option value="Magenta">Magenta</option>
                              <option value="Amarillo">Amarillo (Yellow)</option>
                              <option value="Monocromático">Monocromático</option>
                              <option value="Tricolor">Tricolor</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Impresora Compatible</label>
                            <input
                              type="text"
                              value={toner.compatiblePrinter || ''}
                              onChange={(e) => {
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], compatiblePrinter: e.target.value };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              placeholder="ej. Epson AM-C400"
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Stock de Reserva</label>
                            <input
                              type="number"
                              min="0"
                              value={toner.currentStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], currentStock: val };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-black text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Mínimo (Alerta)</label>
                            <input
                              type="number"
                              min="1"
                              value={toner.minStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 1;
                                const newToners = [...editAgencyForm.toners];
                                newToners[idx] = { ...newToners[idx], minStock: val };
                                setEditAgencyForm({ ...editAgencyForm, toners: newToners });
                              }}
                              className="w-full px-2.5 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-xs font-mono font-bold text-center"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Printer Fleet Management */}
              <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">print</span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Parque de Impresoras Instalado en Sucursal
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPrinterToEditAgency}
                    className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-outline-variant/30"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>+ Añadir Impresora</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(editAgencyForm.printers || []).map((printer, pIdx) => (
                    <div key={pIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-outline-variant/20 text-xs">
                      <div className="sm:col-span-5">
                        <label className="block text-[9px] font-bold text-slate-400">Modelo Impresora</label>
                        <input
                          type="text"
                          required
                          value={printer.model}
                          onChange={(e) => {
                            const newPrinters = [...editAgencyForm.printers];
                            newPrinters[pIdx] = { ...newPrinters[pIdx], model: e.target.value };
                            setEditAgencyForm({ ...editAgencyForm, printers: newPrinters });
                          }}
                          placeholder="ej. Epson AM-C400 / Brother MFC-L6915DW"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[9px] font-bold text-slate-400">Ubicación</label>
                        <input
                          type="text"
                          value={printer.location}
                          onChange={(e) => {
                            const newPrinters = [...editAgencyForm.printers];
                            newPrinters[pIdx] = { ...newPrinters[pIdx], location: e.target.value };
                            setEditAgencyForm({ ...editAgencyForm, printers: newPrinters });
                          }}
                          placeholder="ej. Cajas 1 a 4"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[9px] font-bold text-slate-400">Nº de Serie</label>
                        <input
                          type="text"
                          value={printer.serial || ''}
                          onChange={(e) => {
                            const newPrinters = [...editAgencyForm.printers];
                            newPrinters[pIdx] = { ...newPrinters[pIdx], serial: e.target.value };
                            setEditAgencyForm({ ...editAgencyForm, printers: newPrinters });
                          }}
                          placeholder="ej. EPS-AMC400-01"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg font-mono text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemovePrinterFromEditAgency(pIdx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar impresora"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => setIsEditAgencyModalOpen(false)}
                  className="px-4 py-2.5 bg-surface-container text-slate-600 rounded-xl text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar Sucursal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Delivery Voucher Modal */}
      {currentReceiptData && selectedAgency && (
        <OutsourcingDeliveryReceipt
          deliveryData={currentReceiptData}
          agency={selectedAgency}
          shopInfo={shopInfo}
          onClose={() => setCurrentReceiptData(null)}
        />
      )}
    </div>
  );
}
