/**
 * Helper to format ISO date strings into Day/Month/Year format.
 * E.g., 2026-08-11T10:39:06Z -> 11/08/2026 or 11/08/2026 10:39
 */
export const formatDate = (dateStr: string | Date | undefined | null, includeTime: boolean = false): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
};
