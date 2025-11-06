import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out Design Kit',
    features: [
      'All client-side tools',
      '10 daily API operations',
      '10MB max file size',
      'Browser-based processing',
      'No credit card required',
    ],
    cta: 'Get Started',
    href: '/signup',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9',
    period: 'per month',
    description: 'For freelancers and small teams',
    features: [
      'All client-side tools',
      '500 daily API operations',
      '50MB max file size',
      'Batch processing (10 files)',
      'Priority support',
      'No watermarks',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=premium',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For professionals and agencies',
    features: [
      'All client-side tools',
      '2000 daily API operations',
      '100MB max file size',
      'Batch processing (50 files)',
      'REST API access',
      'Priority support',
      'Custom integrations',
    ],
    cta: 'Start Free Trial',
    href: '/signup?plan=pro',
    popular: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-20 md:py-32">
      <div className="container">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you need more. No hidden fees.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={`relative flex flex-col transition-all hover:shadow-xl ${
                plan.popular 
                  ? 'border-2 border-primary shadow-lg scale-105' 
                  : 'border-2 hover:scale-[1.02]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button 
                  asChild 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  <Link href={plan.href}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
