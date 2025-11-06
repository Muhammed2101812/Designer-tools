import { createClient } from '@/lib/supabase/server'
import { PricingCard } from '@/components/marketing/PricingCard'
import { PricingFAQ } from '@/components/marketing/PricingFAQ'
import { PRICING_PLANS, PRICING_FAQ } from '@/config/pricing'

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch current user plan if logged in
  let currentPlan = 'free'
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()
    
    currentPlan = profile?.plan || 'free'
  }
  
  return (
    <div className="container py-16">
      {/* Header Section */}
      <div className="mx-auto max-w-3xl text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Choose the Plan That&apos;s Right for You
        </h1>
        <p className="text-lg text-muted-foreground mb-2">
          All plans come with a 30-day money-back guarantee
        </p>
        <p className="text-sm text-muted-foreground">
          Start with our free plan and upgrade anytime as your needs grow
        </p>
      </div>
      
      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto mb-16">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            currentPlan={currentPlan}
            isLoggedIn={!!user}
          />
        ))}
      </div>
      
      {/* Feature Comparison */}
      <div className="max-w-4xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Compare Plans
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border rounded-lg">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left font-semibold">
                  Features
                </th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} className="border border-border p-4 text-center font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-4 font-medium">
                  Daily API Operations
                </td>
                {PRICING_PLANS.map((plan) => (
                  <td key={plan.id} className="border border-border p-4 text-center">
                    {plan.dailyQuota.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="bg-muted/25">
                <td className="border border-border p-4 font-medium">
                  Max File Size
                </td>
                {PRICING_PLANS.map((plan) => (
                  <td key={plan.id} className="border border-border p-4 text-center">
                    {plan.maxFileSize}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-border p-4 font-medium">
                  Batch Processing
                </td>
                {PRICING_PLANS.map((plan) => (
                  <td key={plan.id} className="border border-border p-4 text-center">
                    {plan.batchLimit ? `${plan.batchLimit} files` : '1 file'}
                  </td>
                ))}
              </tr>
              <tr className="bg-muted/25">
                <td className="border border-border p-4 font-medium">
                  REST API Access
                </td>
                {PRICING_PLANS.map((plan) => (
                  <td key={plan.id} className="border border-border p-4 text-center">
                    {plan.apiAccess ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="border border-border p-4 font-medium">
                  Support Level
                </td>
                <td className="border border-border p-4 text-center">
                  Community
                </td>
                <td className="border border-border p-4 text-center">
                  Priority
                </td>
                <td className="border border-border p-4 text-center">
                  Dedicated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        
        <PricingFAQ faqs={PRICING_FAQ} />
      </div>
      
      {/* CTA Section */}
      <div className="max-w-2xl mx-auto text-center mt-16 p-8 bg-muted/50 rounded-lg">
        <h3 className="text-xl font-bold mb-2">
          Ready to get started?
        </h3>
        <p className="text-muted-foreground mb-4">
          Join thousands of designers who trust Design Kit for their image processing needs.
        </p>
        {!user && (
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Start Free Today
          </a>
        )}
      </div>
    </div>
  )
}
