import React, { useState } from 'react';
import { Modal, Input, Select, Button } from '../../../components';
import { CLASSES_DATA } from '../../../data';

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
}

interface StudentForm {
  name: string;
  age: string;
  parent: string;
  phone: string;
  email: string;
  level: string;
  className: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ open, onClose }) => {
  const [form, setForm] = useState<StudentForm>({
    name: '',
    age: '',
    parent: '',
    phone: '',
    email: '',
    level: 'A1',
    className: '',
  });

  const set = (k: keyof StudentForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Thêm học viên mới" width={560}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input
            label="Họ tên học viên"
            value={form.name}
            onChange={v => set('name', v)}
            placeholder="Nguyễn Văn A"
          />
        </div>
        <Input label="Tuổi" value={form.age} onChange={v => set('age', v)} placeholder="8" type="number" />
        <Select
          label="Trình độ"
          value={form.level}
          onChange={v => set('level', v)}
          options={[
            { value: 'A1', label: 'A1' },
            { value: 'A2', label: 'A2' },
            { value: 'B1', label: 'B1' },
            { value: 'B2', label: 'B2' },
          ]}
        />
        <div style={{ gridColumn: '1/-1' }}>
          <Input
            label="Tên phụ huynh"
            value={form.parent}
            onChange={v => set('parent', v)}
            placeholder="Nguyễn Văn B"
          />
        </div>
        <Input
          label="Số điện thoại"
          value={form.phone}
          onChange={v => set('phone', v)}
          placeholder="0912 345 678"
        />
        <Input label="Email" value={form.email} onChange={v => set('email', v)} placeholder="email@gmail.com" />
        <div style={{ gridColumn: '1/-1' }}>
          <Select
            label="Lớp học"
            value={form.className}
            onChange={v => set('className', v)}
            options={[
              { value: '', label: 'Chọn lớp...' }, 
              ...CLASSES_DATA.map(c => ({ value: c.name, label: c.name }))
            ]}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>
          Huỷ
        </Button>
        <Button icon="check" onClick={onClose}>
          Lưu học viên
        </Button>
      </div>
    </Modal>
  );
};
