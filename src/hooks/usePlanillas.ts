import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  PlanillaTemplate, PlanillaItem, PlanillaMonth, PlanillaMonthItem,
  PlanillaEntry, PlanillaAlert, PlanillaValue, TimeSlot, Profile, Area,
  PlanillaDocument
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

// ── Items for a specific planilla month (filtered by month_items if assigned) ─
export function usePlanillaItemsForMonth(monthId: string | null, templateId: string | null) {
  const [items, setItems]     = useState<PlanillaItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!templateId || !monthId) { setLoading(false); return }

    // First check if this month has specific item assignments
    const { data: monthItems } = await supabase
      .from('planilla_month_items')
      .select('item_id')
      .eq('month_id', monthId)

    const assignedIds = (monthItems ?? []).map((mi: any) => mi.item_id)

    // Load all active items for this template
    const { data: allItems } = await supabase
      .from('planilla_items')
      .select('*')
      .eq('template_id', templateId)
      .eq('active', true)
      .order('order_index')

    const all = (allItems ?? []) as PlanillaItem[]

    // If specific items are assigned, filter; otherwise show all
    if (assignedIds.length > 0) {
      const idSet = new Set(assignedIds)
      setItems(all.filter(i => idSet.has(i.id)))
    } else {
      setItems(all)
    }
    setLoading(false)
  }, [monthId, templateId])

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

  // Create a new planilla month instance (for multi-area support)
  const createMonth = useCallback(async (
    templateId: string,
    label: string | null,
    areaId: string | null,
    assignedTo: string | null,
    itemIds: string[]
  ) => {
    if (!tenant) return null
    const { data: newMonth, error } = await supabase.from('planilla_months').insert({
      tenant_id:   tenant.id,
      template_id: templateId,
      year,
      month,
      label,
      area_id:     areaId || null,
      assigned_to: assignedTo || null,
      status:      'pending',
    }).select().single()

    if (error || !newMonth) return null

    // Insert item assignments
    if (itemIds.length > 0) {
      await supabase.from('planilla_month_items').insert(
        itemIds.map(itemId => ({ month_id: newMonth.id, item_id: itemId }))
      )
    }

    await load()
    return newMonth
  }, [tenant, year, month, load])

  // Delete a planilla month
  const deleteMonth = useCallback(async (monthId: string) => {
    await supabase.from('planilla_months').delete().eq('id', monthId)
    await load()
  }, [load])

  // Legacy: ensure at least one month per template (backward compat)
  const ensureMonths = useCallback(async (templates: PlanillaTemplate[]) => {
    if (!tenant) return
    for (const tpl of templates) {
      // Only create if no months exist for this template in this period
      const existing = months.filter(m => m.template_id === tpl.id)
      if (existing.length === 0) {
        await supabase.from('planilla_months').insert({
          tenant_id:   tenant.id,
          template_id: tpl.id,
          year,
          month,
          status: 'pending',
        }).select().single()
      }
    }
    await load()
  }, [tenant, year, month, months, load])

  return { months, loading, reload: load, ensureMonths, createMonth, deleteMonth }
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
  // Returns: number (temperature) | 'C' (closed – cerrado) | null (no entry)
  const tempMap = useCallback((itemId: string, day: number, timeSlot: TimeSlot): number | 'C' | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === day && e.time_slot === timeSlot)
    if (!e) return null
    if (e.value === 'C') return 'C'
    return e.numeric_value ?? null
  }, [entries])

  // Mark a temperature slot as "Cerrado" (closed day – counts as compliant)
  const setTempClosed = useCallback(async (itemId: string, day: number, timeSlot: TimeSlot) => {
    if (!monthId || !profile) return
    await supabase.from('planilla_entries').upsert(
      {
        month_id: monthId, item_id: itemId, day,
        value: 'C', time_slot: timeSlot, numeric_value: null,
        updated_by: profile.id, updated_at: new Date().toISOString()
      },
      { onConflict: 'month_id,item_id,day,time_slot' }
    )
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === itemId && e.day === day && e.time_slot === timeSlot)
      const updated: PlanillaEntry = {
        id: idx >= 0 ? prev[idx].id : `${monthId}-${itemId}-${day}-${timeSlot}`,
        month_id: monthId, item_id: itemId, day,
        value: 'C', time_slot: timeSlot, numeric_value: null,
        updated_at: new Date().toISOString(), updated_by: profile.id
      }
      if (idx >= 0) {
        const next = [...prev]; next[idx] = updated; return next
      }
      return [...prev, updated]
    })
  }, [monthId, profile])

  // Upsert a compliance_mt cell (C/NC/CL with time slot for morning/afternoon)
  const setComplianceMTValue = useCallback(async (
    itemId: string,
    day: number,
    timeSlot: TimeSlot,
    value: PlanillaValue | null
  ) => {
    if (!monthId || !profile) return
    await supabase.from('planilla_entries').upsert(
      {
        month_id: monthId, item_id: itemId, day,
        value, time_slot: timeSlot, numeric_value: null,
        updated_by: profile.id, updated_at: new Date().toISOString()
      },
      { onConflict: 'month_id,item_id,day,time_slot' }
    )
    setEntries(prev => {
      const idx = prev.findIndex(e => e.item_id === itemId && e.day === day && e.time_slot === timeSlot)
      const updated: PlanillaEntry = {
        id: idx >= 0 ? prev[idx].id : `${monthId}-${itemId}-${day}-${timeSlot}`,
        month_id: monthId, item_id: itemId, day,
        value, time_slot: timeSlot, numeric_value: null,
        updated_at: new Date().toISOString(), updated_by: profile.id
      }
      if (idx >= 0) {
        const next = [...prev]; next[idx] = updated; return next
      }
      return [...prev, updated]
    })
  }, [monthId, profile])

  // Lookup: compliance_mt entry by slot (returns PlanillaValue or null)
  const complianceMTMap = useCallback((itemId: string, day: number, slot: TimeSlot): PlanillaValue | null => {
    const e = entries.find(e => e.item_id === itemId && e.day === day && e.time_slot === slot)
    return (e?.value as PlanillaValue) ?? null
  }, [entries])

  return { entries, loading, setValue, setNumericValue, setTempClosed, setComplianceMTValue, entryMap, tempMap, complianceMTMap, reload: load }
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

