'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  ExternalLink,
  Settings,
  MapPin,
  Clock,
  Zap,
  ShieldCheck,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Globe,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { getThemeConfig, getChainConfig } from '@/config';

export const dynamic = 'force-dynamic';

interface VerifiedNode {
  id: string;
  node_id: string;
  user_id: string;
  verified_at: string;
  verification_method: string;
  node?: {
    id: string;
    ip: string;
    port: number;
    status: string;
    version: string;
    country_name: string;
    city: string;
    latency_avg: number;
    uptime_percent: number;
    tier: string;
    pix_score: number;
  };
  profile?: {
    display_name: string;
    description: string;
    avatar_url: string;
    is_public: boolean;
  };
}

interface RegisteredNode {
  id: string;
  ip: string;
  port: number;
  status: string;
  version?: string;
  last_seen?: string;
  registered_by?: string;
}

export default function MyNodesPage() {
  const theme = getThemeConfig();
  const chainConfig = getChainConfig();
  const router = useRouter();
  const [nodes, setNodes] = useState<VerifiedNode[]>([]);
  const [registeredNodes, setRegisteredNodes] = useState<RegisteredNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredLoading, setRegisteredLoading] = useState(true);

  // Registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerIp, setRegisterIp] = useState('');
  const [registerPort, setRegisterPort] = useState(chainConfig.p2pPort?.toString() || '33117');
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [detectingIp, setDetectingIp] = useState(false);

  useEffect(() => {
    fetchMyNodes();
    fetchRegisteredNodes();
  }, []);

  const fetchRegisteredNodes = async () => {
    try {
      const response = await fetch('/api/nodes/register');
      if (response.ok) {
        const data = await response.json();
        setRegisteredNodes(data.nodes || []);
      }
    } catch (err) {
      console.error('Failed to fetch registered nodes:', err);
    } finally {
      setRegisteredLoading(false);
    }
  };

  const detectPublicIp = async () => {
    setDetectingIp(true);
    try {
      // Use a public IP detection service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      if (data.ip) {
        setRegisterIp(data.ip);
      }
    } catch (err) {
      console.error('Failed to detect IP:', err);
      setRegisterError('Could not detect your public IP. Please enter it manually.');
    } finally {
      setDetectingIp(false);
    }
  };

  const handleRegisterNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterError(null);
    setRegisterSuccess(null);

    try {
      const response = await fetch('/api/nodes/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: registerIp.trim(),
          port: parseInt(registerPort, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setRegisterError('This node is already registered in the network.');
        } else if (response.status === 422) {
          setRegisterError(data.error || 'Could not connect to your node. Please ensure it is running and accessible.');
        } else {
          setRegisterError(data.error || 'Failed to register node');
        }
        return;
      }

      setRegisterSuccess('Node registered successfully! The crawler will update its details shortly.');
      setRegisterIp('');
      setRegisterPort(chainConfig.p2pPort?.toString() || '33117');
      setShowRegisterForm(false);
      fetchRegisteredNodes();

      // Clear success message after 5 seconds
      setTimeout(() => setRegisterSuccess(null), 5000);
    } catch (err) {
      setRegisterError('An unexpected error occurred');
    } finally {
      setRegistering(false);
    }
  };

  const fetchMyNodes = async () => {
    try {
      const response = await fetch('/api/my-nodes');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth?redirectTo=/manage/nodes');
          return;
        }
        throw new Error('Failed to fetch nodes');
      }

      const data = await response.json();

      // Transform API response to match our interface
      const transformedNodes: VerifiedNode[] = (data.nodes || []).map((node: any) => ({
        id: node.id,
        node_id: node.id,
        user_id: '', // Not needed for display
        verified_at: node.verifiedAt || '',
        verification_method: node.verificationMethod || '',
        node: {
          id: node.id,
          ip: node.ip,
          port: node.port,
          status: node.status,
          version: node.version,
          country_name: node.countryName,
          city: node.city,
          latency_avg: node.latencyAvg,
          uptime_percent: node.uptime,
          tier: node.tier,
          pix_score: node.pixScore
        },
        profile: node.displayName || node.avatarUrl ? {
          display_name: node.displayName,
          description: node.description,
          avatar_url: node.avatarUrl,
          is_public: node.isPublic
        } : null
      }));

      setNodes(transformedNodes);
    } catch (err) {
      console.error('Failed to fetch nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond': return '#a855f7';
      case 'gold': return '#eab308';
      case 'silver': return '#94a3b8';
      case 'bronze': return '#cd7c32';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: theme.primaryColor }} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Nodes</h1>
          <p className="text-muted-foreground">
            Manage your verified and registered nodes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRegisterForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Register Node
          </button>
          <button
            onClick={() => router.push('/nodes')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify Node
          </button>
        </div>
      </div>

      {/* Success Message */}
      {registerSuccess && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-400">{registerSuccess}</p>
        </div>
      )}

      {/* Register Node Modal */}
      {showRegisterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Register a Node</h2>
                <p className="text-muted-foreground text-sm">
                  For nodes behind NAT/CGNAT that can't be discovered by the crawler
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRegisterForm(false);
                  setRegisterError(null);
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-400 mb-1">How it works</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>We'll probe your node to verify it's running {chainConfig.name}</li>
                    <li>The node will appear on the map once confirmed</li>
                    <li>The crawler will periodically check its status</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleRegisterNode}>
              {/* IP Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Public IP Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={registerIp}
                    onChange={(e) => setRegisterIp(e.target.value)}
                    placeholder="e.g., 203.0.113.45"
                    className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={detectPublicIp}
                    disabled={detectingIp}
                    className="px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-2"
                    title="Detect my IP"
                  >
                    {detectingIp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">Detect</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your node's public IP address (not local/private IPs like 192.168.x.x)
                </p>
              </div>

              {/* Port */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Port
                </label>
                <input
                  type="number"
                  value={registerPort}
                  onChange={(e) => setRegisterPort(e.target.value)}
                  placeholder={chainConfig.p2pPort?.toString() || '33117'}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  min={1}
                  max={65535}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Default {chainConfig.name} port is {chainConfig.p2pPort || 33117}. Use a different port if you've configured port forwarding.
                </p>
              </div>

              {/* Error Message */}
              {registerError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{registerError}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterForm(false);
                    setRegisterError(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering || !registerIp || !registerPort}
                  className="flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {registering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Probing...
                    </>
                  ) : (
                    <>
                      <Server className="h-4 w-4" />
                      Register Node
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registered Nodes Section */}
      {!registeredLoading && registeredNodes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5" style={{ color: theme.primaryColor }} />
            Registered Nodes
            <span className="text-sm font-normal text-muted-foreground">
              ({registeredNodes.length})
            </span>
          </h2>
          <div className="glass-strong rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Node</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Version</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Last Seen</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredNodes.map((node) => (
                    <tr key={node.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-sm font-mono">{node.ip}:{node.port}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          node.status === 'up'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {node.status === 'up' ? (
                            <Wifi className="h-3 w-3" />
                          ) : (
                            <WifiOff className="h-3 w-3" />
                          )}
                          {node.status === 'up' ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {node.version || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {node.last_seen ? new Date(node.last_seen).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/node/${node.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Verified Nodes Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-green-500" />
          Verified Nodes
          <span className="text-sm font-normal text-muted-foreground">
            ({nodes.length})
          </span>
        </h2>

      {/* Verified Nodes List */}
      {nodes.length === 0 ? (
        <div className="glass-strong rounded-xl p-8 text-center">
          <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Verified Nodes Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Verify ownership of a node to manage its profile and display a verified badge.
          </p>
          <button
            onClick={() => router.push('/nodes')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <ShieldCheck className="h-4 w-4" />
            Verify a Node
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {nodes.map((vn) => (
            <div
              key={vn.id}
              className="glass-strong rounded-xl p-6 hover:shadow-lg transition-all duration-200"
            >
              {/* Node Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {vn.profile?.avatar_url ? (
                    <img
                      src={vn.profile.avatar_url}
                      alt="Node avatar"
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primaryColor}20` }}
                    >
                      <Server className="h-6 w-6" style={{ color: theme.primaryColor }} />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {vn.profile?.display_name || (vn.node ? `${vn.node.ip}:${vn.node.port}` : 'Node Unavailable')}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {!vn.node ? (
                        <>
                          <XCircle className="h-4 w-4 text-yellow-500" />
                          <span>Node not found</span>
                        </>
                      ) : vn.node.status === 'up' ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {vn.node?.tier && (
                  <span
                    className="px-2.5 py-1 text-xs font-bold rounded-full uppercase"
                    style={{
                      backgroundColor: `${getTierColor(vn.node.tier)}20`,
                      color: getTierColor(vn.node.tier)
                    }}
                  >
                    {vn.node.tier}
                  </span>
                )}
              </div>

              {/* Node Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </div>
                  <p className="text-sm font-medium truncate">
                    {vn.node?.city || vn.node?.country_name || 'Unknown'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Zap className="h-3 w-3" />
                    Latency
                  </div>
                  <p className="text-sm font-medium">
                    {vn.node?.latency_avg?.toFixed(0) || '—'}ms
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    Uptime
                  </div>
                  <p className="text-sm font-medium">
                    {vn.node?.uptime_percent?.toFixed(1) || '—'}%
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`/node/${vn.node_id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Details
                </button>
                <button
                  onClick={() => router.push(`/my-nodes/${vn.node_id}/edit`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <Settings className="h-4 w-4" />
                  Edit Profile
                </button>
              </div>

              {/* Verified Badge */}
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Verified {new Date(vn.verified_at).toLocaleDateString()} via {vn.verification_method}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Empty State - No nodes at all */}
      {nodes.length === 0 && registeredNodes.length === 0 && !registeredLoading && (
        <div className="glass-strong rounded-xl p-12 text-center">
          <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Nodes Yet</h2>
          <p className="text-muted-foreground mb-6">
            Register your node to get it on the map, or verify an existing node.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowRegisterForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted font-medium transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Register Node
            </button>
            <button
              onClick={() => router.push('/nodes')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <ShieldCheck className="h-5 w-5" />
              Browse Nodes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
