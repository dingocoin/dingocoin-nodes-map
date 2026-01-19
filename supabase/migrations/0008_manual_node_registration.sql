-- Add columns for manual node registration
-- Allows users to register their own nodes when behind NAT/CGNAT

-- Source: 'crawler' (discovered by crawler) or 'manual' (user registered)
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'crawler';

-- User who registered this node (NULL for crawler-discovered nodes)
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups by registered user
CREATE INDEX IF NOT EXISTS idx_nodes_registered_by ON nodes(registered_by) WHERE registered_by IS NOT NULL;

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_nodes_source ON nodes(source);

-- Comment for documentation
COMMENT ON COLUMN nodes.source IS 'How this node was added: crawler (discovered automatically) or manual (user registered)';
COMMENT ON COLUMN nodes.registered_by IS 'User ID who manually registered this node (NULL for crawler-discovered)';
