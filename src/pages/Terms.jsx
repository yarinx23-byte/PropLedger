import LegalLayout, { Section, COMPANY } from '../components/LegalLayout.jsx'

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="June 9, 2026">
      <Section title="1. Agreement to terms">
        <p>
          These Terms of Service ("Terms") govern your access to and use of {COMPANY.name} (the "Service"),
          a web application that helps proprietary-trading ("prop") traders track the profit and loss of
          their funded accounts. By creating an account or using the Service, you agree to be bound by these
          Terms. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. The service">
        <p>
          {COMPANY.name} lets you record funded accounts, fees, payout splits, payouts, and business expenses,
          and presents calculated summaries of your net profit. The Service is provided for informational and
          record-keeping purposes only. It is not financial, investment, accounting, or tax advice, and you are
          solely responsible for the accuracy of the data you enter and for any decisions you make based on it.
        </p>
      </Section>

      <Section title="3. Accounts">
        <p>
          You must provide accurate information when registering and keep your login credentials secure. You are
          responsible for all activity that occurs under your account. You must be at least 18 years old to use
          the Service. Notify us immediately of any unauthorized use of your account.
        </p>
      </Section>

      <Section title="4. Subscriptions and billing">
        <p>
          Paid plans are billed on a recurring basis (monthly or annually) through our payment provider, Paddle,
          which acts as the Merchant of Record for all purchases. By subscribing you authorize Paddle to charge
          your payment method on each renewal until you cancel. Prices, including any promotional ("Early Bird")
          pricing, are shown on our pricing page and may change for future billing periods with notice.
        </p>
        <p>
          You may cancel at any time from your account or by contacting us. Cancellation stops future renewals;
          access continues until the end of the current paid period. Refunds are governed by our Refund Policy.
        </p>
      </Section>

      <Section title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>use the Service for any unlawful purpose or in violation of these Terms;</li>
          <li>attempt to gain unauthorized access to the Service, other accounts, or our systems;</li>
          <li>interfere with or disrupt the integrity or performance of the Service;</li>
          <li>reverse engineer, resell, or redistribute the Service without our written permission.</li>
        </ul>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          The Service, including its software, design, and branding, is owned by {COMPANY.name} and protected by
          applicable laws. You retain ownership of the data you enter. You grant us a limited license to process
          and store that data solely to provide the Service to you.
        </p>
      </Section>

      <Section title="7. Disclaimers">
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express or implied,
          including fitness for a particular purpose and accuracy of calculations. We do not guarantee that the
          Service will be uninterrupted, error-free, or that stored data will always be available.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, {COMPANY.name} will not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or for any loss of profits, data, or goodwill arising from
          your use of the Service. Our total liability for any claim relating to the Service will not exceed the
          amount you paid us in the twelve months preceding the claim.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          We may suspend or terminate your access if you breach these Terms or use the Service in a way that may
          cause harm. You may stop using the Service at any time. Upon termination, the provisions of these Terms
          that by their nature should survive will continue to apply.
        </p>
      </Section>

      <Section title="10. Changes to these terms">
        <p>
          We may update these Terms from time to time. If we make material changes, we will update the "Last
          updated" date and, where appropriate, notify you. Continued use of the Service after changes take
          effect constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these Terms? Contact us at{' '}
          <a href={`mailto:${COMPANY.contactEmail}`} className="text-brand-300 hover:text-brand-200">
            {COMPANY.contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
