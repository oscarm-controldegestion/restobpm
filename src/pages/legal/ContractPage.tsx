import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-[#1A3C6E] border-b-2 border-blue-200 pb-2 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function AlertBox({
  icon: Icon,
  title,
  lines,
  variant = 'warning',
}: {
  icon: React.ElementType
  title: string
  lines: string[]
  variant?: 'warning' | 'danger' | 'success' | 'info'
}) {
  const styles = {
    warning: { bg: 'bg-amber-50 border-amber-400', title: 'text-amber-800', text: 'text-amber-700', border: 'border-l-4' },
    danger:  { bg: 'bg-red-50 border-red-400',    title: 'text-red-800',   text: 'text-red-700',   border: 'border-l-4' },
    success: { bg: 'bg-green-50 border-green-500', title: 'text-green-800', text: 'text-green-700', border: 'border-l-4' },
    info:    { bg: 'bg-blue-50 border-blue-400',   title: 'text-blue-800',  text: 'text-blue-700',  border: 'border-l-4' },
  }
  const s = styles[variant]
  return (
    <div className={`${s.bg} ${s.border} rounded-r-lg p-4 my-4`}>
      <div className="flex items-start gap-2 mb-2">
        <Icon size={18} className={s.title + ' flex-shrink-0 mt-0.5'} />
        <p className={`font-semibold text-sm ${s.title}`}>{title}</p>
      </div>
      <ul className="space-y-1 pl-6">
        {lines.map((l, i) => (
          <li key={i} className={`text-sm ${s.text} list-disc`}>{l}</li>
        ))}
      </ul>
    </div>
  )
}

function DefTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-gray-100">
          {rows.map(([k, v]) => (
            <tr key={k} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-semibold text-gray-700 bg-gray-50 w-48 align-top">{k}</td>
              <td className="px-4 py-2.5 text-gray-600">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompTable() {
  const rows = [
    ['SafetyCulture (iAuditor)', '"The Service is provided \'as is\'. SafetyCulture does not warrant that use of the Service will result in regulatory compliance."'],
    ['FoodDocs', '"Compliance with applicable food safety regulations is the sole responsibility of the user."'],
    ['Zenput', '"Zenput is not responsible for any fines, penalties, or regulatory actions taken against the Customer."'],
    ['Jolt Software', '"Jolt Software does not guarantee compliance with health codes and is not liable for any violations thereof."'],
    ['RestoBPM', 'La Plataforma es una herramienta de gestión. La responsabilidad ante la Autoridad Sanitaria recae exclusivamente en el Cliente.'],
  ]
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 my-4">
      <table className="w-full text-xs">
        <thead className="bg-[#1A3C6E] text-white">
          <tr>
            <th className="text-left px-4 py-2.5 font-semibold">Plataforma</th>
            <th className="text-left px-4 py-2.5 font-semibold">Posición estándar de responsabilidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(([p, t]) => (
            <tr key={p} className={p === 'RestoBPM' ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'}>
              <td className="px-4 py-2.5 text-gray-700 font-medium align-top whitespace-nowrap">{p}</td>
              <td className="px-4 py-2.5 text-gray-600 italic">{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ContractPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-[#1A3C6E]" />
              <span className="font-semibold text-gray-800">RestoBPM</span>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full">
            CONFIDENCIAL — Solo uso interno
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#1A3C6E] text-white py-10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">Contrato de Términos de Uso</h1>
          <p className="text-blue-200 text-lg">y Limitación de Responsabilidad</p>
          <p className="text-blue-300 text-sm mt-3">Versión 1.0 · Vigente desde el 1 de Abril de 2026 · Aplicable en Chile</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 text-sm leading-relaxed text-gray-700">

        {/* Preámbulo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
          <h2 className="text-base font-bold text-[#1A3C6E] mb-3">Preámbulo</h2>
          <p className="mb-3">
            RestoBPM es una plataforma digital de gestión y registro para el cumplimiento de las Buenas Prácticas
            de Manufactura (BPM) en establecimientos de servicio de alimentos en Chile, de conformidad con el{' '}
            <strong>D.S. N° 977/96</strong> del Ministerio de Salud y la normativa sanitaria vigente.
          </p>
          <p className="mb-3">
            El presente contrato establece el alcance de los servicios, las responsabilidades del Cliente y las
            limitaciones de responsabilidad de RestoBPM, en línea con el estándar internacional de plataformas
            similares como <strong>SafetyCulture, Zenput, FoodDocs y Jolt Software</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <strong>Principio fundamental:</strong> Todas estas plataformas comparten que son herramientas de
            apoyo al cumplimiento, <em>no garantías del mismo</em>. La responsabilidad final ante las autoridades
            sanitarias recae exclusivamente en el titular del establecimiento.
          </div>
        </div>

        {/* Sección 1 */}
        <Section title="Sección 1. Definiciones">
          <DefTable rows={[
            ['RestoBPM / La Plataforma', 'Servicio SaaS en www.restobpm.cl para digitalizar registros BPM, planillas sanitarias, control de temperatura, higiene de manipuladores, no conformidades y documentación reglamentaria.'],
            ['El Cliente / Usuario', 'Persona natural o jurídica que contrata el acceso a la Plataforma, incluyendo al administrador, supervisores y operadores del establecimiento.'],
            ['Establecimiento', 'Local de preparación y/o servicio de alimentos operado por el Cliente, sujeto a la normativa del D.S. 977/96.'],
            ['Autoridad Sanitaria', 'SEREMI de Salud u organismos fiscalizadores equivalentes con competencia sobre el establecimiento del Cliente.'],
            ['Cumplimiento Normativo', 'Estado de adecuación del Establecimiento a la normativa sanitaria vigente, determinado exclusivamente por la Autoridad Sanitaria.'],
            ['Acción Correctiva', 'Medida adoptada por el Cliente en respuesta a una no conformidad, cuya implementación es responsabilidad exclusiva del Cliente.'],
          ]} />
        </Section>

        {/* Sección 2 */}
        <Section title="Sección 2. Naturaleza y Alcance del Servicio">
          <p className="mb-3">
            RestoBPM es una <strong>herramienta de gestión y registro digital</strong>. Permite al Cliente
            documentar, organizar y hacer seguimiento de las actividades de control BPM que el propio Cliente
            lleva a cabo en su establecimiento. La Plataforma facilita el cumplimiento normativo pero{' '}
            <strong className="text-red-700">no lo garantiza</strong>.
          </p>
          <AlertBox
            icon={AlertTriangle}
            variant="warning"
            title="DECLARACIÓN FUNDAMENTAL DE ALCANCE"
            lines={[
              'RestoBPM es un instrumento de apoyo a la gestión sanitaria, equivalente a un software de planillas digitales.',
              'El cumplimiento del D.S. 977/96 depende exclusivamente de las acciones, omisiones y decisiones del Cliente.',
              'RestoBPM no inspecciona establecimientos, no certifica condiciones sanitarias ni tiene representación ante la Autoridad Sanitaria.',
            ]}
          />
          <p className="font-semibold text-gray-800 mt-4 mb-2">El Servicio incluye:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Módulos digitales de registro BPM (planillas, checklists, control de temperatura, higiene de manipuladores)</li>
            <li>Plantillas de documentos basadas en el D.S. 977/96</li>
            <li>Herramientas de gestión de no conformidades y acciones correctivas</li>
            <li>Almacenamiento seguro con trazabilidad de registros digitales</li>
            <li>Reportes y seguimiento de cumplimiento interno</li>
          </ul>
          <AlertBox
            icon={XCircle}
            variant="danger"
            title="FUERA DEL ALCANCE DE RESTOBPM"
            lines={[
              'Asesoría legal, sanitaria o regulatoria de ningún tipo.',
              'Garantía de aprobación por parte de la SEREMI de Salud.',
              'Verificación de la veracidad de los datos ingresados por el Cliente.',
              'Inspección física de instalaciones, equipos o procesos.',
              'Representación del Cliente ante organismos fiscalizadores.',
              'Protección frente a sanciones, multas o clausuras por infracciones sanitarias.',
            ]}
          />
        </Section>

        {/* Sección 3 */}
        <Section title="Sección 3. Obligaciones y Responsabilidades del Cliente">
          <p className="mb-3">
            El Cliente es el <strong>único responsable</strong> ante la Autoridad Sanitaria por el estado
            sanitario de su establecimiento. Esta responsabilidad no se transfiere ni se comparte con
            RestoBPM bajo ninguna circunstancia.
          </p>
          <p className="font-semibold text-gray-800 mb-2">El Cliente se obliga expresamente a:</p>
          <ol className="list-decimal pl-5 space-y-2">
            {[
              'Ingresar datos verídicos, completos y oportunos. RestoBPM no verifica la exactitud de la información registrada.',
              'Implementar físicamente todas las medidas que registra en la Plataforma. El registro digital no reemplaza la acción física.',
              'Mantener instalaciones, equipos y procesos en conformidad con el D.S. 977/96 con independencia del uso de la Plataforma.',
              'Capacitar adecuadamente a su personal en materia de inocuidad alimentaria y BPM.',
              'Responder directamente ante la SEREMI de Salud durante inspecciones, sin invocar el uso de RestoBPM como argumento de cumplimiento.',
              'Contar con un profesional habilitado (Ingeniero en Alimentos, Nutricionista, Químico Farmacéutico u otro) cuando la normativa lo exija.',
              'Mantener los documentos y carnets sanitarios físicos requeridos por la normativa, sin limitarse a los registros digitales.',
            ].map((item, i) => <li key={i}>{item}</li>)}
          </ol>
        </Section>

        {/* Sección 4 — NÚCLEO */}
        <Section title="Sección 4. Limitación de Responsabilidad de RestoBPM">
          <AlertBox
            icon={XCircle}
            variant="danger"
            title="CLÁUSULA DE EXCLUSIÓN DE RESPONSABILIDAD — NÚCLEO DEL CONTRATO"
            lines={[
              'RestoBPM, sus directores, empleados, colaboradores y proveedores NO SERÁN RESPONSABLES por:',
              '→  Multas, sanciones, clausuras o amonestaciones de la SEREMI de Salud u otros fiscalizadores.',
              '→  Pérdidas económicas por incumplimientos sanitarios del establecimiento.',
              '→  Daños a clientes, trabajadores o terceros por el estado sanitario del establecimiento.',
              '→  Negación o revocación de Resolución Sanitaria o autorización equivalente.',
              '→  Resultados adversos de inspecciones sanitarias.',
              '→  Errores, omisiones o inexactitudes en los datos ingresados por el Cliente.',
              'Esta exclusión aplica incluso si RestoBPM fue informado de la posibilidad de dichos daños.',
            ]}
          />
          <h3 className="font-semibold text-gray-800 mt-4 mb-2">Estándar internacional — Plataformas del mismo sector:</h3>
          <CompTable />
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-gray-700">
              <strong>Tope máximo de responsabilidad:</strong> En el caso excepcional de que un tribunal chileno
              determine responsabilidad de RestoBPM, ésta no podrá exceder el equivalente a{' '}
              <strong>3 meses de suscripción</strong> pagados por el Cliente en los 12 meses previos al hecho.
            </p>
          </div>
        </Section>

        {/* Sección 5 */}
        <Section title="Sección 5. Uso Correcto de la Plataforma">
          <p className="font-semibold text-gray-800 mb-2">El Cliente declara que NO utilizará la Plataforma para:</p>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            <li>Registrar datos falsos para presentarlos como evidencia de cumplimiento ante la Autoridad Sanitaria.</li>
            <li>Construir un argumento de defensa ante la SEREMI basado exclusivamente en registros digitales, sin acciones físicas reales.</li>
            <li>Sustituir la presencia de profesionales habilitados cuando la normativa lo exija.</li>
            <li>Evadir o postergar acciones correctivas reales amparándose en el uso del software.</li>
          </ul>
          <p>
            En caso de uso contrario a estas disposiciones, RestoBPM queda completamente eximido de cualquier
            responsabilidad y el Cliente será el único responsable de las consecuencias.
          </p>
        </Section>

        {/* Sección 6 */}
        <Section title="Sección 6. Propiedad Intelectual y Datos">
          <p className="mb-3">
            El software, diseño, metodología, plantillas y contenidos de RestoBPM son propiedad exclusiva de
            RestoBPM. El Cliente recibe una licencia de uso no exclusiva, intransferible y revocable.
          </p>
          <p>
            Los datos ingresados por el Cliente son de su exclusiva propiedad. RestoBPM actúa como encargado
            de tratamiento y no utilizará dichos datos para fines distintos al servicio, conforme a la Ley N° 19.628.
          </p>
        </Section>

        {/* Sección 7–9 */}
        <Section title="Sección 7. Vigencia y Terminación">
          <p>
            Este contrato entra en vigencia al momento del registro y se mantiene mientras exista suscripción activa.
            El Cliente puede terminar en cualquier momento cancelando su suscripción. RestoBPM puede terminar
            con 30 días de aviso, salvo incumplimientos graves.
          </p>
        </Section>

        <Section title="Sección 8. Modificaciones al Contrato">
          <p>
            RestoBPM puede modificar estos términos con aviso mínimo de <strong>15 días corridos</strong> al
            correo del administrador. El uso continuado constituirá aceptación tácita. Si el Cliente no acepta,
            podrá cancelar sin penalidad durante ese plazo.
          </p>
        </Section>

        <Section title="Sección 9. Ley Aplicable y Resolución de Controversias">
          <p className="mb-2">
            <strong>Ley aplicable:</strong> Legislación de la República de Chile (Código Civil, Ley 19.496,
            Ley 19.628, D.S. 977/96).
          </p>
          <p className="mb-2">
            <strong>Jurisdicción:</strong> Tribunales Ordinarios de Justicia de Santiago de Chile.
          </p>
          <p>
            <strong>Mediación previa:</strong> Las partes intentarán mediación de buena fe por hasta 30 días
            antes de recurrir a los tribunales.
          </p>
        </Section>

        {/* Aceptación */}
        <div className="bg-white border-2 border-green-300 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={22} className="text-green-600 flex-shrink-0" />
            <h2 className="text-base font-bold text-green-800">Manifestación de Voluntad y Aceptación</h2>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Al hacer clic en <strong>"Crear cuenta"</strong> o al iniciar sesión en la Plataforma RestoBPM,
            el Cliente declara:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-gray-700">
            <li>Haber leído y comprendido íntegramente el presente Contrato.</li>
            <li>Aceptar expresamente todas sus cláusulas, en especial la <strong>Sección 4</strong> sobre limitación de responsabilidad.</li>
            <li>Reconocer que RestoBPM es una herramienta de apoyo y que la responsabilidad ante la Autoridad Sanitaria recae exclusivamente en el Cliente.</li>
            <li>Tener capacidad legal para obligarse en nombre del establecimiento que representa.</li>
          </ol>
          <div className="mt-4 text-xs text-gray-500 italic border-t border-gray-200 pt-3">
            Esta aceptación tiene validez como firma electrónica simple conforme a la Ley N° 19.799 sobre
            Documentos Electrónicos y Firma Electrónica (Chile).
          </div>
        </div>

        {/* Navegación legal */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Política de Privacidad', path: '/privacidad' },
            { label: 'Términos de Servicio', path: '/terminos' },
            { label: 'Volver al inicio', path: '/' },
          ].map(({ label, path }) => (
            <Link
              key={path}
              to={path}
              className="text-center py-2.5 px-3 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-6">
          Versión 1.0 · Última actualización: 5 de Abril de 2026 · RestoBPM © {new Date().getFullYear()}
        </div>
      </main>
    </div>
  )
}
