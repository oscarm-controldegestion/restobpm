import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  PlanillaTemplate, PlanillaItem, PlanillaMonth,
  PlanillaEntry, PlanillaAlert, PlanillaValue, TimeSlot, Profile, Area
} from '@/types'

// ── Templates ────────────────────────────────────────────────────────────────
export function usePlanillaTemplates() {
  const [templates, setTemplates] = useState<PlanillaTemplate[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    supabase
      .from('planilla_templates')
      .select('*')
      .eq('active', true)
      .order('order_index')
      .then(({ data }) => {
        setTemplates((data ?? []) as PlanillaTemplate[])
        setLoading(false)
      })
  }, [])

  return { templates, loading }
}

// ── Items for a template ──────────────────────────────────────────────────────
export function usePlanillaItems(templateId: string | null) {
  const [items, setItems]     = useState<PlanillaItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!templateId) { setLoading(false); return }
    const { data } = await supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', templateId)
      .eq('active', true)
      .order('order_index')
    setItems((data ?? []) as PlanillaItem[])
    setLoading(false)
  }, [templateId])

  useEffect(() => { load() }, [load])

  return { items, loading, reload: load }
}

// ── All items for a template (including inactive, for management) ──────────────
export function usePlanillaItemsAll(templateId: string | null) {
  const [items, setItems]     = useState<PlanillaItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!templateId) { setLoading(false); return }
    const { data } = await supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', templateId)
      .order('order_index')
    setItems((data ?? []) as PlanillaItem[])
    setLoading(false)
  }, [templateId])

  useEffect(() => { load() }, [load])

  return { items, loading, reload: load }
}

// ── Operators for current tenant ──────────────────────────────────────────────
export function useTenantOperators() {
  const { tenant } = useAuth()
  const [operators, setOperators] = useState<Profile[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!tenant) return
    supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('role', 'operator')
      .eq('active', true)
      .order('full_name')
      .then(({ data }) => {
        setOperators((data ?? []) as Profile[])
        setLoading(false)
      })
  }, [tenant])

  return { operators, loading }
}

// ── Months for current tenant ─────────────────────────────────────────────────
// If filterByCurrentUser=true, only returns months assigned to the current profile
export function usePlanillaMonths(year: number, month: number, filterByCurrentUser = false) {
  const { tenant, profile } = useAuth()
  const [months, setMonths]   = useState<PlanillaMonth[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    let query = supabase
      .from('planilla_months')
      .select('*, template:planilla_templates(*)')
      .eq('tenant_id', tenant.id)
      .eq('year', year)
      .eq('month', month)
      .order('created_at')

    if (filterByCurrentUser && profile) {
      query = query.eq('assigned_to', profile.id)
    }

    const { data } = await query
    setMonths((data ?? []) as PlanillaMonth[])
    setLoading(false)
  }, [tenant, profile, year, month, filterByCurrentUser])

  useEffect(() => { load() }, [load])

  // Ensure all active templates have a month record for this period
  const ensureMonths = useCallback(async (templates: PlanillaTemplate[]) => {
    if (!tenant) return
    for (const tpl of templates) {
      await supabase.from('planilla_months').insert({
        tenant_id:   tenant.id,
        template_id: tpl.id,
        year,
        month,
        status: 'pending',
      }).select().single()
      // ignore conflict (unique constraint)
    }
    await load()
  }, [tenant, year, month, load])

  return { months, loading, reload: load, ensureMonths }
}

