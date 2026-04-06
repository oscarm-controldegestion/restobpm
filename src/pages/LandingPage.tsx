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
        {/* Franja de colores SEREMI de Salud */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#1a3a7c]"></div>
          <div className="flex-1 bg-[#d52b1e]"></div>
        </div>
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
              <span className="text-[#ff4d55]">¿Tu local está listo?</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl landing-fade-up landing-fade-up-2 text-justify">
              RestoBPM digitaliza el control de tus Buenas Prácticas de Manufactura de Alimentos.
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
              Lo que pasa cuando el control de Buenas Prácticas de Manufactura de Alimentos<br/>
              <span className="text-red-600">sigue siendo en papel y no digital</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 landing-card-hover">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                {/* Clausurado: edificio con candado */}
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <rect x="8" y="13" width="8" height="6" rx="1"/>
                  <path d="M10 13v-2a2 2 0 0 1 4 0v2"/>
                </svg>
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
                {/* Persona con lupa (fiscalizador inspeccionando) */}
                <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="9" cy="7" r="3"/>
                  <path d="M5 21v-2a4 4 0 0 1 4-4h1"/>
                  <circle cx="17" cy="17" r="3"/>
                  <line x1="21" y1="21" x2="19.12" y2="19.12"/>
                </svg>
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
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Control de Buenas Prácticas de Manufactura de Alimentos, completo desde cualquier dispositivo</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">RestoBPM convierte tus registros en papel en un sistema digital inteligente que trabaja para ti las 24 horas.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { bg: 'bg-[#1F3864]/5', border: 'border-[#1F3864]/15', ibg: 'bg-[#1F3864]', title: 'Dashboard en tiempo real', desc: 'Visualiza el estado de cumplimiento de todos los módulos BPM en un solo panel. Detecta desvíos al instante, desde tu teléfono o computador.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { bg: 'bg-green-50', border: 'border-green-200', ibg: 'bg-green-600', title: 'Checklists digitales con folio', desc: 'Cada control queda registrado con fecha, hora, operador responsable y folio único. Imposible de falsificar, siempre disponible.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { bg: 'bg-amber-50', border: 'border-amber-200', ibg: 'bg-amber-500', title: 'Alertas push automáticas', desc: 'Recibe notificaciones cuando una temperatura se desvía del rango, un checklist no se completa a tiempo o surge una no conformidad.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
              { bg: 'bg-blue-50', border: 'border-blue-200', ibg: 'bg-blue-600', title: 'Informe PDF para la SEREMI DE SALUD', desc: 'Genera el informe de cumplimiento BPM en segundos. Con firma digital, folio y todos los registros del período. Muéstralo en la fiscalización.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
              { bg: 'bg-purple-50', border: 'border-purple-200', ibg: 'bg-purple-600', title: 'Métricas e historial', desc: 'Analiza tendencias, puntajes de cumplimiento por módulo y evolución mensual. Toma decisiones con datos reales de tu establecimiento.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
              { bg: 'bg-indigo-50', border: 'border-indigo-200', ibg: 'bg-indigo-600', title: 'Gestión de roles y operadores', desc: 'Asigna roles de operador, supervisor y administrador con permisos diferenciados por función y responsabilidad.', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
            ].map((f, i) => (
              <div key={i} className={`${f.bg} border ${f.border} rounded-2xl p-6 landing-card-hover`}>
                <div className={`w-12 h-12 ${f.ibg} rounded-xl flex items-center justify-center mb-4`}>{f.icon}</div>
                <h3 className="font-bold text-gray-800 text-base mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed text-justify">{f.desc}</p>
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
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Toda la información obligatoria del reglamento sanitario de los alimentos en un solo lugar y cuando la necesites</h2>
          </div>
          <div className="mt-10 bg-[#1F3864] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <p className="font-bold">100% alineado con D.S. 977/96 — Reglamento Sanitario de los Alimentos</p>
                <p className="text-sm text-white/60">Checklists diseñados según los requerimientos de la SEREMI DE SALUD para establecimientos de alimentos en Chile.</p>
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
           �]���
J_B��]���]��\�Ә[YOH�]LM^X�[�\����[���H�ܙY�\�\���\�Ә[YOH�[�[�KY�^][\�X�[�\��\L���V��Q��
�Hݙ\����V��LLY��WH^]�]H�۝X��^X�\�HNKM��[�Y^�[��][ۋX��ܜ��Y��[ȏ����Y[��\�ZܘH8�%ܘ]\�܈�0�X\ݙ��Y]Л�H�����[H��ۙH�����OH��\��[���܈�����U�YH���H��\�Ә[YOH��MM�\�XKZY[�H��YH��[�HOH�H�LOH�L���H�NH�L�H�L��Ϗ�[[�H�[��H�L�
HNHL�L�NH�Ϗ�ݙς��[�ς��]����]�����X�[ۏ����ʈ8� 8� �P�S��8� 8� 
��B��X�[ۈYH��X�[�Ȉ�\�Ә[YOH�KL���Yܘ^KML���]��\�Ә[YOH�X^]�M�^X]]�M�N�M����]��\�Ә[YOH�^X�[�\�X�LM����\�Ә[YOH�^\�H�۝\�[ZX��^V��Q��
�H\\��\�H�X��[��]�Y\�X�Lȏ�[�\������\�Ә[YOH�^L��N�^M�۝Y^�X��^Yܘ^KNL��[Y�H[[�]YH�HY\HHH�Y���[������\�Ә[YOH�]L�^Yܘ^KML�������[�\�[��^Y[��0�X\�H�YX�Hܘ]Z]K��[�\��]HHܰ�Y]ˏ����]���]��\�Ә[YOH�ܚY�N�ܚYX���L��\M�X^]�L�^X]]ȏ���ʈ[�H8�%�[\[ZY[���[
\�X�Y�H
��B�]��\�Ә[YOH���V��Q��
�H��[�YL�M��Y��^�^�^X���[]]�H[�[��X�\�Zݙ\��[��L��[��V��Q��
�H�[��[ٙ��]L����]��\�Ә[YOH�X���]H]�MY�LK̈]�[��]K^LK̈����[��\�Ә[YOH���X[X�\�M^X[X�\�NL^^��۝Y^�X��MKLK�H��[�YY�[�Y�ȏ��!Hp�\��[\���[����]���]��\�Ә[YOH��LLLL��]�]K�MH��[�Y^�^][\�X�[�\��\�Y�KX�[�\�X�M���ݙ��\�Ә[YOH��MHMH^]�]H��[H��ۙH�����OH��\��[���܈�����U�YH����Y]Л�H������Y�ۈ�[��H�L��MK�H�����K���M�M�MN�N�K��L�Mˍ��
K���K��
�M�M�K����LH���L���Ϗ�ݙς��]�����\�Ә[YOH�^[��۝X��^]�]H���[\[ZY[���[�ς�]��\�Ә[YOH�]L�X�LH���[��\�Ә[YOH�^M�۝Y^�X��^]�]H��K�L��[���]����\�Ә[YOH�^^�^]�]K�LX�M����Y\�
�U�O���[�\�Ә[YOH��X�K^KL��H�^LHX�M�^\�H^]�]K����H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�L��۝X��]L�H���$���[��X[�X[\�H��[Y[����ܛX]]����O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�L��۝X��]L�H���$���[���\�[�H[��ܛXX�p�ۏ�O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�L��۝X��]L�H���$���[��[��ܛYH[�[��X��[�H�\��[^�X�p�ۏ�O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�L��۝X��]L�H���$���[��[\�\�\��O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�L��۝X��]L�H���$���[����ܝH�X��O���[��[���H�ܙY�\�\���\�Ә[YOH��Y�[^X�[�\���]�]Hݙ\����Yܘ^KLL^V��Q��
�H�۝X��KL���[�Y^^\�H�[��][ۋX��ܜ����ȏ����Y[��\�ܘ]\�[�ς��]����ʈ[��8�%p�\\��X�\��[\�
��B�]��\�Ә[YOH���]�]H��[�YL��ܙ\��ܙ\�Yܘ^KL�M��Y��\�H�^�^X��[�[��X�\�Zݙ\����]��\�Ә[YOH��LLLL��Z[�Y��LL��[�Y^�^][\�X�[�\��\�Y�KX�[�\�X�M���ݙ��\�Ә[YOH��MHMH^Z[�Y��M���[H��ۙH�����OH��\��[���܈�����U�YH����Y]Л�H������X�H���OH�Ȉ�YH���ZY�H�M��H����OH���Ϗ]H�LM��U�XL��L�L�ML��L���M��Ϗ�ݙς��]�����\�Ә[YOH�^[��۝X��^Yܘ^KN��p�\\��X�\��[\��ς�]��\�Ә[YOH�]L�X�LH���[��\�Ә[YOH�^M�۝Y^�X��^Yܘ^KNL����L��[���]����\�Ә[YOH�^^�^Yܘ^KMX�M����Y\�
�U�O���[�\�Ә[YOH��X�K^KL��H�^LHX�M�^\�H^Yܘ^KM����H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�ML�۝X��]L�H���$���[�����H�[\[ZY[���[�O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�ML�۝X��]L�H���$���[����ۙϒ\�H
�X�\��[\����ۙϏ�O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�ML�۝X��]L�H���$���[���\�p�ۈ�[��[^�YH][K[��[�O��H�\�Ә[YOH��^][\�\�\��\L����[��\�Ә[YOH�^YܙY[�ML�۝X��]L�H���$���[����ܝH�X��[ܚ]\�[��O���[��[���H�ܙY�\�\���\�Ә[YOH��Y�[^X�[�\���Yܘ^KNLݙ\����Yܘ^KM�^]�]H�۝X��KL���[�Y^^\�H�[��][ۋX��ܜ����ȏ����Y[��\�ܘ]\�[�ς��]����]����\�Ә[YOH�^X�[�\�^^�^Yܘ^KM]N���X�[��[�\����[[���
�
H�[�U�H
NIJK��X�\�X�p�ۈY[��X[��[��[H�X[��]ZY\�\ˏ����]�����X�[ۏ����ʈ8� 8� �H�S�S8� 8� 
��B��X�[ۈ�\�Ә[YOH�[�[��YܘYY[�X�HKL����]��\�Ә[YOH�X^]�L�^X]]�M�N�M�^X�[�\������\�Ә[YOH�^L��N�^M�۝Y^�X��^]�]HX�M��[\Y^�H�K�H���[XH�\��[^�X�p�ۈ��\�\�K������\�Ә[YOH�^]�]K��^[�X�LL���0�X\�HX��\����\]��[�\��]HHܰ�Y]ˈ�HX�Y\��۝[�X\�[Y�H[[�]YH�HY\HHH�Y���[ˏ���[���H�ܙY�\�\���\�Ә[YOH�[�[�KY�^][\�X�[�\��\L���]�]H^V��Q��
�H�۝Y^�X��^[�LLKMH��[�YL�ݙ\����Yܘ^KLL�[��][ۋX[�Y��L����ݙ��Y]Л�H�����[H��ۙH�����OH��\��[���܈�����U�YH���H��\�Ә[YOH��MHMH�\�XKZY[�H��YH��]H�LL����MLL�[NL�Nݍ��
�LL��Ϗ�ݙς�ܙX\��Y[�Hܘ]\�[�ς��\�Ә[YOH�^]�]K�^\�H]MH���[�\��]H0���[���\��Z\��0��]���Y�\���[��[O����]�����X�[ۏ����ʈ8� 8� ���T�8� 8� 
��B����\��\�Ә[YOH���V��LLY��WH�ܙ\�]�ܙ\�]�]K�LKLL����]��\�Ә[YOH�X^]�M�^X]]�M�N�M����]��\�Ә[YOH�ܚY�N�ܚYX���L��\NX�LL���]���]��\�Ә[YOH��^][\�X�[�\��\L�^]�]H�۝X��^X�\�HX�Lȏ��]��\�Ә[YOH��M�M���]�]K�L��[�Y[��^][\�X�[�\��\�Y�KX�[�\��ܙ\��ܙ\�]�]Ǩ���ݙ��Y]Л�H�����[H��ۙH�����OH��\��[���܈�����U�YH����\�Ә[YOH��MM^]�]H�\�XKZY[�H��YH��]H�LL����MLL�[NL�Nݍ��
�LL��Ϗ�ݙς��]����\�ДB��]����\�Ә[YOH�^]�]K�L^\�HXY[��\�[^Y���\�[XHH\�[�[��۝��H�Y[�\���X�X�\�HX[�Y�X�\�H\�H\�X�X�[ZY[���H[[Y[���[��[K�����\�Ә[YOH�^]�]K��^^�]Lȏ��ˈM���M�8�%��H�[O����]���]���
�\�Ә[YOH�^]�]H�۝\�[ZX��^\�HX�M����X���
��[�\�Ә[YOH��X�K^KL�^\�H^]�]K�L���O�H�Y�H�ٝ[��[ۙ\Ȉ�\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ��[��[ۘ[YY\��O��O��O�H�Y�H��[�[�Ȉ�\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ�p��[���O�O��O��O�H�Y�H���X�[�Ȉ�\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ��X�[���O��O��O�[���H�ܙY�\�\���\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ��YX�Hܘ]\��[�Ϗ�O���[���]���]���
�\�Ә[YOH�^]�]H�۝\�[ZX��^\�HX�M���Y[�O�
��[�\�Ә[YOH��X�K^KL�^\�H^]�]K�L���O�[���H����[���\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ�[�X�X\��\�p�ۏ�[�Ϗ�O��O�[���H�ܙY�\�\���\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ��Y�\��\��O�[�Ϗ�O��O�H�Y�H�XZ[Θ�۝X���\�؜K����\�Ә[YOH�ݙ\��^]�]H�[��][ۋX��ܜȏ��۝X���O��O���[���]����]���]��\�Ә[YOH��ܙ\�]�ܙ\�]�]K�LM��^�^X���N��^\���][\�X�[�\��\�Y�KX�]�Y[��\L�^^�^]�]K�������H�YX\�H�\�ДH0�������\�X����\�\��Y������X��[��[H<'��<'��O����]����]���ٛ��\����]���
B�B
