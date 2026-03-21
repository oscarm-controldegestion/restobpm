// ─── ROLES ───────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'supervisor' | 'operator'

export type EstablishmentType = 'restaurant' | 'industry' | 'casino' | 'bakery' | 'other'

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'

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
  price: number          // CLP/month
  priceUSD: number
  maxUsers: number
  maxModules: number
  features: string[]
  stripePriceId?: string
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    priceUSD: 0,
    maxUsers: 3,
    maxModules: 2,
    features: ['Módulo Temperatura', 'Módulo Higiene Personal', '3 usuarios', 'Exportar PDF básico'],
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 9990,
    priceUSD: 10,
    maxUsers: 10,
    maxModules: 5,
    features: ['5 módulos BPM completos', '10 usuarios', 'PDF con folio y firma digital', 'Alertas push', 'Soporte email'],
    stripePriceId: 'price_basic_monthly',
  },
  {
    id: 'pro',
    name: 'Profesional',
    price: 19990,
    priceUSD: 20,
    maxUsers: 30,
    maxModules: 5,
    features: ['Todo lo de Básico', '30 usuarios', 'Dashboard analytics avanzado', 'Simulacro SEREMI', 'Múltiples sucursales', 'Soporte prioritario'],
    stripePriceId: 'price_pro_monthly',
  },
  {
    id: 'enterprise',
    name: 'Empresa',
    price: 49990,
    priceUSD: 50,
    maxUsers: 999,
    maxModules: 5,
    features: ['Todo lo de Pro', 'Usuarios ilimitados', 'API access', 'Integración IoT temperatura', 'SLA garantizado', 'Onboarding dedicado'],
    stripePriceId: 'price_enterprise_monthly',
  },
]