// ── Update label on a planilla month ─────────────────────────────────────────
export async function updatePlanillaMonthLabel(monthId: string, label: string | null) {
  return supabase.from('planilla_months').update({ label }).eq('id', monthId)
}

// ── Planilla documents (file uploads for requires_document items) ─────────────
export function usePlanillaDocuments(monthId: string | null) {
  const { tenant, profile } = useAuth()
  const [documents, setDocuments] = useState<PlanillaDocument[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    if (!monthId) { setLoading(false); return }
    const { data } = await supabase
      .from('planilla_documents')
      .select('*')
      .eq('month_id', monthId)
    setDocuments((data ?? []) as PlanillaDocument[])
    setLoading(false)
  }, [monthId])

  useEffect(() => { load() }, [load])

  // Upload a file and create the planilla_documents record
  const uploadDocument = useCallback(async (
    itemId: string,
    file: File
  ): Promise<PlanillaDocument | null> => {
    if (!monthId || !tenant || !profile) return null

    const ext       = file.name.split('.').pop() ?? 'bin'
    const filePath  = `${tenant.id}/${monthId}/${itemId}.${ext}`
    const fileType  = file.type.startsWith('image/') ? 'image' : 'pdf'

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('planilla-docs')
      .upload(filePath, file, { upsert: true })

    if (uploadError) { console.error('Upload error', uploadError); return null }

    // Get public URL (signed URL alternative for private bucket)
    const { data: urlData } = supabase.storage
      .from('planilla-docs')
      .getPublicUrl(filePath)

    const fileUrl = urlData?.publicUrl ?? ''

    // Upsert record in planilla_documents (one per month+item)
    const { data: doc, error: dbError } = await supabase
      .from('planilla_documents')
      .upsert({
        tenant_id:   tenant.id,
        month_id:    monthId,
        item_id:     itemId,
        file_url:    fileUrl,
        file_name:   file.name,
        file_type:   fileType,
        file_size:   file.size,
        uploaded_by: profile.id,
        uploaded_at: new Date().toISOString(),
      }, { onConflict: 'month_id,item_id' })
      .select()
      .single()

    if (dbError) { console.error('DB error', dbError); return null }

    await load()
    return doc as PlanillaDocument
  }, [monthId, tenant, profile, load])

  // Delete a document and its storage file
  const deleteDocument = useCallback(async (docId: string, filePath: string) => {
    await supabase.storage.from('planilla-docs').remove([filePath])
    await supabase.from('planilla_documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }, [])

  // Get document for a specific item
  const getDocForItem = useCallback((itemId: string): PlanillaDocument | null => {
    return documents.find(d => d.item_id === itemId) ?? null
  }, [documents])

  return { documents, loading, uploadDocument, deleteDocument, getDocForItem, reload: load }
}

// ── Months for a date range (used in Fiscalizacion) ──────────────────────────
export function usePlanillaMonthsRange(
  fromYear: number, fromMonth: number,
  toYear:   number, toMonth:   number
) {
  const { tenant } = useAuth()
  const [months, setMonths]   = useState<PlanillaMonth[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    // Build list of (year, month) pairs in range
    const pairs: { year: number; month: number }[] = []
    let y = fromYear, m = fromMonth
    while (y < toYear || (y === toYear && m <= toMonth)) {
      pairs.push({ year: y, month: m })
      m++; if (m > 12) { m = 1; y++ }
      if (pairs.length > 36) break // safety cap
    }

    if (pairs.length === 0) { setMonths([]); setLoading(false); return }

    // Build OR filter
    const filters = pairs.map(p => `and(year.eq.${p.year},month.eq.${p.month})`).join(',')
    const { data } = await supabase
      .from('planilla_months')
      .select('*, template:planilla_templates(*)')
      .eq('tenant_id', tenant.id)
      .or(filters)
      .order('year').order('month').order('created_at')

    setMonths((data ?? []) as PlanillaMonth[])
    setLoading(false)
  }, [tenant, fromYear, fromMonth, toYear, toMonth])

  useEffect(() => { load() }, [load])
  return { months, loading, reload: load }
}

// ── All documents for a tenant (used in Fiscalizacion page) ──────────────────
export function useAllPlanillaDocuments(year: number, month: number) {
  const { tenant } = useAuth()
  const [documents, setDocuments] = useState<(PlanillaDocument & { item_name?: string; template_name?: string })[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    if (!tenant) return
    // Join through planilla_months to filter by tenant + period
    const { data } = await supabase
      .from('planilla_documents')
      .select(`
        *,
        month:planilla_months!inner(
          id, year, month, tenant_id, label,
          template:planilla_templates(name)
        ),
        item:planilla_items(name)
      `)
      .eq('tenant_id', tenant.id)
      .eq('month.year', year)
      .eq('month.month', month)
    setDocuments((data ?? []).map((d: any) => ({
      ...d,
      item_name:     d.item?.name ?? '',
      template_name: d.month?.template?.name ?? '',
    })))
    setLoading(false)
  }, [tenant, year, month])

  useEffect(() => { load() }, [load])

  return { documents, loading, reload: load }
}

// ── Month items (junction table) ─────────────────────────────────────────────
export function usePlanillaMonthItems(monthId: string | null) {
  const [itemIds, setItemIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!monthId) { setLoading(false); return }
    const { data } = await supabase
      .from('planilla_month_items')
      .select('item_id')
      .eq('month_id', monthId)
    setItemIds((data ?? []).map((d: any) => d.item_id))
    setLoading(false)
  }, [monthId])

  useEffect(() => { load() }, [load])

  // Sync: replace all item assignments for this month
  const syncItems = useCallback(async (newItemIds: string[]) => {
    if (!monthId) return
    // Delete all existing
    await supabase.from('planilla_month_items').delete().eq('month_id', monthId)
    // Insert new
    if (newItemIds.length > 0) {
      await supabase.from('planilla_month_items').insert(
        newItemIds.map(itemId => ({ month_id: monthId, item_id: itemId }))
      )
    }
    setItemIds(newItemIds)
  }, [monthId])

  return { itemIds, loading, reload: load, syncItems }
}
