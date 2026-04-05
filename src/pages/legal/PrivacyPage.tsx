import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad y Tratamiento de Datos Personales</h1>
        <p className="text-sm text-gray-500 mb-8">Vigente desde el 1 de Abril de 2026 · Versión 1.0</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-gray-700">

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Responsable del Tratamiento</h2>
            <p>
              <strong>RestoBPM</strong> (en adelante "la Plataforma") es un servicio SaaS de gestión de Buenas Prácticas de
              Manufactura para establecimientos gastronómicos en Chile. El responsable del tratamiento de datos es el titular
              de la cuenta (empresa u organización) que contrata la Plataforma ("el Cliente"), quien actúa como responsable
              ante sus trabajadores y empleados. RestoBPM actúa como encargado de tratamiento en los términos del
              Art. 11 de la Ley N° 19.628.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Marco Legal Aplicable</h2>
            <p>
              El tratamiento de datos personales en esta Plataforma se rige por:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Ley N° 19.628</strong> sobre Protección de la Vida Privada (Chile)</li>
              <li><strong>D.S. N° 977/96</strong> Reglamento Sanitario de los Alimentos (MINSAL)</li>
              <li><strong>Ley N° 19.799</strong> sobre Documentos Electrónicos, Firma Electrónica y Servicios de Certificación</li>
              <li><strong>Ley N° 20.393</strong> sobre Responsabilidad Penal de las Personas Jurídicas</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Datos Personales que Recopilamos</h2>
            <p>La Plataforma recopila y trata las siguientes categorías de datos:</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Dato</th>
                    <th className="text-left px-3 py-2">Finalidad</th>
                    <th className="text-left px-3 py-2">Base Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['RUT de trabajadores', 'Identificación para registros BPM', 'Obligación legal D.S. 977/96'],
                    ['Nombre completo', 'Identificación en planillas y firmas', 'Ejecución del contrato'],
                    ['Correo electrónico', 'Autenticación y comunicaciones', 'Ejecución del contrato'],
                    ['Teléfono (opcional)', 'Contacto del establecimiento', 'Consentimiento'],
                    ['Carnets sanitarios', 'Cumplimiento normativa sanitaria', 'Obligación legal D.S. 977/96'],
                    ['Registros de temperatura', 'Trazabilidad alimentaria', 'Obligación legal D.S. 977/96'],
                    ['No conformidades', 'Gestión de incidentes BPM', 'Ejecución del contrato'],
                  ].map(([dato, fin, base]) => (
                    <tr key={dato} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{dato}</td>
                      <td className="px-3 py-2">{fin}</td>
                      <td className="px-3 py-2 text-gray-500">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Consentimiento (Art. 4 Ley 19.628)</h2>
            <p>
              Al registrarse en la Plataforma, el Cliente otorga su consentimiento expreso para el tratamiento de los
              datos personales de sus trabajadores con las finalidades indicadas en esta política. El Cliente es
              responsable de informar a sus trabajadores sobre el tratamiento de sus datos y obtener el consentimiento
              correspondiente de acuerdo con la normativa vigente.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Almacenamiento y Seguridad</h2>
            <p>
              Los datos se almacenan en servidores de <strong>Supabase</strong> (PostgreSQL) con las siguientes medidas
              de seguridad implementadas:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Cifrado en tránsito mediante HTTPS/TLS 1.3</li>
              <li>Aislamiento multi-tenant con Row Level Security (RLS) en todas las tablas</li>
              <li>Autenticación mediante JWT con expiración automática</li>
              <li>Registro de auditoría de acciones sensibles</li>
              <li>Controles de acceso por roles (administrador, supervisor, operador)</li>
              <li>Sin acceso público a documentos de personal (URLs firmadas con expiración)</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Retención de Datos</h2>
            <p>
              Los datos se mantienen mientras el Cliente tenga una cuenta activa en la Plataforma. Al cancelar la
              suscripción, los datos se conservan por <strong>30 días</strong> para permitir exportación, tras los
              cuales son eliminados de forma segura. Los registros de auditoría se conservan por
              <strong> 2 años</strong> para efectos de trazabilidad legal.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Derechos del Titular</h2>
            <p>
              De conformidad con la Ley N° 19.628, el titular de los datos personales tiene derecho a:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Acceso:</strong> solicitar información sobre los datos que se tratan</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos</li>
              <li><strong>Cancelación:</strong> solicitar la eliminación de sus datos</li>
              <li><strong>Oposición:</strong> oponerse al tratamiento en casos específicos</li>
            </ul>
            <p className="mt-2">
              Para ejercer estos derechos, el titular deberá contactar directamente al establecimiento (Cliente)
              que utiliza la Plataforma, quien es el responsable del tratamiento.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Transferencias a Terceros</h2>
            <p>
              RestoBPM no comparte ni vende datos personales a terceros con fines comerciales. Los únicos encargados
              de tratamiento autorizados son:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Supabase Inc.</strong> — infraestructura de base de datos y autenticación</li>
              <li><strong>Vercel Inc.</strong> — hosting y distribución de la aplicación</li>
              <li><strong>MercadoPago</strong> — procesamiento de pagos (solo datos de facturación)</li>
            </ul>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Incidentes de Seguridad</h2>
            <p>
              En caso de una brecha de seguridad que afecte datos personales, RestoBPM se compromete a notificar
              a los Clientes afectados dentro de las <strong>72 horas</strong> siguientes al descubrimiento del
              incidente, incluyendo la naturaleza del incidente, datos afectados y medidas adoptadas.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Contacto</h2>
            <p>
              Para consultas sobre privacidad o protección de datos, puede contactarnos a través del soporte
              disponible en la Plataforma o al correo indicado en su contrato de servicio.
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
