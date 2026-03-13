// products/letterflow/info.js - Product Metadata

module.exports = {
  id: 'letterflow',
  name: 'LetterFlow',
  description: 'Email newsletter platform with subscriber management and analytics',
  version: '1.0.0',
  status: 'development',
  
  features: [
    'Newsletter creation & editing',
    'Subscriber list management',
    'Campaign scheduling',
    'Email delivery (SMTP/SendGrid/Mailgun)',
    'Open & click tracking',
    'Engagement analytics',
    'Subscriber import/export',
    'MJML template support',
    'Multi-user collaboration',
    'Unsubscribe management'
  ],
  
  tech: {
    backend: 'Node.js + Express',
    frontend: 'React + Vite',
    database: 'PostgreSQL + Prisma',
    email: 'Nodemailer + MJML',
    auth: 'JWT',
    charts: 'Recharts'
  },
  
  deployment: {
    railway: true,
    vercel: false,
    netlify: false
  },
  
  integrations: {
    smtp: true,
    sendgrid: true,
    mailgun: true,
    postmark: true
  },
  
  repository: null,
  documentation: 'README.md',
  
  team: {
    owner: 'anton',
    contributors: []
  },
  
  created: new Date('2024-03-10'),
  updated: new Date('2024-03-10')
};
