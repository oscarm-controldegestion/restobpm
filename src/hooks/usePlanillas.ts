import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  PlanillaTemplate, PlanillaItem, PlanillaMonth,
  PlanillaEntry, PlanillaAlert, PlanillaValue
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

  useEffect(() => {
    if (!templateId) { setLoading(false); return }
    supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', templateId)
      .eq('active', true)
      .order('order_index')
      .then(({ data }) => {
        setItems((data ?? []) as PlanillaItem[])
        setLoading(false)
      })
  }, [templateId])

  return { items, loading }
}

// ── Months for current tenant ─────────────────────────────────────────────────
export function usePlanillaMonths(year: number, month: number) {
  const { tenant } = useAuth()
  const [months, setMonths]   = useState<PlanillaMonth[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    const { data } = await supabase
      .from('planilla_months')
      .select('*, template:planilla_templates(*)')
      .eq('tenant_id', tenant.id)
      .eq('year', year)
      .eq('month', month)
      .order('created_at')
    setMonths((data ?? []) as PlanillaMonth[])
    setLoading(false)
  }, [tenant, year, month])

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

  // Upsert a single cell
  const setValue = useCallback(async (
    itemId: string,
    day: number,
    value: PlanillaValue | null
  ) => {
    if (!monthId || !profile) return
    await supabase.from('planilla_entries').upsert(
      { month_id: monthId, item_id: itemId, day, value, updated_by: profile.id, updated_at: new Date().toISOString() },
      { onConflict: 'month_id,item_id,day' }
    )
    // Optimistic update
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === itemId && e.day === day)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], value, updated_by: profile.id, updated_at: new Date().toISOString() }
        return next
      }
      return [...prev, {
        id: `${monthId}-${itemId}-${day}`,
        month_id: monthId, item_id: itemId, day, value,
        updated_at: new Date().toISOString(), updated_by: profile.id
      }]
    })
  }, [monthId, profile])

  // Build a lookup map: item_id + day → value
  const entryMap = useCallback((itemId: string, day: number): PlanillaValue | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === day)
    return e?.value ?? null
  }, [entries])

  return { entries, loading, setValue, entryMap, reload: load }
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

  // Create an alert (for supervisor use)
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
