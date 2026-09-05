import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Add a tiny artificial delay to make the transition feel organic
    setTimeout(() => {
      const success = login(email, password);
      setIsLoading(false);
      if (!success) {
        setError('Credenciales inválidas. Por favor verifique el correo y la contraseña.');
      }
    }, 600);
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const demoAccounts = [
    { label: 'Administrador', email: 'admin@sistech.com', pass: 'admin123', icon: 'admin_panel_settings', color: 'from-blue-500 to-indigo-600' },
    { label: 'Cajero', email: 'cajero@sistech.com', pass: 'cajero123', icon: 'point_of_sale', color: 'from-emerald-500 to-teal-600' },
    { label: 'Técnico', email: 'tecnico@sistech.com', pass: 'tecnico123', icon: 'build', color: 'from-amber-500 to-orange-600' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c1020] via-[#121c38] to-[#080b15] p-6 text-white relative overflow-hidden">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-secondary/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] z-10">
        {/* Brand Logo & Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30 mb-4 animate-pulse">
            <span className="material-symbols-outlined text-[32px] text-white">bolt</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            SISTECH POS
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Gestión Integral de Ventas y Soporte Técnico
          </p>
        </div>

        {/* Login Card */}
        <div className="glass border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden bg-slate-900/40">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-secondary" />

          <h2 className="text-xl font-semibold mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/30 text-red-200 text-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-red-400 flex-shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="ejemplo@sistech.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-white placeholder-slate-500 outline-none h-12"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-white placeholder-slate-500 outline-none h-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 h-12 mt-6"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
              Cuentas de Demostración
            </p>
            <div className="grid grid-cols-3 gap-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all text-center cursor-pointer min-h-[80px]"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center mb-1.5 shadow`}>
                    <span className="material-symbols-outlined text-white text-[18px]">{acc.icon}</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-200">{acc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} SISTECH POS. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
