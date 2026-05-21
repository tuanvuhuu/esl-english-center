import React, { useState, useEffect } from 'react'
import { Modal, Input, Select, SelectBox, Button, useToast, Icon } from '../../../components'
import { 
  createStudentWithParents, 
  updateStudentWithParents, 
  getClasses, 
  getParents, 
  getStudentById,
  createEnrollment, 
  removeEnrollment, 
  linkStudentToAcademicYear,
  getStudentLevels,
  notify
} from '../../../services'
import { useQuery } from '../../../hooks'
import { useAppContext } from '../../../context/AppContext'
import { supabase } from '../../../lib/supabase'
import type { Student } from '../../../types/data'
import type { StudentParent } from '../../../types/database'

interface StudentFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  student?: Student | null
}

interface FormParent {
  id?: string
  name: string
  phone: string
  email: string
  relation: StudentParent['relation']
  is_primary: boolean
  is_emergency: boolean
}

interface Form {
  name: string
  dob: string
  gender: string
  level: string
  status: string
  classId: string
  parents: FormParent[]
}

const EMPTY: Form = {
  name: '', dob: '', gender: '', level: '', status: 'active', classId: '',
  parents: [
    { name: '', phone: '', email: '', relation: 'mother', is_primary: true, is_emergency: true }
  ]
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({ open, onClose, onSuccess, student }) => {
  const isEdit = !!student
  const toast = useToast()
  const { data: levelsRaw } = useQuery(getStudentLevels)
  const levelOptions = React.useMemo(() => levelsRaw ?? [], [levelsRaw])

  const [form, setForm] = useState<Form>(() => {
    return { ...EMPTY, level: '' }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalClassId, setOriginalClassId] = useState<string>('')

  const { selectedBranch, selectedYear } = useAppContext()
  const branchId = selectedBranch?.id
  const yearId = selectedYear?.id

  const { data: classesRaw } = useQuery(
    () => getClasses({ branchId, academicYearId: yearId }),
    [branchId, yearId]
  )
  const { data: parentsRaw } = useQuery(getParents)

  useEffect(() => {
    const fetchActiveEnrollmentAndParents = async () => {
      if (!student?.id) return
      try {
        // Fetch class enrollment
        const { data: enrollmentData, error: enrollError } = await supabase
          .from('enrollments')
          .select('class_id')
          .eq('student_id', student.id)
          .eq('is_deleted', false)
          .maybeSingle()
        if (enrollError) throw enrollError
        
        let classId = ''
        if (enrollmentData) {
          classId = enrollmentData.class_id
          setOriginalClassId(enrollmentData.class_id)
        } else {
          setOriginalClassId('')
        }

        // Fetch full student with parents
        const fullStudent = await getStudentById(String(student.id))
        const mappedParents = (fullStudent.student_parents ?? []).map(sp => ({
          id: sp.parent?.id,
          name: sp.parent?.full_name ?? '',
          phone: sp.parent?.phone ?? '',
          email: sp.parent?.email ?? '',
          relation: sp.relation,
          is_primary: sp.is_primary,
          is_emergency: sp.is_emergency,
        }))

        setForm({
          name: student.name ?? '',
          dob: student.dob ? student.dob.split('/').reverse().join('-') : '',
          gender: student.gender ?? '',
          level: student.level ?? '',
          status: student.status ?? 'active',
          classId,
          parents: mappedParents.length > 0 ? mappedParents : [
            { name: '', phone: '', email: '', relation: 'mother', is_primary: true, is_emergency: true }
          ]
        })
      } catch (e) {
        console.error('Failed to fetch student active enrollment and parents', e)
      }
    }

    if (student) {
      setForm({
        name: student.name ?? '',
        dob: student.dob ? student.dob.split('/').reverse().join('-') : '',
        gender: student.gender ?? '',
        level: student.level ?? '',
        status: student.status ?? 'active',
        classId: '',
        parents: [
          {
            id: student.parentId ?? undefined,
            name: student.parent ?? '',
            phone: student.phone ?? '',
            email: student.parentEmail ?? '',
            relation: (student.parentRelation as StudentParent['relation']) ?? 'mother',
            is_primary: true,
            is_emergency: true,
          }
        ]
      })
      setOriginalClassId('')
      fetchActiveEnrollmentAndParents()
    } else {
      setForm({ ...EMPTY, level: '' })
      setOriginalClassId('')
    }
    setError(null)
  }, [student, open])

  useEffect(() => {
    if (!student && !form.level && levelOptions.length > 0) {
      setForm(f => ({ ...f, level: levelOptions[0].value }))
    }
  }, [levelOptions, student, form.level])

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))

  const setParentField = (index: number, key: keyof FormParent, value: any) => {
    setForm(f => {
      const updatedParents = [...f.parents]
      
      if (key === 'name') {
        const name = value as string
        const existing = parentsRaw?.find(p => p.full_name === name)
        if (existing) {
          updatedParents[index] = {
            ...updatedParents[index],
            id: existing.id,
            name,
            phone: existing.phone || updatedParents[index].phone,
            email: existing.email || updatedParents[index].email,
          }
        } else {
          updatedParents[index] = {
            ...updatedParents[index],
            id: undefined,
            name,
          }
        }
      } else if (key === 'is_primary' && value === true) {
        // If setting this parent as primary, make sure all others are not primary
        return {
          ...f,
          parents: f.parents.map((p, i) => ({
            ...p,
            is_primary: i === index,
          }))
        }
      } else {
        updatedParents[index] = {
          ...updatedParents[index],
          [key]: value
        }
      }
      
      return {
        ...f,
        parents: updatedParents
      }
    })
  }

  const addParent = () => {
    setForm(f => ({
      ...f,
      parents: [
        ...f.parents,
        { name: '', phone: '', email: '', relation: 'mother', is_primary: f.parents.length === 0, is_emergency: false }
      ]
    }))
  }

  const removeParent = (index: number) => {
    setForm(f => {
      const updated = f.parents.filter((_, i) => i !== index)
      if (f.parents[index]?.is_primary && updated.length > 0) {
        updated[0].is_primary = true
      }
      return {
        ...f,
        parents: updated
      }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Vui lòng nhập họ tên học viên'); return }
    
    // Validate parents
    for (let i = 0; i < form.parents.length; i++) {
      const p = form.parents[i]
      if (!p.name.trim()) {
        setError(`Vui lòng nhập họ tên người liên hệ #${i + 1}`)
        return
      }
      if (!p.phone.trim()) {
        setError(`Vui lòng nhập số điện thoại người liên hệ #${i + 1}`)
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      const studentData = {
        full_name: form.name,
        dob: form.dob || null,
        gender: (form.gender as 'M' | 'F') || null,
        level: form.level,
        status: form.status as any,
      }

      // Auto-ensure at least one primary parent if none selected
      const hasPrimary = form.parents.some(p => p.is_primary)
      const parentsPayload = form.parents.map((p, idx) => ({
        id: p.id,
        full_name: p.name,
        phone: p.phone,
        email: p.email || null,
        relation: p.relation,
        is_primary: hasPrimary ? p.is_primary : idx === 0,
        is_emergency: p.is_emergency,
      }))

      let createdStudentId = String(student?.id || '')
      if (isEdit && student) {
        await updateStudentWithParents(String(student.id), studentData, parentsPayload)
      } else {
        const newStudent = await createStudentWithParents(studentData, parentsPayload)
        createdStudentId = String(newStudent.id)
        if (branchId && yearId) {
          await linkStudentToAcademicYear(createdStudentId, branchId, yearId, form.level)
        }
      }

      // Handle class enrollment change
      if (form.classId !== originalClassId) {
        if (originalClassId) {
          const { data: originalEnrollment } = await supabase
            .from('enrollments')
            .select('id')
            .eq('student_id', createdStudentId)
            .eq('class_id', originalClassId)
            .eq('is_deleted', false)
            .maybeSingle()
          if (originalEnrollment) {
            await removeEnrollment(originalEnrollment.id)
          }
        }
        if (form.classId) {
          await createEnrollment(createdStudentId, form.classId)
        }
      }
      toast.success(isEdit ? 'Cập nhật học viên thành công' : 'Thêm học viên thành công')
      notify(
        isEdit ? 'Cập nhật học viên' : 'Thêm học viên mới',
        isEdit ? `Đã cập nhật thông tin học viên ${form.name}` : `Học viên ${form.name} đã được thêm vào hệ thống`,
        'info',
        { entityType: 'student', entityId: createdStudentId }
      )
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message || 'Đã có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const classOptions = [
    { value: '', label: 'Chưa xếp lớp' },
    ...(classesRaw ?? []).map(c => ({ value: c.id, label: c.name })),
  ]

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'} width={620}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxHeight: '70vh', overflowY: 'auto', paddingRight: 6 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <Input label="Họ tên học viên *" value={form.name} onChange={v => set('name', v)} placeholder="Nguyễn Văn A" />
        </div>
        <Input label="Ngày sinh" value={form.dob} onChange={v => set('dob', v)} type="date" />
        <Select label="Giới tính" value={form.gender} onChange={v => set('gender', v)}
          options={[{ value: '', label: 'Chưa rõ' }, { value: 'M', label: 'Nam' }, { value: 'F', label: 'Nữ' }]} />
        <SelectBox label="Trình độ" value={form.level} onChange={v => set('level', v)}
          options={levelOptions} />
        <Select label="Trạng thái" value={form.status} onChange={v => set('status', v)}
          options={[
            { value: 'active', label: 'Đang học' }, { value: 'trial', label: 'Học thử' },
            { value: 'paused', label: 'Tạm nghỉ' }, { value: 'inactive', label: 'Đã nghỉ' },
          ]} />
        <div style={{ gridColumn: '1/-1' }}>
          <Select label="Lớp học" value={form.classId} onChange={v => set('classId', v)} options={classOptions} />
        </div>

        <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Thông tin phụ huynh / Người liên hệ *</div>
            <Button size="sm" variant="outline" icon="plus" onClick={addParent}>Thêm liên hệ</Button>
          </div>
        </div>

        <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {form.parents.map((p, idx) => (
            <div
              key={idx}
              style={{
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                padding: 14,
                background: 'var(--hover-bg)',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                  Người liên hệ #{idx + 1} {p.is_primary && '(Chính)'}
                </span>
                {form.parents.length > 1 && (
                  <button
                    onClick={() => removeParent(idx)}
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--error-dark)',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <Input
                    label="Họ tên người liên hệ *"
                    value={p.name}
                    onChange={v => setParentField(idx, 'name', v)}
                    placeholder="Nhập hoặc chọn người liên hệ..."
                    list={`parents-list-${idx}`}
                  />
                  <datalist id={`parents-list-${idx}`}>
                    {parentsRaw?.map(pr => (
                      <option key={pr.id} value={pr.full_name}>{pr.phone}</option>
                    ))}
                  </datalist>
                </div>
                <Input
                  label="Số điện thoại *"
                  value={p.phone}
                  onChange={v => setParentField(idx, 'phone', v)}
                  placeholder="0912 345 678"
                />
                <Input
                  label="Email"
                  value={p.email}
                  onChange={v => setParentField(idx, 'email', v)}
                  placeholder="email@gmail.com"
                />
                <Select
                  label="Quan hệ"
                  value={p.relation}
                  onChange={v => setParentField(idx, 'relation', v as StudentParent['relation'])}
                  options={[
                    { value: 'mother', label: 'Mẹ' },
                    { value: 'father', label: 'Bố' },
                    { value: 'grandfather', label: 'Ông' },
                    { value: 'grandmother', label: 'Bà' },
                    { value: 'guardian', label: 'Người giám hộ' },
                    { value: 'other', label: 'Khác' },
                  ]}
                />

                <div style={{ display: 'flex', gap: 20, gridColumn: '1/-1', marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                    <input
                      type="checkbox"
                      checked={p.is_primary}
                      onChange={e => setParentField(idx, 'is_primary', e.target.checked)}
                    />
                    Liên hệ chính
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                    <input
                      type="checkbox"
                      checked={p.is_emergency}
                      onChange={e => setParentField(idx, 'is_emergency', e.target.checked)}
                    />
                    Liên hệ khẩn cấp
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', fontSize: 13, color: '#ef4444' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'center' }}>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button icon={saving ? undefined : 'check'} onClick={handleSave} disabled={saving}>
          {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu học viên'}
        </Button>
      </div>
    </Modal>
  )
}
