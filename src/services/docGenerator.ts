/**
 * docGenerator.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Genera documentos BPM (POE / POES) en formato DOCX con los datos del
 * establecimiento contratante.  Usa docx v9 + file-saver para descarga directa
 * desde el navegador, sin necesidad de backend.
 *
 * Uso:
 *   import { downloadDoc } from '@/services/docGenerator'
 *   downloadDoc('POE-BPM-HIG-001', tenant)
 */

import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, Header, Footer, PageNumber, VerticalAlign,
} from 'docx'
import { saveAs } from 'file-saver'
import type { Tenant } from '@/types'

// ── Colour palette ────────────────────────────────────────────────────────────
const CG  = '1B5E20'   // POE header (dark green)
const CG2 = '2E7D32'   // POE section colour
const CB  = '0D47A1'   // POES header (dark blue)
const CB2 = '1565C0'   // POES section colour
const CW  = 'FFFFFF'
const CD  = '1A1A1A'
const CBDR = 'B0B0B0'

// ── Shared builders ───────────────────────────────────────────────────────────
const bdr  = (c = CBDR) => ({ style: BorderStyle.SINGLE, size: 4, color: c })
const bdrs = (c = CBDR) => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) })

function hCell(text: string, w: number, bg: string) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders: bdrs(bg),
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: CW, size: 18, font: 'Arial' })] })],
  })
}
function dCell(text: string, w: number, shade = CW, bold = false, center = false) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA }, borders: bdrs(),
    shading: { fill: shade, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, bold, size: 18, font: 'Arial', color: CD })] })],
  })
}

const sp = () => new Paragraph({ spacing: { after: 100 }, children: [new TextRun('')] })
const body = (t: string) => new Paragraph({ spacing: { after: 80 },
  children: [new TextRun({ text: t, size: 20, font: 'Arial', color: CD })] })
const bul = (t: string, bold = false) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 },
  children: [new TextRun({ text: t, bold, size: 20, font: 'Arial', color: CD })] })
const num = (t: string) => new Paragraph({ numbering: { reference: 'num', level: 0 }, spacing: { after: 80 },
  children: [new TextRun({ text: t, size: 20, font: 'Arial', color: CD })] })

function secTitle(text: string, color: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 4 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color, font: 'Arial' })],
  })
}
function subH(text: string, color: string) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, font: 'Arial', color })] })
}

const NUMBERING = {
  config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'sub', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u25E6', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ],
}
const STYLES = (color: string) => ({
  default: { document: { run: { font: 'Arial', size: 20, color: CD } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 36, bold: true, font: 'Arial', color },
      paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { size: 22, bold: true, font: 'Arial', color },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
  ],
})

// ── Establishment identity block (appears after the title banner) ─────────────
function estBlock(tenant: Tenant, colBg: string): Paragraph[] {
  const today = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
  const rows: [string, string][] = [
    ['Razón social / Establecimiento', tenant.name],
    ['RUT',                             tenant.rut                  || '—'],
    ['Dirección',                       [tenant.address, tenant.city].filter(Boolean).join(', ') || '—'],
    ['Teléfono',                        tenant.phone                || '—'],
    ['Correo electrónico',              tenant.email                || '—'],
    ['Resolución sanitaria',            tenant.resolucion_sanitaria || '—'],
    ['Responsable BPM',                 [tenant.responsible_bpm, tenant.cargo_responsable].filter(Boolean).join(' — ') || '—'],
    ['Fecha de emisión del documento',  today],
  ]
  const w1 = 3200, w2 = 6160
  return [
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [w1, w2],
      rows: [
        new TableRow({ children: [hCell('Datos del Establecimiento', 9360, colBg)] }),
        ...rows.map(([label, value], i) => new TableRow({ children: [
          dCell(label, w1, i % 2 === 0 ? 'F5F5F5' : 'FAFAFA', true),
          dCell(value, w2, i % 2 === 0 ? 'F5F5F5' : 'FAFAFA'),
        ]})),
      ],
    }),
    sp(),
  ]
}

// ── Title banner ──────────────────────────────────────────────────────────────
function titleBanner(tipo: string, codigo: string, titulo: string, sub: string, bg: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { after: 0 }, shading: { fill: bg, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: tipo, bold: true, size: 22, color: CW, font: 'Arial' })] }),
    new Paragraph({ spacing: { after: 0 }, shading: { fill: bg, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: codigo, size: 18, color: 'A5D6A7', font: 'Arial' })] }),
    new Paragraph({ spacing: { after: 0 }, shading: { fill: bg, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: titulo.toUpperCase(), bold: true, size: 30, color: CW, font: 'Arial' })] }),
    new Paragraph({ spacing: { after: 180 }, shading: { fill: bg, type: ShadingType.CLEAR },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: sub, size: 20, color: 'C8E6C9', font: 'Arial' })] }),
  ]
}

// ── Info row table ─────────────────────────────────────────────────────────────
function infoTable(code: string, version: string, area: string, bg: string): Table {
  const w = 3120
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [w, w, w],
    rows: [
      new TableRow({ children: [hCell('Código', w, bg), hCell('Versión', w, bg), hCell('Área', w, bg)] }),
      new TableRow({ children: [dCell(code, w, 'F9FBE7', false, true), dCell(version, w, 'F9FBE7', false, true), dCell(area, w, 'F9FBE7', false, true)] }),
    ],
  })
}

// ── Criteria table ────────────────────────────────────────────────────────────
function criteriaTable(rows: [string, string, string][], bg: string): Table {
  const [c1, c2, c3] = [4000, 2680, 2680]
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: [c1, c2, c3],
    rows: [
      new TableRow({ children: [hCell('Parámetro', c1, bg), hCell('Estándar', c2, bg), hCell('Acción Correctiva', c3, bg)] }),
      ...rows.map(([p, s, a], i) => new TableRow({ children: [
        dCell(p, c1, i % 2 === 0 ? CW : 'F5F5F5'),
        dCell(s, c2, i % 2 === 0 ? CW : 'F5F5F5'),
        dCell(a, c3, i % 2 === 0 ? CW : 'F5F5F5'),
      ]})),
    ],
  })
}

