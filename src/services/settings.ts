import { supabase } from '../lib/supabase'

export interface CenterSettings {
  name: string
  address: string
  phone: string
  email: string
}

export interface BankSettings {
  bank_id: string
  bank_bin_id: string
  account_no: string
  account_name: string
}

export interface GeneralSettings {
  email_notify: boolean
  sms_notify: boolean
  auto_report: boolean
  online_reg: boolean
}

export const DEFAULT_CENTER_SETTINGS: CenterSettings = {
  name: 'Trung tâm Anh ngữ ESL',
  address: '123 Nguyễn Huệ, Q.1, TP.HCM',
  phone: '028 1234 5678',
  email: 'info@esl.edu.vn'
}

export const DEFAULT_BANK_SETTINGS: BankSettings = {
  bank_id: '',
  bank_bin_id: '',
  account_no: '',
  account_name: ''
}

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  email_notify: true,
  sms_notify: false,
  auto_report: true,
  online_reg: true
}

export const BANK_OPTIONS = [
  { value: '', bin: '', label: '-- Chọn ngân hàng --' },
  { value: 'MB', bin: '970422', label: 'MB Bank (MB)' },
  { value: 'VCB', bin: '970436', label: 'Vietcombank (VCB)' },
  { value: 'TCB', bin: '970407', label: 'Techcombank (TCB)' },
  { value: 'ICB', bin: '970415', label: 'VietinBank (ICB)' },
  { value: 'BIDV', bin: '970418', label: 'BIDV' },
  { value: 'VBA', bin: '970405', label: 'Agribank (VBA)' },
  { value: 'ACB', bin: '970416', label: 'ACB' },
  { value: 'STB', bin: '970403', label: 'Sacombank (STB)' },
  { value: 'TPB', bin: '970423', label: 'TPBank (TPB)' },
  { value: 'VPB', bin: '970432', label: 'VPBank (VPB)' },
  { value: 'VIB', bin: '970441', label: 'VIB' },
  { value: 'SHB', bin: '970443', label: 'SHB' },
  { value: 'MSB', bin: '970426', label: 'MSB' },
  { value: 'HDB', bin: '970437', label: 'HDBank (HDB)' },
  { value: 'OCB', bin: '970448', label: 'OCB' },
  { value: 'ABB', bin: '970425', label: 'ABBANK (ABB)' },
  { value: 'EIB', bin: '970431', label: 'Eximbank (EIB)' },
  { value: 'BAB', bin: '970409', label: 'Bac A Bank (BAB)' },
  { value: 'CUSTOM', bin: '', label: '-- Ngân hàng khác --' }
]

export async function getSystemSettings(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
    
    if (error) {
      console.warn('system_settings table query error or not found, using defaults:', error.message)
      return {}
    }

    return (data || []).reduce((acc: Record<string, any>, item) => {
      acc[item.key] = item.value
      return acc
    }, {})
  } catch (err) {
    console.error('getSystemSettings error:', err)
    return {}
  }
}

export async function saveSystemSetting(key: string, value: any): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) {
    throw error
  }
}
