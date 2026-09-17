import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function TopBar() {
  const { 
    page, 
    setPage, 
    setSubstate, 
    isOnline, 
    currentUser, 
    logout,
    outsourcingAgencies = [],
    products = [],
    tickets = [],
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const role = currentUser?.role || 'admin';

  // Compute live notifications from system state
  const notifications = useMemo(() => {
    const list = [];

    // 1. Critical toner reserves in outsourcing
    outsourcingAgencies.forEach(agency => {
      const zeroToners = (agency.toners || []).filter(t => (t.currentStock || 0) === 0);
      if (zeroToners.length > 0) {
        list.push({
          id: `notif-toner-crit-${agency.id}`,
          type: 'toner_critical',
          icon: 'crisis_alert',
          color: 'text-rose-500 bg-rose-50 border-rose-200',
          title: `Sin Tóner: ${agency.agencyName}`,
          desc: `${agency.clientName} tiene ${zeroToners.map(t => t.model).join(', ')} agotado en reserva.`,
          actionPage: 'outsourcing'
        });
      } else if (agency.status === 'alerta') {
        list.push({
          id: `notif-toner-alert-${agency.id}`,
          type: 'toner_alert',
          icon: 'warning',
          color: 'text-amber-500 bg-amber-50 border-amber-200',
          title: `Stock Bajo: ${agency.agencyName}`,
          desc: `Reserva mínima alcanzada en ${agency.clientName}.`,
          actionPage: 'outsourcing'
        });
      }
    });

    // 2. Inventory out of stock or low stock
    products.forEach(p => {
      if (p.stock === 0) {
        list.push({
          id: `notif-prod-out-${p.id}`,
          type: 'product_out',
          icon: 'inventory_2',
          color: 'text-rose-500 bg-rose-50 border-rose-200',
          title: `Producto Agotado: ${p.name}`,
          desc: `SKU ${p.id} tiene 0 unidades en inventario.`,
          actionPage: 'inventory'
        });
      } else if (p.stock <= 10) {
        list.push({
          id: `notif-prod-low-${p.id}`,
          type: 'product_low',
          icon: 'production_quantity_limits',
          color: 'text-amber-500 bg-amber-50 border-amber-200',
          title: `Stock Mínimo: ${p.name}`,
          desc: `Solo quedan ${p.stock} unidades en existencia.`,
          actionPage: 'inventory'
        });
      }
    });

    // 3. Technical service pending tickets
    const pendingTickets = tickets.filter(t => t.status === 'Pending');
    if (pendingTickets.length > 0) {
      list.push({
        id: 'notif-pending-tickets',
        type: 'tickets_pending',
        icon: 'pending_actions',
        color: 'text-blue-500 bg-blue-50 border-blue-200',
        title: `${pendingTickets.length} Órdenes de Soporte Pendientes`,
        desc: 'Equipos en taller en espera de revisión técnica.',
        actionPage: 'service_registry'
      });
    }

    return list;
  }, [outsourcingAgencies, products, tickets]);

  // Click outside to close notifications
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (page) {
      case 'dashboard':
        return 'Panel de Control (Dashboard)';
      case 'outsourcing':
        return 'Outsourcing & Monitoreo de Tóners';
      case 'pos':
        return 'Terminal de Ventas POS';
      case 'inventory':
        return 'Control de Inventario';
      case 'service_registry':
        return 'Soporte Técnico y Taller';
      case 'reports':
        return 'Reportes y Business Intelligence';
      case 'settings':
        return 'Ajustes y Configuración';
      default:
        return 'SISTECH HITECH';
    }
  };

  const handleAddNew = () => {
    if (page === 'dashboard' || page === 'service_registry') {
      setPage('service_registry');
      setSubstate('service_registry', 'seleccion');
    } else if (page === 'inventory') {
      setSubstate('inventory', 'add');
    } else if (page === 'pos') {
      setSubstate('pos', 'moderno');
    } else if (page === 'outsourcing') {
      setPage('outsourcing');
    }
  };

  const showNewButton = role === 'admin' || 
    (role === 'tecnico' && (page === 'service_registry' || page === 'dashboard')) || 
    (role === 'cajero' && page === 'pos');

  const getProfileImage = () => {
    if (role === 'admin') {
      return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80";
    }
    if (role === 'tecnico') {
      return "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80";
    }
    if (role === 'cliente_outsourcing') {
      return "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=80&q=80";
    }
    return "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80";
  };

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'cajero') return 'Cajero Comercial';
    if (role === 'tecnico') return 'Técnico de Soporte';
    if (role === 'cliente_outsourcing') return 'Cliente Corporativo (SLA)';
    return 'Usuario';
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-88px)] h-16 bg-surface-container-lowest border-b border-outline-variant/30 flex justify-between items-center px-3 sm:px-6 md:px-8 z-30 print:hidden">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 flex md:hidden items-center justify-center cursor-pointer"
          title="Menú Principal"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        <h1 className="text-sm sm:text-base md:text-[19px] font-black text-primary tracking-tight font-sans truncate">
          {getPageTitle()}
        </h1>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
        {/* Add New Button (Role-restricted) */}
        {showNewButton && (
          <button
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-sans text-xs sm:text-[13px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Nuevo Registro"
          >
            <span className="hidden sm:inline">Nuevo</span>
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        )}

        {/* Notifications, Connection Sync Status and Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 border-l border-outline-variant/20 pl-2 sm:pl-4 md:pl-6">
          {/* Connection Status Icon */}
          <div 
            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-all ${
              isOnline 
                ? 'text-emerald-500 bg-emerald-500/10' 
                : 'text-amber-500 bg-amber-500/10'
            }`}
            title={isOnline ? "Online: Datos en la nube sincronizados" : "Offline: Trabajando localmente (datos respaldados)"}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              {isOnline ? 'cloud_done' : 'cloud_off'}
            </span>
          </div>

          {/* Interactive Notifications Center */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center p-1.5 sm:p-2 rounded-full hover:bg-surface-container-high relative cursor-pointer"
              title="Notificaciones y Alertas del Sistema"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto mt-2 sm:mt-3 sm:w-96 bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/30 py-4 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">Alertas del Sistema</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                      {notifications.length} activas
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 space-y-1">
                      <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
                      <p className="text-xs font-bold text-slate-600">Todo en orden</p>
                      <p className="text-[11px]">No hay alertas críticas en inventario, tóners o tickets.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          setPage(notif.actionPage);
                          setShowNotifications(false);
                        }}
                        className="p-2.5 rounded-2xl border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-low transition-all cursor-pointer flex items-start gap-3 text-left"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                          <span className="material-symbols-outlined text-[16px]">{notif.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface leading-tight truncate">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{notif.desc}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-300 text-[16px] mt-1">chevron_right</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary-fixed flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                alt={currentUser?.name || "Usuario"}
                src={getProfileImage()}
              />
            </div>
            <div className="hidden xl:block text-left mr-2">
              <p className="font-sans text-[13px] font-bold leading-none text-on-surface">{currentUser?.name || "Usuario"}</p>
              <p className="font-sans text-[10px] text-on-surface-variant font-semibold mt-1">{getRoleLabel()}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={logout}
            className="text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all flex items-center p-2 rounded-full cursor-pointer"
            title="Cerrar Sesión"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
