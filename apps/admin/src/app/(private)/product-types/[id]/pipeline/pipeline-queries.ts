import { createClient } from '@/lib/supabase/server'

export type StageTrigger = {
  id: string
  event_type: string
  webhook_url: string
  payload_template: unknown | null
}

export type PipelineStage = {
  id: string
  name: string
  order_num: number
  timeout_unit: string | null
  timeout_value: number | null
  stage_triggers: StageTrigger[]
}

export async function getProductTypePipeline(productTypeId: string): Promise<PipelineStage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposal_stages')
    .select(`
      id,
      name,
      order_num,
      timeout_unit,
      timeout_value,
      stage_triggers(id, event_type, webhook_url, payload_template)
    `)
    .eq('product_type_id', productTypeId)
    .order('order_num')

  if (error) throw error
  return data as PipelineStage[]
}
