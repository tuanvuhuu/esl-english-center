import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Input, Button, Icon, Select, useToast, LoadingSpinner } from '../../components';
import { useTheme } from '../../hooks';
import { SettingToggle } from './components/SettingToggle';
import {
  getSystemSettings,
  saveSystemSetting,
  BANK_OPTIONS,
  DEFAULT_CENTER_SETTINGS,
  DEFAULT_BANK_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  type CenterSettings,
  type BankSettings,
  type GeneralSettings
} from '../../services';

// Helper to remove accents for account holder name preview
const removeAccents = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

export const Settings: React.FC = () => {
  const toast = useToast();
  const { mode, toggle } = useTheme();
  const [loading, setLoading] = useState(true);

  // Center Info state
  const [centerName, setCenterName] = useState('');
  const [addr, setAddr] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [centerSaving, setCenterSaving] = useState(false);

  // Bank (VietQR) state
  const [bankId, setBankId] = useState('');
  const [bankBinId, setBankBinId] = useState('');
  const [customBankId, setCustomBankId] = useState('');
  const [customBankBinId, setCustomBankBinId] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankSaving, setBankSaving] = useState(false);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);

  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        const settings = await getSystemSettings();

        // 1. Center Settings
        const cs: CenterSettings = settings['center_settings'] || DEFAULT_CENTER_SETTINGS;
        setCenterName(cs.name || '');
        setAddr(cs.address || '');
        setPhone(cs.phone || '');
        setEmail(cs.email || '');

        // 2. Bank Settings
        const bs: BankSettings = settings['bank_settings'] || DEFAULT_BANK_SETTINGS;
        const bId = bs.bank_id || '';
        const bBin = bs.bank_bin_id || '';

        const isStandardBank = BANK_OPTIONS.some(o => o.value === bId && o.value !== 'CUSTOM' && o.value !== '');
        if (isStandardBank) {
          setBankId(bId);
          setBankBinId(bBin);
          setCustomBankId('');
          setCustomBankBinId('');
        } else if (bId !== '') {
          setBankId('CUSTOM');
          setCustomBankId(bId);
          setCustomBankBinId(bBin);
        } else {
          setBankId('');
          setBankBinId('');
        }
        setAccountNo(bs.account_no || '');
        setAccountName(bs.account_name || '');

        // 3. General Settings
        const gs: GeneralSettings = settings['general_settings'] || DEFAULT_GENERAL_SETTINGS;
        setGeneralSettings(gs);
      } catch (err: any) {
        console.error(err);
        toast.error('Không thể tải cấu hình hệ thống');
      } finally {
        setLoading(false);
      }
    };

    loadAllSettings();
  }, [toast]);

  const handleSaveCenter = async () => {
    setCenterSaving(true);
    try {
      const payload: CenterSettings = {
        name: centerName.trim(),
        address: addr.trim(),
        phone: phone.trim(),
        email: email.trim()
      };
      await saveSystemSetting('center_settings', payload);
      toast.success('Đã lưu thông tin trung tâm');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu: ' + (err.message || 'Chưa rõ nguyên nhân'));
    } finally {
      setCenterSaving(false);
    }
  };

  const handleSaveBank = async () => {
    const finalBankId = bankId === 'CUSTOM' ? customBankId.trim() : bankId;
    const finalBankBin = bankId === 'CUSTOM' ? customBankBinId.trim() : bankBinId;

    if (finalBankId && (!accountNo.trim() || !accountName.trim())) {
      toast.error('Vui lòng nhập đầy đủ số tài khoản và tên chủ tài khoản');
      return;
    }

    setBankSaving(true);
    try {
      const payload: BankSettings = {
        bank_id: finalBankId,
        bank_bin_id: finalBankBin,
        account_no: accountNo.trim(),
        account_name: removeAccents(accountName.trim()).toUpperCase()
      };
      await saveSystemSetting('bank_settings', payload);
      toast.success('Đã lưu cấu hình tài khoản ngân hàng');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu: ' + (err.message || 'Chưa rõ nguyên nhân'));
    } finally {
      setBankSaving(false);
    }
  };

  const handleToggleSetting = async (key: keyof GeneralSettings) => {
    const updated = {
      ...generalSettings,
      [key]: !generalSettings[key]
    };
    setGeneralSettings(updated);
    try {
      await saveSystemSetting('general_settings', updated);
      toast.success('Đã cập nhật cấu hình hệ thống');
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể cập nhật cấu hình: ' + (err.message || ''));
      // Revert state
      setGeneralSettings(generalSettings);
    }
  };

  const handleBankChange = (value: string) => {
    setBankId(value);
    if (value === 'CUSTOM') {
      setBankBinId('');
      setCustomBankId('');
      setCustomBankBinId('');
    } else {
      const selected = BANK_OPTIONS.find(o => o.value === value);
      const bin = selected ? selected.bin : '';
      setBankBinId(bin);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Đang tải cấu hình cài đặt..." />;
  }

  // Generate VietQR live preview image source
  const currentBankId = bankId === 'CUSTOM' ? customBankId : bankId;
  const showPreview = currentBankId && accountNo && accountName;
  const safeAccountName = removeAccents(accountName).toUpperCase();
  const previewQrSrc = showPreview
    ? `https://img.vietqr.io/image/${currentBankId}-${accountNo}-compact2.png?amount=500000&addInfo=HOCPHI+DEMO&accountName=${encodeURIComponent(safeAccountName)}`
    : '';

  return (
    <div>
      <PageHeader title="Cài đặt hệ thống" subtitle="Quản lý thông tin trung tâm và cấu hình thanh toán" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        {/* Center Info Card */}
        <Card animate>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="building" size={18} /> Thông tin trung tâm
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Tên trung tâm" value={centerName} onChange={setCenterName} />
            <Input label="Địa chỉ" value={addr} onChange={setAddr} />
            <Input label="Số điện thoại" value={phone} onChange={setPhone} />
            <Input label="Email" value={email} onChange={setEmail} />
            <div style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Button icon="check" onClick={handleSaveCenter} loading={centerSaving}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>

        {/* Bank Config (VietQR) Card */}
        <Card animate delay={80}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="wallet" size={18} /> Cấu hình ngân hàng (VietQR)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Select
              label="Ngân hàng thụ hưởng"
              value={bankId}
              onChange={handleBankChange}
              options={BANK_OPTIONS}
            />

            {bankId === 'CUSTOM' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <Input
                  label="Mã ngân hàng (ID)"
                  value={customBankId}
                  onChange={setCustomBankId}
                  placeholder="Ví dụ: VCB, MB, TCB"
                  style={{ flex: 1 }}
                />
                <Input
                  label="Mã BIN ngân hàng"
                  value={customBankBinId}
                  onChange={setCustomBankBinId}
                  placeholder="Ví dụ: 970436"
                  style={{ flex: 1 }}
                />
              </div>
            )}

            <Input
              label="Số tài khoản"
              value={accountNo}
              onChange={setAccountNo}
              placeholder="Nhập số tài khoản ngân hàng"
            />
            
            <Input
              label="Tên chủ tài khoản"
              value={accountName}
              onChange={(val) => setAccountName(val.toUpperCase())}
              placeholder="TEN CHU TAI KHOAN KHONG DAU"
            />

            {/* Live VietQR Preview */}
            <div style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 8,
              background: 'var(--bg-2)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Xem trước mã VietQR</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                  Mã QR này sẽ hiển thị ở cuối biên lai học phí để phụ huynh quét thanh toán nhanh.
                </div>
              </div>
              {showPreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={previewQrSrc}
                    alt="VietQR Preview"
                    style={{
                      width: 84,
                      height: 84,
                      objectFit: 'contain',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      background: '#fff',
                      padding: 2
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  width: 84,
                  height: 84,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed var(--border)',
                  borderRadius: 6,
                  fontSize: 10,
                  color: 'var(--text-4)',
                  textAlign: 'center',
                  background: 'var(--bg-1)',
                  padding: 4,
                  boxSizing: 'border-box'
                }}>
                  Chưa đủ cấu hình
                </div>
              )}
            </div>

            <div style={{ alignSelf: 'flex-end', marginTop: 8 }}>
              <Button icon="check" onClick={handleSaveBank} loading={bankSaving}>
                Lưu tài khoản
              </Button>
            </div>
          </div>
        </Card>

        {/* General Settings Card */}
        <Card animate delay={160}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="settings" size={18} /> Cấu hình chung
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SettingToggle
              label="Chế độ tối / Dark mode"
              desc="Chuyển giao diện sang theme tối"
              on={mode === 'dark'}
              onToggle={toggle}
            />
            <SettingToggle
              label="Gửi thông báo qua Email"
              desc="Tự động gửi email nhắc học phí"
              on={generalSettings.email_notify}
              onToggle={() => handleToggleSetting('email_notify')}
            />
            <SettingToggle
              label="Gửi thông báo qua SMS"
              desc="Gửi tin nhắn nhắc lịch học"
              on={generalSettings.sms_notify}
              onToggle={() => handleToggleSetting('sms_notify')}
            />
            <SettingToggle
              label="Tự động tạo báo cáo"
              desc="Tạo báo cáo tháng vào ngày 1"
              on={generalSettings.auto_report}
              onToggle={() => handleToggleSetting('auto_report')}
            />
            <SettingToggle
              label="Cho phép đăng ký online"
              desc="Học viên đăng ký qua website"
              on={generalSettings.online_reg}
              onToggle={() => handleToggleSetting('online_reg')}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
