import { Link } from 'react-router-dom';

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-slate-50 py-10 px-4">
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-8">
        <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500">Back to home</Link>
        <h1 className="text-3xl font-bold text-slate-900 mt-3 mb-2">Privacy Policy</h1>
        <p className="text-slate-600">
          CommunityPulse stores the information needed to operate your account, collect feedback, and support moderation.
        </p>
      </div>

      <div className="space-y-6 text-slate-700 leading-7">
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">What we collect</h2>
          <p>
            We collect profile details you provide, feedback submissions, moderation notes, and platform activity needed for security, analytics, and community management.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">How it is used</h2>
          <p>
            Your data is used to authenticate access, deliver password reset and verification links, surface dashboard insights, and help authorized admins respond to community issues.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access and retention</h2>
          <p>
            Authorized administrators may review moderation data and non-anonymous submissions. Records may be retained for operational, audit, and safety purposes according to your organization&apos;s policies.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