// ── Page setup ────────────────────────────────────────────────────────────────
function pageSetup(tenant: Tenant, headerLabel: string, colBg: string) {
  const short = tenant.name.length > 35 ? tenant.name.slice(0, 35) + '…' : tenant.name
  return {
    properties: { page: { size: { width: 11906, height: 16838 },
      margin: { top: 1080, right: 1080, bottom: 1080, left: 1440 } } },
    headers: {
      default: new Header({ children: [new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: colBg, space: 4 } },
        children: [
          new TextRun({ text: short + '  |  ', bold: true, size: 18, color: colBg, font: 'Arial' }),
          new TextRun({ text: headerLabel, size: 18, color: '555555', font: 'Arial' }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: CBDR, space: 4 } },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: `${tenant.name}${tenant.rut ? ' · RUT ' + tenant.rut : ''}  |  D.S. 977/96  |  Página `, size: 16, color: '888888', font: 'Arial' }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888', font: 'Arial' }),
        ],
      })] }),
    },
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Document builders
// ══════════════════════════════════════════════════════════════════════════════

function buildDoc(
  tipo: string, codigo: string, titulo: string, subTitulo: string,
  area: string, bg: string, sc: string, tenant: Tenant,
  contentFn: (sc: string) => (Paragraph | Table)[]
): Document {
  return new Document({
    styles: STYLES(sc),
    numbering: NUMBERING,
    sections: [{
      ...pageSetup(tenant, `${codigo} — ${titulo}`, bg),
      children: [
        ...titleBanner(tipo, codigo, titulo, subTitulo, bg),
        sp(),
        infoTable(codigo, '1.0', area, sc),
        sp(),
        ...estBlock(tenant, sc),
        ...contentFn(sc),
      ],
    }],
  })
}

// ── POE-BPM-HIG-001 ──────────────────────────────────────────────────────────
function buildHigiene(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-HIG-001',
    'Higiene Personal del Manipulador', 'Presentación · Lavado de manos · Conducta · Salud',
    'Cocina / Todas las áreas', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Garantizar que todo el personal que manipula alimentos mantenga los estándares de higiene personal exigidos por el D.S. 977/96, previniendo la contaminación biológica de los alimentos por parte del manipulador.'),
      sp(),
      secTitle('2. Alcance', sc),
      body('Aplica a toda persona que en su trabajo tenga contacto directo o indirecto con alimentos: cocineros, ayudantes, garzones, personal de bodega y encargados de servicio.'),
      sp(),
      secTitle('3. Responsabilidades', sc),
      bul('Jefe de cocina / Supervisor: verificar higiene del personal al inicio de cada turno.'),
      bul('Todo el personal: cumplir y mantener los estándares en todo momento durante el turno.'),
      bul('Administración: proveer insumos necesarios (jabón, alcohol gel, guantes, delantales).'),
      sp(),
      secTitle('4. Procedimiento', sc),
      subH('4.1  Presentación al ingreso del turno', sc),
      num('Presentarse bañado, con cabello limpio y completamente recogido bajo cofia o gorro.'),
      num('Usar uniforme completo limpio: delantal o chaquetilla, pantalón de trabajo, calzado antideslizante cerrado.'),
      num('Uñas cortas, limpias y sin esmalte.'),
      num('Sin reloj, anillos, pulseras, aretes ni piercing visibles en manos, muñecas o cara.'),
      num('Barba rasurada o cubierta con mascarilla protectora.'),
      sp(),
      subH('4.2  Técnica de lavado de manos (mínimo 20 segundos)', sc),
      num('Mojar manos y antebrazos con agua corriente tibia.'),
      num('Aplicar jabón líquido antibacterial; frotar palmas, dorso, entre dedos y uñas por ≥ 20 segundos.'),
      num('Enjuagar con abundante agua corriente hasta eliminar el jabón.'),
      num('Secar con toalla de papel desechable; cerrar la llave con la misma toalla.'),
      num('Aplicar alcohol gel al 70 % como paso final complementario.'),
      sp(),
      body('Momentos OBLIGATORIOS de lavado: al ingresar al área, antes/después de manipular alimentos crudos, después de ir al baño, después de toser/estornudar/tocar la cara, al cambiar de tarea, después de manipular basura o dinero.'),
      sp(),
      subH('4.3  Control de salud y conducta', sc),
      num('Comunicar al supervisor cualquier síntoma de enfermedad gastrointestinal o infección cutánea.'),
      num('El personal enfermo NO puede manipular alimentos; debe reubicarse en tareas sin contacto.'),
      num('Prohibido comer, beber, mascar chicle o fumar en las áreas de manipulación.'),
      num('Heridas en las manos: cubrir con apósito impermeable azul y guante de nitrilo.'),
      sp(),
      secTitle('5. Criterios de Aceptación', sc),
      criteriaTable([
        ['Lavado de manos', 'Técnica completa de 20 s en cada momento obligatorio', 'Detener tarea; lavar manos de inmediato; registrar'],
        ['Heridas expuestas', 'Ninguna herida sin cubrir en contacto con alimentos', 'Cubrir y colocar guante; evaluar aptitud'],
        ['Personal con síntomas gastrointestinales', 'No manipular alimentos', 'Reubicar; derivar a médico si persiste'],
        ['Joyería / adornos en manos', 'Prohibido durante el turno', 'Retirar; registrar si es reiterativo'],
      ], sc),
      sp(),
      secTitle('6. Referencias', sc),
      bul('D.S. 977/96, Art. 52 — Higiene del personal manipulador'),
      bul('D.S. 977/96, Art. 53 — Prácticas prohibidas en área de alimentos'),
    ])
}

