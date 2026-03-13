# Template Usage Examples

Real-world examples showing how to use each template with actual content.

## 1. Minimal Template Example

**Use case:** Product launch announcement

```javascript
const variables = {
  BRAND_NAME: 'Acme Design',
  WEB_VERSION_URL: 'https://acme.com/emails/launch-001',
  HEADLINE: 'Introducing Acme Studio Pro',
  CONTENT_PARAGRAPH_1: 'After months of development and hundreds of user interviews, we're thrilled to introduce Acme Studio Pro—our most powerful design tool yet. Built for teams who demand precision and speed.',
  CONTENT_PARAGRAPH_2: 'Studio Pro includes everything you loved about our original app, plus 50+ new features: real-time collaboration, advanced prototyping, design systems management, and developer handoff tools.',
  CTA_TEXT: 'Start Your Free Trial',
  CTA_URL: 'https://acme.com/studio-pro/trial',
  SIGNATURE: 'Thanks for being part of this journey.\n\n— The Acme Team',
  COMPANY_NAME: 'Acme Design Inc.',
  COMPANY_ADDRESS: '123 Design Street, San Francisco, CA 94102',
  CURRENT_YEAR: '2024',
  UNSUBSCRIBE_URL: 'https://acme.com/unsubscribe/xyz123',
  PREFERENCES_URL: 'https://acme.com/preferences/xyz123'
};
```

**Result:** Clean, focused announcement with strong call-to-action

---

## 2. Magazine Template Example

**Use case:** Weekly tech news roundup

```javascript
const variables = {
  PUBLICATION_NAME: 'The Tech Brief',
  TAGLINE: 'Curated insights for technology leaders',
  ISSUE_DATE: 'March 10, 2024 • Issue #142',
  WEB_VERSION_URL: 'https://techbrief.com/issues/142',
  
  // Featured story
  FEATURED_CATEGORY: 'AI & ML',
  FEATURED_IMAGE: 'https://cdn.techbrief.com/openai-gpt5.jpg',
  FEATURED_ALT: 'OpenAI GPT-5 announcement',
  FEATURED_TITLE: 'OpenAI Unveils GPT-5: What This Means for Enterprise',
  FEATURED_EXCERPT: 'The latest language model promises 10x better reasoning capabilities and multimodal understanding. We break down the implications for business leaders and what to expect in the coming months.',
  FEATURED_URL: 'https://techbrief.com/gpt5-breakdown',
  
  // Article 1
  ARTICLE_1_CATEGORY: 'STARTUPS',
  ARTICLE_1_IMAGE: 'https://cdn.techbrief.com/startup-funding.jpg',
  ARTICLE_1_ALT: 'Startup funding trends',
  ARTICLE_1_TITLE: 'AI Startups Raise Record $25B in Q1',
  ARTICLE_1_EXCERPT: 'Despite economic headwinds, AI-focused startups continue to attract massive investment.',
  ARTICLE_1_URL: 'https://techbrief.com/ai-funding-q1',
  
  // Article 2
  ARTICLE_2_CATEGORY: 'CYBERSECURITY',
  ARTICLE_2_IMAGE: 'https://cdn.techbrief.com/security-breach.jpg',
  ARTICLE_2_ALT: 'Cybersecurity alert',
  ARTICLE_2_TITLE: 'Major Security Vulnerability Affects 60% of Cloud Providers',
  ARTICLE_2_EXCERPT: 'Security researchers discover critical flaw in widely-used authentication library.',
  ARTICLE_2_URL: 'https://techbrief.com/cloud-vulnerability',
  
  // Quick reads
  QUICK_1_TITLE: 'Google Announces Gemini 2.0 with Enhanced Vision',
  QUICK_1_URL: 'https://techbrief.com/gemini-2',
  QUICK_2_TITLE: 'Apple's Vision Pro Pre-Orders Exceed Expectations',
  QUICK_2_URL: 'https://techbrief.com/vision-pro-sales',
  QUICK_3_TITLE: 'Meta Releases Open-Source Code Llama 3',
  QUICK_3_URL: 'https://techbrief.com/llama-3',
  QUICK_4_TITLE: 'Tesla Unveils Model 2 at Affordable Price Point',
  QUICK_4_URL: 'https://techbrief.com/tesla-model-2',
  
  // Footer
  COMPANY_NAME: 'The Tech Brief',
  COMPANY_ADDRESS: '100 Tech Avenue, Austin, TX 78701',
  UNSUBSCRIBE_URL: 'https://techbrief.com/unsubscribe/abc456',
  PREFERENCES_URL: 'https://techbrief.com/preferences/abc456'
};
```

