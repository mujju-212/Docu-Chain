-- Cleanup script for improperly created generated documents
-- Run this in your PostgreSQL database

-- First, delete documents from the 'Generated' folders in file manager
DELETE FROM documents 
WHERE folder_id IN (
    SELECT id FROM folders WHERE name = 'Generated' AND is_system_folder = true
);

-- Delete all generated documents from the template system
DELETE FROM generated_documents;

-- Verify cleanup
SELECT 'Generated Documents remaining:' as status, COUNT(*) as count FROM generated_documents
UNION ALL
SELECT 'Documents in Generated folders:' as status, COUNT(*) as count 
FROM documents 
WHERE folder_id IN (SELECT id FROM folders WHERE name = 'Generated' AND is_system_folder = true);
