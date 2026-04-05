// ─── ROLES ───────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'supervisor' | 'operator'

export type EstablishmentType = 'restaurant' | 'industry' | 'casino' | 'bakery' | 'other'

export type SubscriptionPlan = 'trial' | 'inicial' | 'total' | 'sucursales'

// ─── TENANT (ESTABLISHMENT) ───────────────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  rut?: string
  address?: string
  city?: string
  phone?: string
  email?: string
  type: EstablishmentType
  logo_url?: string
  resolucion_sanitaria?: string
  responsible_bpm?: string
  cargo_responsable?: string
  signature_bpm_url?: string
  plan: SubscriptionPlan
  plan_expires_at?: string
  stripe_customer_id?: string
  active: boolean
  created_at: string
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
export interface Profile {
  id: string
  tenant_id: string
  full_name: string
  rut?: string
  role: UserRole
  phone?: string
  active: boolean
  created_at: string
  tenant?: Tenant
}

// ─── BPM MODULE ───────────────────────────────────────────────────────────────
export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly' | 'per_reception' | 'annual'

export type EvidenceType = 'visual_check' | 'digital_record' | 'document' | 'certificate' | 'direct_supervision'

export interface BpmModule {
  id: string
  code: string       // IF, IS, PM, CS, PF
  name: string
  description: string
  order_index: number
  active: boolean
  items?: BpmItem[]
}

export interface BpmItem {
  id: string
  module_id: string
  code: string       // IF-001, IF-002, ...
  name: string
  description: string
  frequency: ChecklistFrequency
  rsa_reference: string
  applies_to: string[]
  evidence_type: EvidenceType
  requires_value: boolean
  value_unit?: string
  value_min?: number
  value_max?: number
  active: boolean
  order_index: number
  module?: BpmModule
}

// ─── CHECKLIST EXECUTION ──────────────────────────────────────────────────────
export type ExecutionStatus = 'in_progress' | 'completed' | 'approved' | 'rejected'

export type ItemResult = 'complies' | 'partial' | 'non_compliant' | 'na'

export interface ChecklistExecution {
  id: string
  tenant_id: string
  module_id: string
  executed_by: string
  supervised_by?: string
  started_at: string
  completed_at?: string
  status: ExecutionStatus
  compliance_score?: number
  folio?: string
  pdf_url?: string
  notes?: string
  created_at: string
  module?: BpmModule
  executor?: Profile
  supervisor?: Profile
  responses?: ChecklistResponse[]
}

export interface ChecklistResponse {
  id: string
  execution_id: string
  item_id: string
  result: ItemResult
  numeric_value?: number
  photo_url?: string
  notes?: string
  responded_at: string
  item?: BpmItem
}

// ─── NON CONFORMITY ───────────────────────────────────────────────────────────
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type NcStatus  = 'open' | 'in_progress' | 'resolved' | 'verified'

export interface NonConformity {
  id: string
  tenant_id: string
  execution_id: string
  item_id: string
  detected_by: string
  severity: Severity
  description: string
  status: NcStatus
  created_at: string
  item?: BpmItem
  detector?: Profile
  corrective_actions?: CorrectiveAction[]
}

export interface CorrectiveAction {
  id: string
  non_conformity_id: string
  assigned_to: string
  assigned_by: string
  description: string
  due_date: string
  completed_at?: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  created_at: string
}

// ─── TEMPERATURE LOG ──────────────────────────────────────────────────────────
export interface TemperatureLog {
  id: string
  tenant_id: string
  recorded_by: string
  location: string
  temperature: number
  min_temp: number
  max_temp: number
  in_range: boolean
  notes?: string
  recorded_at: string
  recorder?: Profile
}

// ─── PERSONNEL DOCUMENT ───────────────────────────────────────────────────────
export type DocumentType = 'food_handler_card' | 'lab_exam' | 'training' | 'other'
export type DocumentStatus = 'valid' | 'expiring_soon' | 'expired'