// ── Entries for a month ───────────────────────────────────────────────────────
export function usePlanillaEntries(monthId: string | null) {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<PlanillaEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!monthId) { setLoading(false); return }
    const { data } = await supabase
      .from('planilla_entries')
      .select('*')
      .eq('month_id', monthId)
    setEntries((data ?? []) as PlanillaEntry[])
    setLoading(false)
  }, [monthId])

  useEffect(() => { load() }, [load])

  // Upsert a compliance cell (C/NC/NA)
  const setValue = useCallback(async (
    itemId: string,
    day: number,
    value: PlanillaValue | null
  ) => {
    if (!monthId || !profile) return
    await supabase.from('planilla_entries').upsert(
      {
        month_id: monthId, item_id: itemId, day,
        value, time_slot: null, numeric_value: null,
        updated_by: profile.id, updated_at: new Date().toISOString()
      },
      { onConflict: 'month_id,item_id,day,time_slot' }
    )
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === itemId && e.day === day && e.time_slot === null)
      const updated: PlanillaEntry = {
        id: idx >= 0 ? prev[idx].id : `${monthId}-${itemId}-${day}`,
        month_id: monthId, item_id: itemId, day,
        value, time_slot: null, numeric_value: null,
        updated_at: new Date().toISOString(), updated_by: profile.id
      }
      if (idx >= 0) {
        const next = [...prev]; next[idx] = updated; return next
      }
      return [...prev, updated]
    })
  }, [monthId, profile])

  // Upsert a temperature cell (numeric, with time slot)
  const setNumericValue = useCallback(async (
    itemId: string,
    day: number,
    timeSlot: TimeSlot,
    numericValue: number | null
  ) => {
    if (!monthId || !profile) return
    await supabase.from('planilla_entries').upsert(
      {
        month_id: monthId, item_id: itemId, day,
        value: null, time_slot: timeSlot, numeric_value: numericValue,
        updated_by: profile.id, updated_at: new Date().toISOString()
      },
      { onConflict: 'month_id,item_id,day,time_slot' }
    )
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === itemId && e.day === day && e.time_slot === timeSlot)
      const updated: PlanillaEntry = {
        id: idx >= 0 ? prev[idx].id : `${monthId}-${itemId}-${day}-${timeSlot}`,
        month_id: monthId, item_id: itemId, day,
        value: null, time_slot: timeSlot, numeric_value: numericValue,
        updated_at: new Date().toISOString(), updated_by: profile.id
      }
      if (idx >= 0) {
        const next = [...prev]; next[idx] = updated; return next
      }
      return [...prev, updated]
    })
  }, [monthId, profile])

  // Lookup: compliance entry (time_slot = null)
  const entryMap = useCallback((itemId: string, day: number): PlanillaValue | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === day && e.time_slot === null)
    return e?.value ?? null
  }, [entries])

  // Lookup: temperature entry by slot
  const tempMap = useCallback((itemId: string, day: number, timeSlot: TimeSlot): number | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === day && e.time_slot === timeSlot)
    return e?.numeric_value ?? null
  }, [entries])

  return { entries, loading, setValue, setNumericValue, entryMap, tempMap, reload: load }
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export function usePlanillaAlerts() {
  const { tenant } = useAuth()
  const [alerts, setAlerts]   = useState<PlanillaAlert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    const { data } = await supabase
      .from('planilla_alerts')
      .select('*, month:planilla_months(*, template:planilla_templates(*))')
      .eq('tenant_id', tenant.id)
      .eq('seen', false)
      .order('created_at', { ascending: false })
      .limit(50)
    setAlerts((data ?? []) as PlanillaAlert[])
    setLoading(false)
  }, [tenant])

  useEffect(() => { load() }, [load])

  const markSeen = useCallback(async (id: string) => {
    await supabase.from('planilla_alerts').update({ seen: true }).eq('id', id)
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const createAlert = useCallback(async (
    monthId: string, type: PlanillaAlert['type'], day?: number
  ) => {
    if (!tenant) return
    await supabase.from('planilla_alerts').insert({
      tenant_id: tenant.id, month_id: monthId, type, day: day ?? null
    })
    await load()
  }, [tenant, load])

  return { alerts, loading, markSeen, createAlert, reload: load }
}

// ── Sign a planilla month ─────────────────────────────────────────────────────
export async function signPlanillaMonth(monthId: string, profileId: string, signature: string) {
  return supabase.from('planilla_months').update({
    status:    'signed',
    signed_at: new Date().toISOString(),
    signed_by: profileId,
    signature,
  }).eq('id', monthId)
}

// ── Update month status ───────────────────────────────────────────────────────
export async function updateMonthStatus(monthId: string, status: string) {
  return supabase.from('planilla_months').update({ status }).eq('id', monthId)
}

// ── Assign a planilla month to an operator ────────────────────────────────────
export async function assignPlanillaMonth(monthId: string, profileId: string | null) {
  return supabase.from('planilla_months').update({ assigned_to: profileId }).eq('id', monthId)
}

// ── CRUD for planilla items ───────────────────────────────────────────────────
export async function createPlanillaItem(item: Omit<PlanillaItem, 'id'>) {
  return supabase.from('planilla_items').insert(item).select().single()
}

export async function updatePlanillaItem(id: string, updates: Partial<PlanillaItem>) {
  return supabase.from('planilla_items').update(updates).eq('id', id)
}

export async function deletePlanillaItem(id: string) {
  return supabase.from('planilla_items').update({ active: false }).eq('id', id)
}

// ── Areas ─────────────────────────────────────────────────────────────────────
export function useAreas() {
  const { tenant } = useAuth()
  const [areas, setAreas]     = useState<Area[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    const { data } = await supabase
      .from('areas')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('active', true)
      .order('name')
    setAreas((data ?? []) as Area[])
    setLoading(false)
  }, [tenant])

  useEffect(() => { load() }, [load])

  const createArea = useCallback(async (name: string, description: string | null) => {
    if (!tenant) return
    await supabase.from('areas').insert({ tenant_id: tenant.id, name: name.trim(), description: description?.trim() || null })
    await load()
  }, [tenant, load])

  const updateArea = useCallback(async (id: string, name: string, description: string | null) => {
    await supabase.from('areas').update({ name: name.trim(), description: description?.trim() || null }).eq('id', id)
    await load()
  }, [load])

  const deleteArea = useCallback(async (id: string) => {
    await supabase.from('areas').update({ active: false }).eq('id', id)
    setAreas(prev => prev.filter(a => a.id !== id))
  }, [])

  return { areas, loading, createArea, updateArea, deleteArea, reload: load }
}

// ── Assign area to a planilla month ──────────────────────────────────────────
export async function assignPlanillaArea(monthId: string, areaId: string | null) {
  return supabase.from('planilla_months').update({ area_id: areaId }).eq('id', monthId)
}
