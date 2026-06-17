import LegalLayout, { Section, COMPANY } from '../components/LegalLayout.jsx'

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="June 9, 2026">
      <Section title="1. Overview">
        <p>
          This Privacy Policy explains how {COMPANY.name} ("we", "us") collects, uses, and protects your
          information when you use our profit-and-loss tracking service for prop traders (the "Service"). We are
          committed to handling your data responsibly and only as described here.
        </p>
      </Section>

      <Section title="2. Information we collect">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <span className="text-slate-200">Account information:</span> your email address and authentication
            credentials, managed through our authentication provider (Supabase).
          </li>
          <li>
            <span className="text-slate-200">Service data:</span> the funded accounts, fees, payout splits,
            payouts, and business expenses you enter to track your P&amp;L.
          </li>
          <li>
            <span className="text-slate-200">Payment information:</span> subscription and billing data are
            handled by Paddle, our payment provider and Merchant of Record. We do not collect or store your full
            card details; we receive subscription status needed to grant access.
          </li>
          <li>
            <span className="text-slate-200">Technical data:</span> basic logs and device/browser information
            collected automatically to operate and secure the Service.
          </li>
        </ul>
      </Section>

      <Section title="3. How we use your information">
        <ul className="list-disc space-y-1 pl-6">
          <li>to provide, maintain, and improve the Service;</li>
          <li>to authenticate you and keep your data private to your account;</li>
          <li>to process subscriptions and manage access to paid features;</li>
          <li>to communicate with you about your account, security, and important changes;</li>
          <li>to comply with legal obligations and prevent fraud or abuse.</li>
        </ul>
      </Section>

      <Section title="4. How your data is stored">
        <p>
          Your account and Service data are stored in our database hosted on Supabase. Access is protected by
          Row Level Security, meaning each user can only access their own records. We apply reasonable technical
          and organizational measures to protect your data, though no method of transmission or storage is
          completely secure.
        </p>
      </Section>

      <Section title="5. Sharing of information">
        <p>
          We do not sell your personal information. We share data only with service providers that help us
          operate the Service, under appropriate safeguards:
        </p>
        <ul className="list-disc space-y-1 pl-6">
          <li><span className="text-slate-200">Supabase</span> - database, authentication, and hosting;</li>
          <li><span className="text-slate-200">Paddle</span> - payment processing and subscription management;</li>
          <li>where required by law, or to protect our rights and the safety of users.</li>
        </ul>
      </Section>

      <Section title="6. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct, export, or delete your personal
          data, and to object to or restrict certain processing. You can edit or delete most of your Service data
          directly in the app, or contact us to exercise these rights.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We retain your data for as long as your account is active or as needed to provide the Service. If you
          delete your account, we will delete or anonymize your personal data within a reasonable period, except
          where retention is required for legal, accounting, or fraud-prevention purposes.
        </p>
      </Section>

      <Section title="8. Children's privacy">
        <p>
          The Service is not intended for anyone under 18, and we do not knowingly collect personal information
          from children.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will revise the "Last updated" date above and,
          for material changes, take reasonable steps to notify you.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          For privacy questions or requests, contact us at{' '}
          <a href={`mailto:${COMPANY.contactEmail}`} className="text-brand-300 hover:text-brand-200">
            {COMPANY.contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  )
}
