import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { 
    page, 
    setPage, 
    currentUser, 
    rolePermissions, 
    logout,
    isMobileMenuOpen, 
    setIsMobileMenuOpen 
  } = useApp();

  const role = currentUser?.role || 'admin';
  const allowedWindows = rolePermissions[role] || [];

  const allNavItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', shortLabel: 'Inicio' },
    { id: 'outsourcing', icon: 'hub', label: 'Outsourcing Tóners', shortLabel: 'Tóners' },
    { id: 'service_registry', icon: 'assignment', label: 'Soporte Técnico', shortLabel: 'Soporte' },
    { id: 'pos', icon: 'point_of_sale', label: 'Terminal POS', shortLabel: 'POS' },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventario', shortLabel: 'Stock' },
    { id: 'reports', icon: 'analytics', label: 'Reportes y BI', shortLabel: 'Reportes' },
  ];

  const navItems = allNavItems.filter(item => allowedWindows.includes(item.id));

  // Quick items for Mobile Bottom Bar (Max 4 plus "Menú")
  const mobileQuickIds = ['dashboard', 'service_registry', 'pos', 'outsourcing'];
  const mobileQuickItems = navItems.filter(item => mobileQuickIds.includes(item.id));

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'cajero') return 'Cajero Comercial';
    if (role === 'tecnico') return 'Técnico de Soporte';
    if (role === 'cliente_outsourcing') return 'Cliente Corporativo';
    return 'Usuario';
  };

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Visible only on md and larger screens) */}
      <aside className="fixed left-0 top-0 h-full w-[88px] bg-surface-container-lowest border-r border-outline-variant/30 hidden md:flex flex-col items-center py-8 gap-6 z-50 print:hidden">
        <div className="mb-4">
          <span className="text-[28px] font-bold text-primary tracking-tight material-symbols-outlined">
            rocket_launch
          </span>
        </div>
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary scale-95 shadow-md shadow-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
                title={item.label}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {item.icon}
                </span>
              </button>
            );
          })}
        </nav>
        
        {allowedWindows.includes('settings') && (
          <div className="mt-auto">
            <button 
              onClick={() => setPage('settings')}
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                page === 'settings'
                  ? 'bg-primary text-on-primary scale-95 shadow-md shadow-primary/20'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
              title="Configuración"
            >
              <span className="material-symbols-outlined text-[24px]">settings</span>
            </button>
          </div>
        )}
      </aside>

      {/* 2. MOBILE BOTTOM NAVIGATION BAR (Thumb-friendly for Smartphones) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-lg border-t border-outline-variant/30 flex md:hidden justify-around items-center px-2 z-40 print:hidden shadow-lg safe-bottom">
        {mobileQuickItems.map((item) => {
          const isActive = page === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
                {item.shortLabel}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-pulse" />
              )}
            </button>
          );
        })}

        {/* Hamburger / Full Menu trigger on mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all cursor-pointer ${
            isMobileMenuOpen ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
            Más
          </span>
        </button>
      </nav>

      {/* 3. MOBILE SLIDE-OVER DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden print:hidden">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer content */}
          <div className="fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px] bg-surface-container-lowest border-r border-outline-variant/30 z-50 p-5 flex flex-col shadow-2xl animate-in slide-in-from-left duration-250">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                </div>
                <div>
                  <h2 className="font-black text-sm text-on-surface leading-tight">SISTECH HITECH</h2>
                  <p className="text-[10px] text-slate-400 font-medium">POS & Soporte Técnico</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Current user badge */}
            <div className="p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-on-surface truncate">{currentUser?.name || 'Usuario'}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold inline-block mt-0.5">
                  {getRoleLabel()}
                </span>
              </div>
            </div>

            {/* Full navigation menu links */}
            <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                Módulos del Sistema
              </p>
              {navItems.map((item) => {
                const isActive = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setPage(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 hover:bg-surface-container hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isActive && (
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    )}
                  </button>
                );
              })}

              {allowedWindows.includes('settings') && (
                <button
                  onClick={() => {
                    setPage('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    page === 'settings'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-surface-container hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                  <span className="flex-1 truncate">Ajustes y Configuración</span>
                </button>
              )}
            </nav>

            {/* Logout button at bottom */}
            <div className="pt-4 border-t border-outline-variant/20 mt-auto">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-rose-200"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
