import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | TheOyinbooke Foundation",
  description: "Privacy Policy for TheOyinbooke Foundation - How we protect and handle your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">TOF</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">TheOyinbooke Foundation</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/terms-of-service">
                <Button variant="ghost" size="sm">
                  Terms of Service
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <div className="text-center border-b border-gray-200 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                TheOyinbooke Foundation ("we," "our," or "us") is committed to protecting your privacy and personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                educational support platform and services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Full name, email address, and phone number</li>
                    <li>Date of birth and gender</li>
                    <li>Home address and emergency contact information</li>
                    <li>Academic information (school, level, performance records)</li>
                    <li>Financial information for scholarship and support processing</li>
                    <li>Identity verification documents (as required)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Platform usage patterns and preferences</li>
                    <li>Communication logs and support interactions</li>
                    <li>Device information and IP addresses</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Process scholarship applications and educational support requests</li>
                <li>Manage beneficiary accounts and track academic progress</li>
                <li>Facilitate communication between beneficiaries, guardians, and foundation staff</li>
                <li>Process financial transactions and maintain financial records</li>
                <li>Generate reports for foundation stakeholders and regulatory compliance</li>
                <li>Improve our services and platform functionality</li>
                <li>Send important notifications and updates about your status</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>With educational institutions for academic verification and support coordination</li>
                <li>With financial service providers for scholarship and payment processing</li>
                <li>With authorized foundation staff and volunteers who need access to perform their duties</li>
                <li>When required by Nigerian law or regulatory authorities</li>
                <li>To protect the safety and security of our beneficiaries and staff</li>
                <li>With your explicit consent for specific purposes</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Staff training on data protection and privacy practices</li>
                <li>Secure backup and disaster recovery procedures</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, 
                comply with legal obligations, resolve disputes, and maintain accurate records for foundation operations. 
                Academic and financial records may be retained for extended periods as required by Nigerian educational and financial regulations.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate or incomplete information</li>
                <li>Request deletion of your personal information (subject to legal requirements)</li>
                <li>Withdraw consent for non-essential data processing</li>
                <li>File a complaint about our data handling practices</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
              <p className="text-gray-700">
                Our platform serves beneficiaries of various ages, including minors. For users under 18 years of age, 
                we require parental or guardian consent before collecting personal information. We take additional care 
                to protect the privacy and safety of minor beneficiaries in accordance with Nigerian laws and international best practices.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. International Data Transfers</h2>
              <p className="text-gray-700">
                While we primarily operate within Nigeria, some of our service providers may be located outside Nigeria. 
                When we transfer personal information internationally, we ensure appropriate safeguards are in place to protect your data 
                in accordance with applicable data protection laws.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
                We will notify you of any material changes by posting the updated policy on our platform and sending notification 
                to your registered email address. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="text-gray-700 space-y-2">
                  <p><strong>TheOyinbooke Foundation</strong></p>
                  <p>Email: privacy@theoyinbookefoundation.org</p>
                  <p>Phone: +234 (0) 123 456 7890</p>
                  <p>Address: [Foundation Address], Nigeria</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-900 text-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">TOF</span>
              </div>
              <h3 className="font-semibold">TheOyinbooke Foundation</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering Nigerian students through comprehensive educational support.
            </p>
            <div className="flex justify-center gap-6 text-sm">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <Link href="/privacy-policy" className="text-white">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
            <div className="border-t border-gray-800 pt-4 text-center text-gray-400 text-sm">
              <p>&copy; 2024 TheOyinbooke Foundation. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}