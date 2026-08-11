import React from 'react';
import { ShieldAlert, HelpCircle, RefreshCw, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AIConfidenceBadgeProps {
  level: string; // HIGH, MEDIUM, LOW
  score?: number;
}

export const AIConfidenceBadge: React.FC<AIConfidenceBadgeProps> = ({ level, score }) => {
  const isHigh = level.toUpperCase() === 'HIGH';
  const isMedium = level.toUpperCase() === 'MEDIUM';
  
  let bgColor = 'rgba(239, 68, 68, 0.1)'; // red
  let textColor = '#ef4444';
  let border = '1px solid rgba(239, 68, 68, 0.2)';
  
  if (isHigh) {
    bgColor = 'rgba(34, 197, 94, 0.1)'; // green
    textColor = '#22c55e';
    border = '1px solid rgba(34, 197, 94, 0.2)';
  } else if (isMedium) {
    bgColor = 'rgba(249, 115, 22, 0.1)'; // saffron/orange
    textColor = '#f97316';
    border = '1px solid rgba(249, 115, 22, 0.2)';
  }
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      backgroundColor: bgColor,
      color: textColor,
      border: border,
      textTransform: 'uppercase'
    }}>
      {isHigh ? <CheckCircle2 size={12} /> : isMedium ? <AlertTriangle size={12} /> : <HelpCircle size={12} />}
      Confidence: {level} {score !== undefined && `(${Math.round(score * 100)}%)`}
    </div>
  );
};

interface AIInsightCardProps {
  title: string;
  confidence?: string;
  confidenceScore?: number;
  children: React.ReactNode;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ title, confidence, confidenceScore, children }) => {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
      border: '1px solid rgba(249, 115, 22, 0.12)', // Subtle tricolor saffron hint
      borderLeft: '4px solid var(--color-primary)', // Saffron solid left border
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.02)',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '1rem',
        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--color-primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{title}</span>
        </div>
        {confidence && <AIConfidenceBadge level={confidence} score={confidenceScore} />}
      </div>
      
      <div>{children}</div>
      
      <div style={{
        marginTop: '1rem',
        fontSize: '0.7rem',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <Sparkles size={10} />
        <span>AI-assisted analysis. This is advisory and does not replace human selection authority.</span>
      </div>
    </div>
  );
};

interface AIWarningCardProps {
  message: string;
  severity?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const AIWarningCard: React.FC<AIWarningCardProps> = ({ message, severity = 'MEDIUM' }) => {
  const isHigh = severity === 'HIGH';
  let border = '1px solid rgba(249, 115, 22, 0.2)';
  let bg = 'rgba(249, 115, 22, 0.05)';
  let color = '#f97316';
  
  if (isHigh) {
    border = '1px solid rgba(239, 68, 68, 0.2)';
    bg = 'rgba(239, 68, 68, 0.05)';
    color = '#ef4444';
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: border,
      backgroundColor: bg,
      color: color,
      fontSize: '0.825rem',
      lineHeight: '1.4',
      margin: '0.5rem 0'
    }}>
      <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <span>{message}</span>
    </div>
  );
};

export const AIProcessingIndicator: React.FC<{ message?: string }> = ({ message = 'Analyzing details with AI...' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem',
      textAlign: 'center',
      gap: '12px'
    }}>
      <RefreshCw size={28} className="spin" style={{ color: 'var(--color-primary)' }} />
      <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
};

export const AIUnavailableState: React.FC = () => {
  return (
    <div style={{
      padding: '1.5rem',
      borderRadius: '10px',
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      color: '#64748b',
      fontSize: '0.875rem',
      marginTop: '1rem',
      marginBottom: '1rem'
    }}>
      <Sparkles size={24} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
      <h4 style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>AI Insights Temporarily Unavailable</h4>
      <p style={{ fontSize: '0.8rem' }}>Core Smart India Hackathon portal functionality remains fully operational.</p>
    </div>
  );
};