// ── POE-BPM-COC-001 ──────────────────────────────────────────────────────────
function buildCoccion(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-COC-001',
    'Control de Cocción y Temperaturas Críticas', 'Temperaturas mínimas · Verificación · Registros',
    'Cocina caliente', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Asegurar que todos los alimentos cocidos alcancen las temperaturas internas mínimas para eliminar patógenos y garantizar la inocuidad, conforme al D.S. 977/96.'),
      sp(),
      secTitle('2. Temperaturas Mínimas de Cocción', sc),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [4680, 2340, 2340],
        rows: [
          new TableRow({ children: [hCell('Tipo de alimento', 4680, sc), hCell('Temp. interna mínima', 2340, sc), hCell('Tiempo', 2340, sc)] }),
          ...[
            ['Aves (pollo, pavo, pato) y rellenos',         '74 °C', '15 segundos'],
            ['Carnes molidas y embutidos cocidos',           '71 °C', '15 segundos'],
            ['Cerdo, cordero, ternera (pieza entera)',       '63 °C', '3 min reposo'],
            ['Vacuno (pieza entera / bistec)',                '63 °C', '3 min reposo'],
            ['Pescados y mariscos',                          '63 °C', '15 segundos'],
            ['Huevos (servicio inmediato)',                  '70 °C', 'Yema firme'],
            ['Preparaciones con huevo (tortilla, pastel)',   '74 °C', '15 segundos'],
            ['Alimentos recalentados (toda categoría)',      '74 °C', '15 segundos'],
            ['Mantención en caliente (bufet / línea)',       '≥ 60 °C', 'Continuo'],
          ].map(([f, t, s], i) => new TableRow({ children: [
            dCell(f, 4680, i % 2 === 0 ? CW : 'F5F5F5'),
            dCell(t, 2340, i % 2 === 0 ? CW : 'F5F5F5', false, true),
            dCell(s, 2340, i % 2 === 0 ? CW : 'F5F5F5', false, true),
          ]})),
        ],
      }),
      sp(),
      secTitle('3. Procedimiento', sc),
      num('Verificar que el termómetro esté limpio, calibrado y funcione correctamente.'),
      num('Pre-calentar equipos (horno ≥ 15 min; aceite de fritura 170–180 °C) antes de iniciar.'),
      num('Medir temperatura interna en el punto más grueso de la pieza, alejado de huesos.'),
      num('Para aves enteras: medir en la parte interna del muslo y la pechuga.'),
      num('Si no se alcanza la temperatura mínima, continuar cocción y volver a medir.'),
      num('No servir ningún alimento que no haya alcanzado la temperatura mínima de su categoría.'),
      num('Registrar en la planilla de Control de Cocción: fecha, preparación, temperatura, hora, responsable.'),
      sp(),
      secTitle('4. Criterios y Acciones Correctivas', sc),
      criteriaTable([
        ['Temperatura aves (cocción)', '≥ 74 °C', 'Continuar cocción; no servir hasta alcanzar temperatura'],
        ['Temperatura vacuno/cerdo entero', '≥ 63 °C + 3 min reposo', 'Continuar cocción; registrar'],
        ['Temperatura mantención caliente', '≥ 60 °C', 'Recalentar a ≥ 74 °C o desechar'],
      ], sc),
      sp(),
      secTitle('5. Referencias', sc),
      bul('D.S. 977/96, Art. 69 — Registros de temperatura obligatorios'),
    ])
}

// ── POE-BPM-ENF-001 ──────────────────────────────────────────────────────────
function buildEnfriamiento(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-ENF-001',
    'Enfriamiento Rápido y Recalentamiento', 'Zona de peligro (5–60°C) · Regla de los 2 pasos',
    'Cocina / Cámaras', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Controlar el tiempo que los alimentos cocidos permanecen en la zona de peligro de temperatura (5 °C – 60 °C), reduciendo al mínimo el riesgo de multiplicación de microorganismos patógenos.'),
      sp(),
      secTitle('2. Concepto: Zona de Peligro de Temperatura', sc),
      body('Los microorganismos se multiplican activamente entre 5 °C y 60 °C. Un alimento cocido que permanece en esta zona por más de 2 horas acumula riesgo microbiológico. El objetivo del enfriamiento rápido es atravesar esta zona en el menor tiempo posible.'),
      sp(),
      secTitle('3. Regla de los 2 Pasos (Enfriamiento)', sc),
      num('Paso 1: bajar la temperatura del alimento de 60 °C a 21 °C en ≤ 2 horas.'),
      num('Paso 2: bajar de 21 °C a 5 °C o menos en ≤ 4 horas adicionales.'),
      num('Tiempo total máximo: 6 horas. Si no se cumple, desechar el alimento.'),
      sp(),
      secTitle('4. Métodos de Enfriamiento', sc),
      bul('Abatidor de temperatura: método preferido; seguir instrucciones del equipo.'),
      bul('Baño de agua helada: colocar el contenedor en baño de agua con hielo, agitar periódicamente.'),
      bul('Porciones pequeñas: cortar a ≤ 5 cm de grosor antes de enfriar.'),
      bul('Contenedores poco profundos (máx. 5 cm): mayor superficie de enfriamiento.'),
      sp(),
      secTitle('5. Recalentamiento', sc),
      num('Recalentar RÁPIDO: llevar el alimento de refrigerado a ≥ 74 °C en ≤ 2 horas.'),
      num('Nunca recalentar a temperatura tibia o lenta.'),
      num('Revolver durante el recalentamiento para temperatura uniforme.'),
      num('Solo recalentar UNA vez: lo que sobre debe desecharse.'),
      num('Registrar temperatura en la planilla de Control de Cocción.'),
      sp(),
      secTitle('6. Criterios y Acciones Correctivas', sc),
      criteriaTable([
        ['Enfriamiento 60°C → 21°C', '≤ 2 horas', 'Usar abatidor; si supera total de 6h, desechar'],
        ['Enfriamiento 21°C → 5°C', '≤ 4 horas adicionales', 'Igual; registrar incidencia'],
        ['Recalentamiento', '≥ 74°C en ≤ 2 horas', 'Continuar; si no alcanza en 2h, desechar'],
        ['Segundo recalentamiento', 'Prohibido', 'Desechar; ajustar cantidades de producción'],
      ], sc),
      sp(),
      secTitle('7. Referencias', sc),
      bul('D.S. 977/96, Art. 14 — Almacenamiento de alimentos preparados'),
      bul('D.S. 977/96, Art. 37, 69 — Temperatura y registros'),
    ])
}

