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
      {/* Left brand panel */}
      <div style={{
        flex: 1.1,
        background: 'var(--gradient-hero)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
      }}>
        {/* Soft green glow blobs */}
        <div style={{
          position: 'absolute', width: 520, height: 520, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(128,184,72,0.35) 0%, rgba(128,184,72,0) 65%)',
          top: -160, right: -140, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.20) 0%, rgba(96,165,250,0) 70%)',
          bottom: -120, left: -80, pointerEvents: 'none',
        }} />
        {/* Dotted grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }} />

        {/* Top bar (logo) */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #80b848, #5f8f2e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#fff',
            boxShadow: '0 10px 28px rgba(128,184,72,0.45)',
          }}>E</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 0.2 }}>ESL English Center</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Management Portal</div>
          </div>
        </div>

        {/* Middle hero text */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: 'auto', maxWidth: 460 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(128,184,72,0.18)',
            border: '1px solid rgba(128,184,72,0.35)',
            fontSize: 12, fontWeight: 700, color: '#a6c940', letterSpacing: 0.4,
            marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#80b848' }} />
            HỆ THỐNG QUẢN LÝ TRUNG TÂM
          </div>
          <h1 style={{
            fontSize: 42, fontWeight: 800, color: '#fff',
            margin: '0 0 16px', lineHeight: 1.15, letterSpacing: -0.5,
          }}>
            Định hình tương lai{' '}
            <span style={{
              background: 'linear-gradient(135deg, #a6c940, #80b848)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>tiếng Anh</span>
            {' '}của học viên.
          </h1>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.65, margin: 0,
          }}>
            Quản lý học viên, lớp học, lịch dạy, học phí và kết quả học tập trong một nền tảng duy nhất — đơn giản, hiện đại, theo dõi real-time.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
            marginTop: 36,
          }}>
            {[
              { icon: '🎓', title: '2,400+', sub: 'Học viên' },
              { icon: '📚', title: '180+', sub: 'Lớp hoạt động' },
              { icon: '👩‍🏫', title: '95+', sub: 'Giáo viên' },
              { icon: '⭐', title: '4.9/5', sub: 'Phản hồi PH' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 14, backdropFilter: 'blur(6px)',
              }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{s.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer in left panel */}
        <div style={{
          position: 'relative', zIndex: 1, fontSize: 12,
          color: 'rgba(255,255,255,0.45)',
        }}>
          © 2026 ESL English Center — Internal staff portal
        </div>
      </div>

      {/* Right form panel */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        background: 'var(--card)',
        position: 'relative',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{
            fontSize: 28, fontWeight: 800, color: 'var(--text-1)',
            margin: '0 0 8px', letterSpacing: -0.3,
          }}>
            Chào mừng trở lại 👋
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '0 0 32px' }}>
            Đăng nhập để vào hệ thống quản lý ESL.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  width: '100%', padding: '12px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12, fontSize: 14,
                  fontFamily: 'var(--font)',
                  color: 'var(--text-1)',
                  background: 'var(--input-bg)',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(128,184,72,0.12)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

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
                    width: '100%', padding: '12px 44px 12px 14px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 12, fontSize: 14,
                    fontFamily: 'var(--font)',
                    color: 'var(--text-1)',
                    background: 'var(--input-bg)',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 4px rgba(128,184,72,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-4)', fontSize: 16, padding: 4,
                  }}
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                 onClick={e => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 13, color: '#dc2626',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>⚠️</span>{error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px 24px',
                background: loading ? 'var(--text-4)' : 'var(--gradient-primary)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.15s, box-shadow 0.2s',
                boxShadow: loading ? 'none' : '0 8px 22px rgba(128,184,72,0.40)',
                marginTop: 4,
                letterSpacing: 0.2,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
            </button>
          </form>

          <div style={{
            marginTop: 32, padding: '14px 16px',
            background: 'var(--navy-soft)',
            border: '1px solid var(--border-light)',
            borderRadius: 12,
            fontSize: 12, color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <span>Hệ thống nội bộ — chỉ dành cho nhân viên trung tâm.</span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-4)', textAlign: 'center', marginTop: 28 }}>
            © 2026 ESL English Center.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
