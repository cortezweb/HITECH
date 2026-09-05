import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    rolePermissions,
    updateRolePermissions,
    shopInfo,
    updateShopInfo,
    activityLogs,
    currentUser,
    logActivity,
    products,
    tickets,
    sales
  } = useApp();

  const getUserCommissions = (user) => {
    let volume = 0;
    let rate = '0%';
    let type = 'N/A';
    let commission = 0;

    if (user.role === 'cajero') {
      rate = '2% POS';
      type = 'Ventas POS';
      const userSales = sales ? sales.filter(s => 
        s.cashierName === user.name || 
        s.cashierId === user.email ||
        s.cashierId === user.id
      ) : [];
      volume = userSales.reduce((sum, s) => sum + (s.total || 0), 0);
      commission = volume * 0.02;
    } else if (user.role === 'tecnico') {
      rate = '10% Soporte';
      type = 'Soporte Técnico';
      const userTickets = tickets ? tickets.filter(t => 
        t.status === 'Completed' && (
          t.assignedTech === user.name || 
          t.assignedTech?.name === user.name ||
          t.assignedTech?.email === user.email ||
          t.assignedTech === user.id
        )
      ) : [];
      volume = userTickets.reduce((sum, t) => sum + (t.price || 0), 0);
      commission = volume * 0.10;
    } else if (user.role === 'admin') {
      rate = 'N/A';
      type = 'Administración';
    }

    return { volume, rate, type, commission };
  };

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'permisos' | 'empresa' | 'bitacora' | 'backup'

  // User form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cajero',
    avatar: ''
  });
  const [userErrors, setUserErrors] = useState({});

  // Shop Info Form state
  const [shopForm, setShopForm] = useState({ ...shopInfo });
  const [shopSaveSuccess, setShopSaveSuccess] = useState(false);

  // Search/Filter for Activity Logs
  const [logSearchQuery, setLogSearchQuery] = useState('');

  // Access check
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-4">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-[48px] font-bold">gpp_bad</span>
        </div>
        <h2 className="text-2xl font-black text-on-surface">Acceso Restringido</h2>
        <p className="text-on-surface-variant max-w-md">No tienes los privilegios de Administrador para modificar la configuración del sistema.</p>
      </div>
    );
  }

  // Add User submit handler
  const handleAddUser = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newUser.name.trim()) errors.name = 'El nombre es obligatorio.';
    if (!newUser.email.trim()) {
      errors.email = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      errors.email = 'Correo no válido.';
    } else if (users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
      errors.email = 'Este correo ya está registrado.';
    }
    
    if (!newUser.password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (newUser.password.length < 6) {
      errors.password = 'Debe tener al menos 6 caracteres.';
    }

    if (Object.keys(errors).length > 0) {
      setUserErrors(errors);
      return;
    }

    setUserErrors({});
    await addUser(newUser);
    
    // Reset Form
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'cajero',
      avatar: ''
    });
  };

  // Toggle user status
  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'disabled' : 'active';
    await updateUser(user.id, { status: nextStatus });
  };

  // Delete user check
  const handleDeleteUser = async (userId, name) => {
    if (userId === 'usr-1' || name === currentUser.name) {
      alert('No puedes eliminar tu propia cuenta o la del Administrador principal.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name}?`)) {
      await deleteUser(userId);
    }
  };

  // Shop Info Update handler
  const handleUpdateShop = async (e) => {
    e.preventDefault();
    if (!shopForm.name.trim() || !shopForm.ruc.trim() || !shopForm.address.trim()) {
      alert('Nombre de la Empresa, RUC y Dirección son obligatorios.');
      return;
    }
    await updateShopInfo(shopForm);
    setShopSaveSuccess(true);
    setTimeout(() => setShopSaveSuccess(false), 3000);
  };

  // Permission toggler
  const handleTogglePermission = async (role, windowId) => {
    if (role === 'admin' && windowId === 'settings') {
      alert('Por seguridad, el Administrador debe tener acceso a Ajustes obligatoriamente.');
      return;
    }
    const currentPerms = rolePermissions[role] || [];
    const isAllowed = currentPerms.includes(windowId);
    let updated;
    if (isAllowed) {
      updated = currentPerms.filter(p => p !== windowId);
    } else {
      updated = [...currentPerms, windowId];
    }
    await updateRolePermissions(role, updated);
  };

  // Simulated DB Backup: downloads a JSON
  const triggerJSONBackup = () => {
    const backupObj = {
      users,
      rolePermissions,
      shopInfo,
      products,
      tickets,
      sales,
      activityLogs,
      backupDate: new Date().toISOString(),
      generator: 'SISTECH Admin Toolkit'
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    const dateStr = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    downloadAnchor.setAttribute("download", `sistech_respaldo_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    logActivity('Descargar Backup', 'Se exportó una copia de seguridad en formato JSON.');
  };

  // Restore Backup logic
  const handleRestoreBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.users && data.shopInfo && data.rolePermissions) {
          // 1. Restore Users
          for (const usr of data.users) {
            await setDoc(doc(db, 'users', usr.id), usr);
          }
          // 2. Restore shopInfo
          await updateShopInfo(data.shopInfo);
          // 3. Restore rolePermissions
          for (const [r, perms] of Object.entries(data.rolePermissions)) {
            await updateRolePermissions(r, perms);
          }
          
          alert('¡Copia de seguridad restaurada correctamente!');
          logActivity('Restaurar Backup', 'Se importó una copia de seguridad en el sistema.');
          window.location.reload();
        } else {
          alert('El archivo no parece contener una copia de seguridad estructurada válida de SISTECH.');
        }
      } catch (err) {
        alert('Error al analizar el archivo de respaldo: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Filter logs based on search query
  const filteredLogs = activityLogs.filter(log => {
    if (!logSearchQuery.trim()) return true;
    const query = logSearchQuery.toLowerCase();
    return (
      log.user?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.details?.toLowerCase().includes(query) ||
      log.role?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-black text-on-surface">Configuración de SISTECH</h1>
        <p className="text-[13px] text-on-surface-variant mt-1">
          Administra personal, permisos de roles, datos comerciales, auditoría y copias de seguridad.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-2">
        {[
          { id: 'personal', label: 'Personal y Accesos', icon: 'badge' },
          { id: 'permisos', label: 'Roles y Pantallas', icon: 'key' },
          { id: 'empresa', label: 'Datos Comerciales', icon: 'store' },
          { id: 'bitacora', label: 'Bitácora del Sistema', icon: 'history_toggle_off' },
          { id: 'backup', label: 'Copias de Seguridad', icon: 'backup' }
        ].map((tab) => {
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 font-bold text-[13px] flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                isAct 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-on-surface-variant hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="min-h-[50vh]">
        {/* TAB 1: PERSONAL / STAFF */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Staff list table */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">people</span>
                <span>Personal Registrado</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Rol / Tasa</th>
                      <th className="py-3 px-4 text-right">Volumen</th>
                      <th className="py-3 px-4 text-right">Comisión</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {users.map((usr) => (
                      <tr 
                        key={usr.id} 
                        className={`transition-colors hover:bg-slate-50/50 ${
                          usr.status !== 'active' ? 'opacity-60 bg-slate-50/20' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img 
                            src={usr.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                            alt={usr.name} 
                            className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
                          />
                          <div>
                            <p className="font-bold text-on-surface text-[13px]">{usr.name}</p>
                            <p className="text-[10px] text-on-surface-variant font-mono">{usr.email}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            usr.role === 'admin' 
                              ? 'bg-primary-fixed text-primary' 
                              : usr.role === 'tecnico' 
                                ? 'bg-secondary-fixed text-secondary' 
                                : 'bg-tertiary-fixed text-tertiary'
                          }`}>
                            {usr.role}
                          </span>
                          {usr.role !== 'admin' && (
                            <span className="text-[10px] text-slate-500 font-bold block mt-1">
                              Tasa: {getUserCommissions(usr).rate}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          {usr.role === 'admin' ? '-' : `$${getUserCommissions(usr).volume.toFixed(2)}`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-primary text-[13px]">
                          {usr.role === 'admin' ? '-' : `$${getUserCommissions(usr).commission.toFixed(2)}`}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 font-bold text-[11px] ${
                            usr.status === 'active' ? 'text-emerald-600' : 'text-error'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              usr.status === 'active' ? 'bg-emerald-500' : 'bg-error'
                            }`}></span>
                            <span>{usr.status === 'active' ? 'Activo' : 'Inhabilitado'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(usr)}
                            disabled={usr.id === 'usr-1'}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              usr.status === 'active' 
                                ? 'border-error/20 bg-error/5 text-error hover:bg-error hover:text-white' 
                                : 'border-emerald-600/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                            }`}
                          >
                            {usr.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id, usr.name)}
                            disabled={usr.id === 'usr-1'}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold text-on-surface-variant hover:text-error transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar usuario"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add User Form */}
            <div className="lg:col-span-4 bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">person_add</span>
                <span>Añadir Nuevo Usuario</span>
              </h3>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="ej. Juan Perez"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary"
                  />
                  {userErrors.name && <p className="text-[10px] text-error mt-0.5 font-semibold">{userErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="ej. juan@sistech.com"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary"
                  />
                  {userErrors.email && <p className="text-[10px] text-error mt-0.5 font-semibold">{userErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Contraseña *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary"
                  />
                  {userErrors.password && <p className="text-[10px] text-error mt-0.5 font-semibold">{userErrors.password}</p>}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Rol Asignado</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[12px] outline-none focus:border-primary cursor-pointer font-bold"
                  >
                    <option value="cajero">Cajero (Ventas y Cobros)</option>
                    <option value="tecnico">Técnico (Diagnóstico y Reparaciones)</option>
                    <option value="admin">Administrador (Control Total)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-on-primary rounded-xl text-[12px] font-bold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer mt-2"
                >
                  Registrar Personal
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES & PERMISSIONS GRID */}
        {activeTab === 'permisos' && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6">
            <div className="space-y-1">
              <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">key</span>
                <span>Matriz de Permisos de Pantallas</span>
              </h3>
              <p className="text-[12px] text-on-surface-variant">
                Configura a qué módulos o pantallas del sistema puede ingresar cada rol de usuario.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50">
                    <th className="py-3 px-4 w-1/3">Módulo / Pantalla</th>
                    <th className="py-3 px-4 text-center">Administrador</th>
                    <th className="py-3 px-4 text-center">Cajero</th>
                    <th className="py-3 px-4 text-center">Técnico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {[
                    { id: 'dashboard', label: 'Dashboard General (Inicio)', desc: 'Resumen financiero, métricas de órdenes y KPI comerciales' },
                    { id: 'service_registry', label: 'Soporte Técnico (Órdenes)', desc: 'Registro de fallas, diagnósticos y control de estado de equipos' },
                    { id: 'pos', label: 'Terminal POS (Punto de Venta)', desc: 'Carrito de compras, cobros (efectivo/tarjetas/QR) e impresión de recibos' },
                    { id: 'inventory', label: 'Inventario de Repuestos/Equipos', desc: 'Registro de stock, precios y categorías de productos' },
                    { id: 'reports', label: 'Reportes y Business Intelligence (BI)', desc: 'Análisis de ventas, márgenes, rotación de stock y exportaciones contables' },
                    { id: 'settings', label: 'Configuración y Personal', desc: 'Matriz de permisos, edición de empresa y auditoría' }
                  ].map((window) => (
                    <tr key={window.id} className="hover:bg-slate-50/30">
                      <td className="py-4 px-4">
                        <p className="font-bold text-on-surface text-[13px]">{window.label}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">{window.desc}</p>
                      </td>
                      {['admin', 'cajero', 'tecnico'].map((role) => {
                        const hasAccess = (rolePermissions[role] || []).includes(window.id);
                        return (
                          <td key={role} className="py-4 px-4 text-center">
                            <label className="inline-flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-slate-100/60 transition-colors">
                              <input
                                type="checkbox"
                                checked={hasAccess}
                                onChange={() => handleTogglePermission(role, window.id)}
                                className="w-5 h-5 rounded text-primary focus:ring-primary border-outline-variant/40 accent-primary cursor-pointer"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SHOP / COMPANY DETAILS */}
        {activeTab === 'empresa' && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6 max-w-3xl mx-auto">
            <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5 border-b border-outline-variant/10 pb-4">
              <span className="material-symbols-outlined text-primary text-[20px]">store</span>
              <span>Datos Comerciales de la Tienda</span>
            </h3>

            <form onSubmit={handleUpdateShop} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Nombre Comercial de la Tienda *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.name}
                    onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant mb-1">R.U.C. o Identificación Fiscal *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.ruc}
                    onChange={(e) => setShopForm({ ...shopForm, ruc: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Dirección de la Sucursal *</label>
                <input
                  type="text"
                  required
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Teléfonos de Contacto *</label>
                <input
                  type="text"
                  required
                  value={shopForm.phone}
                  onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Ubicación para el Clima (Ciudad, País) *</label>
                <input
                  type="text"
                  required
                  value={shopForm.weatherLocation || ''}
                  onChange={(e) => setShopForm({ ...shopForm, weatherLocation: e.target.value })}
                  placeholder="ej. Lima, PE o Madrid, ES"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-on-surface-variant mb-1">Garantía / Políticas de Servicio (Términos en Ticket)</label>
                <textarea
                  value={shopForm.warranty}
                  onChange={(e) => setShopForm({ ...shopForm, warranty: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-[13px] outline-none focus:border-primary resize-none"
                />
              </div>

              {shopSaveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-[12px] font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Datos de empresa actualizados con éxito. Los tickets reflejarán estos cambios al instante.</span>
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-3 bg-primary text-on-primary rounded-xl text-[13px] font-bold shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
              >
                Guardar Datos de Tienda
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: BITACORA / ACTIVITY AUDIT LOG */}
        {activeTab === 'bitacora' && (
          <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">history_toggle_off</span>
                  <span>Bitácora de Auditoría del Sistema</span>
                </h3>
                <p className="text-[12px] text-on-surface-variant">
                  Historial detallado de todas las operaciones críticas ejecutadas por el personal.
                </p>
              </div>

              {/* Log Search input */}
              <div className="relative w-full md:max-w-xs">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Buscar logs por acción, usuario..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary text-[12px] outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto pr-2">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-bold bg-slate-50 sticky top-0">
                    <th className="py-2.5 px-4 bg-slate-50">Fecha / Hora</th>
                    <th className="py-2.5 px-4 bg-slate-50">Usuario</th>
                    <th className="py-2.5 px-4 bg-slate-50">Rol</th>
                    <th className="py-2.5 px-4 bg-slate-50">Acción</th>
                    <th className="py-2.5 px-4 bg-slate-50">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-on-surface-variant font-semibold">
                        No se encontraron registros de auditoría que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isAuth = log.action?.includes('Sesión');
                      const isSale = log.action?.includes('Venta');
                      const isDelete = log.action?.includes('Eliminar');
                      const isCreate = log.action?.includes('Crear') || log.action?.includes('Nuevo') || log.action?.includes('Añadir');
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">{log.date}</td>
                          <td className="py-3 px-4 font-bold text-on-surface">{log.user}</td>
                          <td className="py-3 px-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              log.role === 'admin' 
                                ? 'bg-primary-fixed text-primary' 
                                : log.role === 'tecnico' 
                                  ? 'bg-secondary-fixed text-secondary' 
                                  : 'bg-tertiary-fixed text-tertiary'
                            }`}>
                              {log.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSale 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : isDelete 
                                  ? 'bg-red-100 text-red-800' 
                                  : isCreate 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : isAuth 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-slate-100 text-slate-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-on-surface-variant font-semibold leading-normal">{log.details}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BACKUP & DATABASE CONTROL */}
        {activeTab === 'backup' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Database Stats card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4 text-left">
              <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">analytics</span>
                <span>Estado de Almacenamiento Local</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <span className="text-[11px] text-on-surface-variant font-bold block">Productos Inventariados</span>
                  <span className="text-[22px] font-black text-primary mt-1 block">{products.length}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <span className="text-[11px] text-on-surface-variant font-bold block">Órdenes de Soporte</span>
                  <span className="text-[22px] font-black text-secondary mt-1 block">{tickets.length}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <span className="text-[11px] text-on-surface-variant font-bold block">Ventas Registradas</span>
                  <span className="text-[22px] font-black text-emerald-600 mt-1 block">{sales.length}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <span className="text-[11px] text-on-surface-variant font-bold block">Cuentas Activas</span>
                  <span className="text-[22px] font-black text-purple-600 mt-1 block">{users.length}</span>
                </div>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm space-y-6">
              <h3 className="text-[15px] font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">save</span>
                <span>Descargas e Importaciones</span>
              </h3>

              <div className="space-y-4 text-left">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-3">
                  <p className="text-[12px] text-on-surface-variant font-semibold">
                    Descarga toda la base de datos (productos, ventas, tickets, configuraciones y usuarios) en un único archivo plano para resguardar información fuera de la nube.
                  </p>
                  <button
                    type="button"
                    onClick={triggerJSONBackup}
                    className="py-2.5 px-4 bg-primary text-on-primary rounded-xl text-[12px] font-bold shadow hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span>Descargar Backup JSON</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-3">
                  <p className="text-[12px] text-on-surface-variant font-semibold">
                    Restaura configuraciones, usuarios y datos comerciales de la empresa desde un archivo de respaldo JSON generado anteriormente por SISTECH.
                  </p>
                  <label className="py-2.5 px-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded-xl text-[12px] font-bold flex items-center gap-1.5 cursor-pointer w-fit">
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    <span>Subir y Restaurar Respaldo</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
