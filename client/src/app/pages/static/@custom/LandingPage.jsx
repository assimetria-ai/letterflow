// @custom — Letterflow landing page with newsletter-specific content
// Replaces @system/LandingPage with product-specific hero, features, pricing, FAQ
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Mail, Users, BarChart3, Zap, Layout, TestTube } from 'lucide-react'
import { Button } from '../../../components/@system/ui/button'
import { Header } from '../../../components/@system/Header/Header'
import { Footer } from '../../../components/@system/Footer/Footer'
import { Card, CardContent } from '../../../components/@system/Card/Card'
import { OgMeta } from '../../../components/@system/OgMeta/OgMeta'
import { HeroSection } from '../../../components/@custom/HeroSection/HeroSection'
import { FAQ } from '../../../components/@custom/FAQ'
import { info } from '@/config'

const FEATURES = [
  {
    icon: Mail,
    title: 'Rich Newsletter Editor',
    description: 'Write beautiful emails with our drag-and-drop editor. Rich text, images, embeds, and custom templates — no coding required.',
  },
  {
    icon: Users,
    title: 'Subscriber Management',
    description: 'Import, segment, and manage your audience. Tag subscribers, create smart segments, and keep your list clean automatically.',
  },
  {
    icon: BarChart3,
    title: 'Campaign Analytics',
    description: 'Track opens, clicks, and unsubscribes per campaign. Understand what resonates and optimize your content strategy.',
  },
  {
    icon: Zap,
    title: 'Automation Sequences',
    description: 'Set up welcome emails, drip campaigns, and re-engagement flows. Nurture subscribers on autopilot.',
  },
  {
    icon: Layout,
    title: 'Landing Pages',
    description: 'Create high-converting signup pages for your newsletter. Custom domains, embedded forms, and social proof built in.',
  },
  {
    icon: TestTube,
    title: 'A/B Testing',
    description: 'Test subject lines, content, and send times. Let data drive your decisions and boost open rates.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    period: 'forever',
    features: ['Up to 2,500 subscribers', 'Unlimited newsletters', 'Basic analytics', 'Landing page'],
    cta: 'Get Started Free',
    ctaLink: '/auth?tab=register',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: '$19',
    period: '/month',
    features: ['Up to 25,000 subscribers', 'Advanced analytics', 'Automation sequences', 'A/B testing', 'Custom domain', 'Priority support'],
    cta: 'Start Free Trial',
    ctaLink: '/auth?tab=register',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$49',
    period: '/month',
    features: ['Unlimited subscribers', 'Everything in Growth', 'Team collaboration', 'API access', 'Dedicated IP', 'SLA guarantee'],
    cta: 'Start Free Trial',
    ctaLink: '/auth?tab=register',
    highlighted: false,
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <OgMeta
        title={info.name}
        description={info.tagline}
        url={info.url}
      />
      <Header />

      {/* Hero */}
      <HeroSection
        badge="The newsletter platform for creators"
        headline="Your words deserve to land"
        subtitle="Write newsletters that get opened, read, and shared. Powerful editor, smart analytics, and automation — all in one place."
        ctaLabel="Start Writing Free"
        ctaHref="/auth?tab=register"
        secondaryLabel="Sign In"
        secondaryHref="/auth"
        dashboardLabel="Go to Dashboard"
      />

      {/* Features */}
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold">Everything you need to grow your newsletter</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            From your first subscriber to your first million. Tools built for creators who mean business.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="group transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12 md:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            No hidden fees. No revenue cuts. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-primary shadow-lg' : ''}
            >
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6 space-y-3 sm:space-y-4">
                {plan.highlighted && (
                  <span className="inline-block rounded-full bg-primary px-2.5 sm:px-3 py-0.5 sm:py-1 text-xs font-medium text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-xs sm:text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs sm:text-sm">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                      <span className="leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to={plan.ctaLink} className="block">
                  <Button
                    className="w-full"
                    size="default"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Footer CTA */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-10 sm:py-14 md:py-16 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Ready to grow your newsletter?</h2>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Join creators who trust {info.name} to reach their audience.
          </p>
          <div className="mt-6 sm:mt-7 md:mt-8 flex justify-center">
            <Link to="/auth?tab=register" className="w-full max-w-xs sm:w-auto">
              <Button size="lg" className="gap-2 w-full sm:w-auto sm:min-w-[200px]">
                Start Writing Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
