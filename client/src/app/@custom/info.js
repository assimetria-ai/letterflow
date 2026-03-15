/**
 * @custom/info.js — Letterflow Configuration
 */

const info = {
  name: 'Letterflow',
  tagline: 'Write. Land. Earn.',
  slug: 'letterflow',
  navItems: [
    { to: '/dashboard',    label: 'Dashboard',              icon: 'LayoutDashboard' },
    { to: '/editor',       label: 'Newsletter Editor',      icon: 'PenTool' },
    { to: '/subscribers',  label: 'Subscriber Management',  icon: 'Users' },
    { to: '/send',         label: 'Email Sending',          icon: 'Send' },
    { to: '/analytics',    label: 'Analytics Dashboard',    icon: 'BarChart3' },
    { to: '/automations',  label: 'Automation Sequences',   icon: 'Zap' },
    { to: '/pages',        label: 'Landing Pages',          icon: 'Layout' },
    { to: '/ab-testing',   label: 'A/B Testing',            icon: 'GitBranch' },
    { to: '/import-export',label: 'Import/Export',          icon: 'ArrowUpDown' },
    { to: '/settings',     label: 'Settings',               icon: 'Settings' },
  ],
}

export default info
