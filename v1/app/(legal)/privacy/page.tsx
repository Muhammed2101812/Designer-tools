import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Design Kit',
  description: 'Learn how Design Kit collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8">
          <h2>1. Introduction</h2>
          <p>
            Welcome to Design Kit ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your information when you use our design tools platform.
          </p>
          <p>
            Design Kit is a privacy-first design toolkit. Most of our tools process files entirely in your browser, meaning your files never leave your device.
          </p>
        </section>

        <section className="mt-8">
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide</h3>
          <ul>
            <li><strong>Account Information:</strong> Email address, full name, and password when you create an account</li>
            <li><strong>Profile Information:</strong> Profile picture and other optional information you choose to add</li>
            <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store your payment details)</li>
            <li><strong>Feedback and Support:</strong> Information you provide when submitting feedback, bug reports, or contacting support</li>
          </ul>

          <h3>2.2 Automatically Collected Information</h3>
          <ul>
            <li><strong>Usage Data:</strong> Tool usage statistics, features accessed, and interaction patterns</li>
            <li><strong>Technical Data:</strong> IP address, browser type, device information, and operating system</li>
            <li><strong>Analytics Data:</strong> Page views, session duration, and navigation patterns (via Plausible Analytics)</li>
            <li><strong>Error Logs:</strong> Error reports and performance data (via Sentry)</li>
          </ul>

          <h3>2.3 Files and Images</h3>
          <p>
            <strong>Client-Side Tools:</strong> For tools like Color Picker, Image Cropper, Image Resizer, Format Converter, QR Generator, Gradient Generator, and Image Compressor - your files are processed entirely in your browser and <strong>never uploaded to our servers</strong>.
          </p>
          <p>
            <strong>API-Powered Tools:</strong> For Background Remover and Image Upscaler - files are temporarily processed by third-party services (Remove.bg and Replicate) and are deleted immediately after processing. We do not store these files.
          </p>
        </section>

        <section className="mt-8">
          <h2>3. How We Use Your Information</h2>
          <ul>
            <li><strong>Provide Services:</strong> To operate and maintain our platform and tools</li>
            <li><strong>Account Management:</strong> To manage your account, authentication, and subscription</li>
            <li><strong>Communication:</strong> To send service updates, quota warnings, and subscription notifications (you can opt-out)</li>
            <li><strong>Improvement:</strong> To analyze usage patterns and improve our tools and features</li>
            <li><strong>Support:</strong> To respond to your inquiries and provide customer support</li>
            <li><strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal data. We may share your information with:</p>

          <h3>4.1 Service Providers</h3>
          <ul>
            <li><strong>Supabase:</strong> Database and authentication (privacy policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a>)</li>
            <li><strong>Stripe:</strong> Payment processing (privacy policy: <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>)</li>
            <li><strong>Plausible Analytics:</strong> Privacy-friendly analytics, GDPR compliant, no cookies (privacy policy: <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer">plausible.io/privacy</a>)</li>
            <li><strong>Sentry:</strong> Error monitoring (privacy policy: <a href="https://sentry.io/privacy" target="_blank" rel="noopener noreferrer">sentry.io/privacy</a>)</li>
            <li><strong>Remove.bg:</strong> Background removal (only when you use this tool)</li>
            <li><strong>Replicate:</strong> Image upscaling (only when you use this tool)</li>
          </ul>

          <h3>4.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law, court order, or government request, or to protect our rights and safety.
          </p>
        </section>

        <section className="mt-8">
          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data:
          </p>
          <ul>
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Encrypted data storage</li>
            <li>Row-Level Security (RLS) policies in database</li>
            <li>Regular security audits and monitoring</li>
            <li>Secure authentication via Supabase Auth</li>
            <li>File validation and sanitization</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="mt-8">
          <h2>6. Data Retention</h2>
          <ul>
            <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after deletion</li>
            <li><strong>Usage Analytics:</strong> Retained for 90 days</li>
            <li><strong>Feedback:</strong> Retained until resolved or deleted upon request</li>
            <li><strong>Payment Records:</strong> Retained for 7 years for legal and tax compliance</li>
            <li><strong>Processed Files:</strong> Client-side tools: never stored. API tools: deleted immediately after processing</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>7. Your Rights (GDPR)</h2>
          <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Objection:</strong> Object to processing of your data</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise these rights, please contact us at <strong>privacy@designkit.com</strong> (or your support email).
          </p>
        </section>

        <section className="mt-8">
          <h2>8. Cookies and Tracking</h2>
          <p>
            We use minimal cookies for essential functionality:
          </p>
          <ul>
            <li><strong>Authentication Cookies:</strong> To keep you logged in (HTTP-only, secure)</li>
            <li><strong>Preference Cookies:</strong> To remember your theme and settings</li>
          </ul>
          <p>
            <strong>We do NOT use:</strong>
          </p>
          <ul>
            <li>Advertising cookies</li>
            <li>Third-party tracking cookies</li>
            <li>Cross-site tracking</li>
          </ul>
          <p>
            Our analytics provider (Plausible) does not use cookies and is GDPR compliant by default.
          </p>
        </section>

        <section className="mt-8">
          <h2>9. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us.
          </p>
        </section>

        <section className="mt-8">
          <h2>10. Email Preferences</h2>
          <p>
            You can manage your email preferences in your profile settings. You can opt-out of:
          </p>
          <ul>
            <li>Marketing emails</li>
            <li>Quota warning emails</li>
            <li>Subscription update emails (some transactional emails are mandatory)</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>11. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers, including:
          </p>
          <ul>
            <li>EU Standard Contractual Clauses</li>
            <li>Adequacy decisions by the European Commission</li>
            <li>Privacy Shield certification (where applicable)</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant changes by:
          </p>
          <ul>
            <li>Updating the "Last updated" date at the top of this policy</li>
            <li>Sending an email notification (if you are a registered user)</li>
            <li>Displaying a prominent notice on our website</li>
          </ul>
          <p>
            Your continued use of our services after changes constitute acceptance of the updated policy.
          </p>
        </section>

        <section className="mt-8">
          <h2>13. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or our privacy practices, please contact us:
          </p>
          <ul className="list-none pl-0">
            <li><strong>Email:</strong> privacy@designkit.com</li>
            <li><strong>Support:</strong> Use the feedback button in the app</li>
          </ul>
        </section>

        <section className="mt-8 p-6 bg-muted rounded-lg">
          <h2>Privacy-First Commitment</h2>
          <p className="mb-2">
            Design Kit is built with privacy as a core principle:
          </p>
          <ul>
            <li>✅ Most tools process files locally in your browser</li>
            <li>✅ We use privacy-friendly, cookieless analytics</li>
            <li>✅ We don't sell or share your data with advertisers</li>
            <li>✅ We collect only what's necessary to provide our service</li>
            <li>✅ You have full control over your data</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
