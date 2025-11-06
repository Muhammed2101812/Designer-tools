import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Are my images uploaded to your servers?',
    answer: 'No! Most of our tools process images entirely in your browser using client-side JavaScript. Your images never leave your device. Only AI-powered tools (like background removal) use our secure API, and we never store your images.',
  },
  {
    question: 'Is Design Kit really free?',
    answer: 'Yes! We offer a generous free tier with 10 API operations per day and unlimited access to all client-side tools. Premium and Pro plans provide higher limits for power users.',
  },
  {
    question: 'What\'s the difference between client-side and API-powered tools?',
    answer: 'Client-side tools (like Color Picker, Image Resizer) run entirely in your browser for maximum privacy and speed. API-powered tools (like Background Remover, Image Upscaler) use advanced AI that requires server processing but deliver professional results.',
  },
  {
    question: 'Do I need to create an account to use the tools?',
    answer: 'No account needed for client-side tools! You can use them immediately. For API-powered tools, you\'ll need a free account to track your usage limits.',
  },
  {
    question: 'What image formats do you support?',
    answer: 'We support all common formats: JPG, PNG, WebP, GIF, and SVG. Most tools also let you choose your preferred output format and quality level.',
  },
  {
    question: 'Can I use Design Kit for commercial projects?',
    answer: 'Absolutely! All plans, including the free tier, allow commercial use. Check our terms of service for full details.',
  },
  {
    question: 'How do I upgrade my plan?',
    answer: 'Visit the Pricing page and select the plan that fits your needs. You can upgrade, downgrade, or cancel anytime—no long-term commitments.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'Design Kit works best on modern browsers: Chrome, Firefox, Safari, and Edge (latest versions). Some advanced features may not work on older browsers.',
  },
]

export function FAQ() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Design Kit
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 rounded-lg border bg-muted/50 p-6 text-center">
            <p className="mb-2 font-semibold">Still have questions?</p>
            <p className="text-sm text-muted-foreground">
              Can't find the answer you're looking for? Please{' '}
              <a href="/contact" className="text-primary hover:underline">
                contact our support team
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
