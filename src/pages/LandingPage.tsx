import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const STYLES = `
  html { scroll-behavior: smooth; }
  .landing-gradient-hero { background: linear-gradient(135deg, #111f3a 0%, #1F3864 50%, #2a4a8a 100%); }
  .landing-gradient-cta  { background: linear-gradient(135deg, #1F3864 0%, #2a4a8a 100%); }
  .landing-card-hover    { transition: transform .2s, box-shadow .2s; }
  .landing-card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,.12); }
  .landing-pulse-dot::before {
    content: '';
    display: inline-block;
    width: 8px; height: 8px;
    background: #22c55e;
    border-radius: 50%;
    margin-right: 6px;
    animation: lpulse 2s infinite;
  }
  @keyframes lpulse { 0%,100%{opacity:1}50%{opacity:.4} }
  @keyframes lfadeUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
  .landing-fade-up   { animation: lfadeUp .6s ease both; }
  .landing-fade-up-1 { animation-delay:.1s }
  .landing-fade-up-2 { animation-delay:.25s }
  .landing-fade-up-3 { animation-delay:.4s }
`

export default function LandingPage() {
  const { user, profile, isSuperAdmin, loading } = useAuth()
  const navigate = useNavigate()

  // Redirect already-logged-in users to their dashboard
  useEffect(() => {
    if (loading) return
    if (!user) return
    if (isSuperAdmin) { navigate('/superadmin/dashboard', { replace: true }); return }
    if (profile?.role === 'admin')      navigate('/admin/dashboard',      { replace: true })
    else if (profile?.role === 'supervisor') navigate('/supervisor/dashboard', { replace: true })
    else if (profile?.role === 'operator')   navigate('/operator/home',        { replace: true })
  }, [user, profile, isSuperAdmin, loading, navigate])

  const year = new Date().getFullYear()

  return (
    <div className="font-sans text-gray-800 bg-white">
      <style>{STYLES}</style>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111f3a]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 text-white font-bold text-lg">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            RestoBPM
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#problemas" className="hover:text-white transition-colors">Problemas</a>
            <a href="#funciones" className="hover:text-white transition-colors">Funciones</a>
            <a href="#modulos"   className="hover:text-white transition-colors">Módulos</a>
            <a href="#precios"   className="hover:text-white transition-colors">Precios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:inline-block text-sm text-white/70 hover:text-white transition-colors px-3 py-2">
              Ingresar
            </Link>
            <Link to="/register" className="bg-white text-[#1F3864] font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Prueba gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-gradient-hero min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/80 mb-8 landing-fade-up">
              <span className="landing-pulse-dot"></span>
              D.S. 977/96 · RSA Chile · Control en tiempo real
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 landing-fade-up landing-fade-up-1">
              La SEREMI DE SALUD no avisa.<br/>
              <span className="text-blue-300">¿Tu local está listo?</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl landing-fade-up landing-fade-up-2">
              RestoBPM digitaliza el control de tus Buenas Prácticas de Manufactura.
              Registra cada proceso en tiempo real, recibe alertas automáticas y genera
              informes para el fiscalizador con un solo click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 landing-fade-up landing-fade-up-3">
              <Link to="/register" className="inline-flex items-center justify-center gap-2 bg-white text-[#1F3864] font-bold text-base px-7 py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5" aria-hidden="true"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                Empezar gratis — 3 días
              </Link>
              <a href="#funciones" className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold text-base px-7 py-4 rounded-xl hover:bg-white/10 transition-all">
                Ver cómo funciona
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
            <div className="flex flex-wrap gap-3 mt-10 landing-fade-up landing-fade-up-3">
              <span className="text-xs bg-white/10 border border-white/15 text-white/60 px-3 py-1 rounded-full">✓ Sin tarjeta de crédito</span>
              <span className="text-xs bg-white/10 border border-white/15 text-white/60 px-3 py-1 rounded-full">✓ 3 días de prueba completa</span>
              <span className="text-xs bg-white/10 border border-white/15 text-white/60 px-3 py-1 rounded-full">✓ Cancela cuando quieras</span>
              <span className="text-xs bg-white/10 border border-white/15 text-white/60 px-3 py-1 rounded-full">✓ Soporte en español</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMAS ── */}
      <section id="problemas" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1F3864] uppercase tracking-widest mb-3">El problema</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Lo que pasa cuando el control BPM<br/>
              <span className="text-red-600">sigue siendo manual</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 landing-card-hover">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Multas imprevistas</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Sin registro digital, el incumplimiento pasa desapercibido hasta que la SEREMI DE SALUD ya está en la puerta — y la multa, en el bolsillo.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 landing-card-hover">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Registros en papel</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Planillas que se extravían, que se rellenan al final del día o que simplemente nunca llegan a los responsables.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-yellow-100 landing-card-hover">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Sin visibilidad del equipo</h3>
              <p className="text-sm text-gray-500 leading-relaxed">No sabes si tus colaboradores están siguiendo los protocolos correctos. Te enteras del problema cuando ya es tarde.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 landing-card-hover">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Sin evidencia ante el fiscalizador</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Cuando llega la inspección, no puedes demostrar que los controles se realizaron correctamente y en los horarios exigidos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONES ── */}
      <section id="funciones" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1F3864] uppercase tracking-widest mb-3">La solución</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Control BPM completo, desde cualquier dispositivo</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">RestoBPM convierte tus registros en papel en un sistema digital inteligente que trabaja para ti las 24 horas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { bg: 'bg-[#1F3864]/5', border: 'border-[#1F3864]/15', ibg: 'bg-[#1F3864]', title: 'Dashboard en tiempo real', desc: 'Visualiza el estado de cumplimiento de todos los módulos BPM en un solo panel. Detecta desvíos al instante, desde tu teléfono o computador.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { bg: 'bg-green-50', border: 'border-green-200', ibg: 'bg-green-600', title: 'Checklists digitales con folio', desc: 'Cada control queda registrado con fecha, hora, operador responsable y folio único. Imposible de falsificar, siempre disponible.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { bg: 'bg-amber-50', border: 'border-amber-200', ibg: 'bg-amber-500', title: 'Alertas push automáticas', desc: 'Recibe notificaciones cuando una temperatura se desvía del rango, un checklist no se completa a tiempo o surge una no conformidad.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { bg: 'bg-blue-50', border: 'border-blue-200', ibg: 'bg-blue-600', title: 'Informe PDF para la SEREMI DE SALUD', desc: 'Genera el informe de cumplimiento BPM en segundos. Con firma digital, folio y todos los registros del período. Muéstralo en la fiscalización.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { bg: 'bg-purple-50', border: 'border-purple-200', ibg: 'bg-purple-600', title: 'Métricas e historial', desc: 'Analiza tendencias, puntajes de cumplimiento por módulo y evolución mensual. Toma decisiones con datos reales de tu establecimiento.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
              { bg: 'bg-indigo-50', border: 'border-indigo-200', ibg: 'bg-indigo-600', title: 'Gestión de roles y operadores', desc: 'Asigna roles de operador, supervisor y administrador. Cada persona ve y hace solo lo que le corresponde.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            ].map((f, i) => (
              <div key={i} className={`${f.bg} border ${f.border} rounded-2xl p-6 landing-card-hover`}>
                <div className={`w-12 h-12 ${f.ibg} rounded-xl flex items-center justify-center mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-gray-800 text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTE BANNER ── */}
      <section className="landing-gradient-hero py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
            "Sabía que estábamos al día<br/>
            <span className="text-blue-300">porque RestoBPM me lo confirmaba</span><br/>
            minuto a minuto."
          </p>
          <p className="text-white/60 text-base mt-6">— Administrador de establecimiento de alimentos, Santiago</p>
        </div>
      </section>

      {/* ── MÓDULOS ── */}
      <section id="modulos" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1F3864] uppercase tracking-widest mb-3">Módulos BPM</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Todos los módulos que exige la RSA</h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-base">Basados en el D.S. 977/96 y los requerimientos dla SEREMI DE SALUD para establecimientos de producción y expendio de alimentos.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { code: 'IF', color: 'text-blue-600', bg: 'bg-blue-100', title: 'Infraestructura e Instalaciones', desc: 'Estado físico del local: pisos, muros, ventilación, saneamiento.', icon: <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
              { code: 'IS', color: 'text-green-600', bg: 'bg-green-100', title: 'Inocuidad de Superficies', desc: 'Limpieza y desinfección de superficies en contacto con alimentos.', icon: <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
              { code: 'PM', color: 'text-purple-600', bg: 'bg-purple-100', title: 'Personal y Manipuladores', desc: 'Carnet, lavado de manos, indumentaria y capacitaciones vigentes.', icon: <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
              { code: 'CS', color: 'text-cyan-600', bg: 'bg-cyan-100', title: 'Cadena de Frío', desc: 'Registro de temperaturas de cámaras, vitrinas y almacenamiento.', icon: <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
              { code: 'PF', color: 'text-amber-600', bg: 'bg-amber-100', title: 'Procesos y Flujos', desc: 'Recepción, almacenamiento, elaboración y despacho de productos.', icon: <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
            ].map((m) => (
              <div key={m.code} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-100 landing-card-hover">
                <div className={`w-12 h-12 ${m.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>{m.icon}</div>
                <div className={`text-xs font-bold ${m.color} mb-1`}>{m.code}</div>
                <h3 className="font-bold text-gray-800 text-sm">{m.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-[#1F3864] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="font-bold">100% alineado con D.S. 977/96 — Reglamento Sanitario de los Alimentos</p>
                <p className="text-sm text-white/60">Checklists diseñados según los requerimientos dla SEREMI DE SALUD para establecimientos de alimentos en Chile.</p>
              </div>
            </div>
            <Link to="/register" className="shrink-0 bg-white text-[#1F3864] font-bold px-6 py-3 rounded-xl text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
              Probar gratis →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1F3864] uppercase tracking-widest mb-3">Así de simple</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">En 3 pasos, tu local está bajo control</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-0.5 bg-gray-200 z-0"></div>
            {[
              { n: '1', title: 'Regístrate en 2 minutos', desc: 'Ingresa los datos de tu establecimiento y crea tu cuenta de administrador. Sin tarjeta, sin contratos.' },
              { n: '2', title: 'Configura tu equipo', desc: 'Agrega a tus operadores y supervisores. Asigna los módulos BPM que correspondan a tu tipo de establecimiento.' },
              { n: '3', title: 'Opera con tranquilidad', desc: 'Tu equipo registra los controles desde el celular. Tú ves todo en tiempo real y tienes los informes listos para cualquier fiscalización.' },
            ].map((s) => (
              <div key={s.n} className="relative text-center z-10">
                <div className="w-20 h-20 bg-[#1F3864] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <span className="text-3xl font-extrabold text-white">{s.n}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link to="/register" className="inline-flex items-center gap-2 bg-[#1F3864] hover:bg-[#111f3a] text-white font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-lg">
              Comenzar ahora — gratis por 3 días
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section id="precios" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-[#1F3864] uppercase tracking-widest mb-3">Planes</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Elige el plan que se adapta a tu negocio</h2>
            <p className="mt-3 text-gray-500">Todos los planes incluyen 3 días de prueba gratuita. Sin tarjeta de crédito.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Plan 1 — Cumplimiento Total (Destacado) */}
            <div className="bg-[#1F3864] rounded-2xl p-7 shadow-xl flex flex-col relative landing-card-hover ring-2 ring-[#1F3864] ring-offset-2">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-xs font-extrabold px-4 py-1.5 rounded-full shadow">★ Más popular</span>
              </div>
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <h3 className="text-lg font-bold text-white">Cumplimiento Total</h3>
              <div className="mt-3 mb-1"><span className="text-4xl font-extrabold text-white">$14.900</span></div>
              <p className="text-xs text-white/50 mb-6">/mes + IVA</p>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-white/80">
                <li className="flex items-start gap-2"><span className="text-green-300 font-bold mt-0.5">✓</span><strong className="text-white">Usuarios ilimitados</strong></li>
                <li className="flex items-start gap-2"><span className="text-green-300 font-bold mt-0.5">✓</span><strong className="text-white">Todos los módulos BPM</strong></li>
                <li className="flex items-start gap-2"><span className="text-green-300 font-bold mt-0.5">✓</span>Manuales y documentos BPM</li>
                <li className="flex items-start gap-2"><span className="text-green-300 font-bold mt-0.5">✓</span>Alertas push</li>
                <li className="flex items-start gap-2"><span className="text-green-300 font-bold mt-0.5">✓</span>Soporte web</li>
                <li className="flex items-start gap-2"><span className="text-amber-300 font-bold mt-0.5">+</span>Asesoría en resolución sanitaria <em className="text-white/50">(servicio opcional)</em></li>
                <li className="flex items-start gap-2"><span className="text-amber-300 font-bold mt-0.5">+</span>Revisión de establecimiento <em className="text-white/50">(servicio opcional)</em></li>
              </ul>
              <Link to="/register" className="w-full text-center bg-white hover:bg-gray-100 text-[#1F3864] font-bold py-3 rounded-xl text-sm transition-colors block">
                Comenzar gratis
              </Link>
            </div>
            {/* Plan 2 — Múltiples Sucursales */}
            <div className="bg-white rounded-2xl border border-gray-200 p-7 shadow-sm flex flex-col landing-card-hover">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Múltiples Sucursales</h3>
              <div className="mt-3 mb-1"><span className="text-4xl font-extrabold text-gray-900">$28.900</span></div>
              <p className="text-xs text-gray-400 mb-6">/mes + IVA</p>
              <ul className="space-y-2.5 flex-1 mb-6 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>Todo lo de Cumplimiento Total</li>
                <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span><strong>Hasta 4 sucursales</strong></li>
                <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>Gestión centralizada multi-local</li>
                <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>Usuarios ilimitados por sucursal</li>
                <li className="flex items-start gap-2"><span className="text-green-500 font-bold mt-0.5">✓</span>Soporte web prioritario</li>
              </ul>
              <Link to="/register" className="w-full text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors block">
                Comenzar gratis
              </Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">Precios en pesos chilenos (CLP) sin IVA (19%). Facturación mensual. Cancela cuando quieras.</p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="landing-gradient-cta py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Empieza hoy. La próxima fiscalización no espera.</h2>
          <p className="text-white/70 text-lg mb-10">3 días de acceso completo, sin tarjeta de crédito. Si decides continuar, elige el plan que se adapte a tu negocio.</p>
          <Link to="/register" className="inline-flex items-center gap-3 bg-white text-[#1F3864] font-extrabold text-lg px-10 py-5 rounded-2xl hover:bg-gray-100 transition-all shadow-2xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Crear cuenta gratis
          </Link>
          <p className="text-white/40 text-sm mt-5">Sin tarjeta · Sin compromiso · Datos seguros en Chile</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#111f3a] border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                RestoBPM
              </div>
              <p className="text-white/50 text-sm leading-relaxed">Sistema de apoyo en control de Buenas Prácticas de Manufactura para establecimientos de alimentos en Chile.</p>
              <p className="text-white/30 text-xs mt-3">D.S. 977/96 — RSA Chile</p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#funciones" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#modulos"   className="hover:text-white transition-colors">Módulos BPM</a></li>
                <li><a href="#precios"   className="hover:text-white transition-colors">Precios</a></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Prueba gratis</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4">Cuenta</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link to="/login"    className="hover:text-white transition-colors">Iniciar sesión</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Registrarse</Link></li>
                <li><a href="mailto:contacto@restobpm.cl" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
            <p>© {year} RestoBPM · Todos los derechos reservados</p>
            <p>Hecho en Chile 🇨🇱</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
