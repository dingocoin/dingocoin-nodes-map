-- Add metadata column to verifications table
-- This stores process check, port check, and system info for POST-based verification

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'verifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE verifications ADD COLUMN metadata JSONB DEFAULT '{}';

    -- Add GIN index for efficient JSONB queries
    CREATE INDEX idx_verifications_metadata ON verifications USING gin(metadata);

    -- Add comment for documentation
    COMMENT ON COLUMN verifications.metadata IS 'Additional verification data (process check, port check, system info for POST-based verification)';
  END IF;
END $$;

-- Add index for ip_address lookups (for the two-step POST verification)
CREATE INDEX IF NOT EXISTS idx_verifications_ip ON verifications(ip_address) WHERE ip_address IS NOT NULL;

-- Update comment for ip_address column
COMMENT ON COLUMN verifications.ip_address IS 'Request IP address - used for POST-based verification to ensure init and confirm requests come from same IP';
