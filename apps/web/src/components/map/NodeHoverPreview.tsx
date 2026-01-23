'use client';

/* eslint-disable -- False positives from React Compiler plugin for valid renderToStaticMarkup pattern */

import { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as LucideIcons from 'lucide-react';
import { getTierColor, getTierIcon, getTierLabel } from '@/lib/theme-colors';
import { getAccentColor } from '@/lib/theme-utils';
import type { NodeWithProfile } from '@atlasp2p/types';

interface NodeHoverPreviewProps {
  node: NodeWithProfile;
}

// Convert kebab-case to PascalCase for icon lookup
function iconNameToComponent(iconName: string): any {
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  return (LucideIcons as any)[pascalCase];
}

export default function NodeHoverPreview({ node }: NodeHoverPreviewProps) {
  const tierColor = getTierColor(node.tier, node.status);
  const tierIconName = getTierIcon(node.tier);
  const tierLabel = getTierLabel(node.tier);

  // Format uptime percentage
  const uptimeDisplay = node.uptime !== null ? `${node.uptime.toFixed(1)}%` : 'N/A';

  // Get country flag emoji (using Unicode regional indicators)
  const countryFlag = useMemo(() => {
    if (!node.countryCode || node.countryCode.length !== 2) return '';
    try {
      const codePoints = node.countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch (e) {
      return '';
    }
  }, [node.countryCode]);

  // Get tier icon component
  const TierIconComponent = iconNameToComponent(tierIconName);

  // Status icon and color
  const statusIcon = node.status === 'up' ? 'CheckCircle' : node.status === 'reachable' ? 'AlertCircle' : 'XCircle';
  const StatusIconComponent = (LucideIcons as any)[statusIcon];
  const statusColor = node.status === 'up' ? '#22c55e' : node.status === 'reachable' ? '#f59e0b' : '#ef4444';

  return (
    <div
      className="min-w-[180px] max-w-[220px] sm:min-w-[240px] sm:max-w-[280px] bg-card rounded-xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md pointer-events-none z-[1000] text-[11px] sm:text-[13px] leading-snug"
      style={{
        border: `2px solid ${tierColor}`,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Header with IP and status */}
      <div className="mb-2 sm:mb-2.5 border-b border-border pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-xs sm:text-sm text-card-foreground truncate flex-1">
            {node.displayName || `${node.ip}:${node.port}`}
          </div>
          {StatusIconComponent && (
            <div
              className="inline-flex items-center ml-2 flex-shrink-0"
              dangerouslySetInnerHTML={{
                __html: renderToStaticMarkup(
                  <StatusIconComponent size={14} color={statusColor} strokeWidth={2.5} />
                ),
              }}
            />
          )}
        </div>
        {node.displayName && (
          <div className="text-[9px] sm:text-[11px] text-muted-foreground truncate">
            {node.ip}:{node.port}
          </div>
        )}
      </div>

      {/* Tier info */}
      <div className="flex items-center mb-2 gap-1.5 sm:gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-1">
          {TierIconComponent && (
            <div
              className="inline-flex items-center flex-shrink-0"
              dangerouslySetInnerHTML={{
                __html: renderToStaticMarkup(
                  <TierIconComponent
                    size={14}
                    color={tierColor}
                    strokeWidth={2.5}
                    fill={node.tier === 'diamond' ? tierColor : 'none'}
                  />
                ),
              }}
            />
          )}
          <span className="font-semibold text-[11px] sm:text-[13px]" style={{ color: tierColor }}>
            {tierLabel}
          </span>
        </div>
        {node.isVerified && (
          <div className="bg-blue-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-semibold flex items-center gap-1 flex-shrink-0">
            <div
              dangerouslySetInnerHTML={{
                __html: renderToStaticMarkup(
                  <LucideIcons.BadgeCheck size={10} color="white" strokeWidth={2.5} />
                ),
              }}
            />
            <span className="hidden sm:inline">Verified</span>
            <span className="sm:hidden">✓</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2">
        {/* Country */}
        <div className="flex flex-col">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">Country</div>
          <div className="font-semibold text-card-foreground text-[10px] sm:text-xs flex items-center gap-1">
            {countryFlag && <span>{countryFlag}</span>}
            <span>{node.countryCode || '??'}</span>
          </div>
        </div>

        {/* Uptime */}
        <div className="flex flex-col">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">Uptime</div>
          <div
            className="font-semibold text-[10px] sm:text-xs"
            style={{ color: node.uptime >= 99 ? '#22c55e' : node.uptime >= 95 ? '#f59e0b' : '#ef4444' }}
          >
            {uptimeDisplay}
          </div>
        </div>

        {/* Version */}
        <div className="flex flex-col">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">Version</div>
          <div className="font-semibold text-card-foreground text-[10px] sm:text-xs truncate">
            {node.clientVersion || node.version || '?'}
          </div>
        </div>

        {/* Latency */}
        <div className="flex flex-col">
          <div className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5">Latency</div>
          <div
            className="font-semibold text-[10px] sm:text-xs"
            style={{ color: node.latencyAvg && node.latencyAvg < 100 ? '#22c55e' : node.latencyAvg && node.latencyAvg < 300 ? '#f59e0b' : '#ef4444' }}
          >
            {node.latencyAvg ? `${Math.round(node.latencyAvg)}ms` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-2 pt-2 border-t border-border">
        Click for details
      </div>
    </div>
  );
}
