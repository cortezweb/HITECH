import React from 'react';
import { useApp } from '../context/AppContext';

export default function TopBar() {
  const { page, setPage, setSubstate, isOnline, currentUser, logout } = useApp();

  const role = currentUser?.role || 'admin';

  const getPageTitle = () => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'pos':
        return 'Terminal POS';
      case 'inventory':
        return 'Inventario';
      case 'service_registry':
        return 'Registro de Servicio';
      default:
        return 'HITECH';
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
    }
  };

  const showNewButton = role === 'admin' || 
    (role === 'tecnico' && (page === 'service_registry' || page === 'dashboard')) || 
    (role === 'cajero' && page === 'pos');

  const getProfileImage = () => {
    if (role === 'admin') {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuCa6jLVd2RWC_zWWyzuBKdvUmntE_PxNalgoTHEtEE9cLZhA_p4vC8OkF-q7yNNw8uERQ6a9wDsSaUHn1NGCUHFYhzzDCd2HdFMI3gwwz5qG8gMKFmIQAu3baekiH5tBWNEbG9tI1J-iBz6I8fzwybxtE-atTNysmWLXM3i7liKezrMa6pjvQR06D0-ABz5EPY-ajJAwYfW6OLv7ys4NcqX_TszFlr-lHQ8lSLJ8a099sYDmj4kL5w-2beKCwQAAdp0WzoFPXJ9Fws";
    }
    if (role === 'tecnico') {
      return "https://lh3.googleusercontent.com/aida-public/AB6AXuAWS-DL1itB-ehhEbpvCyARjpoyIsDlkB4hC6HkXD7cUteNw_Zdlpgh3xmrIpweVJ9tchVs5Z1LCK6Dv2Wf3WSzi_YpYLHz1psx6dvItGBM6nwbhQUTmgGzDpw43VZxnklVUNAKGe4xlYolqmYpEyUVNOhEYr8oxhctdg-Zyw008hlgS3uEdRBq3WwvNqrgvrYNbM0xqHgp7MSdcbODvuB0Ag5Q47l51P27XrkcTN7jLqR0WOkQuX6Y4bVViFIwUyaazfmu-t8Bamo";
    }
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuCEHAcsQkSq-XpI2d6XOc-7iOtomUETH1UpjTV8pe4IAh3loaesmtSGwC5TnTximhqRXuI64lGMnqVQeJnHWc4pBtkET4i5HJVAqx8_wevfhSRIiB2G4P8-mKzebRjXsQTzPB6qIyl-iSxgO3iE7B6uZQQfAIAvbltg697t3oqMEnwg7OuJ6hJlqrOfvfQA-PoSY9LKMLZESfuZc2OJkZFOzPJk2u0-nu3a8SjaOccOMIooghhYHfCJI_k3uVQcSNOtUc_A8m0r3D4";
  };

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrador';
    if (role === 'cajero') return 'Cajero';
    if (role === 'tecnico') return 'Técnico de Soporte';
    return 'Usuario';
  };

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-88px)] h-16 bg-surface-container-lowest border-b border-outline-variant/30 flex justify-between items-center px-8 z-40 print:hidden">
      <div className="flex items-center gap-4">
        <h1 className="text-[22px] font-bold text-primary font-sans">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-transparent focus-within:border-primary w-64 transition-all duration-200">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-[18px]">search</span>
          <input
            className="bg-transparent border-none outline-none text-[14px] w-full text-on-surface placeholder-on-surface-variant/70 focus:ring-0"
            placeholder="Buscar..."
            type="text"
            onChange={(e) => {}}
          />
        </div>

        {/* Add New Button (Role-restricted) */}
        {showNewButton && (
          <button
            onClick={handleAddNew}
            className="bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container px-6 py-2 rounded-full font-sans text-[14px] font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Nuevo</span>
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
        )}

        {/* Notifications, Connection Sync Status and Profile */}
        <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6">
          {/* Connection Status Icon */}
          <div 
            className={`flex items-center justify-center p-2 rounded-full transition-all ${
              isOnline 
                ? 'text-emerald-500 bg-emerald-500/10' 
                : 'text-amber-500 bg-amber-500/10'
            }`}
            title={isOnline ? "Online: Datos en la nube sincronizados" : "Offline: Trabajando localmente (datos respaldados)"}
          >
            <span className="material-symbols-outlined text-[20px] animate-pulse">
              {isOnline ? 'cloud_done' : 'cloud_off'}
            </span>
          </div>

          <button 
            onClick={() => alert('Notificaciones - Próximamente')}
            className="text-on-surface-variant hover:text-primary transition-colors flex items-center p-2 rounded-full hover:bg-surface-container-high"
            title="Notificaciones"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary-fixed">
              <img
                className="w-full h-full object-cover"
                alt={currentUser?.name || "Usuario"}
                src={getProfileImage()}
              />
            </div>
            <div className="hidden xl:block text-left mr-2">
              <p className="font-sans text-[14px] font-semibold leading-none text-on-surface">{currentUser?.name || "Usuario"}</p>
              <p className="font-sans text-[11px] text-on-surface-variant font-semibold mt-0.5">{getRoleLabel()}</p>
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