// ── POE-BPM-CAR-001 ──────────────────────────────────────────────────────────
function buildCarnes(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-CAR-001',
    'Manejo Higiénico de Carnes', 'Recepción · Almacenamiento · Descongelación · Procesamiento',
    'Cocina / Bodega refrigerada', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer las pautas para la recepción, almacenamiento, descongelación y procesamiento higiénico de carnes (vacuno, cerdo, pollo, pavo y caza), garantizando la inocuidad y cumplimiento del D.S. 977/96.'),
      sp(),
      secTitle('2. Procedimiento', sc),
      subH('2.1  Recepción', sc),
      num('Verificar que el vehículo de transporte esté refrigerado (≤ 5 °C para refrigeradas, ≤ −18 °C para congeladas) y limpio.'),
      num('Controlar temperatura del producto al ingreso con termómetro calibrado.'),
      num('Inspeccionar características organolépticas: color, olor, textura.'),
      num('Verificar rotulado: nombre, fecha de elaboración, vencimiento, lote y resolución sanitaria del proveedor.'),
      num('Registrar en formulario de Recepción de Productos y firmar guía de despacho.'),
      num('Rechazar producto si no cumple criterios de temperatura, rotulado o estado sanitario.'),
      sp(),
      subH('2.2  Almacenamiento', sc),
      num('Carnes refrigeradas: 0 °C – 5 °C, máx. 3 días (molida 24 h).'),
      num('Carnes congeladas: ≤ −18 °C; no descongelar y recongelar.'),
      num('Orden en cámara: aves en estante más bajo, carnes rojas en el medio, cocidos en la parte superior.'),
      num('Usar recipientes con tapa y etiqueta (nombre, fecha ingreso, fecha vencimiento).'),
      num('Aplicar sistema FIFO/PEPS.'),
      sp(),
      subH('2.3  Descongelación', sc),
      num('Método preferido: trasladar a refrigeración (0 °C – 5 °C) con 24–48 h de anticipación.'),
      num('Alternativo: cocción directa desde congelado o microondas si se cocina de inmediato.'),
      num('Prohibido descongelar a temperatura ambiente.'),
      sp(),
      subH('2.4  Procesamiento', sc),
      num('Tabla de corte de color exclusivo para carnes crudas (rojo).'),
      num('Lavar y desinfectar superficies, utensilios y manos antes y después.'),
      num('Temperatura interna mínima de cocción: aves ≥ 74 °C, vacuno/cerdo ≥ 63 °C, molidos ≥ 71 °C.'),
      sp(),
      secTitle('3. Criterios de Aceptación', sc),
      criteriaTable([
        ['Temperatura carne refrigerada', '0 °C a 5 °C', 'Rechazar o aislar; evaluar con supervisor'],
        ['Temperatura carne congelada', '≤ −18 °C', 'Revisar cadena de frío; rechazar si hay signos de descongelación previa'],
        ['Color carne vacuno', 'Rojo cereza brillante', 'Rechazar si verdosa, gris o con mal olor'],
        ['Color pollo / aves', 'Rosado pálido uniforme', 'Rechazar si azulado, moteado o con olor anormal'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 61, 62, 37, 69 — Control de materias primas y almacenamiento'),
    ])
}

// ── POE-BPM-VEG-001 ──────────────────────────────────────────────────────────
function buildVerduras(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-VEG-001',
    'Manejo Higiénico de Verduras y Hortalizas', 'Recepción · Almacenamiento · Lavado · Desinfección',
    'Cocina / Zona de lavado', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer los pasos para la recepción, almacenamiento, lavado, desinfección y procesamiento de frutas, verduras y hortalizas, minimizando riesgos microbiológicos y residuos de pesticidas.'),
      sp(),
      secTitle('2. Procedimiento', sc),
      subH('2.1  Recepción', sc),
      num('Verificar condición fresca, sin daños severos ni signos de descomposición.'),
      num('Comprobar temperatura: vegetales de hoja ≤ 8 °C, otros ≤ 10 °C.'),
      num('Rechazar con moho visible, olores fermentados o signos de pudrición avanzada.'),
      sp(),
      subH('2.2  Lavado y Desinfección', sc),
      num('Pre-enjuagar con agua potable corriente para eliminar tierra y residuos gruesos.'),
      num('Preparar solución desinfectante: hipoclorito de sodio a 100–200 ppm (2–4 mL de cloro doméstico al 5% por litro de agua) o producto autorizado por el ISP.'),
      num('Sumergir los vegetales en la solución desinfectante durante 5–10 minutos.'),
      num('Enjuagar con agua potable abundante para eliminar restos de cloro.'),
      num('Escurrir y secar con papel desechable.'),
      sp(),
      subH('2.3  Procesamiento', sc),
      num('Tabla de corte exclusiva para vegetales (color verde).'),
      num('Vegetales cortados y listos para consumir: cubrir, etiquetar y refrigerar ≤ 5 °C; consumir en ≤ 24 h.'),
      sp(),
      secTitle('3. Criterios de Aceptación', sc),
      criteriaTable([
        ['Concentración cloro en desinfección', '100–200 ppm', 'Preparar nueva solución; verificar con tiras reactivas'],
        ['Tiempo de inmersión en desinfectante', '5–10 minutos', 'No reducir; volver a preparar solución'],
        ['Presencia de plagas o insectos', 'Ninguna', 'Rechazar lote; comunicar al proveedor'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 28, 53, 61, 62 — Agua potable, desinfección y materias primas'),
    ])
}

// ── POE-BPM-OTR-001 ──────────────────────────────────────────────────────────
function buildOtros(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-OTR-001',
    'Manejo Higiénico de Otros Productos', 'Lácteos · Huevos · Pescados · Abarrotes · Congelados',
    'Cocina / Bodega', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer los criterios de recepción, almacenamiento y manipulación higiénica para lácteos, huevos, pescados, abarrotes y productos congelados no cárnicos.'),
      sp(),
      secTitle('2. Procedimientos por Categoría', sc),
      subH('2.1  Lácteos', sc),
      num('Recibir a ≤ 4 °C. Verificar envase íntegro, sin hinchazón ni corrosión.'),
      num('Almacenar en refrigeración (0–4 °C) una vez abiertos; consumir en plazo indicado.'),
      sp(),
      subH('2.2  Huevos', sc),
      num('Verificar envase con sello SAG o registro sanitario del productor.'),
      num('No lavar antes de almacenar; lavar justo antes de usar.'),
      num('Cocinar a temperatura interna ≥ 70 °C para eliminar Salmonella.'),
      sp(),
      subH('2.3  Pescados y Mariscos', sc),
      num('Recibir pescados frescos a ≤ 4 °C; congelados a ≤ −18 °C.'),
      num('Verificar: ojos brillantes, branquias rojas, olor a mar (no amoniaco), carne firme.'),
      num('Tabla y utensilios exclusivos (color celeste) para pescados y mariscos.'),
      sp(),
      subH('2.4  Abarrotes y Productos Secos', sc),
      num('Bodega seca (HR < 70 %), bien ventilada, T° ≤ 25 °C, alejada de luz directa.'),
      num('Almacenar sobre pallets o estantes a ≥ 15 cm del suelo y pared.'),
      num('Aplicar FIFO; colocar productos nuevos al fondo.'),
      sp(),
      subH('2.5  Alimentos Congelados Elaborados', sc),
      num('Recibir a ≤ −18 °C con embalaje íntegro.'),
      num('Rechazar si hay signos de descongelación y recongelación previa.'),
      sp(),
      secTitle('3. Criterios de Aceptación', sc),
      criteriaTable([
        ['Temperatura lácteos (recepción)', '≤ 4 °C', 'Rechazar si >8°C o envase dañado'],
        ['Temperatura pescado fresco', '≤ 4 °C', 'Rechazar si >6°C o características alteradas'],
        ['Temperatura congelados', '≤ −18 °C', 'Rechazar si hay signos de descongelación'],
        ['Latas y conservas', 'Sin abolladuras en costuras, sin hinchazón', 'Desechar; registrar no conformidad'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 14, 28, 61, 62, 96 — Almacenamiento, materias primas y rotulado'),
    ])
}

// ── POE-BPM-ALE-001 ──────────────────────────────────────────────────────────
function buildAlergenos(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-ALE-001',
    'Gestión de Alérgenos', 'Identificación · Comunicación · Prevención de contaminación cruzada',
    'Cocina / Servicio / Atención', 'C62828', 'C62828', tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer los procedimientos para identificar, comunicar y prevenir la contaminación cruzada de alérgenos alimentarios, protegiendo a los comensales con alergias o hipersensibilidades declaradas.'),
      sp(),
      secTitle('2. Los 14 Alérgenos de Declaración Obligatoria', sc),
      bul('Gluten (trigo, cebada, centeno, avena)'), bul('Crustáceos y mariscos'), bul('Huevos y derivados'),
      bul('Pescados'), bul('Maní (cacahuate)'), bul('Soja y derivados'),
      bul('Leche y lácteos'), bul('Nueces y frutos secos (árbol)'), bul('Apio'),
      bul('Mostaza'), bul('Sésamo (ajonjolí)'), bul('Dióxido de azufre / Sulfitos > 10 ppm'),
      bul('Altramuces (lupinos)'), bul('Moluscos'),
      sp(),
      secTitle('3. Procedimiento', sc),
      subH('3.1  Preparación e identificación', sc),
      num('Mantener ficha técnica de cada preparación con lista de alérgenos presentes.'),
      num('Actualizar fichas cada vez que cambie una receta o proveedor de materia prima.'),
      num('Capacitar al personal de sala para conocer los alérgenos de la carta.'),
      sp(),
      subH('3.2  Atención al cliente con alergia', sc),
      num('Comunicar DE INMEDIATO al jefe de cocina (no solo al cocinero) la solicitud de alergia.'),
      num('Si no se puede garantizar un plato libre del alérgeno, informar al cliente con claridad.'),
      sp(),
      subH('3.3  Preparación del plato libre de alérgeno', sc),
      num('Limpiar y desinfectar la superficie de trabajo antes de comenzar.'),
      num('Usar utensilios, tabla y vajilla exclusivos etiquetados "SIN ALÉRGENO".'),
      num('No compartir aceite de fritura con productos que contengan el alérgeno.'),
      num('Mantener el plato separado hasta el momento de servir, identificado con nota visible.'),
      sp(),
      secTitle('4. Criterios y Acciones Correctivas', sc),
      criteriaTable([
        ['Carta sin identificación de alérgenos', 'Todos los alérgenos declarados', 'Actualizar la carta; no usar hasta corregir'],
        ['Preparación con utensilios contaminados', 'Utensilios exclusivos o desinfectados', 'Desechar el plato; preparar nuevamente'],
        ['Cliente con reacción alérgica', 'Cero incidentes', 'Asistencia inmediata; llamar al 131 si es grave; registrar'],
      ], sc),
      sp(),
      secTitle('5. Referencias', sc),
      bul('D.S. 977/96, Art. 96, 107 — Rotulado de alimentos y declaración de ingredientes'),
      bul('Resolución Exenta 2847/2015 MINSAL — Etiquetado de alérgenos en Chile'),
    ])
}

// ── POE-BPM-SER-001 ──────────────────────────────────────────────────────────
function buildServicio(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR — POE', 'POE-BPM-SER-001',
    'Servicio de Alimentos y Mantención en Temperatura', 'Bufet · Línea de servicio · Delivery · Sobrantes',
    'Sala / Cocina / Despacho', CG, CG2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Asegurar que los alimentos sean servidos en condiciones de temperatura e higiene adecuadas, desde que salen de cocina hasta que llegan al comensal.'),
      sp(),
      secTitle('2. Procedimiento', sc),
      subH('2.1  Línea de servicio y bufet', sc),
      num('Pre-calentar equipos de mantención ≥ 30 min antes de apertura.'),
      num('Temperatura línea caliente: ≥ 60 °C antes de colocar alimentos.'),
      num('Temperatura línea fría: ≤ 8 °C.'),
      num('Verificar temperatura cada 30 minutos; registrar.'),
      num('Tiempo máximo de exposición en bufet: 4 h caliente, 3 h frío a temperatura ambiente.'),
      num('Reponer en recipientes nuevos y limpios; nunca mezclar con residuo anterior.'),
      sp(),
      subH('2.2  Servicio en mesa', sc),
      num('Manipular vasos por el tallo, cubiertos por el mango, platos por los bordes.'),
      num('No reutilizar vajilla ni cubiertos sin lavar entre comensales.'),
      sp(),
      subH('2.3  Delivery y despacho', sc),
      num('Usar contenedores isotérmicos. Cargar alimentos calientes a ≥ 65 °C; entregar ≥ 57 °C.'),
      num('Tiempo máximo sin mantención activa: 30 minutos.'),
      sp(),
      subH('2.4  Sobrantes', sc),
      num('Alimentos servidos al público NO se reutilizan ni devuelven a cocina.'),
      num('Sobras de cocina (no servidas): evaluar temperatura y tiempo antes de refrigerar.'),
      sp(),
      secTitle('3. Criterios y Acciones Correctivas', sc),
      criteriaTable([
        ['Temp. alimentos calientes en servicio', '≥ 60 °C', 'Recalentar a ≥ 74°C o desechar'],
        ['Temp. alimentos fríos en servicio', '≤ 8 °C', 'Bajar T° activamente; si >30 min sobre 8°C, desechar'],
        ['Tiempo en bufet (caliente)', '≤ 4 horas', 'Desechar al superar; registrar pérdida'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 14, 37, 52, 69 — Almacenamiento, temperatura, higiene y registros'),
    ])
}

// ── POES-LIM-001 ─────────────────────────────────────────────────────────────
function buildLimpieza(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-LIM-001',
    'Limpieza y Desinfección de Superficies y Utensilios', 'Mesones · Tablas · Cuchillos · Utensilios',
    'Cocina / Todas las áreas', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer el procedimiento para la limpieza y desinfección efectiva de las superficies de trabajo y utensilios en contacto directo con alimentos, previniendo la contaminación cruzada.'),
      sp(),
      secTitle('2. Diferencia Clave: Limpiar vs. Desinfectar', sc),
      body('LIMPIAR: eliminar suciedad visible mediante detergente y acción mecánica.'),
      body('DESINFECTAR: eliminar microorganismos patógenos en la superficie ya limpia.'),
      body('CRÍTICO: No se puede desinfectar una superficie sucia. Siempre primero limpiar, luego desinfectar.'),
      sp(),
      secTitle('3. Procedimiento de 5 Pasos', sc),
      num('Pre-limpieza: retirar residuos sólidos con espátula o cepillo.'),
      num('Limpieza: aplicar detergente desengrasante; frotar por ≥ 30 segundos.'),
      num('Enjuague: enjuagar con agua potable hasta eliminar el detergente.'),
      num('Desinfección: aplicar solución desinfectante (cloro 200 ppm); dejar actuar 2–5 min.'),
      num('Enjuague final y secado: enjuagar si necesario; secar con papel desechable.'),
      sp(),
      secTitle('4. Frecuencias por Superficie', sc),
      criteriaTable([
        ['Mesones de trabajo', 'Después de cada preparación y al inicio/fin de turno', 'Limpiar y desinfectar de inmediato'],
        ['Tablas de corte', 'Después de cada uso con diferente alimento', 'Desinfectar; retirar si hay daños profundos'],
        ['Cuchillos y utensilios', 'Después de cada uso con diferente alimento', 'Lavar y desinfectar antes de reutilizar'],
        ['Paños y esponjas', 'Diariamente; reemplazar ante mal olor', 'Desinfectar en solución clorada 200 ppm'],
      ], sc),
      sp(),
      secTitle('5. Soluciones Desinfectantes', sc),
      bul('Hipoclorito de sodio: 200 ppm (4 mL de cloro 5% por litro). Preparar diariamente.'),
      bul('Cuaternario de amonio: según ficha técnica del producto. Sin enjuague si está en concentración correcta.'),
      bul('Alcohol etílico/isopropílico 70 %: para superficies pequeñas y utensilios.'),
      sp(),
      secTitle('6. Referencias', sc),
      bul('D.S. 977/96, Art. 55, 56, 57 — Limpieza, desinfección y saneamiento'),
    ])
}