**Result:** Rich, editorial-style newsletter with multiple stories

---

## 3. Digest Template Example

**Use case:** Daily marketing digest

```javascript
const variables = {
  DIGEST_NAME: 'Marketing Minute',
  DIGEST_SUBTITLE: 'Your daily dose of marketing news',
  ISSUE_NUMBER: '387',
  ISSUE_DATE: 'Monday, March 10, 2024',
  INTRO_TEXT: 'Good morning! Here are the top marketing stories you need to know today.',
  
  // Top stories
  STORY_1_TITLE: 'TikTok Launches New Ad Format for E-Commerce Brands',
  STORY_1_SUMMARY: 'The platform introduces "Shop Spotlight" ads that integrate directly with product catalogs, making it easier for brands to drive sales.',
  STORY_1_URL: 'https://marketingminute.com/tiktok-ads',
  STORY_1_SOURCE: 'TechCrunch',
  STORY_1_TIME: '2 hours ago',
  
  STORY_2_TITLE: 'Google Analytics 4 Becomes Mandatory Next Month',
  STORY_2_SUMMARY: 'Universal Analytics will officially sunset on April 1st. Here's what marketers need to know about the transition.',
  STORY_2_URL: 'https://marketingminute.com/ga4-migration',
  STORY_2_SOURCE: 'Search Engine Journal',
  STORY_2_TIME: '4 hours ago',
  
  STORY_3_TITLE: 'New Study Shows Video Content Drives 3x More Engagement',
  STORY_3_SUMMARY: 'Research from HubSpot reveals that video posts generate significantly higher engagement across all social platforms.',
  STORY_3_URL: 'https://marketingminute.com/video-study',
  STORY_3_SOURCE: 'HubSpot',
  STORY_3_TIME: '6 hours ago',
  
  // Trending
  TREND_1_TITLE: 'How Brands Are Using ChatGPT for Content Creation',
  TREND_1_URL: 'https://marketingminute.com/chatgpt-content',
  TREND_2_TITLE: 'Instagram Reels Algorithm Update Explained',
  TREND_2_URL: 'https://marketingminute.com/reels-algo',
  TREND_3_TITLE: '10 Email Subject Lines with 50%+ Open Rates',
  TREND_3_URL: 'https://marketingminute.com/subject-lines',
  TREND_4_TITLE: 'LinkedIn Introduces AI-Powered Campaign Optimization',
  TREND_4_URL: 'https://marketingminute.com/linkedin-ai',
  TREND_5_TITLE: 'Pinterest Trends Report: What's Hot in Q1 2024',
  TREND_5_URL: 'https://marketingminute.com/pinterest-trends',
  
  // Quick bites
  BITE_1_TITLE: 'Meta Ad Costs',
  BITE_1_TEXT: 'CPM decreased 12% month-over-month',
  BITE_1_URL: 'https://marketingminute.com/meta-costs',
  BITE_2_TITLE: 'YouTube Shorts',
  BITE_2_TEXT: 'Now supports 3-minute videos (up from 60s)',
  BITE_2_URL: 'https://marketingminute.com/shorts-update',
  BITE_3_TITLE: 'Shopify Partners',
  BITE_3_TEXT: 'New affiliate program launches with 20% commission',
  BITE_3_URL: 'https://marketingminute.com/shopify-affiliate',
  
  // Footer
  FREQUENCY: 'weekday',
  COMPANY_NAME: 'Marketing Minute',
  CURRENT_YEAR: '2024',
  UNSUBSCRIBE_URL: 'https://marketingminute.com/unsubscribe/def789',
  PREFERENCES_URL: 'https://marketingminute.com/preferences/def789',
  WEB_VERSION_URL: 'https://marketingminute.com/issues/387'
};
```

