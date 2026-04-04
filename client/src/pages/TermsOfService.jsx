import { Link } from 'react-router-dom';

const TermsOfService = () => (
  <div className="min-h-screen bg-slate-50 py-10 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-8">
        <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500">Back to home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">Terms of Service</h1>
        <p className="text-slate-600">
          These terms explain how CommunityPulse should be used within your organization or community.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 leading-7">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Use responsibly</h2>
          <p>
            Use CommunityPulse to share constructive feedback, moderate community concerns, and improve local decisions. Do not post unlawful, harassing, or intentionally misleading content.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Account expectations</h2>
          <p>
            You are responsible for maintaining the security of your account and for any activity performed while signed in. Administrators may review moderation actions and platform misuse.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Content and moderation</h2>
          <p>
            Submitted feedback may be categorized, analyzed for sentiment, and reviewed by authorized moderators or administrators. CommunityPulse may remove or archive content that violates local rules or platform policy.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsOfService;