// ── POES-EQP-001 ─────────────────────────────────────────────────────────────
function buildEquipos(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-EQP-001',
    'Limpieza y Desinfección de Equipos de Cocina', 'Hornos · Freidoras · Parrillas · Refrigeración',
    'Cocina / Bodega', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Mantener los equipos de cocina en condiciones higiénicas óptimas, previniendo la acumulación de residuos orgánicos, grasas carbonizadas y microorganismos que puedan contaminar los alimentos.'),
      sp(),
      secTitle('2. Procedimientos por Equipo', sc),
      subH('2.1  Cocina a gas / inducción', sc),
      num('Superficie y quemadores: limpiar con desengrasante al final del turno; enjuagar y desinfectar.'),
      num('Perillas y mandos: limpiar con paño húmedo y alcohol 70 %; no sumergir en agua.'),
      sp(),
      subH('2.2  Horno', sc),
      num('Rejillas y bandejas: lavar con desengrasante y enjuagar al final del turno.'),
      num('Interior: aplicar spray desengrasante con horno tibio; dejar 10–15 min; retirar con espátula y paño.'),
      num('Limpieza profunda: semanal o ante acumulación de residuos carbonizados.'),
      sp(),
      subH('2.3  Freidora', sc),
      num('Diariamente: filtrar el aceite cuando esté tibio (80–100 °C); retirar residuos del fondo.'),
      num('Al cambio de aceite: vaciar, enjuagar con agua caliente, aplicar desengrasante, frotar con cepillo de mango largo, enjuagar y secar.'),
      num('Temperatura de fritura máxima: 180 °C.'),
      sp(),
      subH('2.4  Equipos de frío', sc),
      num('Exterior: diario con paño húmedo y desinfectante.'),
      num('Interior: semanal. Retirar alimentos, limpiar con detergente suave, enjuagar, desinfectar; secar antes de reponer.'),
      sp(),
      secTitle('3. Frecuencia por Equipo', sc),
      criteriaTable([
        ['Cocina a gas (superficie)', 'Fin de turno (diaria)', 'Limpiar de inmediato; registrar omisión'],
        ['Horno (interior)', 'Semanal / ante acumulación', 'Limpieza de emergencia; no usar con exceso de residuos'],
        ['Freidora (completa)', 'Al cambio de aceite (máx. semanal)', 'Cambiar aceite ante degradación visible'],
        ['Equipos de frío (interior)', 'Semanal / ante derrame', 'Limpiar de inmediato ante cualquier derrame'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 37, 55, 56, 57 — Equipos y condiciones de limpieza'),
    ])
}

// ── POES-INS-001 ─────────────────────────────────────────────────────────────
function buildInstalaciones(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-INS-001',
    'Limpieza de Instalaciones', 'Pisos · Paredes · Techos · Baños · Sala de comensales',
    'Todas las instalaciones', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Mantener todas las instalaciones del establecimiento en condiciones sanitarias adecuadas, previniendo la acumulación de suciedad, humedad y microorganismos.'),
      sp(),
      secTitle('2. Procedimientos', sc),
      subH('2.1  Pisos de cocina (diario)', sc),
      num('Barrer con escobillón seco; dirigir residuos al punto de recolección.'),
      num('Aplicar solución detergente caliente; restregar con cepillo. Especial atención a esquinas y sumideros.'),
      num('Enjuagar, aplicar desinfectante (hipoclorito 200 ppm), dejar 5 min, enjuagar y escurrir.'),
      sp(),
      subH('2.2  Paredes (semanal)', sc),
      num('Aplicar desengrasante de arriba hacia abajo; especial atención a uniones pared-piso.'),
      num('Enjuagar y desinfectar; limpiar inmediatamente ante cualquier salpicadura.'),
      sp(),
      subH('2.3  Campana extractora (semanal)', sc),
      num('Filtros de grasa: lavar en lavavajillas o a mano con desengrasante.'),
      num('Interior de campana: limpiar mensualmente o ante acumulación visible de grasa.'),
      sp(),
      subH('2.4  Baños y vestuarios (mínimo 2 veces al día)', sc),
      num('Inodoros, urinarios, lavamanos: aplicar desinfectante clorado; frotar con cepillo; enjuagar.'),
      num('Reponer jabón, papel higiénico y toallas en cada revisión.'),
      sp(),
      subH('2.5  Sala de comensales', sc),
      num('Mesas: limpiar con paño húmedo y desinfectante entre cada servicio.'),
      num('Pisos del salón: barrer entre turnos; trapear al inicio y fin del servicio.'),
      sp(),
      secTitle('3. Frecuencia', sc),
      criteriaTable([
        ['Pisos cocina', 'Diaria (inicio y fin de turno)', 'Limpiar de inmediato; señalizar superficie mojada'],
        ['Paredes cocina', 'Semanal / ante salpicaduras', 'Limpiar ante cualquier salpicadura visible'],
        ['Campana (filtros)', 'Semanal', 'No operar con filtros saturados (riesgo de incendio)'],
        ['Baños', 'Mínimo 2 veces al día', 'Limpiar de inmediato ante contaminación visible'],
        ['Mesas comensales', 'Entre cada servicio', 'Nunca colocar cubiertos antes de desinfectar'],
      ], sc),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 44, 45, 48, 55, 56 — Condiciones sanitarias e instalaciones'),
    ])
}

