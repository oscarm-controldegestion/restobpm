/**
 * Programa de Higiene Estándar
 * Documento BPM personalizado con los datos del establecimiento (tenant).
 * Optimizado para impresión en tamaño carta.
 */

import { useAuth } from '@/contexts/AuthContext'

const ESTABLISHMENT_LABELS: Record<string, string> = {
  restaurant: 'Restaurante',
  industry:   'Industria Alimentaria',
  casino:     'Casino / Alimentación Colectiva',
  bakery:     'Panadería / Pastelería',
  other:      'Establecimiento de Alimentos',
}

function Section({ num, title, children }: {
  num: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="mb-8 print:mb-6 print:break-inside-avoid">
      <h2 className="text-base font-bold text-gray-100 print:text-black border-b border-gray-700 print:border-gray-400 pb-1 mb-3">
        {num}. {title}
      </h2>
      <div className="text-sm text-gray-300 print:text-black leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h3 className="text-sm font-semibold text-gray-200 print:text-black mb-1">{title}</h3>
      <div className="pl-4 text-sm text-gray-300 print:text-black leading-relaxed space-y-1">
        {children}
      </div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return <p className="before:content-['•'] before:mr-2 before:text-gray-500 print:before:text-gray-400">{children}</p>
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 print:text-gray-600 w-36 flex-shrink-0">{label}:</span>
      <span className="text-gray-100 print:text-black font-medium">{value || '—'}</span>
    </div>
  )
}