**Result:** Scannable daily roundup with categorized content

---

## 4. Product Update Template Example

**Use case:** SaaS app monthly update

```javascript
const variables = {
  PRODUCT_NAME: 'Taskflow',
  UPDATE_DATE: 'March 2024 Update',
  HERO_HEADLINE: 'We shipped 12 new features this month',
  HERO_MESSAGE: 'Our biggest update yet! From AI-powered task suggestions to advanced automation, here's everything new in Taskflow.',
  
  // Feature 1
  FEATURE_1_IMAGE: 'https://cdn.taskflow.com/ai-assistant.png',
  FEATURE_1_ALT: 'AI Assistant feature screenshot',
  FEATURE_1_TITLE: 'AI Task Assistant',
  FEATURE_1_DESCRIPTION: 'Get intelligent task suggestions based on your work patterns. Our AI learns from your behavior to recommend priorities, estimate completion times, and suggest optimal scheduling.',
  FEATURE_1_URL: 'https://taskflow.com/features/ai-assistant',
  
  // Feature 2
  FEATURE_2_IMAGE: 'https://cdn.taskflow.com/automation.png',
  FEATURE_2_ALT: 'Advanced automation builder',
  FEATURE_2_TITLE: 'Advanced Automation Builder',
  FEATURE_2_DESCRIPTION: 'Create powerful workflows with our no-code automation builder. Connect Taskflow with 500+ apps and automate repetitive tasks across your entire stack.',
  FEATURE_2_URL: 'https://taskflow.com/features/automation',
  
  // Improvements
  IMPROVEMENT_1_TITLE: 'Mobile app performance',
  IMPROVEMENT_1_DESC: '40% faster load times and smoother animations',
  IMPROVEMENT_2_TITLE: 'Search functionality',
  IMPROVEMENT_2_DESC: 'Search now includes comments, attachments, and custom fields',
  
  // Fixes
  FIX_1_TITLE: 'Notification delays',
  FIX_1_DESC: 'Resolved issue causing 5-10 minute delay in push notifications',
  FIX_2_TITLE: 'Calendar sync issues',
  FIX_2_DESC: 'Fixed Google Calendar integration not updating in real-time',
  
  // Upcoming
  UPCOMING_1_TITLE: 'Team Analytics Dashboard',
  UPCOMING_1_DESC: 'Visualize team productivity and identify bottlenecks',
  UPCOMING_2_TITLE: 'Voice Commands',
  UPCOMING_2_DESC: 'Create tasks and set reminders using voice input',
  UPCOMING_3_TITLE: 'Offline Mode',
  UPCOMING_3_DESC: 'Work on tasks without internet, sync when back online',
  
  // Links
  APP_URL: 'https://app.taskflow.com',
  FEEDBACK_URL: 'https://taskflow.com/feedback',
  DOCS_URL: 'https://docs.taskflow.com',
  SUPPORT_URL: 'https://taskflow.com/support',
  
  // Footer
  COMPANY_NAME: 'Taskflow Inc.',
  CURRENT_YEAR: '2024',
  UNSUBSCRIBE_URL: 'https://taskflow.com/unsubscribe/ghi012',
  PREFERENCES_URL: 'https://taskflow.com/preferences/ghi012'
};
```

**Result:** Feature-rich product update with clear categorization

---

## 5. Personal Template Example

**Use case:** Weekly founder's letter

