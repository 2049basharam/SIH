import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet, Download } from 'lucide-react';

const Reports: React.FC = () => {
  const { token } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  const triggerDownload = (reportType: string) => {
    // We can open a window or trigger a browser download with token attached as query param or via anchor click.
    // Since our backend /api/coordinator/reports checks bearer token, we can construct the URL.
    // If the browser opens it, they need to authenticate. To make it extremely simple, we can fetch it via axios and trigger local download, or append the token!
    // Let's implement dynamic download using an inline fetch that creates an object URL. That is extremely clean and works with the token!
    const downloadReport = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/coordinator/reports?type=${reportType}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sih_report_${reportType}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert('Failed to download report. Ensure session is active.');
      }
    };
    downloadReport();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
          <FileSpreadsheet size={22} color="var(--color-primary)" />
          Export Administrative Reports
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          Download spreadsheet reports containing real-time student registry and team status data.
        </p>
      </div>

      <div className="grid-3">
        {/* Card 1 */}
        <div className="card" style={styles.card}>
          <div style={styles.iconWrapper}>
            <FileSpreadsheet size={28} color="var(--color-primary)" />
          </div>
          <h3 style={{ fontSize: '1.15rem' }}>All Teams Report</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Exports a list of all formed teams, their leaders, members counts, selected problem codes, and current evaluation scores.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => triggerDownload('all-teams')}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        {/* Card 2 */}
        <div className="card" style={styles.card}>
          <div style={styles.iconWrapper}>
            <FileSpreadsheet size={28} color="var(--color-secondary)" />
          </div>
          <h3 style={{ fontSize: '1.15rem' }}>Registered Students</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Exports a directory of all registered students, their departments, contact details, year of study, and assigned team names.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => triggerDownload('students')}>
            <Download size={14} /> Download CSV
          </button>
        </div>

        {/* Card 3 */}
        <div className="card" style={styles.card}>
          <div style={styles.iconWrapper}>
            <FileSpreadsheet size={28} color="var(--color-success)" />
          </div>
          <h3 style={{ fontSize: '1.15rem' }}>Shortlisted Teams</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
            Exports a list of teams that have been nominated for waitlisting or final shortlisting, along with average scores.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => triggerDownload('shortlisted')}>
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1rem',
    minHeight: '260px',
    padding: '2rem 1.5rem',
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.02)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }
};

export default Reports;
