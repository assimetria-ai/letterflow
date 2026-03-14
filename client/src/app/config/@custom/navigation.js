import { LayoutDashboard, Mail, Users, BarChart3, FlaskConical, Upload, Settings, Zap, Layout, Send } from 'lucide-react'

export const LETTERFLOW_NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
  { icon: Mail, label: 'Newsletters', to: '/app/newsletters' },
  { icon: Users, label: 'Subscribers', to: '/app/subscribers' },
  { icon: Send, label: 'Email Sending', to: '/app/sending' },
  { icon: BarChart3, label: 'Analytics', to: '/app/analytics' },
  { icon: Zap, label: 'Automations', to: '/app/automations' },
  { icon: Layout, label: 'Landing Pages', to: '/app/landing-pages' },
  { icon: FlaskConical, label: 'A/B Tests', to: '/app/ab-tests' },
  { icon: Upload, label: 'Import/Export', to: '/app/import-export' },
  { icon: Settings, label: 'Settings', to: '/app/settings' },
]