// ── POES-PLG-001 ─────────────────────────────────────────────────────────────
function buildPlagas(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-PLG-001',
    'Control Integrado de Plagas', 'Prevención · Monitoreo · Empresa autorizada SAG',
    'Todas las instalaciones', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Prevenir y controlar la presencia de plagas (roedores, insectos voladores, insectos rastreros) mediante un enfoque de Control Integrado de Plagas (CIP) que combina medidas preventivas, de monitoreo y de control.'),
      sp(),
      secTitle('2. Medidas Preventivas', sc),
      bul('Sellar fisuras, grietas y aberturas en paredes, techos y pisos.'),
      bul('Instalar mallas en ventanas, rejillas y desagüe.'),
      bul('Puertas de cocina: cerrar siempre; instalar burlete en la parte inferior.'),
      bul('No dejar residuos en superficies ni en el suelo al final del turno.'),
      bul('Basura: contenedores con tapa; retirar al exterior al término de cada jornada.'),
      bul('No acumular cajas de cartón vacías dentro de la cocina (refugio de cucarachas).'),
      sp(),
      secTitle('3. Monitoreo Interno', sc),
      num('Inspección visual semanal de rincones, bajo equipos, bodegas, baños y exterior.'),
      num('Colocar estaciones de monitoreo (trampas de pegamento) en áreas críticas.'),
      num('Revisar las trampas semanalmente; registrar tipo y cantidad de captura.'),
      num('Si se detecta plaga activa, activar el protocolo de control de inmediato.'),
      sp(),
      secTitle('4. Empresa de Control de Plagas', sc),
      body('El establecimiento debe contar con un contrato vigente con una empresa autorizada por el SAG (D.S. N° 34/2012). La empresa debe:'),
      bul('Contar con registro SAG vigente.'),
      bul('Realizar visitas preventivas según el programa acordado (mensual o bimestral).'),
      bul('Emitir informe técnico con cada visita y entregarlo al establecimiento.'),
      bul('Utilizar solo plaguicidas autorizados para uso en industria alimentaria.'),
      sp(),
      secTitle('5. Criterios y Acciones', sc),
      criteriaTable([
        ['Presencia de roedores en cocina', 'Cero tolerancia', 'Cierre parcial; notificar SEREMI; empresa de control'],
        ['Informe técnico empresa de plagas', 'Vigente (máx. 3 meses)', 'Solicitar visita de inmediato'],
        ['Trampas de monitoreo', 'Revisión semanal documentada', 'Cambiar trampas deterioradas; aumentar frecuencia si hay capturas'],
      ], sc),
      sp(),
      secTitle('6. Referencias', sc),
      bul('D.S. 977/96, Art. 44, 58 — Condiciones sanitarias y control de vectores y plagas'),
      bul('D.S. N° 34/2012 SAG — Registro de plaguicidas de uso sanitario'),
    ])
}

