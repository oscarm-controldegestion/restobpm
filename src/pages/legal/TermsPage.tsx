import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-700" />
            <span className="font-semibold text-gray-800">RestoBPM</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-sm text-gray-500 mb-8">Vigente desde el 1 de Abril de 2026 · Versión 1.0</p>

        <div className="space-y-8 text-sm leading-relaxed text-gray-700">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Aceptación de los Términos</h2>
            <p>
              Al crear una cuenta y utilizar la Plataforma RestoBPM, el Cliente acepta quedar vinculado
              por estos Términos y Condiciones. Si actúa en nombre de una organización, declara tener
              autorización para aceptar en su nombre.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Descripción del Servicio</h2>
            <p>
              RestoBPM es una plataforma SaaS de gestión de Buenas Prácticas de Manufactura (BPM) para
              establecimientos de servicio de alimentos en Chile. Permite registrar y gestionar planillas
              sanitarias, control de temperatura, higiene de manipuladores, no conformidades y
              documentación requerida por el D.S. N° 977/96.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Período de Prueba y Suscripción</h2>
            <p>
              Al registrarse, el Cliente accede a un período de prueba gratuito de <strong>3 días</strong>,
              sin necesidad de tarjeta de crédito. Al vencimiento del período de prueba, el acceso se
              suspende automáticamente hasta que el Cliente contrate un plan de suscripción. Los precios
              incluyen IVA cuando corresponda según la normativa tributaria vigente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Responsabilidades del Cliente</h2>
            <p>El Cliente es responsable de:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>La veracidad y exactitud de los datos ingresados en la Plataforma</li>
              <li>Informar a sus trabajadores sobre el tratamiento de sus datos personales</li>
              <li>Cumplir con la normativa sanitaria vigente (D.S. 977/96) independiente del uso de la Plataforma</li>
              <li>No compartir el acceso con personas no autorizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Limitación de Responsabilidad</h2>
            <p>
              RestoBPM es una herramienta de gestión y registro. La Plataforma <strong>no garantiza</strong>{' '}
              el cumplimiento normativo del establecimiento ni reemplaza la asesoría de un profesional
              habilitado. Las certificaciones, resoluciones sanitarias y cumplimiento legal son
              responsabilidad exclusiva del Cliente. RestoBPM no será responsable por sanciones,
              multas o cierres derivados de incumplimientos normativos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Propiedad Intelectual</h2>
            <p>
              El software, diseño y contenidos de la Plataforma son propiedad de RestoBPM y están
              protegidos por las leyes de propiedad intelectual. Los datos ingresados por el Cliente
              son de su propiedad exclusiva.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Cancelación y Eliminación de Datos</h2>
            <p>
              El Cliente puede cancelar su suscripción en cualquier momento desde la sección de
              configuración. Los datos se conservarán por 30 días tras la cancelación para permitir
              exportación, y serán eliminados definitivamente al término de ese plazo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Modificaciones a los Términos</h2>
            <p>
              RestoBPM puede modificar estos Términos con previo aviso de 15 días por correo electrónico.
              El uso continuado de la Plataforma tras la notificación implica aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Ley Aplicable y Jurisdicción</h2>
            <p>
              Estos Términos se rigen por la legislación de la República de Chile. Cualquier controversia
              será sometida a los tribunales ordinarios de justicia de la ciudad de Santiago, con renuncia
              a cualquier otro fuero que pudiera corresponder.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400">
            Última actualización: 5 de Abril de 2026 · RestoBPM © {new Date().getFullYear()}
          </div>
        </div>
      </main>
    </div>
  )
}
