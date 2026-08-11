import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { 
  RefreshCw, CheckCircle2, Clock, Database 
} from 'lucide-react';
import api from '../../api';

interface SyncLog {
  id: number;
  sync_date: string;
  source: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  fetched: number;
  created: number;
  updated: number;
  unavailable: number;
  duration: number;
  triggered_by: string;
  error_message: string | null;
}

const SihSynchronization: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSyncHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/spoc/problem-statements/sync-history');
      setLogs(res.data);
    } catch (err) {
      showToast('Failed to load sync history log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyncHistory();
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await api.post('/spoc/problem-statements/sync');
      showToast('Synchronization task launched in background!', 'info');
      // Wait 3 seconds then refresh logs
      setTimeout(async () => {
        await fetchSyncHistory();
        setSyncing(false);
        showToast('Sync status updated', 'success');
      }, 3500);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to trigger sync';
      showToast(msg, 'error');
      setSyncing(false);
    }
  };

  // Find last successful synchronization date
  const lastSuccess = logs.find(log => log.status === 'SUCCESS');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>SIH Problem Statements Synchronization</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Schedule or manually pull problem statement additions, updates, or removals from official portals.
        </p>
      </div>

      {/* Control Card */}
      <div className="grid-3" style={{ gap: '1.25rem' }}>
        <div className="card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2rem' }}>
          <div>
            <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Dynamic Selection Controller</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              The portal is configured to fetch from the official Smart India Hackathon webpage. Synchronizing will automatically pull newly published problem statement metadata, versions, and update local indexes without losing historical student mappings.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button 
              onClick={handleSyncNow} 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              disabled={syncing}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Synchronizing Service...' : 'Trigger Sync Now'}
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Uses official source: sih.gov.in
            </span>
          </div>
        </div>

        {/* Sync Summary Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>System Cache Status</h4>
          
          <div style={styles.statusRow}>
            <Clock size={16} color="var(--text-muted)" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Last Sync Status:</strong>{' '}
              {logs[0] ? (
                <span className={`badge ${logs[0].status === 'SUCCESS' ? 'badge-success' : 'badge-danger'}`}>
                  {logs[0].status}
                </span>
              ) : 'Never Synced'}
            </div>
          </div>

          <div style={styles.statusRow}>
            <CheckCircle2 size={16} color="var(--color-success)" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Last Successful Sync:</strong>{' '}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                {lastSuccess ? new Date(lastSuccess.sync_date).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          <div style={styles.statusRow}>
            <Database size={16} color="#3b82f6" />
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Sync Cache Version:</strong>{' '}
              <span className="badge badge-info">SIH 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync History Logs */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Sync History & Performance Logs</h3>
        {loading ? (
          <div>Loading sync ledger logs...</div>
        ) : logs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No synchronization history logs present. Trigger a sync to start caching.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Sync Date</th>
                  <th>Triggered By</th>
                  <th>Status</th>
                  <th>Fetched</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Unavailable</th>
                  <th>Duration</th>
                  <th>Error Log</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {new Date(log.sync_date).toLocaleString()}
                    </td>
                    <td>{log.triggered_by}</td>
                    <td>
                      <span className={`badge ${
                        log.status === 'SUCCESS' ? 'badge-success' : 
                        log.status === 'PENDING' ? 'badge-info' : 'badge-danger'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td>{log.fetched}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{log.created}</td>
                    <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{log.updated}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.unavailable}</td>
                    <td>{log.duration}s</td>
                    <td style={{ maxWidth: '240px', fontSize: '0.75rem', color: 'var(--color-danger)', wordBreak: 'break-all' }}>
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  statusRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  }
};

export default SihSynchronization;
