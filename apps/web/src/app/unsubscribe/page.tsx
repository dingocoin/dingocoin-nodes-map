'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail, MailX, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getThemeConfig, getChainConfig } from '@/config';

interface UnsubscribeResult {
  success: boolean;
  message: string;
  nodeInfo?: {
    ip: string;
    port: number;
    name?: string;
  };
}

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const theme = getThemeConfig();
  const chain = getChainConfig();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<UnsubscribeResult | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({
        success: false,
        message: 'Missing unsubscribe token. Please use the link from your email.',
      });
      setLoading(false);
      return;
    }

    // Call the unsubscribe API
    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        setResult(data);
      } catch (error) {
        setResult({
          success: false,
          message: 'Failed to process unsubscribe request. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    };

    unsubscribe();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2
            className="h-12 w-12 animate-spin mx-auto mb-4"
            style={{ color: theme.primaryColor }}
          />
          <p className="text-muted-foreground">Processing your request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          {/* Icon */}
          <div className="mb-6">
            {result?.success ? (
              <div
                className="h-20 w-20 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}20` }}
              >
                <MailX className="h-10 w-10" style={{ color: theme.primaryColor }} />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-full bg-red-500/20 mx-auto flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-2">
            {result?.success ? 'Unsubscribed Successfully' : 'Unsubscribe Failed'}
          </h1>

          {/* Message */}
          <p className="text-muted-foreground mb-6">{result?.message}</p>

          {/* Node Info */}
          {result?.nodeInfo && (
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-1">Node</p>
              <p className="font-mono font-medium">
                {result.nodeInfo.ip}:{result.nodeInfo.port}
              </p>
            </div>
          )}

          {/* Success Info */}
          {result?.success && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6 text-sm text-muted-foreground text-left">
              <p className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                <span>
                  You will no longer receive email alerts for this node. Discord webhook
                  notifications (if configured) are still active.
                </span>
              </p>
              <p className="flex items-start gap-2 mt-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: theme.primaryColor }} />
                <span>
                  To re-enable email alerts or manage all your subscriptions, visit{' '}
                  <Link
                    href="/settings/alerts"
                    className="underline hover:no-underline"
                    style={{ color: theme.primaryColor }}
                  >
                    Alert Settings
                  </Link>
                  .
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Map
            </Link>
            {result?.success && (
              <Link
                href="/settings/alerts"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: theme.primaryColor }}
              >
                Manage Alerts
              </Link>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          {chain.name} Node Monitor
        </p>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
