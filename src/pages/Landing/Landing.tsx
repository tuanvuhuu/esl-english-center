import React from 'react'

interface LandingProps {
  onEnterApp: () => void
}

const NAVY = '#0B2545'
const ORANGE = '#FF6B35'

const programs = [
  {
    icon: '🧒',
    age: '4 - 6 tuổi',
    title: 'Little Stars',
    desc: 'Khơi nguồn cảm hứng học tiếng Anh qua bài hát, trò chơi & flashcard sinh động.',
    color: '#FF6B35',
  },
  {
    icon: '🎒',
    age: '7 - 11 tuổi',
    title: 'Young Explorers',
    desc: 'Xây dựng nền tảng 4 kỹ năng vững chắc, chuẩn Cambridge Starters – Flyers.',
    color: '#3B82F6',
  },
  {
    icon: '🎓',
    age: '12 - 15 tuổi',
    title: 'Teen Achievers',
    desc: 'Tăng tốc luyện thi IELTS Junior, KET, PET — học bằng tư duy phản biện.',
    color: '#10B981',
  },
  {
    icon: '🚀',
    age: '16+ tuổi',
    title: 'IELTS Mastery',
    desc: 'Lộ trình cá nhân hoá để chinh phục IELTS 6.5 – 8.0 trong 4 – 8 tháng.',
    color: '#8B5CF6',
  },
]

const whyChoose = [
  { icon: '🌍', title: '100% Giáo viên bản ngữ', desc: 'Đến từ Anh, Mỹ, Úc, Canada với chứng chỉ TESOL/CELTA.' },
  { icon: '📈', title: 'Lộ trình cá nhân hoá', desc: 'Kiểm tra đầu vào miễn phí, theo dõi tiến độ real-time qua app phụ huynh.' },
  { icon: '🏆', title: '15+ năm kinh nghiệm', desc: 'Hơn 12.000 học viên đã thành công đạt mục tiêu tiếng Anh.' },
  { icon: '💎', title: 'Cam kết đầu ra', desc: 'Học lại miễn phí nếu không đạt mục tiêu cam kết bằng văn bản.' },
]

const testimonials = [
  {
    name: 'Chị Nguyễn Lan Anh',
    role: 'Phụ huynh bé Minh Anh — 8 tuổi',
    quote: 'Sau 6 tháng tại ESL, con tôi tự tin nói chuyện với giáo viên nước ngoài. Lộ trình rõ ràng, giáo viên rất tâm huyết.',
    avatar: '👩',
  },
  {
    name: 'Anh Trần Hoàng Long',
    role: 'Phụ huynh bé Khang — 12 tuổi',
    quote: 'Hệ thống báo cáo hàng tuần giúp tôi nắm được con đang học gì. Điểm Cambridge Flyers của con đạt 14/15 khiên.',
    avatar: '👨',
  },
  {
    name: 'Bạn Phạm Mai Chi',
    role: 'Học viên IELTS — đạt 7.5',
    quote: 'Mình từ 5.0 lên 7.5 trong 5 tháng. Thầy cô tận tâm, lớp ít học viên, được sửa bài cá nhân thường xuyên.',
    avatar: '🧑‍🎓',
  },
]

const stats = [
  { value: '12,000+', label: 'Học viên đã đào tạo' },
  { value: '15+', label: 'Năm kinh nghiệm' },
  { value: '95+', label: 'Giáo viên bản ngữ' },
  { value: '4.9/5', label: 'Phụ huynh hài lòng' },
]

