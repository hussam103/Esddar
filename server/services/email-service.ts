import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';
import { storage } from '../storage';

// Initialize SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY environment variable not set!');
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY || '');

// Store confirmation tokens temporarily (in production, this should be in the database)
export const emailConfirmationTokens = new Map<string, { userId: number, email: string, expires: Date }>();

/**
 * Generate a confirmation token for email verification
 */
export function generateEmailConfirmationToken(userId: number, email: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // Token valid for 24 hours
  
  emailConfirmationTokens.set(token, { userId, email, expires });
  return token;
}

/**
 * Verify a confirmation token and update user status
 */
export async function verifyEmailConfirmationToken(token: string): Promise<boolean> {
  const confirmation = emailConfirmationTokens.get(token);
  
  if (!confirmation) {
    return false; // Token not found
  }
  
  if (confirmation.expires < new Date()) {
    emailConfirmationTokens.delete(token);
    return false; // Token expired
  }
  
  // Update user as verified in the database
  await storage.updateUser(confirmation.userId, { 
    emailVerified: true,
    onboardingStep: 'upload_document', // Set the first onboarding step
  });
  
  // Delete used token
  emailConfirmationTokens.delete(token);
  return true;
}

/**
 * Send a confirmation email to a newly registered user
 */
export async function sendConfirmationEmail(
  userId: number,
  username: string, 
  email: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const token = generateEmailConfirmationToken(userId, email);
    const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;
    
    await mailService.send({
      to: email,
      from: 'support@esddar.com', // Replace with your verified sender email
      subject: 'Confirm Your Esddar Account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to Esddar!</h2>
          <p>Thank you for registering, ${username}. Please confirm your email address to continue.</p>
          <p>
            <a href="${confirmationLink}" style="background-color: #4F46E5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Confirm Email Address
            </a>
          </p>
          <p>If you didn't create an Esddar account, you can safely ignore this email.</p>
          <p>The confirmation link will expire in 24 hours.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Esddar - AI-Powered Tender Matching Platform<br>
            &copy; ${new Date().getFullYear()} Esddar. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Welcome to Esddar!
        
        Thank you for registering, ${username}. Please confirm your email address by visiting this link:
        ${confirmationLink}
        
        If you didn't create an Esddar account, you can safely ignore this email.
        The confirmation link will expire in 24 hours.
      `
    });
    
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
}

/**
 * Send a welcome email after email is confirmed
 */
export async function sendWelcomeEmail(
  username: string, 
  email: string
): Promise<boolean> {
  try {
    await mailService.send({
      to: email,
      from: 'support@esddar.com', // Replace with your verified sender email
      subject: 'Welcome to Esddar - Let\'s Get Started!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Welcome to Esddar!</h2>
          <p>Hello ${username},</p>
          <p>Your email has been confirmed and your account is now active. Here's what you can do next:</p>
          <ol>
            <li>Upload your company profile document to help us match you with relevant tenders</li>
            <li>Choose a subscription package that fits your business needs</li>
            <li>Set up your preferences for better tender recommendations</li>
          </ol>
          <p>Let's get started on finding the perfect government tenders for your business!</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Esddar - AI-Powered Tender Matching Platform<br>
            &copy; ${new Date().getFullYear()} Esddar. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Welcome to Esddar!
        
        Hello ${username},
        
        Your email has been confirmed and your account is now active. Here's what you can do next:
        
        1. Upload your company profile document to help us match you with relevant tenders
        2. Choose a subscription package that fits your business needs
        3. Set up your preferences for better tender recommendations
        
        Let's get started on finding the perfect government tenders for your business!
      `
    });
    
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send a notification when user completes a subscription payment
 */
export async function sendSubscriptionConfirmationEmail(
  username: string, 
  email: string,
  plan: string,
  endDate: Date
): Promise<boolean> {
  try {
    await mailService.send({
      to: email,
      from: 'support@esddar.com', // Replace with your verified sender email
      subject: 'Your Esddar Subscription is Active!',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Subscription Confirmed</h2>
          <p>Hello ${username},</p>
          <p>Thank you for subscribing to our <strong>${plan}</strong> plan. Your subscription is now active.</p>
          <p>Subscription details:</p>
          <ul>
            <li>Plan: ${plan}</li>
            <li>Valid until: ${endDate.toLocaleDateString()}</li>
          </ul>
          <p>You now have full access to all features included in your subscription.</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Esddar - AI-Powered Tender Matching Platform<br>
            &copy; ${new Date().getFullYear()} Esddar. All rights reserved.
          </p>
        </div>
      `,
      text: `
        Subscription Confirmed
        
        Hello ${username},
        
        Thank you for subscribing to our ${plan} plan. Your subscription is now active.
        
        Subscription details:
        - Plan: ${plan}
        - Valid until: ${endDate.toLocaleDateString()}
        
        You now have full access to all features included in your subscription.
      `
    });
    
    return true;
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    return false;
  }
}