export interface PersonnelDocument {
  id: string
  profile_id: string
  tenant_id: string
  document_type: DocumentType
  issued_date?: string
  expiry_date?: string
  document_url?: string
  status: DocumentStatus
  created_at: string
  profile?: Profile
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
export interface DashboardStats {
  todayCompliance: number
  pendingTasks: number
  openNonConformities: number
  expiringDocuments: number
  temperatureAlerts: number
  moduleScores: { module: string; score: number; color: string }[]
  last30Days: { date: string; score: number }[]
}

// ─── SUBSCRIPTION PLANS ───────────────────────────────────────────────────────
export interface PricingPlan {
  id: SubscriptionPlan
  name: string
  price: number          // CLP/month (sin IVA)
  maxOperators: number
  maxSupervisors: number
  maxBranches: number
  maxModules: number     // -1 = todos
  modules: string[]      // códigos de módulos incluidos
  features: string[]
  addons?: string[]      // servicios a contratar adicionales
  highlighted?: boolean
  stripePriceId?: string
}

export const BPM_MODULES_ALL = ['IF', 'IS', 'PM', 'CS', 'PF'] as const
// IF = Infraestructura/Instalaciones
// IS = Inocuidad de Superficies
// PM = Personal y Manipuladores
// CS = Cadena de Frío / Temperatura
// PF = Proceso y Flujos productivos

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'trial',
    name: 'Demo',
    price: 0,
    maxOperators: 1,
    maxSupervisors: 0,
    maxBranches: 1,
    maxModules: 2,
    modules: ['CS', 'PM'],
    features: [
      '1 usuario operador',
      'Módulos: Temperatura y Personal',
      'Acceso limitado 30 días',
      'Solo para evaluación',
    ],
  },
  {
    id: 'total',
    name: 'Cumplimiento Total',
    price: 14900,
    maxOperators: -1,       // sin límite
    maxSupervisors: -1,
    maxBranches: 1,
    maxModules: -1,
    modules: ['IF', 'IS', 'PM', 'CS', 'PF'],
    features: [
      'Usuarios ilimitados',
      'Todos los módulos BPM',
      'Manuales y documentos BPM',
      'Alertas push',
      'Soporte web',
    ],
    addons: [
      'Asesoría en resolución sanitaria',
      'Revisión de establecimiento (servicio opcional)',
    ],
    highlighted: true,
    stripePriceId: 'price_total_monthly',
  },
  {
    id: 'sucursales',
    name: 'Múltiples Sucursales',
    price: 28900,
    maxOperators: -1,
    maxSupervisors: -1,
    maxBranches: 4,
    maxModules: -1,
    modules: ['IF', 'IS', 'PM', 'CS', 'PF'],
    features: [
      'Todo lo de Cumplimiento Total',
      'Hasta 4 sucursales',
      'Gestión centralizada multi-local',
      'Alertas push',
      'Soporte web prioritario',
    ],
    addons: [
      'Asesoría en resolución sanitaria',
      'Revisión de establecimiento (servicio opcional)',
    ],
    stripePriceId: 'price_sucursales_monthly',
  },
]

