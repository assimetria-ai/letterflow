# LetterFlow Email Templates

A collection of 5 professionally-designed, responsive email newsletter templates built with MJML.

## 📧 Templates

### 1. **Minimal** (`minimal.mjml`)
Clean, distraction-free layout for focused messaging.

**Best for:**
- Personal announcements
- Product launches
- Single-topic newsletters
- Brand storytelling

**Features:**
- Clean typography
- Single-column layout
- Prominent CTA button
- Minimal visual distractions
- Black & white color scheme

**Variables:**
- `{{BRAND_NAME}}` - Your brand/company name
- `{{HEADLINE}}` - Main headline
- `{{CONTENT_PARAGRAPH_1}}` - First content paragraph
- `{{CONTENT_PARAGRAPH_2}}` - Second content paragraph
- `{{CTA_TEXT}}` - Call-to-action button text
- `{{CTA_URL}}` - Button destination URL
- `{{SIGNATURE}}` - Closing signature
- `{{COMPANY_NAME}}`, `{{COMPANY_ADDRESS}}` - Footer details
- `{{UNSUBSCRIBE_URL}}`, `{{PREFERENCES_URL}}` - Footer links

---

### 2. **Magazine** (`magazine.mjml`)
Multi-column, rich content layout inspired by editorial publications.

**Best for:**
- Content curation newsletters
- Media/publishing companies
- Multi-topic roundups
- Editorial content

**Features:**
- Featured story with large image
- Two-column article grid
- Quick reads section
- Category tags
- Editorial typography (Georgia serif)

**Variables:**
- `{{PUBLICATION_NAME}}` - Publication title
- `{{TAGLINE}}` - Subtitle/tagline
- `{{ISSUE_DATE}}` - Publication date
- `{{FEATURED_*}}` - Featured story (image, title, excerpt, URL, category)
- `{{ARTICLE_1_*}}`, `{{ARTICLE_2_*}}` - Column articles
- `{{QUICK_1-4_*}}` - Quick reads section
- Standard footer variables

---

### 3. **Digest** (`digest.mjml`)
List-based layout for content aggregation and roundups.

**Best for:**
- Daily/weekly digests
- News roundups
- Content aggregation
- Link collections
- Industry updates

**Features:**
- Numbered/bulleted list format
- Scannable content structure
- Color-coded sections
- Story summaries with metadata
- Top stories + trending sections

**Variables:**
- `{{DIGEST_NAME}}` - Digest title
- `{{DIGEST_SUBTITLE}}` - Subtitle
- `{{ISSUE_NUMBER}}` - Issue number
- `{{ISSUE_DATE}}` - Date
- `{{INTRO_TEXT}}` - Opening paragraph
- `{{STORY_1-3_*}}` - Top stories (title, summary, URL, source, time)
- `{{TREND_1-5_*}}` - Trending items
- `{{BITE_1-3_*}}` - Quick bites section
- `{{FREQUENCY}}` - Email frequency (week, day, etc.)

---

### 4. **Product Update** (`product-update.mjml`)
Feature-focused layout for product releases and updates.

**Best for:**
- SaaS product updates
- Feature releases
- Changelog newsletters
- App update announcements
- Developer updates

**Features:**
- Visual feature showcases
- Badge system (New, Improved, Fixed)
- Before/after comparisons
- Coming soon section
- Strong CTAs

**Variables:**
- `{{PRODUCT_NAME}}` - Product name
- `{{UPDATE_DATE}}` - Update date
- `{{HERO_HEADLINE}}`, `{{HERO_MESSAGE}}` - Opening section
- `{{FEATURE_1-2_*}}` - New features (image, title, description, URL)
- `{{IMPROVEMENT_1-2_*}}` - Improvements
- `{{FIX_1-2_*}}` - Bug fixes
- `{{UPCOMING_1-3_*}}` - Coming soon items
- `{{APP_URL}}` - Link to your app
- `{{FEEDBACK_URL}}`, `{{DOCS_URL}}`, `{{SUPPORT_URL}}` - Help links

---

### 5. **Personal** (`personal.mjml`)
Warm, letter-style layout for one-to-one communication.

**Best for:**
- Personal newsletters
- Founder updates
- Thought leadership
- Community letters
- Behind-the-scenes content

**Features:**
- Letter-like formatting
- Serif typography (Georgia)
- Signature-style author name
- Pull quote support
- Optional P.S. section
- Intimate, conversational tone

**Variables:**
- `{{AUTHOR_NAME}}` - Author/sender name
- `{{TAGLINE}}` - Author tagline
- `{{PUBLISH_DATE}}` - Publication date
- `{{GREETING}}` - Opening greeting (e.g., "Hey friend")
- `{{PARAGRAPH_1-5}}` - Content paragraphs
- `{{PULL_QUOTE}}` - Highlighted quote (optional)
- `{{CONTENT_IMAGE}}`, `{{IMAGE_ALT}}`, `{{IMAGE_CAPTION}}` - Image section
- `{{CLOSING_THOUGHT}}` - Final paragraph
- `{{SIGNOFF}}` - Sign-off (e.g., "Warmly")
- `{{PS_CONTENT}}` - P.S. content (optional)
- `{{SHARE_URL}}`, `{{ARCHIVE_URL}}` - Sharing/archive links

