import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TheOyinbooke Foundation",
  description: "Terms of Service for TheOyinbooke Foundation platform and educational support services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <div className="text-center border-b border-gray-200 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using TheOyinbooke Foundation platform and services ("Platform"), you agree to be bound by these 
                Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform. These Terms apply 
                to all users, including beneficiaries, guardians, administrators, reviewers, and visitors.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. About TheOyinbooke Foundation</h2>
              <p className="text-gray-700 leading-relaxed">
                TheOyinbooke Foundation is a registered non-profit organization in Nigeria dedicated to providing educational 
                support and scholarships to deserving students. Our Platform facilitates the application, review, and management 
                of educational support programs, financial aid, and academic tracking services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility and Account Registration</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Eligibility Requirements</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Must be a Nigerian resident or citizen</li>
                    <li>For beneficiaries: Currently enrolled in or accepted to a recognized educational institution</li>
                    <li>For minors: Must have parental or guardian consent and supervision</li>
                    <li>Must provide accurate and complete information during registration</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Account Responsibilities</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Notify us immediately of any unauthorized account access</li>
                    <li>Ensure all information provided is accurate and up-to-date</li>
                    <li>Use the Platform only for its intended educational support purposes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Platform Services</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Services Provided</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Educational scholarship application and review system</li>
                    <li>Academic progress tracking and reporting</li>
                    <li>Financial support management and disbursement</li>
                    <li>Communication tools for beneficiaries, guardians, and foundation staff</li>
                    <li>Document management and verification services</li>
                    <li>Program enrollment and attendance tracking</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Service Limitations</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Services are subject to availability and funding</li>
                    <li>Support is limited to the foundation's current capacity and resources</li>
                    <li>Acceptance into programs is competitive and not guaranteed</li>
                    <li>Services may be modified or discontinued with notice</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. User Obligations and Conduct</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Acceptable Use</h3>
                  <p className="text-gray-700 mb-2">Users must:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide truthful and accurate information in all applications and communications</li>
                    <li>Maintain appropriate academic performance standards as specified in support agreements</li>
                    <li>Comply with the rules and regulations of their educational institutions</li>
                    <li>Use the Platform in a manner consistent with applicable laws and regulations</li>
                    <li>Respect the privacy and rights of other users</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Prohibited Activities</h3>
                  <p className="text-gray-700 mb-2">Users must not:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide false or misleading information</li>
                    <li>Attempt to access unauthorized areas of the Platform</li>
                    <li>Use the Platform for commercial purposes without permission</li>
                    <li>Harass, abuse, or threaten other users or staff</li>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Misuse foundation resources or support for non-educational purposes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Educational Support Terms</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Scholarship and Financial Support</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Support is awarded based on merit, need, and available funding</li>
                    <li>Recipients must maintain minimum academic performance standards</li>
                    <li>Support may be reduced or terminated for non-compliance with terms</li>
                    <li>Financial support is provided directly to educational institutions or approved vendors</li>
                    <li>Recipients must provide regular progress reports and documentation</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Academic Monitoring</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Beneficiaries must submit regular academic reports and transcripts</li>
                    <li>Foundation staff may contact schools for verification of academic status</li>
                    <li>Failure to maintain satisfactory academic progress may result in support suspension</li>
                    <li>Academic support includes mentoring and tutoring services when available</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, 
                use, and protect your personal information. By using our Platform, you consent to the collection 
                and use of your information as described in our Privacy Policy.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>We collect only information necessary for providing our services</li>
                <li>Personal information is protected using industry-standard security measures</li>
                <li>Information may be shared with educational institutions and service providers as necessary</li>
                <li>Users have rights to access, correct, and request deletion of their personal information</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Foundation Property</h3>
                  <p className="text-gray-700 mb-2">
                    The Platform, including its design, functionality, content, and trademarks, is owned by 
                    TheOyinbooke Foundation and protected by applicable intellectual property laws.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">User Content</h3>
                  <p className="text-gray-700 mb-2">
                    By submitting content to the Platform (applications, documents, communications), you grant 
                    the Foundation a non-exclusive license to use such content for the purposes of providing our services.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Platform Availability and Modifications</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>We strive to maintain Platform availability but cannot guarantee uninterrupted service</li>
                <li>Scheduled maintenance will be communicated in advance when possible</li>
                <li>We reserve the right to modify, suspend, or discontinue any part of the Platform</li>
                <li>Users will be notified of significant changes to services or terms</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by Nigerian law:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>The Foundation provides services on an "as is" and "as available" basis</li>
                <li>We do not guarantee specific educational or career outcomes</li>
                <li>Our liability is limited to the value of services provided to the user</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Users are responsible for their own academic performance and career decisions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Termination by Foundation</h3>
                  <p className="text-gray-700 mb-2">We may terminate or suspend access for:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Violation of these Terms of Service</li>
                    <li>Providing false or misleading information</li>
                    <li>Failure to maintain academic performance standards</li>
                    <li>Inappropriate conduct or behavior</li>
                    <li>Legal or regulatory requirements</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Termination by User</h3>
                  <p className="text-gray-700">
                    Users may terminate their account at any time by contacting us. Upon termination, 
                    access to services will cease, but certain obligations may continue as specified in support agreements.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from 
                these Terms or the use of our Platform will be resolved through:
              </p>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Good faith negotiations between the parties</li>
                <li>Mediation through a mutually agreed mediator</li>
                <li>Arbitration under Nigerian arbitration laws, if mediation fails</li>
                <li>Nigerian courts of competent jurisdiction as a last resort</li>
              </ol>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these Terms from time to time to reflect changes in our services, legal requirements, 
                or business practices. Material changes will be communicated through the Platform and via email to 
                registered users. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="text-gray-700 space-y-2">
                  <p><strong>TheOyinbooke Foundation</strong></p>
                  <p>Email: legal@theoyinbookefoundation.org</p>
                  <p>Phone: +234 (0) 123 456 7890</p>
                  <p>Address: [Foundation Address], Nigeria</p>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  For technical support, please contact: support@theoyinbookefoundation.org
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-8">
              <p className="text-sm text-gray-600 text-center">
                By using TheOyinbooke Foundation Platform, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}