// ─── AREAS ───────────────────────────────────────────────────────────────────
export interface Area {
  id: string
  tenant_id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

// ─── PLANILLA TYPES ───────────────────────────────────────────────────────────
export type PlanillaFrequency = 'daily' | 'weekly' | 'monthly'
export type PlanillaValue     = 'C' | 'NC' | 'NA' | 'CL'
export type PlanillaStatus    = 'pending' | 'in_progress' | 'completed' | 'signed'
export type AlertType         = 'not_started' | 'incomplete' | 'overdue'
export type PlanillaValueType = 'compliance' | 'temperature' | 'compliance_mt'
export type TimeSlot          = 'morning' | 'afternoon'

export type PlanillaLayoutType =
  | 'default'
  | 'worker_hygiene'
  | 'product_reception'
  | 'fumigation_program'
  | 'training_program'
  | 'equipment_maintenance'

export type ReceptionEstado = 'conforme' | 'no_conforme' | 'observacion'

export interface ProductReceptionEntry {
  id: string
  tenant_id: string
  month_id: string
  fecha_recepcion: string         // ISO timestamptz
  proveedor: string
  producto: string
  marca: string | null
  cantidad: number | null
  unidad: string
  temperatura: number | null
  temperatura_min: number | null
  temperatura_max: number | null
  fecha_vencimiento: string | null // ISO date
  lote: string | null
  estado: ReceptionEstado
  observaciones: string | null
  photo_url: string | null
  photo_taken_at: string | null
  recibido_por: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── FUMIGACIÓN ──────────────────────────────────────────────────────────────
export type FumigacionPeriodo = 'mensual' | 'bimestral' | 'trimestral'
export interface FumigacionRecord {
  id: string
  tenant_id: string
  month_id: string
  fecha_fumigacion: string           // ISO date
  empresa_fumigadora: string
  nombre_tecnico: string | null
  n_registro_sag: string | null
  producto_utilizado: string | null
  dosis: string | null
  areas_tratadas: string | null
  plagas_objetivo: string | null
  periodo: FumigacionPeriodo
  fecha_proxima: string | null
  certificado_url: string | null
  certificado_nombre: string | null
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── CAPACITACIÓN ────────────────────────────────────────────────────────────
export type TipoInstructor  = 'interno' | 'externo' | 'online'
export type EvaluacionResult = 'aprobado' | 'reprobado' | 'pendiente' | 'sin_evaluacion'
export interface TrainingRecord {
  id: string
  tenant_id: string
  month_id: string
  fecha: string                      // ISO date
  tema: string
  objetivos: string | null
  tipo_instructor: TipoInstructor
  nombre_instructor: string | null
  empresa_instructor: string | null
  duracion_horas: number | null
  n_participantes: number | null
  lista_participantes: string | null
  evaluacion: EvaluacionResult
  puntaje_promedio: number | null
  certificado_url: string | null
  certificado_nombre: string | null
  material_url: string | null
  material_nombre: string | null
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── MANTENIMIENTO DE EQUIPOS ─────────────────────────────────────────────────
export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'calibracion' | 'inspeccion'
export type EstadoEquipo      = 'en_servicio' | 'fuera_servicio' | 'en_reparacion'
export interface MaintenanceRecord {
  id: string
  tenant_id: string
  month_id: string
  fecha_mantenimiento: string        // ISO date
  equipo_nombre: string
  equipo_marca: string | null
  equipo_modelo: string | null
  equipo_n_serie: string | null
  tipo_mantenimiento: TipoMantenimiento
  descripcion_trabajo: string
  empresa_tecnico: string | null
  nombre_tecnico: string | null
  repuestos_utilizados: string | null
  costo: number | null
  estado_equipo: EstadoEquipo
  fecha_proxima: string | null
  certificado_url: string | null
  certificado_nombre: string | null
  observaciones: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PlanillaTemplate {
  id: string
  tenant_id: string | null
  name: string
  description: string | null
  active: boolean
  order_index: number
  layout_type: PlanillaLayoutType
  created_at: string
}

// ─── WORKERS ─────────────────────────────────────────────────────────────────
export type WorkerShift = 'AM' | 'PM' | 'Ambos'

export interface Worker {
  id: string
  tenant_id: string
  name: string
  rut: string
  shift: WorkerShift
  active: boolean
  order_index: number
  created_at: string
}

export interface HigieneEntry {
  id: string
  tenant_id: string
  month_id: string
  worker_id: string
  item_id: string
  day: number
  value: 'S' | 'N' | null
}

export interface PlanillaItem {
  id: string
  template_id: string
  name: string
  frequency: PlanillaFrequency
  value_type: PlanillaValueType
  equipment_number: string | null
  order_index: number
  active: boolean
  requires_document: boolean
}

export interface PlanillaDocument {
  id: string
  tenant_id: string
  month_id: string
  item_id: string
  file_url: string
  file_name: string
  file_type: 'pdf' | 'image'
  file_size: number | null
  uploaded_by: string | null
  uploaded_at: string
  note: string | null
}

export interface PlanillaMonth {
  id: string
  tenant_id: string
  template_id: string
  year: number
  month: number
  assigned_to: string | null
  area_id: string | null
  label: string | null
  status: PlanillaStatus
  signed_at: string | null
  signed_by: string | null
  signature: string | null
  pdf_url: string | null
  created_at: string
  template?: PlanillaTemplate
  assigned_profile?: Profile
  area?: Area
}

export interface PlanillaMonthItem {
  id: string
  month_id: string
  item_id: string
}

export interface PlanillaEntry {
  id: string
  month_id: string
  item_id: string
  day: number
  value: PlanillaValue | null
  time_slot: TimeSlot | null
  numeric_value: number | null
  updated_at: string
  updated_by: string | null
}

export interface PlanillaAlert {
  id: string
  tenant_id: string
  month_id: string
  day: number | null
  type: AlertType
  seen: boolean
  created_at: string
  month?: PlanillaMonth
}

export interface PlanillaComplianceStats {
  template_id: string
  template_name: string
  total_expected: number
  total_filled: number
  total_c: number
  total_nc: number
  total_na: number
  compliance_pct: number
}