// ── POES-PER-001 ─────────────────────────────────────────────────────────────
function buildPersonal(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-PER-001',
    'Higiene y Vestuario del Personal', 'Uniforme · Ropa de trabajo · Ingreso · Visitantes',
    'Todas las áreas', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer los estándares de vestuario y presentación del personal por área de trabajo, evitando la contaminación física y biológica de los alimentos por parte del personal y los visitantes.'),
      sp(),
      secTitle('2. Estándares por Cargo', sc),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340, 3510, 3510],
        rows: [
          new TableRow({ children: [hCell('Cargo', 2340, sc), hCell('Vestuario obligatorio', 3510, sc), hCell('Prohibido', 3510, sc)] }),
          ...[
            ['Cocinero / ayudante', 'Chaquetilla blanca, delantal, pantalón, cofia, calzado antideslizante', 'Joyería en manos, uñas con esmalte, ropa de calle sin cubrir'],
            ['Garzón / cajero', 'Uniforme de sala, cabello recogido, calzado cerrado', 'Bermudas, chanclas, camiseta sin mangas'],
            ['Personal de limpieza', 'Delantal de color diferente (azul/amarillo), guantes, calzado antideslizante', 'Usar mismo uniforme en baños y cocina'],
          ].map(([c, v, p], i) => new TableRow({ children: [
            dCell(c, 2340, i % 2 === 0 ? CW : 'F5F5F5', true),
            dCell(v, 3510, i % 2 === 0 ? CW : 'F5F5F5'),
            dCell(p, 3510, i % 2 === 0 ? CW : 'F5F5F5'),
          ]})),
        ],
      }),
      sp(),
      secTitle('3. Protocolo de Ingreso a Cocina', sc),
      num('Todo el personal que ingrese a cocina debe usar cofia, ropa de trabajo apropiada y manos lavadas.'),
      num('Uniformes de calle: guardar en casillero asignado; nunca en la cocina.'),
      num('Técnicos y visitas: usar cofia y delantal de visita; acompañados en todo momento.'),
      num('Proveedores: NO ingresan a la cocina; se recibe en zona de recepción.'),
      sp(),
      secTitle('4. Referencias', sc),
      bul('D.S. 977/96, Art. 52, 53, 54 — Higiene, conducta y salud del personal'),
    ])
}

