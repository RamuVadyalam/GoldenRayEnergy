import { supabaseAdmin } from '../config/supabase.js';

export const PROJECT_STAGES = ['new', 'design', 'selling', 'installation', 'maintenance', 'exit'];

export async function generateProjectCode() {
  const year = new Date().getFullYear();
  const { count, error } = await supabaseAdmin
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .like('code', `GR-${year}-%`);
  if (error) throw error;
  return `GR-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
}

// Create a project for a new website enquiry. Called from /api/quote/submit.
export async function createProjectFromEnquiry({ form, calculation, contactId, systemType }) {
  const code = await generateProjectCode();

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      code,
      customer_id:     contactId,
      stage:           'new',
      address:         form.address || null,
      system_size_kw:  calculation?.systemSize  || null,
      panels:          calculation?.panels      || null,
      battery_kwh:     calculation?.batteryKwh  || null,
      system_type:     systemType               || null,
      estimated_value: calculation?.totalCost   || null,
      notes:           form.installationType ? `Installation: ${form.installationType}${form.batteryOption ? ` · Battery: ${form.batteryOption}` : ''}` : null,
    })
    .select('id, code')
    .single();
  if (error) throw error;
  return data;
}
