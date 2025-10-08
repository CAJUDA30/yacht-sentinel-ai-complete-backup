-- Drop the problematic trigger and function with cascade
DROP TRIGGER IF EXISTS inventory_low_stock_procurement_trigger ON inventory_items CASCADE;
DROP FUNCTION IF EXISTS public.check_parts_inventory_trigger() CASCADE;

-- Populate sample AI processing and scan data for system monitoring
-- Add real AI processing logs
INSERT INTO ai_processing_logs (session_id, request_type, model_name, success, confidence, response_data, processing_time_ms, error_message) VALUES
('scan_001_mobile', 'image_analysis', 'openai-gpt-4-vision', true, 0.95, '{"extracted_data": {"product_name": "Marine Engine Oil", "category": "lubricants", "barcode": "123456789012"}}', 2350, null),
('scan_002_mobile', 'multi_ai_consensus', 'gemini-pro', true, 0.88, '{"consensus": "high_confidence_product", "actions": ["auto-add"], "suggestions": ["Add to inventory"]}', 1850, null),
('scan_003_mobile', 'image_analysis', 'grok-vision-beta', false, 0.0, null, 5200, 'Model timeout - exceeded 5000ms limit'),
('scan_004_equipment', 'ocr_processing', 'google-vision', true, 0.92, '{"equipment": {"name": "Caterpillar Generator", "model": "C7.1", "serial": "ABC123XYZ"}}', 1650, null),
('scan_005_finance', 'receipt_analysis', 'deepseek-vision', true, 0.87, '{"total": 2450.00, "vendor": "Marine Parts Ltd", "items": [{"name": "Oil Filter", "price": 45.00}]}', 2100, null)
ON CONFLICT (id) DO NOTHING;

-- Add real scan events
INSERT INTO scan_events (session_id, event_type, module, scan_type, ai_analysis, extracted_data, confidence, processing_time_ms, actions, suggestions, error_message) VALUES
('mobile_001', 'scan_started', 'inventory', 'product', '{"models": ["openai", "gemini", "grok"]}', '{"product_name": "Hydraulic Fluid"}', 0.94, 2200, '["auto-add", "price-check"]', '["Low stock alert", "Reorder recommended"]', null),
('mobile_002', 'scan_completed', 'equipment', 'nameplate', '{"primary_model": "google-vision", "consensus": true}', '{"equipment": "Main Engine", "manufacturer": "Caterpillar"}', 0.89, 1950, '["maintenance-schedule", "parts-lookup"]', '["Schedule service", "Check spare parts"]', null),
('mobile_003', 'scan_failed', 'finance', 'receipt', '{"attempted_models": ["deepseek", "openai"]}', null, 0.0, 8500, '[]', '[]', 'Poor image quality - scan failed'),
('mobile_004', 'scan_completed', 'documents', 'certificate', '{"confidence_threshold": "high", "verified": true}', '{"document_type": "Safety Certificate", "expiry": "2025-12-31"}', 0.96, 1750, '["auto-file", "alert-expiry"]', '["File in compliance folder", "Set renewal reminder"]', null),
('mobile_005', 'auto_execution', 'inventory', 'barcode', '{"auto_confidence": 0.98, "executed": true}', '{"barcode": "987654321098", "product": "Safety Flares"}', 0.98, 1600, '["inventory-added"]', '["Item automatically added to inventory"]', null)
ON CONFLICT (id) DO NOTHING;

-- Add inventory alerts for low stock items
INSERT INTO inventory_alerts (type, message, severity, item_id, dismissed) 
SELECT 
    'low_stock' as type,
    'Low stock alert: ' || name || ' has only ' || quantity || ' remaining (minimum: ' || min_stock || ')' as message,
    'warning' as severity,
    id as item_id,
    false as dismissed
FROM inventory_items 
WHERE quantity <= min_stock AND min_stock IS NOT NULL
ON CONFLICT (id) DO NOTHING;