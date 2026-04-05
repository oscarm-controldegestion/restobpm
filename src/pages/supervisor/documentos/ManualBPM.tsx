/**
 * Manual de Buenas Prácticas de Manufactura (BPM)
 * Documento genérico personalizado con los datos del tenant.
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

// ─── Componentes de presentación ──────────────────────────────────────────────
function Section({ num, title, children }: {
  num: string; title: string; children: React.ReactNode
}) {
  return (
    <div className="mb-8 print:mb-5 print:break-inside-avoid">
      <h2 className="text-base font-bold text-white print:text-black border-b-2 border-blue-700 print:border-gray-600 pb-1 mb-3 uppercase tracking-wide text-xs">
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
      <h3 className="text-sm font-semibold text-gray-100 print:text-black mb-1.5">{title}</h3>
      <div className="pl-4 border-l-2 border-gray-700 print:border-gray-300 space-y-1">
        {children}
      </div>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-gray-300 print:text-black before:content-['▸'] before:mr-2 before:text-blue-500 print:before:text-gray-500">
      {children}
    </p>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-gray-500 print:text-gray-600 italic mt-1">{children}</p>
  )
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex gap-2 text-sm border-b border-gray-800 print:border-gray-200 py-1.5">
      <span className="text-gray-400 print:text-gray-600 w-40 flex-shrink-0">{label}</span>
      <span className="text-gray-100 print:text-black font-medium">{value || '—'}</span>
    </div>
  )
}

// ─── Tabla simple ─────────────────────────────────────────────────────────────
function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto print:overflow-visible mt-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-800 print:bg-gray-100">
            {headers.map(h => (
              <th key={h} className="border border-gray-600 print:border-gray-400 px-3 py-2 text-left text-gray-200 print:text-black font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="even:bg-gray-850 print:even:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="border border-gray-700 print:border-gray-300 px-3 py-2 text-gray-300 print:text-black align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ManualBPM() {
  const { tenant } = useAuth()
  const today = new Date().toLocaleDateString('es-CL', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
  const tipo = ESTABLISHMENT_LABELS[tenant?.type ?? 'other'] ?? 'Establecimiento de Alimentos'

  return (
    <div className="bg-gray-900 print:bg-white text-gray-100 print:text-black min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">

        {/* ══ PORTADA ══════════════════════════════════════════════════════════ */}
        <div className="mb-10 print:mb-8 border-2 border-blue-700 print:border-gray-600 rounded-xl print:rounded-none overflow-hidden">
          {/* Franja superior */}
          <div className="bg-blue-800 print:bg-gray-800 px-8 py-4">
            <p className="text-blue-200 print:text-white text-xs uppercase tracking-widest font-semibold">
              Manual de Buenas Prácticas de Manufactura
            </p>
          </div>
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-white print:text-black mb-1">
              Manual BPM
            </h1>
            <p className="text-gray-400 print:text-gray-600 text-sm mb-6">
              Reglamento Sanitario de los Alimentos — D.S. N° 977/96 — Ministerio de Salud, Chile
            </p>

            <div className="space-y-0.5">
              <InfoRow label="Razón Social"       value={tenant?.name} />
              <InfoRow label="RUT"                value={tenant?.rut} />
              <InfoRow label="Dirección"          value={tenant?.address} />
              <InfoRow label="Teléfono"           value={tenant?.phone} />
              <InfoRow label="Tipo de establecimiento" value={tipo} />
              <InfoRow label="Fecha de emisión"   value={today} />
              <InfoRow label="Versión"            value="1.0" />
              <InfoRow label="Sistema de control" value="RestoBPM — www.restobpm.cl" />
            </div>
          </div>
        </div>

        {/* ══ ÍNDICE ══════════════════════════════════════════════════════════ */}
        <Section num="0" title="Índice de Contenidos">
          <SimpleTable
            headers={['N°', 'Sección', 'Página']}
            rows={[
              ['1', 'Presentación e Introducción', '—'],
              ['2', 'Marco Legal y Normativo', '—'],
              ['3', 'Objetivos del Manual', '—'],
              ['4', 'Alcance', '—'],
              ['5', 'Definiciones', '—'],
              ['6', 'Instalaciones y Equipos', '—'],
              ['7', 'Control de Agua Potable', '—'],
              ['8', 'Higiene del Personal', '—'],
              ['9', 'Control de Materias Primas e Insumos', '—'],
              ['10','Control de Temperatura y Cadena de Frío', '—'],
              ['11','Limpieza y Sanitización', '—'],
              ['12','Control Integrado de Plagas', '—'],
              ['13','Manejo de Residuos Sólidos y Líquidos', '—'],
              ['14','Trazabilidad y Retiro de Productos', '—'],
              ['15','Capacitación del Personal', '—'],
              ['16','Documentación y Registros', '—'],
              ['17','Revisión, Actualización y Vigencia', '—'],
            ]}
          />
        </Section>

        {/* ══ 1. PRESENTACIÓN ═════════════════════════════════════════════════ */}
        <Section num="1" title="Presentación e Introducción">
          <p>
            El presente Manual de Buenas Prácticas de Manufactura (Manual BPM) ha sido elaborado
            para <strong>{tenant?.name ?? 'este establecimiento'}</strong> con el propósito de
            establecer los lineamientos, procedimientos y controles necesarios para garantizar
            la inocuidad de los alimentos producidos, preparados o comercializados.
          </p>
          <p>
            Las Buenas Prácticas de Manufactura constituyen el conjunto de principios básicos y
            prácticas generales de higiene en la manipulación, preparación, elaboración, envasado,
            almacenamiento, transporte y distribución de alimentos, con el objeto de garantizar
            que los productos se fabriquen en condiciones sanitarias adecuadas y se disminuyan
            los riesgos inherentes a la producción.
          </p>
          <p>
            Este manual es de cumplimiento obligatorio para todo el personal del establecimiento y
            debe ser revisado y actualizado al menos una vez al año.
          </p>
        </Section>

        {/* ══ 2. MARCO LEGAL ══════════════════════════════════════════════════ */}
        <Section num="2" title="Marco Legal y Normativo">
          <p>Este manual se enmarca en la siguiente normativa vigente en Chile:</p>
          <div className="mt-2 space-y-1">
            <Li><strong>D.S. N° 977/96 del MINSAL</strong> — Reglamento Sanitario de los Alimentos y sus modificaciones.</Li>
            <Li><strong>D.S. N° 594/1999 del MINSAL</strong> — Condiciones Sanitarias y Ambientales Básicas en los Lugares de Trabajo.</Li>
            <Li><strong>Ley N° 20.724</strong> — Ley de Etiquetado de Alimentos.</Li>
            <Li><strong>Resolución Exenta N° 7.839/2017</strong> — Guía de Buenas Prácticas de Manufactura para establecimientos de alimentos.</Li>
            <Li><strong>Código Sanitario D.F.L. N° 725</strong> — Marco general de la salud pública.</Li>
            <Li><strong>Normas Codex Alimentarius</strong> — Principios Generales de Higiene de los Alimentos (CAC/RCP 1-1969).</Li>
          </div>
        </Section>

        {/* ══ 3. OBJETIVOS ════════════════════════════════════════════════════ */}
        <Section num="3" title="Objetivos del Manual">
          <Sub title="Objetivo General:">
            <p className="text-sm text-gray-300 print:text-black">
              Establecer y mantener los procedimientos de Buenas Prácticas de Manufactura que
              aseguren la inocuidad y calidad de los alimentos en <strong>{tenant?.name ?? 'el establecimiento'}</strong>,
              protegiendo la salud de los consumidores y cumpliendo con la normativa sanitaria vigente.
            </p>
          </Sub>
          <Sub title="Objetivos Específicos:">
            <Li>Definir estándares de higiene para instalaciones, equipos y personal.</Li>
            <Li>Establecer procedimientos de control en todas las etapas de la cadena alimentaria.</Li>
            <Li>Reducir y controlar los riesgos de contaminación física, química y biológica.</Li>
            <Li>Proporcionar evidencia documentada del cumplimiento de las BPM.</Li>
            <Li>Capacitar al personal en prácticas seguras de manipulación de alimentos.</Li>
          </Sub>
        </Section>

        {/* ══ 4. ALCANCE ══════════════════════════════════════════════════════ */}
        <Section num="4" title="Alcance">
          <p>
            Este manual aplica a <strong>todas las áreas operativas</strong> de{' '}
            <strong>{tenant?.name ?? 'el establecimiento'}</strong> que intervengan directa
            o indirectamente en la recepción, almacenamiento, preparación, producción,
            envasado, distribución y servicio de alimentos, así como a todo el personal
            propio, contratista o de servicios externos que opere en dichas áreas.
          </p>
        </Section>

        {/* ══ 5. DEFINICIONES ═════════════════════════════════════════════════ */}
        <Section num="5" title="Definiciones">
          <SimpleTable
            headers={['Término', 'Definición']}
            rows={[
              ['BPM','Buenas Prácticas de Manufactura. Conjunto de procedimientos para asegurar la inocuidad alimentaria.'],
              ['Contaminación','Presencia de cualquier agente físico, químico o biológico que pueda hacer que el alimento sea nocivo para la salud.'],
              ['Contaminación cruzada','Transferencia de microorganismos de un alimento a otro, directa o indirectamente.'],
              ['Inocuidad','Garantía de que los alimentos no causarán daño al consumidor cuando se preparen o consuman.'],
              ['Manipulador de alimentos','Toda persona que trabaje directamente con alimentos envasados o no envasados.'],
              ['Sanitización','Reducción del número de microorganismos a un nivel seguro mediante agentes químicos y/o físicos.'],
              ['POES','Procedimientos Operacionales Estandarizados de Saneamiento.'],
              ['Temperatura crítica','Temperatura que debe mantenerse para inhibir el crecimiento de microorganismos patógenos.'],
              ['Fecha de vencimiento','Fecha límite de consumo recomendada por el fabricante de un producto.'],
              ['FIFO','First In, First Out. Método de rotación de inventario: lo primero que entra es lo primero que sale.'],
            ]}
          />
        </Section>

        {/* ══ 6. INSTALACIONES Y EQUIPOS ══════════════════════════════════════ */}
        <Section num="6" title="Instalaciones y Equipos">
          <Sub title="6.1 Condiciones generales de las instalaciones:">
            <Li>Los pisos, paredes y cielos deben ser lisos, impermeables, lavables y de colores claros.</Li>
            <Li>Los desagües deben contar con sifón y rejillas en buen estado.</Li>
            <Li>La iluminación debe ser suficiente (mínimo 220 lux en zonas de preparación).</Li>
            <Li>La ventilación debe evitar la acumulación de vapores, humos y olores.</Li>
            <Li>Las ventanas deben contar con mallas mosquiteras en buen estado.</Li>
            <Li>Las puertas deben ser de cierre automático en áreas de producción.</Li>
          </Sub>
          <Sub title="6.2 Equipos y utensilios:">
            <Li>Los equipos y superficies en contacto con alimentos deben ser de acero inoxidable u otro material aprobado.</Li>
            <Li>Los equipos deben mantenerse en buen estado de higiene y funcionamiento.</Li>
            <Li>Los termómetros deben calibrarse periódicamente.</Li>
            <Li>Se prohíbe el uso de madera en superficies de contacto con alimentos.</Li>
          </Sub>
          <Sub title="6.3 Servicios higiénicos:">
            <Li>El personal debe disponer de servicios higiénicos separados por género, con agua caliente, jabón y papel secante.</Li>
            <Li>Los servicios higiénicos no deben comunicar directamente con las zonas de manipulación de alimentos.</Li>
          </Sub>
        </Section>

        {/* ══ 7. CONTROL DE AGUA POTABLE ══════════════════════════════════════ */}
        <Section num="7" title="Control de Agua Potable">
          <p>
            El agua utilizada en la preparación de alimentos, limpieza de superficies y
            utensilios debe ser de <strong>red pública o de fuente certificada como potable</strong>.
          </p>
          <Sub title="Requisitos:">
            <Li>Realizar análisis microbiológico y físico-químico del agua al menos una vez al año si se usa fuente propia.</Li>
            <Li>Los estanques y cisternas deben limpiarse y desinfectarse al menos dos veces al año, con registro.</Li>
            <Li>Mantener registros de las limpiezas y análisis realizados.</Li>
            <Li>El agua caliente debe alcanzar al menos 82 °C en el punto de uso para la higienización de equipos.</Li>
          </Sub>
          <Note>Conservar los certificados de análisis de agua disponibles para fiscalización.</Note>
        </Section>

        {/* ══ 8. HIGIENE DEL PERSONAL ═════════════════════════════════════════ */}
        <Section num="8" title="Higiene del Personal">
          <p>
            El personal es el principal vector de contaminación en la cadena alimentaria.
            Todos los manipuladores deben cumplir con el Programa de Higiene Estándar del
            establecimiento y con los siguientes requisitos mínimos:
          </p>
          <Sub title="Higiene personal:">
            <Li>Lavado frecuente y correcto de manos (técnica de 6 pasos, mínimo 20 segundos).</Li>
            <Li>Uñas cortas, limpias y sin esmalte. No se permiten uñas postizas.</Li>
            <Li>No se permite el uso de joyas, relojes o piercings visibles en áreas de producción.</Li>
            <Li>El cabello debe mantenerse cubierto con cofia o gorro en todo momento.</Li>
          </Sub>
          <Sub title="Uniforme:">
            <Li>Uso de uniforme limpio y completo: cofia, delantal, calzado de seguridad.</Li>
            <Li>El uniforme no debe usarse fuera del establecimiento.</Li>
            <Li>Los uniformes deben lavarse con frecuencia diaria.</Li>
          </Sub>
          <Sub title="Estado de salud:">
            <Li>Trabajadores con síntomas de enfermedad gastrointestinal, infecciones cutáneas o respiratorias deben ser separados del contacto con alimentos.</Li>
            <Li>Se debe llevar registro de ausentismo por enfermedad.</Li>
          </Sub>
          <Note>Ver Programa de Higiene Estándar para detalle completo de procedimientos.</Note>
        </Section>

        {/* ══ 9. CONTROL DE MATERIAS PRIMAS ═══════════════════════════════════ */}
        <Section num="9" title="Control de Materias Primas e Insumos">
          <Sub title="9.1 Recepción:">
            <Li>Inspeccionar visualmente cada entrega: envases íntegros, fechas de vencimiento vigentes, temperatura de llegada y condiciones organolépticas.</Li>
            <Li>Los productos refrigerados deben llegar a ≤ 5 °C; los congelados a ≤ -18 °C.</Li>
            <Li>Rechazar productos que no cumplan con los estándares establecidos.</Li>
            <Li>Registrar cada recepción con fecha, proveedor, temperatura y resultado de inspección.</Li>
          </Sub>
          <Sub title="9.2 Almacenamiento:">
            <Li>Aplicar sistema FIFO (primero en entrar, primero en salir).</Li>
            <Li>Mantener separación entre alimentos crudos y cocidos (evitar contaminación cruzada).</Li>
            <Li>Almacenar productos en contenedores tapados e identificados con nombre y fecha.</Li>
            <Li>No apoyar alimentos directamente sobre el suelo (mínimo 15 cm de altura).</Li>
            <Li>Mantener bodegas limpias, ordenadas, ventiladas y protegidas de plagas.</Li>
          </Sub>
        </Section>

        {/* ══ 10. CONTROL DE TEMPERATURA ══════════════════════════════════════ */}
        <Section num="10" title="Control de Temperatura y Cadena de Frío">
          <p>El control de temperatura es crítico para prevenir el crecimiento de microorganismos patógenos.</p>
          <SimpleTable
            headers={['Tipo de alimento / proceso', 'Temperatura requerida', 'Frecuencia de control']}
            rows={[
              ['Refrigeración (carnes, lácteos, preparados)', '≤ 5 °C', 'Mínimo 2 veces al día (M y T)'],
              ['Congelación', '≤ -18 °C', 'Mínimo 1 vez al día'],
              ['Cocción de carnes (centro del producto)', '≥ 74 °C', 'Por cada preparación'],
              ['Mantención en caliente (servicio)', '≥ 63 °C', 'Cada 2 horas durante el servicio'],
              ['Enfriamiento rápido', 'De 60 °C a ≤ 21 °C en ≤ 2 h', 'Por cada proceso'],
              ['Zona de peligro (NO prolongar)', '5 °C – 60 °C', 'Monitoreo continuo'],
            ]}
          />
          <Note>Registrar todas las temperaturas en las planillas correspondientes del sistema RestoBPM.</Note>
        </Section>

        {/* ══ 11. LIMPIEZA Y SANITIZACIÓN ═════════════════════════════════════ */}
        <Section num="11" title="Limpieza y Sanitización">
          <p>
            La limpieza elimina la suciedad visible; la sanitización reduce los
            microorganismos a niveles seguros. Ambos procesos son complementarios e
            indispensables. Se deben aplicar los Procedimientos Operacionales Estandarizados
            de Saneamiento (POES) correspondientes.
          </p>
          <Sub title="11.1 Principio básico (5 pasos):">
            <Li>1. Pre-enjuague con agua tibia para remover residuos gruesos.</Li>
            <Li>2. Aplicación de detergente según dilución indicada por el fabricante.</Li>
            <Li>3. Frotado y remoción de suciedad.</Li>
            <Li>4. Enjuague con abundante agua potable.</Li>
            <Li>5. Aplicación de sanitizante (hipoclorito de sodio 200 ppm o equivalente aprobado). Dejar actuar el tiempo de contacto indicado.</Li>
          </Sub>
          <Sub title="11.2 Frecuencias mínimas:">
            <SimpleTable
              headers={['Superficie / equipo', 'Limpieza', 'Sanitización']}
              rows={[
                ['Mesones y superficies de trabajo', 'Antes, durante y después de cada uso', 'Diaria'],
                ['Utensilios y vajilla', 'Después de cada uso', 'Después de cada uso'],
                ['Equipos de cocina (cocina, freidoras, etc.)', 'Diaria', 'Diaria'],
                ['Refrigeradores y cámaras', 'Semanal', 'Semanal'],
                ['Pisos', 'Diaria', 'Diaria'],
                ['Paredes y cielos', 'Mensual', 'Mensual'],
                ['Campanas y filtros', 'Semanal', 'Semanal'],
                ['Baños y vestuarios', 'Diaria', 'Diaria'],
              ]}
            />
          </Sub>
          <Note>Registrar las limpiezas en la Planilla de Registro de Limpieza y Sanitización.</Note>
        </Section>

        {/* ══ 12. CONTROL DE PLAGAS ════════════════════════════════════════════ */}
        <Section num="12" title="Control Integrado de Plagas">
          <p>
            El control de plagas debe realizarse mediante un programa preventivo y correctivo
            gestionado por una empresa certificada con Resolución Sanitaria vigente.
          </p>
          <Sub title="Medidas preventivas:">
            <Li>Mantener el establecimiento limpio y libre de residuos alimentarios.</Li>
            <Li>Sellar grietas, agujeros y aberturas en paredes, pisos y cielos.</Li>
            <Li>Mantener las rejillas de alcantarillado en buen estado.</Li>
            <Li>Usar mallas mosquiteras en ventanas y puertas cuando corresponda.</Li>
            <Li>Almacenar la basura en contenedores con tapa y retirarla diariamente.</Li>
          </Sub>
          <Sub title="Empresa de control de plagas:">
            <Li>Contratar empresa autorizada con Resolución Sanitaria vigente.</Li>
            <Li>Mantener ficha de la empresa, copia de RS y registros de cada visita.</Li>
            <Li>Frecuencia mínima recomendada: mensual preventiva + visita correctiva según necesidad.</Li>
          </Sub>
          <Note>Conservar contrato y Resolución Sanitaria del proveedor disponibles para fiscalización.</Note>
        </Section>

        {/* ══ 13. MANEJO DE RESIDUOS ════════════════════════════════════════════ */}
        <Section num="13" title="Manejo de Residuos Sólidos y Líquidos">
          <Sub title="Residuos sólidos:">
            <Li>Usar recipientes con tapa y bolsas de basura resistentes, diferenciados por tipo de residuo.</Li>
            <Li>Vaciar los recipientes de basura de las áreas de producción al menos una vez por turno.</Li>
            <Li>La zona de acopio de basura debe estar alejada de las áreas de almacenamiento de alimentos y contar con buena ventilación.</Li>
            <Li>El retiro de residuos debe realizarse por camión municipal autorizado o empresa de gestión de residuos.</Li>
            <Li>Conservar los recibos de entrega en vertedero o empresa de retiro autorizados.</Li>
          </Sub>
          <Sub title="Residuos líquidos:">
            <Li>Las aguas servidas deben evacuarse al alcantarillado público o fosa séptica con Resolución Sanitaria.</Li>
            <Li>Las trampas de grasa deben limpiarse con la frecuencia indicada en la RS del establecimiento.</Li>
          </Sub>
        </Section>

        {/* ══ 14. TRAZABILIDAD ════════════════════════════════════════════════ */}
        <Section num="14" title="Trazabilidad y Retiro de Productos">
          <p>
            La trazabilidad permite identificar el origen, el proceso y el destino de los
            alimentos en todas las etapas, facilitando la gestión de alertas sanitarias.
          </p>
          <Sub title="Registros mínimos de trazabilidad:">
            <Li>Facturas y guías de despacho de proveedores (mantener por al menos 2 años).</Li>
            <Li>Registros de temperatura de recepción.</Li>
            <Li>Registros de preparación con fecha, lote y responsable.</Li>
            <Li>Etiquetado de productos almacenados con nombre, fecha de elaboración y fecha de vencimiento.</Li>
          </Sub>
          <Sub title="Procedimiento de retiro:">
            <Li>En caso de sospechar que un lote de alimento está contaminado, retirar inmediatamente del servicio.</Li>
            <Li>Aislar, identificar y documentar el producto retirado.</Li>
            <Li>Notificar al SEREMI de Salud si el producto fue comercializado.</Li>
          </Sub>
        </Section>

        {/* ══ 15. CAPACITACIÓN ════════════════════════════════════════════════ */}
        <Section num="15" title="Capacitación del Personal">
          <p>
            La capacitación continua es fundamental para mantener los estándares BPM. Todo el
            personal debe recibir inducción antes de comenzar a manipular alimentos, y
            capacitaciones periódicas durante su desempeño.
          </p>
          <SimpleTable
            headers={['Tema', 'Frecuencia', 'Responsable']}
            rows={[
              ['Inducción BPM (personal nuevo)', 'Antes de iniciar funciones', 'Supervisor / Admin'],
              ['Higiene personal y lavado de manos', 'Anual + reinducciones según necesidad', 'Supervisor'],
              ['Temperaturas críticas y cadena de frío', 'Anual', 'Supervisor'],
              ['Limpieza y sanitización (POES)', 'Anual', 'Supervisor'],
              ['Contaminación cruzada y alérgenos', 'Anual', 'Supervisor'],
              ['Manejo de residuos', 'Anual', 'Supervisor'],
              ['Actualización normativa sanitaria', 'Cuando corresponda', 'Admin'],
            ]}
          />
          <Note>Mantener registros de asistencia a capacitaciones con fecha, tema, nombre del relator y firmas de asistentes.</Note>
        </Section>

        {/* ══ 16. DOCUMENTACIÓN Y REGISTROS ═══════════════════════════════════ */}
        <Section num="16" title="Documentación y Registros">
          <p>
            Toda la documentación BPM debe estar disponible para auditorías internas y
            externas (SEREMI de Salud). Los registros deben conservarse por <strong>al menos 2 años</strong>.
          </p>
          <SimpleTable
            headers={['Documento / Registro', 'Frecuencia', 'Sistema de control']}
            rows={[
              ['Planilla de Higiene de Manipuladores', 'Diaria', 'RestoBPM'],
              ['Planilla de Temperatura (refrigeración/congelación)', 'Diaria (M y T)', 'RestoBPM'],
              ['Planilla de Limpieza y Sanitización', 'Diaria', 'RestoBPM'],
              ['Revisiones Generales (RS, contratos, manuales)', 'Mensual', 'RestoBPM'],
              ['Registros de recepción de proveedores', 'Por entrega', 'Libro/archivo físico'],
              ['Registros de capacitaciones', 'Según programa', 'Archivo físico'],
              ['Contrato y RS de empresa de control de plagas', 'Vigente', 'Archivo documental RestoBPM'],
              ['Resolución Sanitaria del establecimiento', 'Vigente', 'Archivo documental RestoBPM'],
              ['Manual BPM (este documento)', 'Revisión anual', 'Archivo documental RestoBPM'],
            ]}
          />
        </Section>

        {/* ══ 17. REVISIÓN Y VIGENCIA ═════════════════════════════════════════ */}
        <Section num="17" title="Revisión, Actualización y Vigencia">
          <p>
            Este Manual BPM debe ser revisado y actualizado en los siguientes casos:
          </p>
          <Li>Al menos <strong>una vez al año</strong>, como parte de la gestión documental.</Li>
          <Li>Cuando se produzcan cambios significativos en la infraestructura o los procesos.</Li>
          <Li>Cuando entre en vigencia nueva normativa sanitaria aplicable.</Li>
          <Li>Cuando se detecten incumplimientos sistemáticos o se produzca un evento de inocuidad.</Li>
          <p className="mt-3 text-gray-400 print:text-gray-600 text-xs">
            Versión 1.0 — Emitido el {today} — {tenant?.name ?? 'Establecimiento'} — RestoBPM
          </p>
        </Section>

        {/* ══ FIRMA EMPRESA ════════════════════════════════════════════════════ */}
        <div className="mt-10 print:mt-8 border border-gray-700 print:border-gray-400 rounded-xl print:rounded-none p-6 print:break-inside-avoid">
          <p className="text-xs text-gray-400 print:text-gray-600 uppercase tracking-widest mb-4">
            Autorización y firma del establecimiento
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Datos empresa */}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 print:text-gray-500 mb-0.5">Razón Social</p>
                <p className="font-semibold text-gray-100 print:text-black">{tenant?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 print:text-gray-500 mb-0.5">RUT</p>
                <p className="font-semibold text-gray-100 print:text-black">{tenant?.rut ?? '—'}</p>
              </div>
              {tenant?.address && (
                <div>
                  <p className="text-xs text-gray-500 print:text-gray-500 mb-0.5">Dirección</p>
                  <p className="text-gray-300 print:text-black">{tenant.address}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 print:text-gray-500 mb-0.5">Fecha</p>
                <p className="text-gray-300 print:text-black">{today}</p>
              </div>
            </div>

            {/* Firmas */}
            <div className="space-y-6">
              {['Elaborado por', 'Aprobado por'].map(role => (
                <div key={role}>
                  <p className="text-xs text-gray-500 print:text-gray-500 mb-6">{role}</p>
                  <div className="border-b border-gray-600 print:border-gray-400 mb-1" />
                  <p className="text-xs text-gray-600 print:text-gray-400">Nombre, cargo y firma</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700 print:border-gray-300 text-xs text-gray-600 print:text-gray-400 text-center">
            {tenant?.name ?? ''}{tenant?.rut ? ` · RUT ${tenant.rut}` : ''} · Manual BPM v1.0 · RestoBPM
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 10px; }
          .print\\:hidden  { display: none !important; }
          .print\\:block   { display: block  !important; }
          @page { margin: 1.8cm; size: letter portrait; }
        }
      `}</style>
    </div>
  )
}
