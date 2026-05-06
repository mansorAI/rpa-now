export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy — RPA Now</h1>
        <p className="text-gray-400 mb-10">Last updated: May 2025</p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="text-gray-300 leading-relaxed">
            RPA Now collects information you provide directly, such as account credentials, social media
            access tokens (OAuth), and content you schedule for publishing. RPA Now does not store your
            social media passwords.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed">
            Your data is used solely to provide the automation and social media scheduling services
            you request. OAuth tokens are encrypted and used only to publish content on your behalf
            at the times you specify.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">3. TikTok Integration</h2>
          <p className="text-gray-300 leading-relaxed">
            When you connect your TikTok account, we request permission to publish videos on your
            behalf using the Content Posting API. We do not access your followers, messages, or any
            data beyond what is required for publishing. You can revoke access at any time from your
            TikTok account settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing</h2>
          <p className="text-gray-300 leading-relaxed">
            We do not sell, trade, or share your personal data with third parties except as required
            to operate the service (e.g., cloud hosting providers).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
          <p className="text-gray-300 leading-relaxed">
            We retain your data as long as your account is active. You may delete your account and
            all associated data at any time by contacting us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">6. Security</h2>
          <p className="text-gray-300 leading-relaxed">
            All data is transmitted over HTTPS and stored with encryption. OAuth tokens are encrypted
            at rest in our database.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
          <p className="text-gray-300 leading-relaxed">
            For any privacy-related questions, please contact us at:{' '}
            <a href="mailto:mansor.learning@gmail.com" className="text-blue-400 hover:underline">
              mansor.learning@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
