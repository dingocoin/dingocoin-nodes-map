-- Add unsubscribe token to alert_subscriptions
-- This allows users to unsubscribe from email alerts via a link without logging in

-- Add the unsubscribe_token column
ALTER TABLE alert_subscriptions
ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT UNIQUE;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_unsubscribe_token
ON alert_subscriptions(unsubscribe_token)
WHERE unsubscribe_token IS NOT NULL;

-- Generate tokens for existing subscriptions that don't have one
UPDATE alert_subscriptions
SET unsubscribe_token = encode(gen_random_bytes(32), 'hex')
WHERE unsubscribe_token IS NULL;

-- Add NOT NULL constraint after populating existing rows
-- (We do this separately to allow the UPDATE to complete first)
-- Note: New rows will get tokens from the API layer