---

## 🚀 Usage

### Option 1: Using MJML CLI (Recommended for Development)

```bash
# Install MJML globally
npm install -g mjml

# Compile a template to HTML
mjml templates/minimal.mjml -o output/minimal.html

# Compile with variable substitution
mjml templates/minimal.mjml -o output/minimal.html

# Watch for changes
mjml templates/*.mjml -o output/ --watch
```

### Option 2: Using MJML Node.js API

```javascript
const mjml2html = require('mjml');
const fs = require('fs');

// Read MJML template
const mjmlTemplate = fs.readFileSync('templates/minimal.mjml', 'utf8');

// Compile to HTML
const { html } = mjml2html(mjmlTemplate);

// Save compiled HTML
fs.writeFileSync('output/minimal.html', html);
```

### Option 3: Integrate into LetterFlow

```javascript
// server/utils/templates.js
const mjml2html = require('mjml');
const fs = require('fs');
const path = require('path');

function compileTemplate(templateName, variables) {
  // Load MJML template
  const templatePath = path.join(__dirname, '../templates', `${templateName}.mjml`);
  let mjmlContent = fs.readFileSync(templatePath, 'utf8');
  
  // Replace variables
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    mjmlContent = mjmlContent.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  // Compile to HTML
  const { html, errors } = mjml2html(mjmlContent);
  
  if (errors.length > 0) {
    console.error('MJML compilation errors:', errors);
  }
  
  return html;
}

// Usage
const html = compileTemplate('minimal', {
  BRAND_NAME: 'Acme Inc',
  HEADLINE: 'Introducing Our New Product',
  CONTENT_PARAGRAPH_1: 'We are excited to announce...',
  // ... more variables
});
```

## 🎨 Customization

All templates use CSS variables and MJML attributes that can be customized:

### Colors
Edit the `<mj-style>` section in each template to change colors:

```xml
<mj-style>
  .primary-color { color: #your-color; }
  .cta-button { background-color: #your-brand-color; }
</mj-style>
```

### Fonts
Change the `font-family` attribute in `<mj-attributes>`:

```xml
<mj-attributes>
  <mj-all font-family="'Your Font', sans-serif" />
</mj-attributes>
```

### Spacing
Adjust padding in `<mj-section>` and `<mj-text>` elements:

```xml
<mj-section padding="40px 20px">
  <mj-text padding="0 0 20px">Content</mj-text>
</mj-section>
```

## 📱 Responsive Design

All templates are built with MJML, which automatically generates responsive HTML that works across:

- ✅ Gmail (desktop, mobile, app)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (2007-2021, Office 365, Outlook.com)
- ✅ Yahoo Mail
- ✅ Thunderbird
- ✅ AOL Mail
- ✅ Samsung Email
- ✅ All major mobile email clients

## 🧪 Testing

Before sending, test your emails using:

1. **Litmus** - Comprehensive email testing across clients
2. **Email on Acid** - Email testing and analytics
3. **MailTrap** - Safe email testing environment
4. **Mailtrap.io** - SMTP testing service

Or send test emails to yourself on different devices:

```bash
# Send test email
node -e "
const nodemailer = require('nodemailer');
const html = require('./output/minimal.html');
// ... configure and send
"
```

## 📦 Template Metadata

Each template includes:
- **Title** - Descriptive name
- **Preview** - Email client preview text
- **Responsive** - Mobile-optimized
- **Variables** - All customizable fields
- **Color scheme** - Default brand colors

## 🔧 Template Variables Reference

### Common Variables (All Templates)

| Variable | Description | Example |
|----------|-------------|---------|
| `{{CURRENT_YEAR}}` | Current year | 2024 |
| `{{COMPANY_NAME}}` | Your company name | Acme Inc |
| `{{COMPANY_ADDRESS}}` | Physical address | 123 Main St, City, State 12345 |
| `{{UNSUBSCRIBE_URL}}` | Unsubscribe link | https://example.com/unsubscribe |
| `{{PREFERENCES_URL}}` | Email preferences | https://example.com/preferences |
| `{{WEB_VERSION_URL}}` | View in browser | https://example.com/email/123 |

## 💡 Best Practices

1. **Keep it simple** - Don't overload with content
2. **Clear CTA** - One primary action per email
3. **Mobile-first** - 60%+ of emails opened on mobile
4. **Alt text** - Always include for images
5. **Plain text** - Provide a text version
6. **Test thoroughly** - Check across email clients
7. **Personalize** - Use subscriber's name when possible
8. **Optimize images** - Compress before embedding
9. **Track performance** - Monitor opens, clicks, conversions
10. **A/B test** - Try different subject lines and CTAs

## 📚 Resources

- **MJML Documentation**: https://mjml.io/documentation/
- **Email Design Best Practices**: https://mailchimp.com/resources/email-marketing-field-guide/
- **Can I Email**: https://www.caniemail.com/ - CSS support in email clients
- **Really Good Emails**: https://reallygoodemails.com/ - Email design inspiration

## 🤝 Contributing

Have ideas for new templates? Found a bug? PRs welcome!

## 📄 License

PROPRIETARY - Part of LetterFlow platform
