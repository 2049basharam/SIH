import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck } from 'lucide-react';
import api from '../../api';
import type { AuditLog } from '../../types';
import { formatDate } from '../../utils';

const AuditLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/coordinator/audit-logs');
        setLogs(res.data);
      } catch (err) {
        showToast('Error loading audit log history', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Retrieving action trails...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldCheck size={24} color="var(--color-primary)" />
        <h2>Administrative Audit Log Trail</h2>
      </div>

      <div className="table-container">
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No audit logs recorded in system.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Reason Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>L-{log.id}</td>
                  <td>{formatDate(log.timestamp, true)}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{log.actor_id ? `User #${log.actor_id}` : 'System'}</td>
                  <td>
                    <span className={`badge ${log.actor_role === 'coordinator' ? 'badge-success' : log.actor_role === 'judge' ? 'badge-warning' : 'badge-info'}`}>
                      {log.actor_role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{log.action}</td>
                  <td>{log.entity} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                  <td style={{ fontStyle: 'italic', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.reason || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
