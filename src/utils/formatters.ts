export const formatDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
};

export const formatCurrency = (amount: number | string): string => {
  if (amount === undefined || amount === null) return '0đ';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
};

export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
};

export const getInitials = (name: string): string => {
  if (!name) return 'AA';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

export const getDayOfWeek = (date: Date): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

export const getTimeString = (date: Date): string => {
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};
