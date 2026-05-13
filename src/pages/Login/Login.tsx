import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export const Login: React.FC = () => {
  const { login } = useAuth()
  const savedEmail = localStorage.getItem('esl_saved_email') ?? ''
  const [email, setEmail] = useState(savedEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(!!savedEmail)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    const err = await login(email, password, remember)
    if (err) setError('Email hoặc mật khẩu không đúng')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
      fontFamily: 'var(--font)',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,107,53,0.08)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,107,53,0.05)', bottom: -50, left: -50 }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'linear-gradient(135deg, #FF6B35, #e85d04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(255,107,53,0.4)',
          }}>E</div>

          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            ESL English Center
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
            Hệ thống quản lý trung tâm Anh ngữ toàn diện — học viên, lớp học, tài chính và hơn thế nữa.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48, textAlign: 'left' }}>
            {[
              { icon: '👨‍🎓', text: 'Quản lý học viên & phụ huynh' },
              { icon: '📚', text: 'Lịch học & điểm danh tự động' },
              { icon: '💰', text: 'Theo dõi học phí & tài chính' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        background: 'var(--card)',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: '0 0 8px' }}>
            Đăng nhập
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 32px' }}>
            Chào mừng trở lại! Nhập thông tin đăng nhập của bạn.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@esl.edu.vn"
                required
                style={{
                  width: '100%', padding: '11px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12, fontSize: 14,
                  fontFamily: 'var(--font)',
                  color: 'var(--text-1)',
                  background: 'var(--input-bg)',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 14,
                    fontFamily: 'var(--font)',
                    color: 'var(--text-1)',
                    background: 'var(--input-bg)',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', fontSize: 16, padding: 4,
                  }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Ghi nhớ đăng nhập</span>
            </label>

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                fontSize: 13, color: '#ef4444',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading ? 'var(--text-4)' : 'linear-gradient(135deg, #FF6B35, #e85d04)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.35)',
                marginTop: 4,
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', marginTop: 32 }}>
            © 2026 ESL English Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
