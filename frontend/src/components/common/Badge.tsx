import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'md' }) => {
  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} tracking-wide shadow-sm`}
    >
      {children}
    </span>
  );
};

export function getStatusBadge(status: string | undefined) {
  if (!status) return <Badge variant="neutral">N/A</Badge>;
  const s = status.toUpperCase();

  if (['PASSED', 'VERIFIED', 'CLOSED', 'COMPLETED', 'ACTIVE', 'APPROVED', 'RESOLVED'].includes(s)) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (['FAILED', 'CRITICAL', 'REJECTED', 'SCRAPPED', 'SUSPENDED', 'HIGH'].includes(s)) {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (['PENDING', 'PENDING_VERIFICATION', 'IN_PROGRESS', 'QUARANTINED', 'MEDIUM', 'WARNING'].includes(s)) {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (['OPEN', 'INVESTIGATING', 'SCHEDULED', 'DRAFT', 'LOW'].includes(s)) {
    return <Badge variant="info">{status}</Badge>;
  }

  return <Badge variant="neutral">{status}</Badge>;
}
