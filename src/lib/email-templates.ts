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

export {
  replaceVariables,
};