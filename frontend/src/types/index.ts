export interface User {
  id: number;
  email: string;
  full_name: string;
  department?: string;
  is_active: boolean;
  roles: { id: number; name: string; description?: string }[];
}

export interface Product {
  id: number;
  product_id: string;
  name: string;
  sku: string;
  category: string;
  description?: string;
  lifecycle_status: string;
  created_at: string;
  updated_at?: string;
}

export interface Material {
  id: number;
  material_id: string;
  name: string;
  description?: string;
  category: string;
  unit_of_measurement: string;
  lifecycle_status: string;
}

export interface BOMComponent {
  id: number;
  product_id: number;
  material_id: number;
  revision: string;
  component_sequence: number;
  quantity_required: number;
  unit_of_measurement: string;
  is_critical: boolean;
  bom_status: string;
  effective_from: string;
  effective_to?: string;
  product?: Product;
  material?: Material;
}

export interface Supplier {
  id: number;
  supplier_id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  country?: string;
  quality_rating: number;
  status: string;
  total_lots_supplied: number;
  defect_free_percentage: number;
  created_at: string;
}

export interface MaterialLot {
  id: number;
  lot_number: string;
  material_id: number;
  supplier_id: number;
  quantity_received: number;
  quantity_remaining: number;
  unit_of_measurement: string;
  received_date: string;
  expiry_date?: string;
  quarantine_status: string;
  supplier_lot_reference?: string;
  certificate_of_analysis_url?: string;
  material?: Material;
  supplier?: Supplier;
}

export interface ProductionOrder {
  id: number;
  order_id: string;
  product_id: number;
  bom_revision: string;
  planned_quantity: number;
  actual_quantity: number;
  scrap_quantity: number;
  rework_quantity: number;
  production_status: string;
  start_date?: string;
  end_date?: string;
  product?: Product;
}

export interface MaterialConsumption {
  id: number;
  production_order_id: number;
  material_lot_id: number;
  material_id: number;
  consumed_quantity: number;
  unit_of_measurement: string;
  consumed_at: string;
  consumed_by?: string;
  material?: Material;
  material_lot?: MaterialLot;
  production_order?: ProductionOrder;
}

export interface Machine {
  id: number;
  machine_id: string;
  name: string;
  machine_type: string;
  line_location: string;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
}

export interface ProcessStep {
  id: number;
  step_id: string;
  name: string;
  step_sequence: number;
  description?: string;
  estimated_duration_minutes?: number;
}

export interface ProductionStepExecution {
  id: number;
  execution_id: string;
  production_order_id: number;
  process_step_id: number;
  machine_id: number;
  operator_id?: number;
  status: string;
  started_at?: string;
  completed_at?: string;
  parameters_logged?: Record<string, any>;
  machine?: Machine;
  process_step?: ProcessStep;
  production_order?: ProductionOrder;
}

export interface InspectionPlan {
  id: number;
  plan_id: string;
  product_id?: number;
  process_step_id?: number;
  inspection_type: string;
  sample_size_type: string;
  acceptance_quality_limit?: number;
  inspection_parameters?: string;
  is_active: boolean;
  product?: Product;
  process_step?: ProcessStep;
}

export interface InspectionResult {
  id: number;
  inspection_id: string;
  inspection_plan_id: number;
  production_order_id: number;
  inspection_date: string;
  quantity_inspected: number;
  quantity_passed: number;
  quantity_failed: number;
  inspection_status: string;
  inspector: string;
  notes?: string;
  inspection_plan?: InspectionPlan;
  production_order?: ProductionOrder;
}

export interface Defect {
  id: number;
  defect_id: string;
  inspection_id?: number;
  production_order_id?: number;
  material_lot_id?: number;
  machine_id?: number;
  process_step_id?: number;
  defect_category: string;
  severity: string;
  defect_status: string;
  defect_quantity: number;
  description: string;
  detection_date: string;
  suspected_cause?: string;
  confirmed_root_cause?: string;
  resolved_at?: string;
  created_at: string;
  production_order?: ProductionOrder;
  inspection_result?: InspectionResult;
  material_lot?: MaterialLot;
  machine?: Machine;
  process_step?: ProcessStep;
}

export interface DefectContainment {
  id: number;
  containment_id: string;
  defect_id: number;
  containment_type: string;
  affected_quantity: number;
  quarantine_location?: string;
  disposition: string;
  contained_by?: string;
  containment_status: string;
  action_notes?: string;
  created_at: string;
  defect?: Defect;
}

export interface CAPA {
  id: number;
  capa_id: string;
  defect_id: number;
  capa_type: string;
  title: string;
  root_cause_analysis?: string;
  action_plan?: string;
  assigned_to?: string;
  target_completion_date?: string;
  completed_at?: string;
  capa_status: string;
  verification_status: string;
  effectiveness_review_notes?: string;
  closed_at?: string;
  created_at: string;
  defect?: Defect;
}

export interface ExceptionRecord {
  id: number;
  exception_id: string;
  entity_type: string;
  entity_id: string;
  exception_category: string;
  severity: string;
  description: string;
  resolution_status: string;
  identified_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface DashboardKPIs {
  total_products: number;
  total_suppliers: number;
  total_material_lots: number;
  total_production_orders: number;
  total_units_produced: number;
  total_inspections: number;
  total_defects: number;
  overall_defect_rate: number;
  scrap_quantity: number;
  rework_quantity: number;
  open_capa: number;
  pending_verification: number;
  traceability_coverage: number;
  data_quality_exceptions: number;
}

export interface RecentActivity {
  entity_type: string;
  entity_id: string;
  event_type: string;
  description: string;
  performed_by?: string;
  timestamp: string;
}
