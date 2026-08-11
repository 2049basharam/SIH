import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { BarChart3, Download } from 'lucide-react';
import api from '../../api';

const Reports: React.FC = () => {
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: string) => {
    setDownloading(type);
    try {
      const res = await api.get(`/spoc/reports?type=${type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sih_report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Report CSV downloaded successfully!', 'success');
    } catch (err) {
      showToast('Failed to download report data', 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>College Selection Reports</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Download spreadsheet-ready selection status files, team details, and student registries.
        </p>
      </div>

      <div className="grid-3" style={{ gap: '1.5rem' }}>
        <div className="card" style={styles.reportCard}>
          <BarChart3 size={28} color="var(--color-primary)" />
          <h4 style={styles.title}>All Registered Teams</h4>
          <p style={styles.desc}>Complete sheet of all student teams, leaders, members count, and status.</p>
          <button 
            onClick={() => handleDownload('all-teams')} 
            className="btn btn-primary" 
            style={styles.downloadBtn}
            disabled={downloading !== null}
          >
            <Download size={16} />
            {downloading === 'all-teams' ? 'Downloading...' : 'Export CSV'}
          </button>
        </div>

        <div className="card" style={styles.reportCard}>
          <BarChart3 size={28} color="#10b981" />
          <h4 style={styles.title}>Registered Students</h4>
          <p style={styles.desc}>Detailed sheet of student names, rolls, genders, departments, and phone numbers.</p>
          <button 
            onClick={() => handleDownload('students')} 
            className="btn btn-primary" 
            style={styles.downloadBtn}
            disabled={downloading !== null}
          >
            <Download size={16} />
            {downloading === 'students' ? 'Downloading...' : 'Export CSV'}
          </button>
        </div>

        <div className="card" style={styles.reportCard}>
          <BarChart3 size={28} color="#6366f1" />
          <h4 style={styles.title}>Shortlisted Teams</h4>
          <p style={styles.desc}>Clean dashboard layout representing all recommended/shortlisted teams for nominations.</p>
          <button 
            onClick={() => handleDownload('shortlisted')} 
            className="btn btn-primary" 
            style={styles.downloadBtn}
            disabled={downloading !== null}
          >
            <Download size={16} />
            {downloading === 'shortlisted' ? 'Downloading...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  reportCard: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: '0.75rem',
  },
  title: {
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginTop: '0.5rem',
  },
  desc: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    minHeight: '40px',
  },
  downloadBtn: {
    marginTop: '1rem',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }
};

export default Reports;