```javascript
const variables = {
  AUTHOR_NAME: 'Sarah Chen',
  TAGLINE: 'Founder @ BuildKit',
  PUBLISH_DATE: 'Sunday, March 10, 2024',
  GREETING: 'Hey friend',
  
  PARAGRAPH_1: 'I'm writing this from a coffee shop in Portland, where I've spent the past week meeting with customers. There's something powerful about stepping away from the computer and having real conversations about the problems we're trying to solve.',
  
  PARAGRAPH_2: 'One meeting in particular stuck with me. A small design studio showed me how they use BuildKit to manage client projects. They'd built their own workflow on top of our platform—something we never imagined. It was both humbling and exciting.',
  
  PULL_QUOTE: 'The best products are finished by their users, not their creators.',
  
  PARAGRAPH_3: 'This got me thinking about the future of BuildKit. We often talk about building features users ask for, but what about building for what they don't know they need yet? That's the harder, more interesting problem.',
  
  PARAGRAPH_4: 'Over the next few months, we're going to experiment with this idea. Some experiments will fail. Some might change how we think about the product entirely. I'll keep you posted on what we learn.',
  
  CONTENT_IMAGE: 'https://cdn.buildkit.com/sarah-portland.jpg',
  IMAGE_ALT: 'Sarah at a Portland coffee shop',
  IMAGE_CAPTION: 'My Portland office for the week',
  
  PARAGRAPH_5: 'In other news, we just hit 10,000 active users this week. I remember when hitting 100 felt like a moonshot. Thank you for being part of this journey.',
  
  CLOSING_THOUGHT: 'If you're ever in the Bay Area and want to grab coffee, just reply to this email. I'd love to hear what you're working on.',
  
  SIGNOFF: 'Until next week',
  
  PS_CONTENT: 'I'm reading "The Innovator's Dilemma" for the third time. It hits different when you're actually building something. Have you read it? What did you think?',
  
  // Links
  SHARE_URL: 'https://buildkit.com/letters/2024-03-10',
  ARCHIVE_URL: 'https://buildkit.com/letters/archive',
  
  // Footer
  NEWSLETTER_NAME: 'Sarah's Weekly Letters',
  COMPANY_NAME: 'BuildKit',
  COMPANY_ADDRESS: '1234 Market Street, San Francisco, CA 94103',
  PREFERENCES_URL: 'https://buildkit.com/preferences/jkl345',
  UNSUBSCRIBE_URL: 'https://buildkit.com/unsubscribe/jkl345'
};
```

**Result:** Warm, conversational newsletter with personal touch

---

## Integration Example

Here's how to integrate these templates into your newsletter sending system:

```javascript
// server/services/newsletter.js
const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

class NewsletterService {
  constructor() {
    this.templatesDir = path.join(__dirname, '../templates');
  }
  
  compileNewsletter(templateId, variables) {
    // Load MJML template
    const templatePath = path.join(this.templatesDir, `${templateId}.mjml`);
    let mjmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      mjmlContent = mjmlContent.replace(regex, value || '');
    });
    
    // Compile to responsive HTML
    const { html, errors } = mjml2html(mjmlContent, {
      validationLevel: 'soft'
    });
    
    if (errors.length > 0) {
      console.warn('MJML warnings:', errors);
    }
    
    return {
      html,
      text: this.generatePlainText(html) // Optional: generate plain text version
    };
  }
  
  generatePlainText(html) {
    // Strip HTML tags for plain text version
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  async sendNewsletter(newsletterId, subscribers) {
    // Get newsletter from database
    const newsletter = await db.newsletter.findById(newsletterId);
    
    // Compile template with variables
    const { html, text } = this.compileNewsletter(
      newsletter.templateId,
      newsletter.variables
    );
    
    // Send to subscribers
    for (const subscriber of subscribers) {
      await this.emailService.send({
        to: subscriber.email,
        subject: newsletter.subject,
        html,
        text
      });
    }
  }
}

module.exports = new NewsletterService();
```

---

## Tips for Success

1. **Test with real data first** - Fill templates with actual content before sending
2. **Preview across clients** - Use tools like Litmus or Email on Acid
3. **Optimize images** - Compress images to < 200KB each
4. **Keep it scannable** - Use clear hierarchy and spacing
5. **Include plain text** - Always generate a text version
6. **Test CTAs** - Make sure all links work
7. **Check mobile** - 60%+ of opens happen on mobile
8. **A/B test** - Try different subject lines and layouts
9. **Monitor metrics** - Track opens, clicks, and unsubscribes
10. **Iterate** - Use performance data to improve over time
