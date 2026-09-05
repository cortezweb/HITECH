import React from 'react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const { page, setPage, currentUser, rolePermissions } = useApp();

  const role = currentUser?.role || 'admin';
  const allowedWindows = rolePermissions[role] || [];

  const allNavItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'service_registry', icon: 'assignment', label: 'Soporte Técnico' },
    { id: 'pos', icon: 'point_of_sale', label: 'Terminal POS' },
    { id: 'inventory', icon: 'inventory_2', label: 'Inventario' },
    { id: 'reports', icon: 'analytics', label: 'Reportes y BI' },
  ];

  const navItems = allNavItems.filter(item => allowedWindows.includes(item.id));

  return (
    <aside className="fixed left-0 top-0 h-full w-[88px] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col items-center py-8 gap-6 z-50 print:hidden">
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
              className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
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
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
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
  );
}
