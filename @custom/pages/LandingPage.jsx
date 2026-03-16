import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Users, Send, BarChart3, Zap, Layout,
  FlaskConical, ArrowDownUp, CheckCircle2, ArrowRight,
  Star, ChevronRight, Globe, Shield, Clock, Sparkles
} from 'lucide-react';

const BRAND_COLOR = '#0EA5E9';
const BRAND_DARK = '#0284C7';

const features = [
  {
    icon: Mail,
    name: 'Newsletter Editor',
    description: 'Rich text block editor with drag-and-drop sections, inline image uploads, reusable templates, and mobile preview. Supports HTML export and scheduled publishing.',
  },
  {
    icon: Users,
    name: 'Subscriber Management',
    description: 'Import subscribers via CSV or API. Create segments by tags, signup source, engagement level, or custom fields. Manage unsubscribes and bounces automatically.',
  },
  {
    icon: Send,
    name: 'Email Sending',
    description: 'Send campaigns via Resend or AWS SES. SPF/DKIM setup wizard, deliverability scoring, send-time optimization, and bounce/complaint handling with automatic list hygiene.',
  },
  {
    icon: BarChart3,
    name: 'Analytics Dashboard',
    description: 'Per-campaign metrics: open rate, click rate, unsubscribes, and growth trends. Subscriber growth chart, geo distribution, and top-performing content ranking.',
  },
  {
    icon: Zap,
    name: 'Automation Sequences',
    description: 'Build multi-step drip campaigns triggered by signup, tag assignment, or date. Visual sequence builder with delay nodes, conditional branches, and per-step metrics.',
  },
  {
    icon: Layout,
    name: 'Landing Pages',
    description: 'Drag-and-drop landing page builder for newsletter signups. Custom domains, embedded forms, social proof widgets, and conversion tracking. Mobile-responsive.',
  },
  {
    icon: FlaskConical,
    name: 'A/B Testing',
    description: 'Split-test subject lines, sender names, content blocks, and send times. Automatic winner selection based on open rate or click rate after a configurable sample window.',
  },
  {
    icon: ArrowDownUp,
    name: 'Import/Export',
    description: 'One-click import from Mailchimp, Substack, ConvertKit, or CSV. Export full subscriber lists and campaign history as CSV/JSON. GDPR-compliant data portability.',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for getting started with your first newsletter.',
    features: [
      'Up to 500 subscribers',
      'Newsletter editor',
      'Basic analytics',
      '1 landing page',
      'Community support',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Everything you need to grow a thriving newsletter business.',
    features: [
      'Up to 10,000 subscribers',
      'All editor features',
      'Advanced analytics & reports',
      'Unlimited landing pages',
      'Automation sequences',
      'A/B testing',
      'Custom domain',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For large publishers and media companies with advanced needs.',
    features: [
      'Unlimited subscribers',
      'Everything in Pro',
      'Dedicated IP address',
      'Advanced API access',
      'SSO & team roles',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Founder, The Morning Brief',
    avatar: 'SM',
    quote: 'Letterflow transformed how I run my newsletter. The automation sequences saved me 10 hours a week, and my open rates jumped 23% with the A/B testing tools.',
    rating: 5,
  },
  {
    name: 'James Chen',
    role: 'Content Lead, TechInsider',
    avatar: 'JC',
    quote: 'We migrated from Mailchimp in under an hour thanks to the import tool. The analytics dashboard gives us insights we never had before. Truly a game-changer.',
    rating: 5,
  },
  {
    name: 'Elena Rodriguez',
    role: 'Creator, Design Weekly',
    avatar: 'ER',
    quote: 'The landing page builder helped me grow from 200 to 5,000 subscribers in three months. The drag-and-drop editor is a joy to use and my newsletters look stunning.',
    rating: 5,
  },
];

const stats = [
  { label: 'Newsletters Sent', value: '12M+' },
  { label: 'Active Creators', value: '8,500+' },
  { label: 'Avg. Open Rate', value: '47.3%' },
  { label: 'Uptime', value: '99.99%' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleGetStarted = (e) => {
    e.preventDefault();
    navigate('/signup' + (email ? `?email=${encodeURIComponent(email)}` : ''));
  };

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#0f172a' }}>
      {/* Navigation */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e2e8f0', padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', height: 64,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={28} color={BRAND_COLOR} strokeWidth={2.5} />
            <span style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Letterflow</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <a href="#features" style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Features</a>
            <a href="#pricing" style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Pricing</a>
            <a href="#testimonials" style={{ color: '#475569', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>Testimonials</a>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent', border: `1px solid ${BRAND_COLOR}`,
                color: BRAND_COLOR, padding: '8px 20px', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: BRAND_COLOR, border: 'none', color: '#fff',
                padding: '8px 20px', borderRadius: 8, fontSize: 14,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        background: `linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)`,
        padding: '80px 24px 100px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400,
          borderRadius: '50%', background: `${BRAND_COLOR}10`, filter: 'blur(80px)',
        }} />
        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
            padding: '6px 16px', marginBottom: 24, fontSize: 13, color: '#475569',
          }}>
            <Sparkles size={14} color={BRAND_COLOR} />
            Now with AI-powered subject line suggestions
          </div>
          <h1 style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.1, color: '#0f172a',
            margin: '0 0 20px',
          }}>
            Write. Land. Earn.
          </h1>
          <p style={{
            fontSize: 20, color: '#475569', lineHeight: 1.6, margin: '0 0 40px',
            maxWidth: 560, marginLeft: 'auto', marginRight: 'auto',
          }}>
            The all-in-one newsletter platform for creators who want to grow their audience,
            monetize their content, and own their subscriber relationships.
          </p>
          <form onSubmit={handleGetStarted} style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: '14px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                fontSize: 16, width: 320, outline: 'none', background: '#fff',
              }}
            />
            <button type="submit" style={{
              background: BRAND_COLOR, color: '#fff', border: 'none',
              padding: '14px 32px', borderRadius: 10, fontSize: 16,
              fontWeight: 600, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 8,
            }}>
              Start for Free <ArrowRight size={18} />
            </button>
          </form>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}>
            No credit card required. Free up to 500 subscribers.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '40px 24px' }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto', display: 'flex',
          justifyContent: 'space-around', flexWrap: 'wrap', gap: 24,
        }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: BRAND_COLOR }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Everything You Need to Grow
            </h2>
            <p style={{ fontSize: 18, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>
              From your first subscriber to your millionth, Letterflow scales with you.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} style={{
                  background: '#fff', borderRadius: 12, padding: 28,
                  border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: `${BRAND_COLOR}12`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  }}>
                    <Icon size={24} color={BRAND_COLOR} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                    {feature.name}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 48px' }}>
            Launch Your Newsletter in 3 Steps
          </h2>
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { step: '1', title: 'Create', desc: 'Sign up, pick a template, and customize your newsletter design in minutes.' },
              { step: '2', title: 'Grow', desc: 'Build landing pages, import subscribers, and set up automated welcome sequences.' },
              { step: '3', title: 'Earn', desc: 'Monetize with premium tiers, track performance, and optimize with A/B tests.' },
            ].map((item) => (
              <div key={item.step} style={{ flex: '1 1 220px', maxWidth: 280 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: BRAND_COLOR, color: '#fff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, margin: '0 auto 16px',
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ background: '#f8fafc', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ fontSize: 18, color: '#64748b' }}>
              Start free. Upgrade when you're ready.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24, maxWidth: 960, margin: '0 auto',
          }}>
            {pricingPlans.map((plan) => (
              <div key={plan.name} style={{
                background: '#fff', borderRadius: 16, padding: 32,
                border: plan.highlighted ? `2px solid ${BRAND_COLOR}` : '1px solid #e2e8f0',
                position: 'relative', display: 'flex', flexDirection: 'column',
              }}>
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: BRAND_COLOR, color: '#fff', padding: '4px 16px',
                    borderRadius: 12, fontSize: 12, fontWeight: 600,
                  }}>
                    Most Popular
                  </div>
                )}
                <h3 style={{ fontSize: 22, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>
                  {plan.description}
                </p>
                <div style={{ margin: '0 0 24px' }}>
                  <span style={{ fontSize: 44, fontWeight: 800, color: '#0f172a' }}>{plan.price}</span>
                  <span style={{ fontSize: 16, color: '#64748b' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', flex: 1 }}>
                  {plan.features.map((feat) => (
                    <li key={feat} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontSize: 14, color: '#334155', padding: '6px 0',
                    }}>
                      <CheckCircle2 size={16} color={BRAND_COLOR} />
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/signup')}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 10,
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: plan.highlighted ? BRAND_COLOR : '#f1f5f9',
                    color: plan.highlighted ? '#fff' : '#0f172a',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Loved by Creators
            </h2>
            <p style={{ fontSize: 18, color: '#64748b' }}>
              Thousands of creators trust Letterflow to power their newsletters.
            </p>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24,
          }}>
            {testimonials.map((t) => (
              <div key={t.name} style={{
                background: '#f8fafc', borderRadius: 12, padding: 28,
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} fill="#FBBF24" color="#FBBF24" />
                  ))}
                </div>
                <p style={{ fontSize: 15, color: '#334155', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: BRAND_COLOR, color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 600,
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{t.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        background: `linear-gradient(135deg, #0c4a6e 0%, ${BRAND_COLOR} 100%)`,
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
            Ready to Start Your Newsletter?
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', lineHeight: 1.6 }}>
            Join 8,500+ creators already using Letterflow. Free forever for up to 500 subscribers.
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: '#fff', color: BRAND_COLOR, border: 'none',
              padding: '16px 40px', borderRadius: 10, fontSize: 17,
              fontWeight: 700, cursor: 'pointer',
            }}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '48px 24px 32px', color: '#94a3b8' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'flex',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 32,
        }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Mail size={22} color={BRAND_COLOR} />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Letterflow</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
              The newsletter platform that helps creators write, grow, and earn. Built for scale.
            </p>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#features" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Features</a>
              <a href="#pricing" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Pricing</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Changelog</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Roadmap</a>
            </div>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Documentation</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>API Reference</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Blog</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Support</a>
            </div>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: 1 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Privacy Policy</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>Terms of Service</a>
              <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13 }}>GDPR</a>
            </div>
          </div>
        </div>
        <div style={{
          maxWidth: 1100, margin: '32px auto 0', paddingTop: 24,
          borderTop: '1px solid #1e293b', textAlign: 'center',
          fontSize: 13, color: '#64748b',
        }}>
          2026 Letterflow. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
