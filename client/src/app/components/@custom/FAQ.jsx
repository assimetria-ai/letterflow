// @custom — FAQ accordion section for the Landing page
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/app/lib/@system/utils'


const FAQ_ITEMS = [
  {
    question: 'What is included in the free plan?',
    answer:
      'The free plan includes up to 2,500 subscribers, unlimited newsletters, basic open/click analytics, and a hosted landing page. No credit card required — upgrade at any time.' },
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes. You can cancel your subscription from the Settings page at any point. You will keep access until the end of your current billing period and will not be charged again.' },
  {
    question: 'Do you take a cut of my revenue?',
    answer:
      'No. Unlike some competitors, Letterflow never takes a percentage of your earnings. You keep 100% of what you make from your newsletter.' },
  {
    question: 'Can I import my subscribers from another platform?',
    answer:
      'Absolutely. You can bulk-import subscribers from CSV files, Mailchimp, Substack, Beehiiv, and other platforms. We also support exporting your data at any time — your list is always yours.' },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit (TLS) and at rest. We use industry-standard security practices including bcrypt password hashing, JWT session management, and regular security audits.' },
  {
    question: 'Is there an API I can integrate with?',
    answer:
      'Yes. All plans include API access for managing subscribers, sending newsletters, and pulling analytics. Full API documentation is available in your dashboard.' },
]


function AccordionItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 sm:gap-4 py-4 sm:py-5 text-left text-sm sm:text-base font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="leading-snug">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4 sm:pb-5' : 'max-h-0',
        )}
      >
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pr-6">{item.answer}</p>
      </div>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="container mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl font-bold">Frequently asked questions</h2>
        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-muted-foreground">
          Everything you need to know. Can't find the answer{' '}
          <a
            href="mailto:support@letterflow.com"
            className="underline underline-offset-4 hover:text-primary"
          >
            Ask us directly.
          </a>
        </p>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border bg-card px-4 sm:px-6">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => toggle(index)}
          />
        ))}
      </div>
    </section>
  )
}
