import LegalLayout, { Section, COMPANY } from '../components/LegalLayout.jsx'

export default function Refund() {
  return (
    <LegalLayout title="Refund Policy" lastUpdated="June 9, 2026">
      <Section title="1. Overview">
        <p>
          This Refund Policy explains how refunds work for paid subscriptions to {COMPANY.name} (the "Service").
          Payments are processed by Paddle, our payment provider and Merchant of Record. Paddle's Buyer Terms may
          also apply to your purchase.
        </p>
      </Section>

      <Section title="2. Subscriptions">
        <p>
          {COMPANY.name} is offered as a recurring subscription (monthly or annual, including any promotional
          Early Bird pricing). Your subscription renews automatically at the end of each billing period unless you
          cancel beforehand.
        </p>
      </Section>

      <Section title="3. 14-day money-back guarantee">
        <p>
          If you are not satisfied with the Service, you may request a full refund within{' '}
          <span className="text-slate-200">14 days</span> of your initial purchase. To request a refund, contact
          us at{' '}
          <a href={`mailto:${COMPANY.contactEmail}`} className="text-brand-300 hover:text-brand-200">
            {COMPANY.contactEmail}
          </a>{' '}
          with the email address used at checkout. Approved refunds are issued to your original payment method by
          Paddle, typically within 5-10 business days.
        </p>
      </Section>

      <Section title="4. Renewals">
        <p>
          Charges for renewal periods are generally non-refundable. We recommend canceling before your renewal
          date if you do not wish to be charged again. If you were charged for a renewal you did not intend,
          contact us promptly and we will review your request in good faith.
        </p>
      </Section>

      <Section title="5. How to cancel">
        <p>
          You can cancel your subscription at any time from your account, or by contacting us. Cancellation stops
          all future charges; you retain access to paid features until the end of the current billing period. We
          do not provide prorated refunds for the unused portion of a billing period except where required by
          law.
        </p>
      </Section>

      <Section title="6. Exceptions">
        <p>
          Refunds may be declined where there is evidence of fraud, abuse, or violation of our Terms of Service.
          Where local consumer-protection laws grant you additional refund rights, those rights apply.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          For any billing or refund questions, contact us at{' '}
          <a href={`mailto:${COMPANY.contactEmail}`} className="text-brand-300 hover:text-brand-200">
            {COMPANY.contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
