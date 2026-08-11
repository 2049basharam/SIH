import React, { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../api';

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  gender: string;
  department: string;
  branch: string;
  year: number;
  phone: string;
}

const Students: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/coordinator/students'); // uses college filtered coordinator endpoint
        setStudents(res.data);
      } catch (err) {
        showToast('Failed to retrieve students roster', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>College Students Roster</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Overview of all verified student profiles registered for SIH internal selections.
        </p>
      </div>

      {loading ? (
        <div>Retrieving students roster...</div>
      ) : students.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No students registered under your institution yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Student ID (Roll)</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>Department</th>
                <th>Branch</th>
                <th>Academic Year</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.student_id}</td>
                  <td>{s.full_name}</td>
                  <td>{s.gender}</td>
                  <td>{s.department}</td>
                  <td>{s.branch}</td>
                  <td>Year {s.year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Students;
