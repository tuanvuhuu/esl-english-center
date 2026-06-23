import React from 'react';
import { Card, Icon, Badge, FadeIn } from '../../../components';
import { TuitionAlerts as TuitionAlertsType } from '../../../services/dashboard';

interface TuitionAlertsProps {
  data?: TuitionAlertsType | null;
  loading?: boolean;
  onActionClick?: () => void;
}

export const TuitionAlerts: React.FC<TuitionAlertsProps> = ({ data, loading = false, onActionClick }) => {
  if (loading) {
    return (
      <Card animate delay={250}>
        <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
          Đang kiểm tra công nợ học phí...
        </div>
      </Card>
    );
  }

  if (!data || (data.totalPendingCount === 0 && data.totalOverdueCount === 0)) {
    return null; // Không hiển thị nếu không có công nợ nào
  }

  return (
    <FadeIn delay={100}>
      <Card
        style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03))',
          border: '1.5px dashed rgba(239, 68, 68, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            filter: 'blur(20px)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#FEE2E2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="alert" size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: '#EF4444' }}>Nhắc nhở hoàn tất học phí</span>
                {data.totalOverdueCount > 0 && (
                  <Badge variant="error" style={{ fontSize: 10 }}>
                    {data.totalOverdueCount} cần lưu ý
                  </Badge>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '6px 0 0', lineHeight: 1.4 }}>
                Hiện ghi nhận <strong>{data.totalPendingCount + data.totalOverdueCount}</strong> học viên có khoản phí học tập chờ hoàn thiện. Tổng mức phí: <strong>{data.totalPendingAmount.toLocaleString()}đ</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onActionClick}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.25)';
            }}
          >
            Cập nhật học phí
          </button>
        </div>

        {/* Danh sách 3 hóa đơn quá hạn hoặc có số tiền lớn nhất */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 16, borderTop: '1px solid rgba(239, 68, 68, 0.1)', paddingTop: 14 }}>
          {data.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                borderRadius: 10,
                padding: '10px 12px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{a.studentName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{a.className}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: a.status === 'overdue' ? '#EF4444' : 'var(--text-2)' }}>
                  {a.amount.toLocaleString()}đ
                </div>
                <div style={{ fontSize: 10, color: a.status === 'overdue' ? '#EF4444' : 'var(--text-4)', marginTop: 2, fontWeight: a.status === 'overdue' ? 600 : 400 }}>
                  {a.status === 'overdue' ? 'Đang chờ hoàn tất' : `Hạn: ${new Date(a.dueDate).toLocaleDateString('vi-VN')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </FadeIn>
  );
};
