import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Design Kit',
  description: 'Terms and conditions for using Design Kit design tools platform.',
}

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using Design Kit ("Service", "we", "us", or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you do not have permission to access the Service.
          </p>
          <p>
            These Terms apply to all visitors, users, and others who access or use the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2>2. Description of Service</h2>
          <p>
            Design Kit is a web-based platform providing design tools including but not limited to:
          </p>
          <ul>
            <li>Color Picker</li>
            <li>Image Cropper</li>
            <li>Image Resizer</li>
            <li>Format Converter</li>
            <li>QR Code Generator</li>
            <li>Gradient Generator</li>
            <li>Image Compressor</li>
            <li>Background Remover (API-powered)</li>
            <li>Image Upscaler (API-powered)</li>
            <li>Mockup Generator</li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time without notice.
          </p>
        </section>

        <section className="mt-8">
          <h2>3. User Accounts</h2>

          <h3>3.1 Account Creation</h3>
          <p>
            To access certain features, you must create an account. You agree to:
          </p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and update your information to keep it accurate</li>
            <li>Maintain the security of your password</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized use</li>
          </ul>

          <h3>3.2 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account if:
          </p>
          <ul>
            <li>You violate these Terms</li>
            <li>You provide false or misleading information</li>
            <li>Your account is inactive for more than 12 months</li>
            <li>We are required to do so by law</li>
          </ul>
          <p>
            You may delete your account at any time through your profile settings.
          </p>
        </section>

        <section className="mt-8">
          <h2>4. Subscription Plans</h2>

          <h3>4.1 Plan Types</h3>
          <ul>
            <li><strong>Free Plan:</strong> Limited API operations per day, unlimited client-side tools</li>
            <li><strong>Premium Plan:</strong> Increased API operations, priority support</li>
            <li><strong>Pro Plan:</strong> Maximum API operations, priority support, early access to features</li>
          </ul>

          <h3>4.2 Billing</h3>
          <ul>
            <li>Subscriptions are billed monthly or annually in advance</li>
            <li>Payment is processed securely through Stripe</li>
            <li>Prices are subject to change with 30 days notice</li>
            <li>All fees are non-refundable except as required by law</li>
          </ul>

          <h3>4.3 Cancellation</h3>
          <ul>
            <li>You may cancel your subscription at any time</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
            <li>You retain access to premium features until the end of the paid period</li>
            <li>No refunds for partial months or unused API operations</li>
          </ul>

          <h3>4.4 Free Trial</h3>
          <p>
            If we offer a free trial:
          </p>
          <ul>
            <li>Trial period duration will be specified at signup</li>
            <li>You may cancel before the trial ends to avoid charges</li>
            <li>Payment method must be provided to start trial</li>
            <li>Automatic billing begins after trial unless canceled</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>5. Usage Limits and Quotas</h2>

          <h3>5.1 API Operations</h3>
          <p>
            API-powered tools (Background Remover, Image Upscaler) have daily usage limits:
          </p>
          <ul>
            <li>Free: 10 operations per day</li>
            <li>Premium: 500 operations per day</li>
            <li>Pro: 2,000 operations per day</li>
          </ul>

          <h3>5.2 Client-Side Tools</h3>
          <p>
            Client-side tools (Color Picker, Image Cropper, etc.) have no usage limits.
          </p>

          <h3>5.3 Fair Use</h3>
          <p>
            We reserve the right to limit or suspend access if we detect:
          </p>
          <ul>
            <li>Automated or scripted usage (bots)</li>
            <li>Excessive API requests</li>
            <li>Abuse of the Service</li>
            <li>Commercial reselling of our services without authorization</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>6. User Content and Files</h2>

          <h3>6.1 Your Files</h3>
          <p>
            You retain all rights to files you upload or process using our Service.
          </p>

          <h3>6.2 File Processing</h3>
          <ul>
            <li><strong>Client-Side Tools:</strong> Files are processed entirely in your browser and never uploaded to our servers</li>
            <li><strong>API Tools:</strong> Files are temporarily sent to third-party processors and deleted immediately after processing</li>
            <li>We do not store, view, or claim ownership of your files</li>
          </ul>

          <h3>6.3 File Restrictions</h3>
          <p>
            You agree not to upload files that:
          </p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Contain malware, viruses, or harmful code</li>
            <li>Include illegal, obscene, or inappropriate content</li>
            <li>Violate privacy or data protection laws</li>
          </ul>

          <h3>6.4 Feedback</h3>
          <p>
            If you submit feedback, bug reports, or suggestions, you grant us the right to use this information without compensation or attribution.
          </p>
        </section>

        <section className="mt-8">
          <h2>7. Prohibited Uses</h2>
          <p>
            You agree not to:
          </p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit malware, viruses, or harmful code</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Scrape, harvest, or collect user data</li>
            <li>Impersonate others or provide false information</li>
            <li>Resell or redistribute our services without permission</li>
            <li>Use automated systems (bots) without authorization</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>8. Intellectual Property</h2>

          <h3>8.1 Our Rights</h3>
          <p>
            The Service, including its design, features, text, graphics, logos, and software, is owned by Design Kit and protected by copyright, trademark, and other intellectual property laws.
          </p>

          <h3>8.2 License to Use</h3>
          <p>
            We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal or internal business use.
          </p>

          <h3>8.3 Restrictions</h3>
          <p>
            You may not:
          </p>
          <ul>
            <li>Copy, modify, or create derivative works of the Service</li>
            <li>Reverse engineer or decompile the Service</li>
            <li>Remove or alter any copyright or proprietary notices</li>
            <li>Use our trademarks without written permission</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>9. Third-Party Services</h2>
          <p>
            Our Service integrates with third-party services:
          </p>
          <ul>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Remove.bg:</strong> Background removal</li>
            <li><strong>Replicate:</strong> Image upscaling</li>
            <li><strong>Supabase:</strong> Database and authentication</li>
          </ul>
          <p>
            Your use of these services is subject to their respective terms and privacy policies. We are not responsible for third-party services.
          </p>
        </section>

        <section className="mt-8">
          <h2>10. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul>
            <li>Warranties of merchantability</li>
            <li>Fitness for a particular purpose</li>
            <li>Non-infringement</li>
            <li>Accuracy or reliability</li>
            <li>Uninterrupted or error-free operation</li>
          </ul>
          <p>
            We do not guarantee that:
          </p>
          <ul>
            <li>The Service will meet your requirements</li>
            <li>Results will be accurate or reliable</li>
            <li>Defects will be corrected</li>
            <li>The Service will be available at all times</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DESIGN KIT SHALL NOT BE LIABLE FOR:
          </p>
          <ul>
            <li>Indirect, incidental, special, consequential, or punitive damages</li>
            <li>Loss of profits, revenue, data, or use</li>
            <li>Business interruption</li>
            <li>Cost of substitute services</li>
          </ul>
          <p>
            OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE LAST 12 MONTHS, OR $100, WHICHEVER IS GREATER.
          </p>
          <p>
            Some jurisdictions do not allow limitations on liability, so these limitations may not apply to you.
          </p>
        </section>

        <section className="mt-8">
          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless Design Kit and its affiliates, officers, agents, and employees from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your content or files</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>13. Data Protection and Privacy</h2>
          <p>
            Your privacy is important to us. Please review our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> to understand how we collect, use, and protect your information.
          </p>
          <p>
            By using our Service, you consent to our Privacy Policy.
          </p>
        </section>

        <section className="mt-8">
          <h2>14. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes will be effective when posted with an updated "Last updated" date.
          </p>
          <p>
            We will notify you of significant changes by:
          </p>
          <ul>
            <li>Email notification (for registered users)</li>
            <li>Prominent notice on our website</li>
            <li>In-app notification</li>
          </ul>
          <p>
            Your continued use after changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section className="mt-8">
          <h2>15. Termination</h2>
          <p>
            We may terminate or suspend your access immediately, without notice, for:
          </p>
          <ul>
            <li>Violation of these Terms</li>
            <li>Illegal activity</li>
            <li>Fraudulent behavior</li>
            <li>At our sole discretion</li>
          </ul>
          <p>
            Upon termination:
          </p>
          <ul>
            <li>Your right to use the Service ceases immediately</li>
            <li>We may delete your account and data</li>
            <li>Outstanding fees remain due</li>
            <li>Provisions that should survive termination will continue (e.g., liability, indemnification)</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>16. Governing Law and Disputes</h2>

          <h3>16.1 Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
          </p>

          <h3>16.2 Dispute Resolution</h3>
          <p>
            For any disputes arising from these Terms or the Service:
          </p>
          <ol>
            <li><strong>Informal Resolution:</strong> Contact us first to resolve informally</li>
            <li><strong>Mediation:</strong> If informal resolution fails, we agree to mediation</li>
            <li><strong>Arbitration/Court:</strong> As a last resort, disputes will be resolved through [arbitration/courts in your jurisdiction]</li>
          </ol>

          <h3>16.3 Class Action Waiver</h3>
          <p>
            You agree that disputes will be resolved on an individual basis, not as a class action or representative action.
          </p>
        </section>

        <section className="mt-8">
          <h2>17. General Provisions</h2>

          <h3>17.1 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Design Kit.
          </p>

          <h3>17.2 Severability</h3>
          <p>
            If any provision is found invalid or unenforceable, the remaining provisions remain in full force and effect.
          </p>

          <h3>17.3 Waiver</h3>
          <p>
            Our failure to enforce any right or provision does not constitute a waiver of that right or provision.
          </p>

          <h3>17.4 Assignment</h3>
          <p>
            You may not assign or transfer these Terms. We may assign our rights without restriction.
          </p>

          <h3>17.5 Force Majeure</h3>
          <p>
            We are not liable for failures due to circumstances beyond our reasonable control.
          </p>
        </section>

        <section className="mt-8">
          <h2>18. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us:
          </p>
          <ul className="list-none pl-0">
            <li><strong>Email:</strong> support@designkit.com</li>
            <li><strong>Feedback:</strong> Use the feedback button in the app</li>
          </ul>
        </section>

        <section className="mt-8 p-6 bg-muted rounded-lg">
          <h2>Acknowledgment</h2>
          <p>
            BY USING DESIGN KIT, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.
          </p>
        </section>
      </div>
    </div>
  )
}
