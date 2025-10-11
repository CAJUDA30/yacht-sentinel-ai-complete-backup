-- Create yacht-documents storage bucket for yacht document uploads
-- This migration ensures the storage bucket exists for the yacht onboarding document uploads

-- Create storage bucket for yacht documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'yacht-documents',
  'yacht-documents',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for yacht documents bucket
-- Users can upload documents for yachts they have access to
CREATE POLICY "Users can upload yacht documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'yacht-documents' AND
  auth.uid() IS NOT NULL
);

-- Users can view documents for yachts they have access to
CREATE POLICY "Users can view yacht documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'yacht-documents' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own uploaded documents
CREATE POLICY "Users can update their yacht documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'yacht-documents' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()
);

-- Users can delete their own uploaded documents
CREATE POLICY "Users can delete their yacht documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'yacht-documents' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_storage_objects_yacht_documents 
ON storage.objects(bucket_id, name) 
WHERE bucket_id = 'yacht-documents';

-- Insert some sample folder structure
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
VALUES 
  ('yacht-documents', 'templates/', null, '{"type": "folder"}'),
  ('yacht-documents', 'templates/registration/', null, '{"type": "folder"}'),
  ('yacht-documents', 'templates/insurance/', null, '{"type": "folder"}'),
  ('yacht-documents', 'templates/safety/', null, '{"type": "folder"}')
ON CONFLICT (bucket_id, name) DO NOTHING;