// ── POES-RES-001 ─────────────────────────────────────────────────────────────
function buildResiduos(tenant: Tenant): Document {
  return buildDoc('PROCEDIMIENTO OPERATIVO ESTÁNDAR DE SANITIZACIÓN — POES', 'POES-RES-001',
    'Manejo y Disposición de Residuos Sólidos', 'Clasificación · Almacenamiento · Retiro · Reciclaje',
    'Cocina / Sala / Área exterior', CB, CB2, tenant, (sc) => [
      secTitle('1. Objetivo', sc),
      body('Establecer el procedimiento para la segregación, almacenamiento, higiene y disposición final de los residuos sólidos generados en el establecimiento, previniendo la atracción de plagas y la contaminación cruzada.'),
      sp(),
      secTitle('2. Clasificación de Residuos', sc),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [2500, 2000, 4860],
        rows: [
          new TableRow({ children: [hCell('Tipo de residuo', 2500, sc), hCell('Color contenedor', 2000, sc), hCell('Ejemplos', 4860, sc)] }),
          ...[
            ['Residuos orgánicos', 'Verde o café', 'Restos de comida, cáscaras, preparaciones vencidas, aceite de cocina'],
            ['Reciclables secos', 'Azul', 'Cartón, papel, plástico limpio, vidrio, metales'],
            ['No reciclables', 'Gris o negro', 'Papel contaminado, plásticos sucios, servilletas, guantes desechables'],
            ['Residuos peligrosos', 'Rojo (etiquetado)', 'Envases de productos de limpieza, plaguicidas vacíos'],
          ].map(([t, c, e], i) => new TableRow({ children: [
            dCell(t, 2500, i % 2 === 0 ? CW : 'F5F5F5', true),
            dCell(c, 2000, i % 2 === 0 ? CW : 'F5F5F5', false, true),
            dCell(e, 4860, i % 2 === 0 ? CW : 'F5F5F5'),
          ]})),
        ],
      }),
      sp(),
      secTitle('3. Procedimiento de Manejo Interno', sc),
      num('Usar contenedores con tapa de pedal en todas las áreas de trabajo.'),
      num('No llenar los contenedores más del 80 % de su capacidad.'),
      num('Vaciar los contenedores de cocina al exterior al fin de cada turno (mínimo).'),
      num('Nunca dejar residuos orgánicos en la cocina durante la noche.'),
      num('Aceite de cocina usado: enfriar, filtrar y almacenar en contenedor hermético; gestionar con empresa recolectora autorizada. Prohibido verterlo por el desagüe.'),
      num('Zona exterior: contenedores con tapa siempre cerrada; lavar semanalmente.'),
      sp(),
      secTitle('4. Criterios y Acciones Correctivas', sc),
      criteriaTable([
        ['Contenedores sin tapa en cocina', 'Todos con tapa de pedal', 'Proporcionar de inmediato; registrar'],
        ['Residuos orgánicos en cocina al cierre', 'Ninguno al final del turno', 'Vaciar de inmediato; capacitar personal'],
        ['Aceite por el desagüe', 'Prohibido', 'Registrar; capacitar; medida disciplinaria si reincidente'],
      ], sc),
      sp(),
      secTitle('5. Referencias', sc),
      bul('D.S. 977/96, Art. 44, 58 — Condiciones sanitarias y eliminación de residuos'),
      bul('Ley N° 20.920 — Gestión de residuos y responsabilidad extendida del productor'),
    ])
}

// ══════════════════════════════════════════════════════════════════════════════
// Registry & public API
// ══════════════════════════════════════════════════════════════════════════════

export type DocCode =
  | 'POE-BPM-HIG-001' | 'POE-BPM-COC-001' | 'POE-BPM-ENF-001'
  | 'POE-BPM-CAR-001' | 'POE-BPM-VEG-001' | 'POE-BPM-OTR-001'
  | 'POE-BPM-ALE-001' | 'POE-BPM-SER-001'
  | 'POES-LIM-001' | 'POES-EQP-001' | 'POES-INS-001'
  | 'POES-PLG-001' | 'POES-PER-001' | 'POES-RES-001'

const BUILDERS: Record<DocCode, (t: Tenant) => Document> = {
  'POE-BPM-HIG-001': buildHigiene,
  'POE-BPM-COC-001': buildCoccion,
  'POE-BPM-ENF-001': buildEnfriamiento,
  'POE-BPM-CAR-001': buildCarnes,
  'POE-BPM-VEG-001': buildVerduras,
  'POE-BPM-OTR-001': buildOtros,
  'POE-BPM-ALE-001': buildAlergenos,
  'POE-BPM-SER-001': buildServicio,
  'POES-LIM-001':    buildLimpieza,
  'POES-EQP-001':    buildEquipos,
  'POES-INS-001':    buildInstalaciones,
  'POES-PLG-001':    buildPlagas,
  'POES-PER-001':    buildPersonal,
  'POES-RES-001':    buildResiduos,
}

/**
 * Generate and trigger browser download of a BPM document as DOCX.
 * @param code   Document code (e.g. 'POE-BPM-HIG-001')
 * @param tenant Tenant data from AuthContext
 */
export async function downloadDoc(code: DocCode, tenant: Tenant): Promise<void> {
  const builder = BUILDERS[code]
  if (!builder) throw new Error(`Unknown document code: ${code}`)
  const doc  = builder(tenant)
  const blob = await Packer.toBlob(doc)
  const safe = (tenant.name || 'establecimiento').replace(/[^a-z0-9]/gi, '_').slice(0, 30)
  saveAs(blob, `${code}_${safe}.docx`)
}

/**
 * Generate and return a DOCX Blob (for custom download logic).
 */
export async function buildDocBlob(code: DocCode, tenant: Tenant): Promise<Blob> {
  const builder = BUILDERS[code]
  if (!builder) throw new Error(`Unknown document code: ${code}`)
  return Packer.toBlob(builder(tenant))
}
