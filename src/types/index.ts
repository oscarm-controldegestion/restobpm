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
  phone?: string
  type: EstablishmentType
  logo_url?: string
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
    id: 'inicial',
    name: 'Cumplimiento Inicial',
    price: 14990,
    maxOperators: 2,
    maxSupervisors: 1,
    maxBranches: 1,
    maxModules: 3,
    modules: ['CS', 'PM', 'IS'],
    features: [
      '2 usuarios operadores',
      '1 supervisor',
      'Módulos: Temperatura, Personal e Inocuidad',
      'Alertas push',
      'Soporte web',
    ],
    stripePriceId: 'price_inicial_monthly',
  },
  {
    id: 'total',
    name: 'Cumplimiento Total',
    price: 19900,
    maxOperators: 8,
    maxSupervisors: 2,
    maxBranches: 1,
    maxModules: -1,
    modules: ['IF', 'IS', 'PM', 'CS', 'PF'],
    features: [
      'Hasta 10 usuarios (8 operadores + 2 supervisores)',
      'Todos los módulos BPM',
      'Alertas push',
      'Soporte web',
    ],
    addons: [
      'Asesoría en resolución sanitaria',
      'Revisión de local (servicio a contratar)',
    ],
    highlighted: true,
    stripePriceId: 'price_total_monthly',
  },
  {
    id: 'sucursales',
    name: 'Múltiples Sucursales',
    price: 39900,
    maxOperators: 8,
    maxSupervisors: 2,
    maxBranches: 5,
    maxModules: -1,
    modules: ['IF', 'IS', 'PM', 'CS', 'PF'],
    features: [
      'Todo lo de Cumplimiento Total',
      'Hasta 5 sucursales',
      'Gestión centralizada multi-local',
      'Alertas push',
      'Soporte web prioritario',
    ],
    addons: [
      'Asesoría en resolución sanitaria',
      'Revisión de local (servicio a contratar)',
    ],
    stripePriceId: 'price_sucursales_monthly',
  },
]

// ─── PLANILLA TYPES ───────────────────────────────────────────────────────────
export type PlanillaFrequency = 'daily' | 'weekly' | 'monthly'
export type PlanillaValue     = 'C' | 'NC' | 'NA'
export type PlanillaStatus    = 'pending' | 'in_progress' | 'completed' | 'signed'
export type AlertType         = 'not_started' | 'incomplete' | 'overdue'
export type PlanillaValueType = 'compliance' | 'temperature'
export type TimeSlot          = 'morning' | 'afternoon'

export interface PlanillaTemplate {
  id: string
  tenant_id: string | null
  name: string
  description: string | null
  active: boolean
  order_index: number
  created_at: string
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
}

export interface PlanillaMonth {
  id: string
  tenant_id: string
  template_id: string
  year: number
  month: number
  assigned_to: string | null
  status: PlanillaStatus
  signed_at: string | null
  signed_by: string | null
  signature: string | null
  pdf_url: string | null
  created_at: string
  template?: PlanillaTemplate
  assigned_profile?: Profile
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
