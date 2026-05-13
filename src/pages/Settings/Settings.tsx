import React, { useState } from 'react';
import { PageHeader, Card, Input, Button, Icon } from '../../components';
import { useTheme } from '../../hooks';
import { SettingToggle } from './components/SettingToggle';

export const Settings: React.FC = () => {
  const [centerName, setCenterName] = useState('ESL English Center');
  const [addr, setAddr] = useState('123 Nguyễn Huệ, Q.1, TP.HCM');
  const [phone, setPhone] = useState('028 1234 5678');
  const [email, setEmail] = useState('info@esl.edu.vn');
  const { mode, toggle } = useTheme();

  return (
    <div>
      <PageHeader title="Cài đặt hệ thống" subtitle="Quản lý thông tin trung tâm và cấu hình" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        <Card animate>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="building" size={18} /> Thông tin trung tâm
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Tên trung tâm" value={centerName} onChange={setCenterName} />
            <Input label="Địa chỉ" value={addr} onChange={setAddr} />
            <Input label="Số điện thoại" value={phone} onChange={setPhone} />
            <Input label="Email" value={email} onChange={setEmail} />
            <div style={{ alignSelf: 'flex-end' }}>
              <Button icon="check">
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>

        <Card animate delay={80}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="settings" size={18} /> Cấu hình chung
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SettingToggle label="Chế độ tối / Dark mode" desc="Chuyển giao diện sang theme tối" on={mode === 'dark'} onToggle={toggle} />
            <SettingToggle label="Gửi thông báo qua Email" desc="Tự động gửi email nhắc học phí" on={true} />
            <SettingToggle label="Gửi thông báo qua SMS" desc="Gửi tin nhắn nhắc lịch học" on={false} />
            <SettingToggle label="Tự động tạo báo cáo" desc="Tạo báo cáo tháng vào ngày 1" on={true} />
            <SettingToggle label="Cho phép đăng ký online" desc="Học viên đăng ký qua website" on={true} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