export default function ProgramaHigiene() {
  const { tenant } = useAuth()
  const today = new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  const tipoEstablecimiento = ESTABLISHMENT_LABELS[tenant?.type ?? 'other'] ?? 'Establecimiento de Alimentos'

  return (
    <div className="bg-gray-900 print:bg-white text-gray-100 print:text-black min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">

        {/* ── Carátula ── */}
        <div className="mb-10 print:mb-8 border border-gray-700 print:border-gray-400 rounded-xl print:rounded-none p-8 print:p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 print:text-gray-500 uppercase tracking-widest mb-2">
              Documento BPM
            </p>
            <h1 className="text-2xl font-bold text-white print:text-black mb-1">
              Programa de Higiene Estándar
            </h1>
            <p className="text-gray-400 print:text-gray-600 text-sm">
              Procedimientos de Higiene Personal para Manipuladores de Alimentos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            <InfoRow label="Establecimiento"  value={tenant?.name} />
            <InfoRow label="RUT"              value={tenant?.rut} />
            <InfoRow label="Dirección"        value={tenant?.address} />
            <InfoRow label="Teléfono"         value={tenant?.phone} />
            <InfoRow label="Tipo"             value={tipoEstablecimiento} />
            <InfoRow label="Fecha emisión"    value={today} />
            <InfoRow label="Versión"          value="1.0" />
            <InfoRow label="Sistema"          value="RestoBPM" />
          </div>
        </div>

        {/* ── Secciones del programa ── */}

        <Section num="1" title="Objetivo">
          <p>
            Establecer y mantener los procedimientos de higiene personal para todo el personal que
            manipule alimentos en <strong>{tenant?.name ?? 'este establecimiento'}</strong>,
            con el fin de prevenir la contaminación de los alimentos y garantizar la inocuidad
            alimentaria conforme al Reglamento Sanitario de los Alimentos (D.S. N° 977/96) y las
            Buenas Prácticas de Manufactura (BPM).
          </p>
        </Section>

        <Section num="2" title="Alcance">
          <p>
            Este programa aplica a <strong>todo el personal</strong> del establecimiento que entre
            en contacto directo o indirecto con los alimentos: cocineros, ayudantes, manipuladores
            de línea, personal de bodega y cualquier otro colaborador que ingrese a zonas de
            preparación o almacenamiento de alimentos.
          </p>
        </Section>

        <Section num="3" title="Responsabilidades">
          <Sub title="Supervisor / Jefe de Área:">
            <Li>Velar por el cumplimiento del presente programa.</Li>
            <Li>Capacitar al personal en los procedimientos de higiene.</Li>
            <Li>Registrar y gestionar las no conformidades detectadas.</Li>
            <Li>Revisar y actualizar el programa al menos una vez al año.</Li>
          </Sub>
          <Sub title="Manipuladores de Alimentos:">
            <Li>Cumplir con todos los procedimientos de higiene personal.</Li>
            <Li>Informar al supervisor cualquier condición de salud que pueda comprometer la inocuidad.</Li>
            <Li>Firmar la planilla de higiene diariamente.</Li>
          </Sub>
        </Section>

        <Section num="4" title="Higiene Personal">
          <Sub title="4.1 Lavado de manos">
            <p className="mb-2 text-gray-300 print:text-black">
              El lavado de manos es la medida más eficaz para prevenir la contaminación de los
              alimentos. Se debe realizar <strong>obligatoriamente</strong> en las siguientes situaciones:
            </p>
            <Li>Al ingresar al área de trabajo (inicio de turno).</Li>
            <Li>Después de usar los servicios higiénicos.</Li>
            <Li>Después de manipular alimentos crudos (carne, pescado, huevos, vegetales sin lavar).</Li>
            <Li>Después de tocar la cara, cabello, nariz o boca.</Li>
            <Li>Después de manipular residuos, basura o productos de limpieza.</Li>
            <Li>Al cambiar de actividad o producto.</Li>
            <Li>Después de estornudar, toser o sonarse la nariz.</Li>
            <p className="mt-3 font-semibold text-gray-200 print:text-black">Técnica correcta de lavado (mínimo 20 segundos):</p>
            <div className="grid grid-cols-2 gap-x-4 mt-1">
              <Li>1. Mojar las manos con agua tibia.</Li>
              <Li>2. Aplicar jabón líquido antibacterial.</Li>
              <Li>3. Frotar palmas, dorso, espacios interdigitales y uñas.</Li>
              <Li>4. Enjuagar completamente con agua corriente.</Li>
              <Li>5. Secar con toalla de papel desechable.</Li>
              <Li>6. Cerrar la llave con la toalla usada.</Li>
            </div>
          </Sub>

          <Sub title="4.2 Cuidado de manos y uñas">
            <Li>Las uñas deben mantenerse cortas, limpias y sin esmalte.</Li>
            <Li>No se permite el uso de joyas, anillos, pulseras ni relojes durante la manipulación de alimentos.</Li>
            <Li>Las heridas o cortes en las manos deben ser cubiertas con apósito impermeable de color azul detectable y guante de látex.</Li>
            <Li>No se permite el uso de uñas postizas o de gel.</Li>
          </Sub>

          <Sub title="4.3 Uniforme y Equipamiento de Protección Personal (EPP)">
            <p className="mb-2 text-gray-300 print:text-black">
              El uniforme es parte fundamental de las BPM. Todo el personal debe cumplir con:
            </p>
            <Li>Usar uniforme limpio y en buen estado todos los días.</Li>
            <Li>Cofia o gorro que cubra completamente el cabello.</Li>
            <Li>Delantal apropiado para la tarea asignada.</Li>
            <Li>Calzado de seguridad antideslizante, limpio y exclusivo para el área de trabajo.</Li>
            <Li>Mascarilla en zonas donde se requiera (envasado, preparaciones frías, etc.).</Li>
            <Li>El uniforme no debe salir del establecimiento; debe cambiarse antes de ingresar.</Li>
            <Li>La ropa de calle debe guardarse en el casillero asignado.</Li>
          </Sub>

          <Sub title="4.4 Conductas prohibidas en áreas de manipulación">
            <Li>Fumar, comer o beber fuera de las zonas autorizadas.</Li>
            <Li>Masticar chicle, caramelos u otras sustancias.</Li>
            <Li>Estornudar o toser sobre los alimentos sin cubrirse con el codo.</Li>
            <Li>Tocarse la cara, cabello o cuerpo sin lavarse las manos a continuación.</Li>
            <Li>Usar perfumes, colonias o lociones de fuerte olor en el área de trabajo.</Li>
            <Li>Sentarse sobre mesas de trabajo o superficies de contacto con alimentos.</Li>
          </Sub>
        </Section>

        <Section num="5" title="Estado de Salud del Personal">
          <p>
            El personal que presente alguna de las siguientes condiciones debe informarlo
            inmediatamente al supervisor y será separado del contacto directo con alimentos
            hasta su total recuperación:
          </p>
          <div className="mt-2 space-y-1">
            <Li>Enfermedades gastrointestinales (diarrea, vómitos, náuseas).</Li>
            <Li>Infecciones respiratorias con secreción nasal activa.</Li>
            <Li>Heridas infectadas, eccemas o lesiones cutáneas en manos o brazos.</Li>
            <Li>Ictericia (coloración amarilla de piel o mucosas).</Li>
            <Li>Fiebre igual o superior a 38 °C.</Li>
          </div>
          <p className="mt-3 text-gray-400 print:text-gray-600 text-xs italic">
            El supervisor debe reportar y registrar toda separación de personal por motivos de salud.
          </p>
        </Section>

        <Section num="6" title="Capacitación">
          <p>
            Todo el personal nuevo recibirá inducción en este programa antes de comenzar a
            manipular alimentos. Adicionalmente, se realizarán capacitaciones periódicas mínimo
            una vez al año, o cuando se detecten incumplimientos reiterados.
          </p>
          <p className="mt-2">
            Los temas mínimos de capacitación son: lavado de manos, uso de uniforme y EPP,
            enfermedades de transmisión alimentaria, contaminación cruzada y buenas prácticas
            de manufactura.
          </p>
        </Section>

        <Section num="7" title="Frecuencia de Controles y Registros">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-gray-800 print:bg-gray-100">
                  <th className="border border-gray-600 print:border-gray-400 px-3 py-2 text-left text-gray-200 print:text-black font-semibold">Control</th>
                  <th className="border border-gray-600 print:border-gray-400 px-3 py-2 text-left text-gray-200 print:text-black font-semibold">Frecuencia</th>
                  <th className="border border-gray-600 print:border-gray-400 px-3 py-2 text-left text-gray-200 print:text-black font-semibold">Responsable</th>
                  <th className="border border-gray-600 print:border-gray-400 px-3 py-2 text-left text-gray-200 print:text-black font-semibold">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 print:divide-gray-300">
                {[
                  ['Higiene personal (manos, uñas, uniforme, vestimenta)', 'Diaria', 'Supervisor', 'Planilla Higiene Manipuladores'],
                  ['Estado de salud del personal', 'Diaria', 'Supervisor', 'Libro de novedades / Registro salud'],
                  ['Verificación de uso de EPP', 'Diaria', 'Supervisor', 'Planilla Higiene Manipuladores'],
                  ['Capacitación en BPM', 'Anual (mínimo)', 'Administrador', 'Registro de capacitaciones'],
                  ['Revisión del programa', 'Anual', 'Administrador', 'Control documental'],
                ].map(([ctrl, freq, resp, reg]) => (
                  <tr key={ctrl} className="hover:bg-gray-800/50 print:hover:bg-transparent">
                    <td className="border border-gray-700 print:border-gray-300 px-3 py-2 text-gray-300 print:text-black">{ctrl}</td>
                    <td className="border border-gray-700 print:border-gray-300 px-3 py-2 text-gray-300 print:text-black">{freq}</td>
                    <td className="border border-gray-700 print:border-gray-300 px-3 py-2 text-gray-300 print:text-black">{resp}</td>
                    <td className="border border-gray-700 print:border-gray-300 px-3 py-2 text-gray-300 print:text-black">{reg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section num="8" title="Revisión y Vigencia">
          <p>
            Este programa será revisado y actualizado al menos <strong>una vez al año</strong>,
            o cuando ocurran cambios relevantes en la operación, nueva normativa sanitaria
            aplicable, o cuando se detecten incumplimientos sistemáticos.
          </p>
          <p className="mt-2 text-gray-400 print:text-gray-600 text-xs">
            Versión 1.0 — Emitido el {today} — {tenant?.name ?? 'Establecimiento'} — RestoBPM
          </p>
        </Section>

        {/* Firma */}
        <div className="mt-10 print:mt-8 grid grid-cols-2 gap-8 text-sm">
          {['Elaborado por', 'Aprobado por'].map(role => (
            <div key={role} className="border-t border-gray-600 print:border-gray-400 pt-3">
              <p className="text-gray-400 print:text-gray-600 text-xs mb-8">{role}</p>
              <div className="border-b border-gray-600 print:border-gray-400 mb-1" />
              <p className="text-gray-500 print:text-gray-500 text-xs">Nombre y firma</p>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11px; }
          .print\\:hidden  { display: none !important; }
          .print\\:block   { display: block  !important; }
          @page { margin: 2cm; size: letter portrait; }
        }
      `}</style>
    </div>
  )
}