export const Landing: React.FC<LandingProps> = ({ onEnterApp }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      fontFamily: 'var(--font)',
      color: NAVY,
    }}>
      {/* ========== NAVBAR ========== */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid #E6ECF5',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: '14px 32px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #FF6B35, #E55A2B)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 20px rgba(255,107,53,0.35)',
            }}>E</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>ESL English Center</div>
              <div style={{ fontSize: 10, color: '#5C6F8A', fontWeight: 500 }}>Học tiếng Anh đỉnh cao</div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 28, marginLeft: 40 }}>
            {[
              { label: 'Chương trình', href: '#programs' },
              { label: 'Vì sao chọn ESL', href: '#why' },
              { label: 'Phụ huynh nói', href: '#testimonials' },
              { label: 'Liên hệ', href: '#contact' },
            ].map(n => (
              <a key={n.href} href={n.href} style={{
                fontSize: 14, fontWeight: 600, color: NAVY,
                textDecoration: 'none', transition: 'color 0.15s',
              }}
                 onMouseEnter={e => e.currentTarget.style.color = ORANGE}
                 onMouseLeave={e => e.currentTarget.style.color = NAVY}>
                {n.label}
              </a>
            ))}
          </nav>

          <div style={{ flex: 1 }} />

          <a href="tel:1900xxxx" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, fontWeight: 700, color: NAVY,
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: 16 }}>📞</span> 1900 XXXX
          </a>

          <button onClick={onEnterApp} style={{
            padding: '10px 22px',
            background: 'var(--gradient-primary)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13.5, fontWeight: 700, fontFamily: 'var(--font)',
            cursor: 'pointer', letterSpacing: 0.2,
            boxShadow: '0 6px 16px rgba(255,107,53,0.38)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            Đăng nhập →
          </button>
        </div>
      </header>

      {/* ========== HERO ========== */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #F6F8FC 0%, #EEF3FB 100%)',
        overflow: 'hidden',
        padding: '80px 32px 100px',
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0) 65%)',
          top: -120, right: -80, pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(11,37,69,0.10) 0%, rgba(11,37,69,0) 70%)',
          bottom: -120, left: -60, pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56,
          alignItems: 'center', position: 'relative',
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 999,
              background: '#FFF5F0', color: ORANGE,
              fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
              marginBottom: 20,
              border: '1px solid rgba(255,107,53,0.2)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE }} />
              ƯU ĐÃI THÁNG 6: GIẢM ĐẾN 30% HỌC PHÍ
            </div>

            <h1 style={{
              fontSize: 54, fontWeight: 800, color: NAVY,
              margin: '0 0 20px', lineHeight: 1.1,
              letterSpacing: -1,
            }}>
              Học tiếng Anh{' '}
              <span style={{
                position: 'relative',
                background: 'linear-gradient(135deg, #FF6B35, #E55A2B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>chuẩn quốc tế</span><br />
              ngay tại Việt Nam.
            </h1>

            <p style={{
              fontSize: 17, color: '#5C6F8A',
              lineHeight: 1.7, margin: '0 0 32px',
              maxWidth: 540,
            }}>
              Hơn 15 năm đồng hành cùng 12,000+ học viên — giáo viên bản ngữ, lộ trình cá nhân hoá, cam kết đầu ra rõ ràng. Bắt đầu hành trình tiếng Anh của bạn hôm nay.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a href="#contact" style={{
                padding: '15px 28px',
                background: 'var(--gradient-primary)',
                color: '#fff', borderRadius: 12,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 12px 28px rgba(255,107,53,0.40)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'transform 0.15s',
              }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Đăng ký học thử miễn phí →
              </a>
              <a href="#programs" style={{
                padding: '15px 28px',
                background: '#fff',
                color: NAVY, borderRadius: 12,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                border: '1.5px solid #E6ECF5',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'border-color 0.15s',
              }}
                 onMouseEnter={e => e.currentTarget.style.borderColor = ORANGE}
                 onMouseLeave={e => e.currentTarget.style.borderColor = '#E6ECF5'}>
                Xem chương trình
              </a>
            </div>

            <div style={{
              display: 'flex', gap: 28, marginTop: 40,
              paddingTop: 28, borderTop: '1px solid #E6ECF5',
            }}>
              {stats.map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: NAVY, letterSpacing: -0.3 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: '#5C6F8A', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero illustration card stack */}
          <div style={{ position: 'relative', height: 520 }}>
            <div style={{
              position: 'absolute', top: 20, right: 0,
              width: 320, height: 420,
              background: 'var(--gradient-hero)',
              borderRadius: 24, padding: 28,
              boxShadow: '0 30px 60px -20px rgba(11,37,69,0.45)',
              color: '#fff', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', width: 220, height: 220, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,107,53,0.4) 0%, rgba(255,107,53,0) 65%)',
                top: -80, right: -60,
              }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>📚</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Live Class</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>IELTS 6.5 — Speaking</div>
                </div>
              </div>
              <div style={{ position: 'relative', marginTop: 28, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>
                "Hôm nay chúng ta sẽ luyện phần 2 — describe a memorable trip..."
              </div>
              <div style={{ position: 'relative', marginTop: 18, display: 'flex', gap: 8 }}>
                {['T', 'M', 'L', 'A'].map((c, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: ['#FF6B35', '#3B82F6', '#10B981', '#8B5CF6'][i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                    border: '2px solid #143360',
                  }}>{c}</div>
                ))}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff',
                  border: '2px solid #143360',
                }}>+8</div>
              </div>
            </div>

            <div style={{
              position: 'absolute', bottom: 20, left: 0,
              width: 260, padding: 20,
              background: '#fff', borderRadius: 20,
              boxShadow: '0 24px 50px -16px rgba(11,37,69,0.20)',
              border: '1px solid #E6ECF5',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#FFF5F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>📈</div>
                <div>
                  <div style={{ fontSize: 12, color: '#5C6F8A' }}>Tiến độ học viên</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>+18% tuần này</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
                {[40, 55, 35, 70, 50, 80, 95].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`, borderRadius: 4,
                    background: i === 6 ? 'var(--gradient-primary)' : '#EEF3FB',
                  }} />
                ))}
              </div>
            </div>

            <div style={{
              position: 'absolute', top: 0, left: 40,
              padding: '12px 16px',
              background: '#fff', borderRadius: 14,
              boxShadow: '0 16px 32px -12px rgba(11,37,69,0.18)',
              border: '1px solid #E6ECF5',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🏆</div>
              <div>
                <div style={{ fontSize: 12, color: '#5C6F8A' }}>IELTS đạt mục tiêu</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>Band 7.5 ✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PROGRAMS ========== */}
      <section id="programs" style={{ padding: '96px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px', borderRadius: 999,
              background: '#FFF5F0', color: ORANGE,
              fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
              marginBottom: 14, textTransform: 'uppercase',
            }}>
              Chương trình đào tạo
            </div>
            <h2 style={{
              fontSize: 38, fontWeight: 800, color: NAVY,
              margin: '0 0 14px', letterSpacing: -0.5,
            }}>
              Lộ trình phù hợp cho mọi độ tuổi
            </h2>
            <p style={{ fontSize: 16, color: '#5C6F8A', margin: 0, maxWidth: 620, marginInline: 'auto', lineHeight: 1.6 }}>
              4 chương trình được thiết kế chuyên biệt theo độ tuổi và mục tiêu — từ những bước đầu tiên đến chinh phục IELTS.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20,
          }}>
            {programs.map((p, i) => (
              <div key={i} style={{
                position: 'relative',
                padding: '28px 24px',
                background: '#fff',
                border: '1px solid #E6ECF5',
                borderRadius: 20,
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                cursor: 'pointer',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px -16px rgba(11,37,69,0.18)';
                e.currentTarget.style.borderColor = p.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E6ECF5';
              }}>
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 120, height: 120, borderRadius: '50%',
                  background: `${p.color}10`,
                }} />
                <div style={{
                  position: 'relative',
                  width: 56, height: 56, borderRadius: 16,
                  background: `${p.color}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, marginBottom: 18,
                }}>{p.icon}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: p.color,
                  letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase',
                }}>{p.age}</div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: NAVY, margin: '0 0 10px' }}>{p.title}</h3>
                <p style={{ fontSize: 13.5, color: '#5C6F8A', margin: 0, lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE ========== */}
      <section id="why" style={{
        padding: '96px 32px',
        background: 'linear-gradient(180deg, #F6F8FC 0%, #EEF3FB 100%)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 56, alignItems: 'center',
          }}>
            <div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px', borderRadius: 999,
                background: '#FFF5F0', color: ORANGE,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
                marginBottom: 14, textTransform: 'uppercase',
              }}>
                Vì sao chọn ESL?
              </div>
              <h2 style={{
                fontSize: 38, fontWeight: 800, color: NAVY,
                margin: '0 0 18px', letterSpacing: -0.5, lineHeight: 1.15,
              }}>
                Điều làm nên sự khác biệt của ESL
              </h2>
              <p style={{ fontSize: 16, color: '#5C6F8A', margin: 0, lineHeight: 1.7 }}>
                Không chỉ dạy ngôn ngữ — chúng tôi xây dựng sự tự tin, tư duy phản biện và tình yêu học tập cho mỗi học viên.
              </p>
              <button onClick={onEnterApp} style={{
                marginTop: 28,
                padding: '14px 24px',
                background: NAVY, color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, fontFamily: 'var(--font)',
                cursor: 'pointer',
                boxShadow: '0 12px 24px rgba(11,37,69,0.20)',
              }}>
                Khám phá thêm →
              </button>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16,
            }}>
              {whyChoose.map((w, i) => (
                <div key={i} style={{
                  padding: '24px 22px',
                  background: '#fff', borderRadius: 18,
                  border: '1px solid #E6ECF5',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: 30, marginBottom: 12 }}>{w.icon}</div>
                  <h4 style={{ fontSize: 16, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>{w.title}</h4>
                  <p style={{ fontSize: 13, color: '#5C6F8A', margin: 0, lineHeight: 1.6 }}>{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section id="testimonials" style={{ padding: '96px 32px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px', borderRadius: 999,
              background: '#FFF5F0', color: ORANGE,
              fontSize: 11, fontWeight: 700, letterSpacing: 0.6,
              marginBottom: 14, textTransform: 'uppercase',
            }}>
              Phụ huynh & học viên nói
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, color: NAVY, margin: 0, letterSpacing: -0.5 }}>
              Câu chuyện thành công
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{
                padding: 28,
                background: '#F6F8FC',
                borderRadius: 20,
                border: '1px solid #E6ECF5',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 18, right: 22,
                  fontSize: 48, color: ORANGE, opacity: 0.18,
                  fontFamily: 'serif', lineHeight: 1,
                }}>"</div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#F59E0B', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{
                  fontSize: 14, color: '#1F3658', margin: '0 0 22px',
                  lineHeight: 1.7,
                }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: '#fff', border: '2px solid #E6ECF5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#5C6F8A' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section id="contact" style={{ padding: '60px 32px 96px', background: '#fff' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          position: 'relative', overflow: 'hidden',
          background: 'var(--gradient-hero)',
          borderRadius: 28,
          padding: '64px 56px',
          color: '#fff',
          boxShadow: '0 30px 60px -20px rgba(11,37,69,0.45)',
        }}>
          <div style={{
            position: 'absolute', width: 480, height: 480, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,53,0.30) 0%, rgba(255,107,53,0) 65%)',
            top: -180, right: -120, pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
            backgroundSize: '22px 22px', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <h2 style={{
                fontSize: 36, fontWeight: 800, color: '#fff',
                margin: '0 0 16px', letterSpacing: -0.4, lineHeight: 1.15,
              }}>
                Sẵn sàng bắt đầu hành trình{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #FF8A5C, #FF6B35)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>tiếng Anh</span>?
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.65 }}>
                Đăng ký nhận tư vấn lộ trình & kiểm tra trình độ <strong style={{ color: '#FFB496' }}>miễn phí</strong> — ưu đãi học phí lên đến 30% trong tháng này.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
              <a href="tel:1900xxxx" style={{
                padding: '15px 28px',
                background: 'var(--gradient-primary)',
                color: '#fff', borderRadius: 12,
                fontSize: 15, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 12px 28px rgba(255,107,53,0.45)',
                textAlign: 'center',
              }}>
                📞 Gọi tư vấn ngay: 1900 XXXX
              </a>
              <button onClick={onEnterApp} style={{
                padding: '15px 28px',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff', borderRadius: 12,
                fontSize: 15, fontWeight: 700, fontFamily: 'var(--font)',
                border: '1px solid rgba(255,255,255,0.20)',
                cursor: 'pointer', textAlign: 'center',
                backdropFilter: 'blur(6px)',
              }}>
                Đăng nhập hệ thống nội bộ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer style={{ background: NAVY, color: 'rgba(255,255,255,0.7)', padding: '56px 32px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: 40, paddingBottom: 36,
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'linear-gradient(135deg, #FF6B35, #E55A2B)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, fontWeight: 900, color: '#fff',
                }}>E</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>ESL English Center</div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0 }}>
                Hệ thống trung tâm tiếng Anh chuẩn quốc tế — 15+ năm đồng hành cùng học viên Việt Nam.
              </p>
            </div>
            {[
              { title: 'Chương trình', items: ['Little Stars (4-6)', 'Young Explorers (7-11)', 'Teen Achievers (12-15)', 'IELTS Mastery (16+)'] },
              { title: 'Trung tâm', items: ['Về ESL Academy', 'Đội ngũ giáo viên', 'Cơ sở vật chất', 'Tin tức & sự kiện'] },
              { title: 'Liên hệ', items: ['📞 1900 XXXX', '✉️ info@esl.edu.vn', '📍 Hà Nội · TP.HCM · Đà Nẵng', '🕐 8:00 — 21:30'] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, letterSpacing: 0.3 }}>
                  {col.title}
                </div>
                {col.items.map((it, j) => (
                  <div key={j} style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{
            paddingTop: 24,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 12,
            fontSize: 12, color: 'rgba(255,255,255,0.5)',
          }}>
            <div>© 2026 ESL English Center. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 18 }}>
              <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Chính sách bảo mật</a>
              <a href="#" onClick={e => e.preventDefault()} style={{ color: 'inherit', textDecoration: 'none' }}>Điều khoản</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
