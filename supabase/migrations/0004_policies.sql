-- ===========================================
-- ATLASP2P - ROW LEVEL SECURITY POLICIES
-- ===========================================
-- Access control for all tables
-- ===========================================

-- ============================================
-- AUTH FUNCTIONS - DELEGATED TO GOTRUE
-- ============================================
-- GoTrue (auth container) creates these functions:
--   - auth.uid() → Current user's UUID
--   - auth.role() → Current user's role
--   - auth.email() → Current user's email
--
-- Our RLS policies reference these functions, but we DO NOT
-- create them here to avoid ownership conflicts.
--
-- PostgreSQL allows policies to reference functions that will
-- exist when the policies are actually used. GoTrue creates
-- these functions during its initialization, which runs
-- concurrently with our migrations.
-- ============================================

-- Nodes
DROP POLICY IF EXISTS "Nodes are viewable by everyone" ON nodes;
CREATE POLICY "Nodes are viewable by everyone" ON nodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage nodes" ON nodes;
CREATE POLICY "Service role can manage nodes" ON nodes FOR ALL USING (auth.role() = 'service_role');

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON node_profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON node_profiles FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can view own profiles" ON node_profiles;
CREATE POLICY "Users can view own profiles" ON node_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profiles" ON node_profiles;
CREATE POLICY "Users can update own profiles" ON node_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own profiles" ON node_profiles;
CREATE POLICY "Users can insert own profiles" ON node_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own profiles" ON node_profiles;
CREATE POLICY "Users can delete own profiles" ON node_profiles FOR DELETE USING (auth.uid() = user_id);

-- Tip Configs
DROP POLICY IF EXISTS "Active tip configs are viewable by everyone" ON node_tip_configs;
CREATE POLICY "Active tip configs are viewable by everyone" ON node_tip_configs FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Users can view own tip configs" ON node_tip_configs;
CREATE POLICY "Users can view own tip configs" ON node_tip_configs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tip configs" ON node_tip_configs;
CREATE POLICY "Users can insert own tip configs" ON node_tip_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tip configs" ON node_tip_configs;
CREATE POLICY "Users can update own tip configs" ON node_tip_configs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tip configs" ON node_tip_configs;
CREATE POLICY "Users can delete own tip configs" ON node_tip_configs FOR DELETE USING (auth.uid() = user_id);

-- Tips
DROP POLICY IF EXISTS "Tips are viewable by everyone" ON tips;
CREATE POLICY "Tips are viewable by everyone" ON tips FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert tips" ON tips;
CREATE POLICY "Anyone can insert tips" ON tips FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service role can manage tips" ON tips;
CREATE POLICY "Service role can manage tips" ON tips FOR ALL USING (auth.role() = 'service_role');

-- Verifications
DROP POLICY IF EXISTS "Users can view own verifications" ON verifications;
CREATE POLICY "Users can view own verifications" ON verifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create verifications" ON verifications;
CREATE POLICY "Users can create verifications" ON verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own verifications" ON verifications;
CREATE POLICY "Users can update own verifications" ON verifications FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "Users can delete own pending verifications" ON verifications;
CREATE POLICY "Users can delete own pending verifications" ON verifications FOR DELETE USING (auth.uid() = user_id AND status IN ('pending', 'pending_approval'));
DROP POLICY IF EXISTS "Service role can manage verifications" ON verifications;
CREATE POLICY "Service role can manage verifications" ON verifications FOR ALL USING (auth.role() = 'service_role');

-- Verified Nodes
DROP POLICY IF EXISTS "Verified nodes are viewable by everyone" ON verified_nodes;
CREATE POLICY "Verified nodes are viewable by everyone" ON verified_nodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage verified nodes" ON verified_nodes;
CREATE POLICY "Service role can manage verified nodes" ON verified_nodes FOR ALL USING (auth.role() = 'service_role');

-- Snapshots
DROP POLICY IF EXISTS "Snapshots are viewable by everyone" ON snapshots;
CREATE POLICY "Snapshots are viewable by everyone" ON snapshots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage snapshots" ON snapshots;
CREATE POLICY "Service role can manage snapshots" ON snapshots FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Node snapshots are viewable by everyone" ON node_snapshots;
CREATE POLICY "Node snapshots are viewable by everyone" ON node_snapshots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage node snapshots" ON node_snapshots;
CREATE POLICY "Service role can manage node snapshots" ON node_snapshots FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Network history is viewable by everyone" ON network_history;
CREATE POLICY "Network history is viewable by everyone" ON network_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage network history" ON network_history;
CREATE POLICY "Service role can manage network history" ON network_history FOR ALL USING (auth.role() = 'service_role');

-- Admin
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
CREATE POLICY "Super admins can manage admin users" ON admin_users FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true));

DROP POLICY IF EXISTS "Admins can view banned users" ON banned_users;
CREATE POLICY "Admins can view banned users" ON banned_users FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage banned users" ON banned_users;
CREATE POLICY "Admins can manage banned users" ON banned_users FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view moderation queue" ON moderation_queue;
CREATE POLICY "Admins can view moderation queue" ON moderation_queue FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage moderation queue" ON moderation_queue;
CREATE POLICY "Admins can manage moderation queue" ON moderation_queue FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can insert audit log" ON audit_log;
CREATE POLICY "Admins can insert audit log" ON audit_log FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits" ON rate_limits FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Everyone can view active default avatars" ON default_avatars;
CREATE POLICY "Everyone can view active default avatars" ON default_avatars FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage default avatars" ON default_avatars;
CREATE POLICY "Admins can manage default avatars" ON default_avatars FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Everyone can view public admin settings" ON admin_settings;
CREATE POLICY "Everyone can view public admin settings" ON admin_settings FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Admins can view all admin settings" ON admin_settings;
CREATE POLICY "Admins can view all admin settings" ON admin_settings FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage admin settings" ON admin_settings;
CREATE POLICY "Admins can manage admin settings" ON admin_settings FOR ALL USING (is_admin());

-- Alerts
DROP POLICY IF EXISTS "Users can view own alert subscriptions" ON alert_subscriptions;
CREATE POLICY "Users can view own alert subscriptions" ON alert_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own alert subscriptions" ON alert_subscriptions;
CREATE POLICY "Users can manage own alert subscriptions" ON alert_subscriptions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own alert history" ON alert_history;
CREATE POLICY "Users can view own alert history" ON alert_history FOR SELECT USING (auth.uid() = (SELECT user_id FROM alert_subscriptions WHERE id = alert_history.subscription_id));
DROP POLICY IF EXISTS "Service role can manage alert history" ON alert_history;
CREATE POLICY "Service role can manage alert history" ON alert_history FOR ALL USING (auth.role() = 'service_role');

-- API Keys
DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
CREATE POLICY "Users can view own API keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own API keys" ON api_keys;
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own API key usage" ON api_key_usage;
CREATE POLICY "Users can view own API key usage" ON api_key_usage FOR SELECT USING (auth.uid() = (SELECT user_id FROM api_keys WHERE id = api_key_usage.key_id));
DROP POLICY IF EXISTS "Service role can manage API key usage" ON api_key_usage;
CREATE POLICY "Service role can manage API key usage" ON api_key_usage FOR ALL USING (auth.role() = 'service_role');

