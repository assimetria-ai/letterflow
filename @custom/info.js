// @custom — Letterflow product configuration
// Overrides .config/info.js defaults

const GENERAL_INFO = {
  name: 'Letterflow',
  description: 'AI-powered email campaigns platform — create, automate, and optimize email marketing at scale.',
  cta: {
    title: 'Start Sending Smarter Emails',
    description: 'Join thousands of marketers using AI to craft high-converting email campaigns.',
    buttonText: 'Get Started Free',
  },
  url: 'https://letterflow.com',
  email: 'hello@letterflow.com',
  supportEmail: 'support@letterflow.com',
  socials: [],
  theme_color: '#4F46E5',
  background_color: '#F5F3FF',
  links: {
    faq: 'https://letterflow.com/faq',
    refer_and_earn: 'https://letterflow.com/refer',
  },
  products: {
    monthly: {
      price: 29,
      description: 'Monthly Subscription',
    },
    yearly: {
      price: 290,
      description: 'Yearly Subscription',
    },
  },
  plans: [
    {
      priceId: 'price_REPLACE_ME',
      price: 29,
      yearlyPrice: 290,
      name: 'Pro',
      description: 'Pro Plan — Unlimited campaigns, AI writing, advanced analytics',
      paymentLink: '',
      noAllowedRoutes: [],
    },
  ],
  authMode: 'web2',
  emailProvider: 'resend',
}

module.exports = GENERAL_INFO
