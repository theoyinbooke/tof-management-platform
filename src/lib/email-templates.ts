// Email Templates for TheOyinbooke Foundation
// These templates are used throughout the application for consistent messaging

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateData {
  [key: string]: any;
}

/**
 * Replace template variables in content
 */
function replaceVariables(content: string, data: EmailTemplateData): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

/**
 * Application Status Update Email
 */
export const applicationStatusTemplate = (data: {
  applicantName: string;
  status: string;
  foundationName: string;
  applicationId: string;
  reviewNotes?: string;
}): EmailTemplate => ({
  subject: `Application Update - ${data.status}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>TheOyinbooke Foundation</h1>
        <p>Educational Support Application Update</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.applicantName},</h2>
        
        <p>We hope this message finds you well. We are writing to inform you about the status of your application to the ${data.foundationName}.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Application Status: ${data.status.toUpperCase()}</h3>
          <p><strong>Application ID:</strong> ${data.applicationId}</p>
          ${data.reviewNotes ? `<p><strong>Review Notes:</strong><br>${data.reviewNotes}</p>` : ''}
        </div>
        
        ${data.status === 'approved' ? `
          <p>Congratulations! Your application has been approved. You will receive further information about the next steps shortly.</p>
        ` : data.status === 'rejected' ? `
          <p>We regret to inform you that your application was not successful at this time. We encourage you to apply again in the future.</p>
        ` : `
          <p>Your application is currently under review. We will contact you once a decision has been made.</p>
        `}
        
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Payment Confirmation Email
 */
export const paymentConfirmationTemplate = (data: {
  beneficiaryName: string;
  amount: string;
  currency: string;
  receiptNumber: string;
  paymentDate: string;
  feeType: string;
  foundationName: string;
}): EmailTemplate => ({
  subject: `Payment Confirmation - Receipt #${data.receiptNumber}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>Payment Confirmed</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.beneficiaryName},</h2>
        
        <p>Thank you for your payment. We have successfully received and processed your payment.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin-top: 0; color: #16a34a;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Receipt Number:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.receiptNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.currency} ${data.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Payment Type:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.feeType}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Date:</strong></td>
              <td style="padding: 8px 0;">${data.paymentDate}</td>
            </tr>
          </table>
        </div>
        
        <p>Please keep this email as your receipt for accounting purposes.</p>
        
        <p>Thank you for being part of the ${data.foundationName} community.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Finance Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Program Enrollment Confirmation Email
 */
export const programEnrollmentTemplate = (data: {
  beneficiaryName: string;
  programName: string;
  startDate: string;
  location?: string;
  coordinatorName?: string;
  foundationName: string;
}): EmailTemplate => ({
  subject: `Program Enrollment Confirmed - ${data.programName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
        <h1>Program Enrollment Confirmed!</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.beneficiaryName},</h2>
        
        <p>Congratulations! You have been successfully enrolled in the following program:</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">${data.programName}</h3>
          <p><strong>Start Date:</strong> ${data.startDate}</p>
          ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          ${data.coordinatorName ? `<p><strong>Program Coordinator:</strong> ${data.coordinatorName}</p>` : ''}
        </div>
        
        <p>We are excited to have you participate in this program. More details about the program schedule and requirements will be shared soon.</p>
        
        <p>If you have any questions, please contact your program coordinator or reach out to us.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Programs Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Welcome Email for New Users
 */
export const welcomeTemplate = (data: {
  userName: string;
  role: string;
  foundationName: string;
  loginUrl: string;
}): EmailTemplate => ({
  subject: `Welcome to ${data.foundationName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to TheOyinbooke Foundation</h1>
        <p>Educational Support Management Platform</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Welcome, ${data.userName}!</h2>
        
        <p>We are delighted to welcome you to the ${data.foundationName} platform. Your account has been created with <strong>${data.role}</strong> access.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #16a34a;">Get Started</h3>
          <p>Click the button below to access your dashboard:</p>
          <a href="${data.loginUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            Access Dashboard
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Generic notification template
 */
export const notificationTemplate = (data: {
  title: string;
  message: string;
  userName?: string;
  foundationName: string;
  actionUrl?: string;
  actionText?: string;
}): EmailTemplate => ({
  subject: data.title,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center;">
        <h1>TheOyinbooke Foundation</h1>
        <p>Notification</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        ${data.userName ? `<h2>Dear ${data.userName},</h2>` : '<h2>Hello,</h2>'}
        
        <h3 style="color: #374151;">${data.title}</h3>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <p>${data.message}</p>
        </div>
        
        ${data.actionUrl && data.actionText ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.actionUrl}" style="background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${data.actionText}
            </a>
          </div>
        ` : ''}
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Document approval notification
 */
export const documentApprovalTemplate = (data: {
  beneficiaryName: string;
  documentName: string;
  status: 'approved' | 'rejected';
  reviewNotes?: string;
  foundationName: string;
}): EmailTemplate => ({
  subject: `Document ${data.status} - ${data.documentName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${data.status === 'approved' ? '#16a34a' : '#dc2626'}; color: white; padding: 20px; text-align: center;">
        <h1>Document ${data.status === 'approved' ? 'Approved' : 'Rejected'}</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.beneficiaryName},</h2>
        
        <p>Your document has been reviewed and ${data.status}.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.status === 'approved' ? '#16a34a' : '#dc2626'};">
          <h3 style="margin-top: 0; color: ${data.status === 'approved' ? '#16a34a' : '#dc2626'};">Document: ${data.documentName}</h3>
          <p><strong>Status:</strong> ${data.status.toUpperCase()}</p>
          ${data.reviewNotes ? `<p><strong>Review Notes:</strong><br>${data.reviewNotes}</p>` : ''}
        </div>
        
        ${data.status === 'approved' ? `
          <p>Your document has been approved and is now part of your record.</p>
        ` : `
          <p>Please review the notes above and resubmit your document with the necessary corrections.</p>
        `}
        
        <p>Best regards,<br>
        The ${data.foundationName} Document Review Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * User Invitation Email
 */
export const userInvitationTemplate = (data: {
  inviteeName: string;
  inviterName: string;
  role: string;
  foundationName: string;
  signUpUrl: string;
  expiresInDays?: number;
}): EmailTemplate => ({
  subject: `You're invited to join ${data.foundationName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>You're Invited!</h1>
        <p>TheOyinbooke Foundation Management Platform</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.inviteeName},</h2>
        
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.foundationName}</strong> as a <strong>${data.role}</strong>.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Your Role: ${data.role.replace('_', ' ').toUpperCase()}</h3>
          <p>You'll have access to the foundation's management platform where you can:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.role === 'admin' ? `
              <li>Manage beneficiaries and applications</li>
              <li>Review financial records</li>
              <li>Oversee programs and activities</li>
              <li>Generate reports and analytics</li>
            ` : data.role === 'reviewer' ? `
              <li>Review scholarship applications</li>
              <li>Evaluate beneficiary documents</li>
              <li>Provide assessment feedback</li>
              <li>Track review progress</li>
            ` : data.role === 'beneficiary' ? `
              <li>Access your student portal</li>
              <li>View financial support details</li>
              <li>Track academic progress</li>
              <li>Participate in programs</li>
            ` : data.role === 'guardian' ? `
              <li>Monitor your child's progress</li>
              <li>View financial statements</li>
              <li>Communicate with foundation staff</li>
              <li>Access important updates</li>
            ` : `
              <li>Access the foundation platform</li>
              <li>Collaborate with the team</li>
              <li>Contribute to the mission</li>
            `}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.signUpUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Accept Invitation & Sign Up
          </a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⏰ Important:</strong> This invitation ${data.expiresInDays ? `expires in ${data.expiresInDays} days` : 'expires soon'}. Please accept it as soon as possible.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions about this invitation or need assistance with the sign-up process, please don't hesitate to contact us.
        </p>
        
        <p>We look forward to having you as part of our team!</p>
        
        <p>Best regards,<br>
        <strong>${data.inviterName}</strong><br>
        ${data.foundationName}</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
        <p style="margin-top: 10px; color: #9ca3af;">
          Invitation link: <span style="font-family: monospace; font-size: 11px;">${data.signUpUrl}</span>
        </p>
      </div>
    </div>
  `,
});

/**
 * New User Registration Welcome Email
 */
export const newUserWelcomeTemplate = (data: {
  userName: string;
  role: string;
  foundationName: string;
  dashboardUrl: string;
  supportEmail?: string;
}): EmailTemplate => ({
  subject: `Welcome to ${data.foundationName} - Account Created Successfully`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>Welcome to TheOyinbooke Foundation!</h1>
        <p>Your account has been created successfully</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Hello ${data.userName}!</h2>
        
        <p>Congratulations! Your account has been successfully created for <strong>${data.foundationName}</strong>.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Account Details</h3>
          <p><strong>Role:</strong> ${data.role.replace('_', ' ').toUpperCase()}</p>
          <p><strong>Foundation:</strong> ${data.foundationName}</p>
          <p><strong>Account Status:</strong> Active</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0ea5e9;">What's Next?</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #0369a1;">
            <li>Complete your profile information</li>
            <li>Explore the dashboard features</li>
            <li>Check your notification preferences</li>
            ${data.role === 'beneficiary' ? '<li>Upload required documents</li>' : ''}
            ${data.role === 'guardian' ? '<li>Add your dependent beneficiaries</li>' : ''}
            ${data.role === 'reviewer' ? '<li>Review your assigned applications</li>' : ''}
            ${data.role === 'admin' ? '<li>Set up foundation configuration</li>' : ''}
          </ul>
        </div>
        
        <p>If you have any questions or need assistance, please contact our support team${data.supportEmail ? ` at ${data.supportEmail}` : ''}.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Application Submission Acknowledgement Email
 */
export const applicationSubmissionTemplate = (data: {
  applicantName: string;
  applicationId: string;
  submissionDate: string;
  foundationName: string;
  trackingUrl?: string;
  expectedReviewTime?: string;
}): EmailTemplate => ({
  subject: `Application Submitted Successfully - ${data.applicationId}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0ea5e9; color: white; padding: 20px; text-align: center;">
        <h1>Application Submitted!</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.applicantName},</h2>
        
        <p>Thank you for submitting your application to ${data.foundationName}. We have successfully received your application and it is now under review.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">Application Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Application ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${data.applicationId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Submission Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.submissionDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><span style="color: #0ea5e9; font-weight: bold;">Under Review</span></td>
            </tr>
            ${data.expectedReviewTime ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Expected Review Time:</strong></td>
              <td style="padding: 8px 0;">${data.expectedReviewTime}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${data.trackingUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.trackingUrl}" style="background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Track Application Status
          </a>
        </div>
        ` : ''}
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">What Happens Next?</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
            <li>Our review team will evaluate your application</li>
            <li>You may be contacted for additional information or documents</li>
            <li>We will notify you via email when a decision is made</li>
            <li>Keep your application ID for reference</li>
          </ul>
        </div>
        
        <p>Please save this email for your records. If you have any questions about your application, please contact us and reference your application ID.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Admissions Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Application Approved Email
 */
export const applicationApprovedTemplate = (data: {
  applicantName: string;
  applicationId: string;
  foundationName: string;
  nextSteps: string[];
  contactInfo?: string;
  onboardingUrl?: string;
}): EmailTemplate => ({
  subject: `🎉 Congratulations! Your Application Has Been Approved`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>🎉 Congratulations!</h1>
        <p>Your application has been approved</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.applicantName},</h2>
        
        <p>We are delighted to inform you that your application to ${data.foundationName} has been <strong style="color: #16a34a;">APPROVED</strong>!</p>
        
        <div style="background-color: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h3 style="margin-top: 0; color: #16a34a;">🎓 Welcome to Our Foundation Family!</h3>
          <p style="margin-bottom: 0; color: #15803d;">Application ID: <strong>${data.applicationId}</strong></p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">What Happens Next?</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.nextSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
          </ul>
        </div>
        
        ${data.onboardingUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.onboardingUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Complete Onboarding
          </a>
        </div>
        ` : ''}
        
        <p>We are excited to support you on your educational journey and look forward to being part of your success story.</p>
        
        ${data.contactInfo ? `<p><strong>Questions?</strong> Contact us at ${data.contactInfo}</p>` : ''}
        
        <p>Congratulations once again!</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Application Rejected Email
 */
export const applicationRejectedTemplate = (data: {
  applicantName: string;
  applicationId: string;
  foundationName: string;
  reason?: string;
  feedback?: string;
  reapplyInfo?: string;
  contactInfo?: string;
}): EmailTemplate => ({
  subject: `Application Status Update - ${data.applicationId}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center;">
        <h1>Application Status Update</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.applicantName},</h2>
        
        <p>Thank you for your interest in ${data.foundationName} and for taking the time to submit your application.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <p>After careful consideration, we regret to inform you that we are unable to approve your application at this time.</p>
          <p><strong>Application ID:</strong> ${data.applicationId}</p>
          
          ${data.reason ? `
          <div style="margin-top: 15px;">
            <p><strong>Reason:</strong></p>
            <p style="color: #4b5563;">${data.reason}</p>
          </div>
          ` : ''}
          
          ${data.feedback ? `
          <div style="margin-top: 15px;">
            <p><strong>Feedback:</strong></p>
            <p style="color: #4b5563;">${data.feedback}</p>
          </div>
          ` : ''}
        </div>
        
        <p>We understand this may be disappointing news, but please know that this decision does not reflect your worth or potential.</p>
        
        ${data.reapplyInfo ? `
        <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0ea5e9;">Future Opportunities</h4>
          <p style="color: #0369a1; margin-bottom: 0;">${data.reapplyInfo}</p>
        </div>
        ` : ''}
        
        <p>We encourage you to continue pursuing your educational goals and wish you success in all your future endeavors.</p>
        
        ${data.contactInfo ? `<p>If you have any questions about this decision, please contact us at ${data.contactInfo}</p>` : ''}
        
        <p>Best regards,<br>
        The ${data.foundationName} Admissions Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Beneficiary Acceptance Email
 */
export const beneficiaryAcceptanceTemplate = (data: {
  beneficiaryName: string;
  foundationName: string;
  supportDetails: {
    monthlyAmount?: string;
    supportType: string;
    duration?: string;
  };
  dashboardUrl: string;
  coordinatorName?: string;
  coordinatorEmail?: string;
}): EmailTemplate => ({
  subject: `🎉 Welcome as a ${data.foundationName} Beneficiary!`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>🎉 Welcome to Our Family!</h1>
        <p>You are now a ${data.foundationName} Beneficiary</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.beneficiaryName},</h2>
        
        <p>Congratulations! We are thrilled to welcome you as a beneficiary of ${data.foundationName}. Your journey with us begins today!</p>
        
        <div style="background-color: #dcfce7; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #16a34a;">Your Support Package</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #bbf7d0;"><strong>Support Type:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #bbf7d0;">${data.supportDetails.supportType}</td>
            </tr>
            ${data.supportDetails.monthlyAmount ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #bbf7d0;"><strong>Monthly Support:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #bbf7d0;">${data.supportDetails.monthlyAmount}</td>
            </tr>
            ` : ''}
            ${data.supportDetails.duration ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Support Duration:</strong></td>
              <td style="padding: 8px 0;">${data.supportDetails.duration}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Access Your Student Portal
          </a>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">What You Can Do in Your Portal</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>View your financial support history</li>
            <li>Track your academic progress</li>
            <li>Upload required documents</li>
            <li>Participate in foundation programs</li>
            <li>Communicate with your coordinator</li>
            <li>Access educational resources</li>
          </ul>
        </div>
        
        ${data.coordinatorName ? `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">Your Coordinator</h4>
          <p style="margin-bottom: 0; color: #92400e;">
            <strong>${data.coordinatorName}</strong> will be your primary point of contact.
            ${data.coordinatorEmail ? ` You can reach them at ${data.coordinatorEmail}.` : ''}
          </p>
        </div>
        ` : ''}
        
        <p>We are committed to supporting your educational journey and helping you achieve your goals. Together, we will work towards your success!</p>
        
        <p>Welcome to the family!</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Academic Performance Alert Email
 */
export const academicPerformanceAlertTemplate = (data: {
  studentName: string;
  guardianName?: string;
  foundationName: string;
  alertType: 'low_performance' | 'improvement_needed' | 'failing_grade' | 'attendance_concern';
  details: {
    subject?: string;
    currentGrade?: string;
    expectedGrade?: string;
    attendanceRate?: string;
    reportingPeriod?: string;
  };
  recommendations: string[];
  coordinatorContact?: string;
  dashboardUrl?: string;
}): EmailTemplate => ({
  subject: `Academic Alert: ${data.studentName} - Action Required`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1>⚠️ Academic Performance Alert</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.guardianName || data.studentName},</h2>
        
        <p>We are writing to inform you about ${data.guardianName ? `${data.studentName}'s` : 'your'} academic performance that requires attention.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #dc2626;">
            ${data.alertType === 'low_performance' ? '📊 Low Academic Performance' :
              data.alertType === 'improvement_needed' ? '📈 Improvement Needed' :
              data.alertType === 'failing_grade' ? '❌ Failing Grade Alert' :
              '🕐 Attendance Concern'}
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Student:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${data.studentName}</td>
            </tr>
            ${data.details.subject ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Subject:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${data.details.subject}</td>
            </tr>
            ` : ''}
            ${data.details.currentGrade ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Current Grade:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${data.details.currentGrade}</td>
            </tr>
            ` : ''}
            ${data.details.expectedGrade ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Expected Grade:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${data.details.expectedGrade}</td>
            </tr>
            ` : ''}
            ${data.details.attendanceRate ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;"><strong>Attendance Rate:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #fecaca;">${data.details.attendanceRate}</td>
            </tr>
            ` : ''}
            ${data.details.reportingPeriod ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Reporting Period:</strong></td>
              <td style="padding: 8px 0;">${data.details.reportingPeriod}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #f59e0b;">💡 Recommended Actions</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.recommendations.map(rec => `<li style="margin-bottom: 8px;">${rec}</li>`).join('')}
          </ul>
        </div>
        
        ${data.dashboardUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.dashboardUrl}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            View Detailed Report
          </a>
        </div>
        ` : ''}
        
        <p>Early intervention is key to academic success. We encourage you to take these recommendations seriously and reach out for support.</p>
        
        ${data.coordinatorContact ? `<p><strong>Need Help?</strong> Contact your coordinator at ${data.coordinatorContact}</p>` : ''}
        
        <p>We are here to support academic excellence and are committed to helping ${data.guardianName ? data.studentName : 'you'} succeed.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Academic Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Financial Notification Email (Payment due, payment received, etc.)
 */
export const financialNotificationTemplate = (data: {
  recipientName: string;
  foundationName: string;
  notificationType: 'payment_due' | 'payment_received' | 'payment_overdue' | 'scholarship_disbursed' | 'fee_waiver_approved';
  amount: string;
  currency: string;
  dueDate?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  paymentUrl?: string;
  details?: string;
}): EmailTemplate => ({
  subject: `Financial Update: ${
    data.notificationType === 'payment_due' ? `Payment Due - ${data.amount}` :
    data.notificationType === 'payment_received' ? `Payment Received - ${data.amount}` :
    data.notificationType === 'payment_overdue' ? `Overdue Payment - ${data.amount}` :
    data.notificationType === 'scholarship_disbursed' ? `Scholarship Disbursed - ${data.amount}` :
    'Fee Waiver Approved'
  }`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${
        data.notificationType === 'payment_received' || data.notificationType === 'scholarship_disbursed' || data.notificationType === 'fee_waiver_approved' ? '#16a34a' :
        data.notificationType === 'payment_overdue' ? '#dc2626' : '#f59e0b'
      }; color: white; padding: 20px; text-align: center;">
        <h1>
          ${data.notificationType === 'payment_due' ? '💳 Payment Due' :
            data.notificationType === 'payment_received' ? '✅ Payment Received' :
            data.notificationType === 'payment_overdue' ? '⚠️ Payment Overdue' :
            data.notificationType === 'scholarship_disbursed' ? '🎓 Scholarship Disbursed' :
            '🎉 Fee Waiver Approved'}
        </h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.recipientName},</h2>
        
        <p>${
          data.notificationType === 'payment_due' ? 'This is a reminder that you have a payment due.' :
          data.notificationType === 'payment_received' ? 'We have successfully received your payment.' :
          data.notificationType === 'payment_overdue' ? 'Your payment is now overdue. Please make payment as soon as possible.' :
          data.notificationType === 'scholarship_disbursed' ? 'Your scholarship has been disbursed successfully!' :
          'Great news! Your fee waiver has been approved.'
        }</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${
          data.notificationType === 'payment_received' || data.notificationType === 'scholarship_disbursed' || data.notificationType === 'fee_waiver_approved' ? '#16a34a' :
          data.notificationType === 'payment_overdue' ? '#dc2626' : '#f59e0b'
        };">
          <h3 style="margin-top: 0; color: ${
            data.notificationType === 'payment_received' || data.notificationType === 'scholarship_disbursed' || data.notificationType === 'fee_waiver_approved' ? '#16a34a' :
            data.notificationType === 'payment_overdue' ? '#dc2626' : '#f59e0b'
          };">Financial Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; font-size: 18px;">${data.currency} ${data.amount}</td>
            </tr>
            ${data.invoiceNumber ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice/Reference:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${data.invoiceNumber}</td>
            </tr>
            ` : ''}
            ${data.dueDate ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Due Date:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${data.dueDate}</td>
            </tr>
            ` : ''}
            ${data.paymentMethod ? `
            <tr>
              <td style="padding: 8px 0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0;">${data.paymentMethod}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${data.details ? `
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #4b5563;">${data.details}</p>
        </div>
        ` : ''}
        
        ${data.paymentUrl && (data.notificationType === 'payment_due' || data.notificationType === 'payment_overdue') ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.paymentUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Make Payment Now
          </a>
        </div>
        ` : ''}
        
        <p>${
          data.notificationType === 'payment_due' ? 'Please ensure payment is made by the due date to avoid late fees.' :
          data.notificationType === 'payment_received' ? 'Thank you for your prompt payment. A receipt has been generated for your records.' :
          data.notificationType === 'payment_overdue' ? 'Please contact us immediately if you are experiencing financial difficulties.' :
          data.notificationType === 'scholarship_disbursed' ? 'Congratulations! Continue to excel in your studies.' :
          'This waiver has been applied to your account automatically.'
        }</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Finance Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Document Upload Required Email
 */
export const documentUploadRequiredTemplate = (data: {
  recipientName: string;
  foundationName: string;
  documentTypes: string[];
  dueDate?: string;
  uploadUrl?: string;
  instructions?: string;
}): EmailTemplate => ({
  subject: `Document Upload Required - ${data.foundationName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
        <h1>📋 Documents Required</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.recipientName},</h2>
        
        <p>We need you to upload the following documents to complete your records with ${data.foundationName}.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #f59e0b;">Required Documents</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.documentTypes.map(doc => `<li style="margin-bottom: 8px;">${doc}</li>`).join('')}
          </ul>
          ${data.dueDate ? `<p style="margin-top: 15px;"><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
        </div>
        
        ${data.instructions ? `
        <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0ea5e9;">Upload Instructions</h4>
          <p style="color: #0369a1; margin-bottom: 0;">${data.instructions}</p>
        </div>
        ` : ''}
        
        ${data.uploadUrl ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.uploadUrl}" style="background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Upload Documents
          </a>
        </div>
        ` : ''}
        
        <p>Please upload these documents as soon as possible to ensure your application or account remains active.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Documentation Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * System Maintenance Notification Email
 */
export const systemMaintenanceTemplate = (data: {
  foundationName: string;
  maintenanceType: 'scheduled' | 'emergency' | 'completed';
  startTime?: string;
  endTime?: string;
  expectedDuration?: string;
  affectedServices?: string[];
  alternativeAccess?: string;
}): EmailTemplate => ({
  subject: `${data.maintenanceType === 'scheduled' ? '🔧 Scheduled' : data.maintenanceType === 'emergency' ? '⚠️ Emergency' : '✅ Completed'} System Maintenance - ${data.foundationName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${data.maintenanceType === 'completed' ? '#16a34a' : data.maintenanceType === 'emergency' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center;">
        <h1>
          ${data.maintenanceType === 'scheduled' ? '🔧 Scheduled Maintenance' : 
            data.maintenanceType === 'emergency' ? '⚠️ Emergency Maintenance' : 
            '✅ Maintenance Completed'}
        </h1>
        <p>TheOyinbooke Foundation System Notice</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear Users,</h2>
        
        <p>${
          data.maintenanceType === 'scheduled' ? 
            'We will be performing scheduled system maintenance to improve our services.' :
          data.maintenanceType === 'emergency' ? 
            'We are currently performing emergency maintenance to resolve system issues.' :
            'System maintenance has been completed successfully.'
        }</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.maintenanceType === 'completed' ? '#16a34a' : data.maintenanceType === 'emergency' ? '#dc2626' : '#f59e0b'};">
          <h3 style="margin-top: 0; color: ${data.maintenanceType === 'completed' ? '#16a34a' : data.maintenanceType === 'emergency' ? '#dc2626' : '#f59e0b'};">Maintenance Details</h3>
          
          ${data.startTime ? `<p><strong>Start Time:</strong> ${data.startTime}</p>` : ''}
          ${data.endTime ? `<p><strong>End Time:</strong> ${data.endTime}</p>` : ''}
          ${data.expectedDuration ? `<p><strong>Expected Duration:</strong> ${data.expectedDuration}</p>` : ''}
          
          ${data.affectedServices && data.affectedServices.length > 0 ? `
          <div style="margin-top: 15px;">
            <p><strong>Affected Services:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${data.affectedServices.map(service => `<li>${service}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
        
        ${data.alternativeAccess && data.maintenanceType !== 'completed' ? `
        <div style="background-color: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #0ea5e9;">Alternative Access</h4>
          <p style="color: #0369a1; margin-bottom: 0;">${data.alternativeAccess}</p>
        </div>
        ` : ''}
        
        <p>${
          data.maintenanceType === 'scheduled' ? 
            'We apologize for any inconvenience this may cause and appreciate your patience.' :
          data.maintenanceType === 'emergency' ? 
            'We are working to resolve this as quickly as possible and will notify you when services are restored.' :
            'All services are now fully operational. Thank you for your patience during the maintenance window.'
        }</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Technical Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Password Reset Email
 */
export const passwordResetTemplate = (data: {
  userName: string;
  resetUrl: string;
  expirationTime: string;
  ipAddress?: string;
  foundationName: string;
}): EmailTemplate => ({
  subject: `Password Reset Request - ${data.foundationName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center;">
        <h1>🔐 Password Reset</h1>
        <p>TheOyinbooke Foundation</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.userName},</h2>
        
        <p>We received a request to reset your password for your ${data.foundationName} account.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #374151;">
          <h3 style="margin-top: 0; color: #374151;">Reset Instructions</h3>
          <p>Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${data.resetUrl}" style="background-color: #374151; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="font-family: monospace; word-break: break-all;">${data.resetUrl}</span>
          </p>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #92400e;">Important Security Information</h4>
          <ul style="margin: 10px 0; padding-left: 20px; color: #92400e;">
            <li>This link expires in ${data.expirationTime}</li>
            <li>This link can only be used once</li>
            ${data.ipAddress ? `<li>Request came from IP address: ${data.ipAddress}</li>` : ''}
            <li>If you didn't request this reset, please ignore this email</li>
          </ul>
        </div>
        
        <p>If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
        
        <p>For security questions, contact our support team immediately.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Security Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated security message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

/**
 * Generic System Notification Email
 */
export const systemNotificationTemplate = (data: {
  recipientName: string;
  foundationName: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'information' | 'warning' | 'success' | 'error';
  actionUrl?: string;
  actionText?: string;
  timestamp?: string;
}): EmailTemplate => ({
  subject: `${data.priority === 'urgent' ? '🚨 URGENT: ' : data.priority === 'high' ? '⚠️ ' : ''}${data.title}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${
        data.category === 'success' ? '#16a34a' :
        data.category === 'error' ? '#dc2626' :
        data.category === 'warning' ? '#f59e0b' : '#374151'
      }; color: white; padding: 20px; text-align: center;">
        <h1>
          ${data.category === 'success' ? '✅' :
            data.category === 'error' ? '❌' :
            data.category === 'warning' ? '⚠️' : 'ℹ️'} ${data.title}
        </h1>
        <p>TheOyinbooke Foundation${data.priority === 'urgent' ? ' - URGENT' : ''}</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.recipientName},</h2>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${
          data.category === 'success' ? '#16a34a' :
          data.category === 'error' ? '#dc2626' :
          data.category === 'warning' ? '#f59e0b' : '#374151'
        };">
          <div style="margin-bottom: 15px;">
            <span style="background-color: ${
              data.priority === 'urgent' ? '#dc2626' :
              data.priority === 'high' ? '#f59e0b' :
              data.priority === 'medium' ? '#0ea5e9' : '#6b7280'
            }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
              ${data.priority} Priority
            </span>
          </div>
          
          <div style="color: #374151; line-height: 1.6;">
            ${data.message}
          </div>
          
          ${data.timestamp ? `
          <div style="margin-top: 15px; font-size: 14px; color: #6b7280;">
            <strong>Timestamp:</strong> ${data.timestamp}
          </div>
          ` : ''}
        </div>
        
        ${data.actionUrl && data.actionText ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.actionUrl}" style="background-color: ${
            data.category === 'success' ? '#16a34a' :
            data.category === 'error' ? '#dc2626' :
            data.category === 'warning' ? '#f59e0b' : '#374151'
          }; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            ${data.actionText}
          </a>
        </div>
        ` : ''}
        
        <p>This notification was sent to keep you informed about important updates regarding your ${data.foundationName} account.</p>
        
        <p>Best regards,<br>
        The ${data.foundationName} Team</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  `,
});

export {
  replaceVariables,
};