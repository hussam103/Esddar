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
  baseUrl: string,
  language: string = 'ar' // Default to Arabic
): Promise<boolean> {
  try {
    const token = generateEmailConfirmationToken(userId, email);
    const confirmationLink = `${baseUrl}/confirm-email?token=${token}`;
    
    // Get translations based on language
    const subject = language === 'ar' 
      ? 'تأكيد حساب إصدار الخاص بك' 
      : 'Confirm Your Esddar Account';
    
    const welcomeText = language === 'ar' 
      ? `مرحباً بك في إصدار!` 
      : 'Welcome to Esddar!';
    
    const thankYouText = language === 'ar' 
      ? `شكراً للتسجيل، ${username}. يرجى تأكيد عنوان بريدك الإلكتروني للمتابعة.` 
      : `Thank you for registering, ${username}. Please confirm your email address to continue.`;
    
    const buttonText = language === 'ar' 
      ? 'تأكيد عنوان البريد الإلكتروني' 
      : 'Confirm Email Address';
    
    const disclaimerText = language === 'ar' 
      ? 'إذا لم تقم بإنشاء حساب في إصدار، يمكنك تجاهل هذا البريد الإلكتروني بأمان.' 
      : 'If you didn\'t create an Esddar account, you can safely ignore this email.';
    
    const expiryText = language === 'ar' 
      ? 'رابط التأكيد سينتهي خلال 24 ساعة.' 
      : 'The confirmation link will expire in 24 hours.';
    
    const footerText = language === 'ar' 
      ? `إصدار - منصة مطابقة المناقصات المدعومة بالذكاء الاصطناعي<br>&copy; ${new Date().getFullYear()} إصدار. جميع الحقوق محفوظة.` 
      : `Esddar - AI-Powered Tender Matching Platform<br>&copy; ${new Date().getFullYear()} Esddar. All rights reserved.`;
    
    // Define text direction based on language
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    
    await mailService.send({
      to: email,
      from: 'support@esddar.com',
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; direction: ${direction}; text-align: ${language === 'ar' ? 'right' : 'left'};">
          <!-- Header -->
          <div style="background-color: #1e40af; padding: 20px; text-align: center;">
            <div style="display: inline-block; width: 40px; height: 40px; background-color: #1e40af; border-radius: 8px; margin-bottom: 10px;">
              <div style="background-color: rgba(255, 255, 255, 0.9); width: 36px; height: 36px; margin: 2px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: #1e40af;">
                ${language === 'ar' ? 'إ' : 'E'}
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${language === 'ar' ? 'إصدار' : 'Esddar'}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #1e40af; margin-top: 0; margin-bottom: 20px; font-size: 20px;">${welcomeText}</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">${thankYouText}</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationLink}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                ${buttonText}
              </a>
            </div>
            
            <p style="color: #555; font-size: 14px; margin-bottom: 10px;">${disclaimerText}</p>
            <p style="color: #555; font-size: 14px; margin-bottom: 10px;">${expiryText}</p>
            
            <!-- Divider -->
            <div style="border-top: 1px solid #e0e0e0; margin: 30px 0;"></div>
            
            <!-- Advantages List -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; margin-bottom: 15px;">
                ${language === 'ar' ? 'ما يمكنك القيام به مع إصدار:' : 'What you can do with Esddar:'}
              </h3>
              <ul style="padding-${language === 'ar' ? 'right' : 'left'}: 20px; margin: 0; color: #444;">
                <li style="margin-bottom: 10px;">
                  ${language === 'ar' 
                    ? 'البحث عن المناقصات الحكومية ذات الصلة بعملك' 
                    : 'Find government tenders relevant to your business'}
                </li>
                <li style="margin-bottom: 10px;">
                  ${language === 'ar' 
                    ? 'الحصول على توصيات مخصصة بناءً على ملف شركتك' 
                    : 'Get personalized recommendations based on your company profile'}
                </li>
                <li style="margin-bottom: 10px;">
                  ${language === 'ar' 
                    ? 'تقديم عروض احترافية باستخدام أدواتنا وقوالبنا' 
                    : 'Submit professional proposals using our tools and templates'}
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">${footerText}</p>
            <p style="margin: 0;">
              <a href="${baseUrl}" style="color: #1e40af; text-decoration: none;">${baseUrl}</a>
            </p>
          </div>
        </div>
      `,
      text: language === 'ar' 
        ? `
          مرحباً بك في إصدار!
          
          شكراً للتسجيل، ${username}. يرجى تأكيد عنوان بريدك الإلكتروني بزيارة هذا الرابط:
          ${confirmationLink}
          
          إذا لم تقم بإنشاء حساب في إصدار، يمكنك تجاهل هذا البريد الإلكتروني بأمان.
          رابط التأكيد سينتهي خلال 24 ساعة.
        `
        : `
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
  email: string,
  language: string = 'ar' // Default to Arabic
): Promise<boolean> {
  try {
    // Get translations based on language
    const subject = language === 'ar' 
      ? 'مرحباً بك في إصدار - لنبدأ!' 
      : 'Welcome to Esddar - Let\'s Get Started!';
    
    const welcomeText = language === 'ar' 
      ? `مرحباً بك في إصدار!` 
      : 'Welcome to Esddar!';
    
    const greetingText = language === 'ar' 
      ? `مرحباً ${username}،` 
      : `Hello ${username},`;
    
    const confirmationText = language === 'ar' 
      ? 'تم تأكيد بريدك الإلكتروني وتفعيل حسابك. إليك ما يمكنك القيام به بعد ذلك:' 
      : 'Your email has been confirmed and your account is now active. Here\'s what you can do next:';
    
    const step1 = language === 'ar' 
      ? 'قم بتحميل ملف تعريف شركتك لمساعدتنا في مطابقتك مع المناقصات ذات الصلة' 
      : 'Upload your company profile document to help us match you with relevant tenders';
    
    const step2 = language === 'ar' 
      ? 'اختر باقة اشتراك تناسب احتياجات عملك' 
      : 'Choose a subscription package that fits your business needs';
    
    const step3 = language === 'ar' 
      ? 'قم بإعداد تفضيلاتك للحصول على توصيات مناقصات أفضل' 
      : 'Set up your preferences for better tender recommendations';
    
    const closingText = language === 'ar' 
      ? 'لنبدأ في العثور على المناقصات الحكومية المثالية لشركتك!' 
      : 'Let\'s get started on finding the perfect government tenders for your business!';
    
    const buttonText = language === 'ar' 
      ? 'انتقل إلى لوحة التحكم' 
      : 'Go to Dashboard';
    
    const footerText = language === 'ar' 
      ? `إصدار - منصة مطابقة المناقصات المدعومة بالذكاء الاصطناعي<br>&copy; ${new Date().getFullYear()} إصدار. جميع الحقوق محفوظة.` 
      : `Esddar - AI-Powered Tender Matching Platform<br>&copy; ${new Date().getFullYear()} Esddar. All rights reserved.`;
    
    // Define text direction based on language
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    
    await mailService.send({
      to: email,
      from: 'support@esddar.com',
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; direction: ${direction}; text-align: ${language === 'ar' ? 'right' : 'left'};">
          <!-- Header with Celebration Banner -->
          <div style="background-color: #1e40af; padding: 20px; text-align: center; background-image: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
            <div style="display: inline-block; width: 40px; height: 40px; background-color: #1e40af; border-radius: 8px; margin-bottom: 10px;">
              <div style="background-color: rgba(255, 255, 255, 0.9); width: 36px; height: 36px; margin: 2px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: #1e40af;">
                ${language === 'ar' ? 'إ' : 'E'}
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${language === 'ar' ? 'إصدار' : 'Esddar'}</h1>
            <div style="margin-top: 15px; font-size: 18px; color: white;">🎉 ${welcomeText} 🎉</div>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #1e40af; margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #eef2ff; padding-bottom: 10px;">${greetingText}</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">${confirmationText}</p>
            
            <!-- Steps with icons -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="min-width: 36px; height: 36px; background-color: #1e40af; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-${language === 'ar' ? 'left' : 'right'}: 15px;">1</div>
                <div>${step1}</div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <div style="min-width: 36px; height: 36px; background-color: #1e40af; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-${language === 'ar' ? 'left' : 'right'}: 15px;">2</div>
                <div>${step2}</div>
              </div>
              
              <div style="display: flex; align-items: center;">
                <div style="min-width: 36px; height: 36px; background-color: #1e40af; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-${language === 'ar' ? 'left' : 'right'}: 15px;">3</div>
                <div>${step3}</div>
              </div>
            </div>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">${closingText}</p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                ${buttonText}
              </a>
            </div>
          </div>
          
          <!-- Featured Section -->
          <div style="padding: 20px; background-color: #eef2ff; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
            <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; margin-bottom: 15px;">
              ${language === 'ar' ? 'ميزات مميزة:' : 'Featured Benefits:'}
            </h3>
            <ul style="padding-${language === 'ar' ? 'right' : 'left'}: 20px; margin: 0; color: #444;">
              <li style="margin-bottom: 10px;">
                ${language === 'ar' 
                  ? 'توفير الوقت والجهد في البحث عن المناقصات' 
                  : 'Save time and effort searching for tenders'}
              </li>
              <li style="margin-bottom: 10px;">
                ${language === 'ar' 
                  ? 'زيادة معدل النجاح مع توصيات مخصصة' 
                  : 'Increase success rate with personalized recommendations'}
              </li>
              <li style="margin-bottom: 10px;">
                ${language === 'ar' 
                  ? 'تتبع تقدم تطبيقاتك وإدارتها بكفاءة' 
                  : 'Track and manage your applications efficiently'}
              </li>
            </ul>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">${footerText}</p>
            <div style="margin-top: 15px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
              <a href="#" style="color: #1e40af; text-decoration: none; margin: 0 10px;">
                ${language === 'ar' ? 'مركز المساعدة' : 'Help Center'}
              </a>
              <a href="#" style="color: #1e40af; text-decoration: none; margin: 0 10px;">
                ${language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
              </a>
              <a href="#" style="color: #1e40af; text-decoration: none; margin: 0 10px;">
                ${language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
              </a>
            </div>
          </div>
        </div>
      `,
      text: language === 'ar' 
        ? `
          مرحباً بك في إصدار!
          
          مرحباً ${username}،
          
          تم تأكيد بريدك الإلكتروني وتفعيل حسابك. إليك ما يمكنك القيام به بعد ذلك:
          
          1. قم بتحميل ملف تعريف شركتك لمساعدتنا في مطابقتك مع المناقصات ذات الصلة
          2. اختر باقة اشتراك تناسب احتياجات عملك
          3. قم بإعداد تفضيلاتك للحصول على توصيات مناقصات أفضل
          
          لنبدأ في العثور على المناقصات الحكومية المثالية لشركتك!
        `
        : `
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
  endDate: Date,
  language: string = 'ar' // Default to Arabic
): Promise<boolean> {
  try {
    // Get translations based on language
    const subject = language === 'ar' 
      ? 'اشتراكك في إصدار مفعل الآن!' 
      : 'Your Esddar Subscription is Active!';
    
    const headerText = language === 'ar' 
      ? 'تم تأكيد الاشتراك' 
      : 'Subscription Confirmed';
    
    const greetingText = language === 'ar' 
      ? `مرحباً ${username}،` 
      : `Hello ${username},`;
    
    const thankYouText = language === 'ar' 
      ? `شكراً لاشتراكك في باقة <strong>${plan}</strong>. اشتراكك مفعل الآن.` 
      : `Thank you for subscribing to our <strong>${plan}</strong> plan. Your subscription is now active.`;
    
    const detailsText = language === 'ar' 
      ? 'تفاصيل الاشتراك:' 
      : 'Subscription details:';
    
    const planText = language === 'ar' 
      ? `الباقة: ${plan}` 
      : `Plan: ${plan}`;
    
    const validUntilText = language === 'ar' 
      ? `صالح حتى: ${endDate.toLocaleDateString('ar')}` 
      : `Valid until: ${endDate.toLocaleDateString()}`;
    
    const accessText = language === 'ar' 
      ? 'لديك الآن وصول كامل إلى جميع الميزات المضمنة في اشتراكك.' 
      : 'You now have full access to all features included in your subscription.';
    
    const featuresText = language === 'ar' 
      ? 'ميزات متاحة في اشتراكك:' 
      : 'Features available in your subscription:';
    
    // Define features based on plan
    const features = {
      "basic": {
        ar: [
          "حتى 20 توصية مناقصة شهرياً",
          "مطابقة ذكاء اصطناعي أساسية",
          "3 مناقصات محفوظة",
          "إشعارات البريد الإلكتروني"
        ],
        en: [
          "Up to 20 tender recommendations monthly",
          "Basic AI matching",
          "3 saved tenders",
          "Email notifications"
        ]
      },
      "professional": {
        ar: [
          "توصيات مناقصات غير محدودة",
          "مطابقة ذكاء اصطناعي متقدمة",
          "20 مناقصة محفوظة",
          "قوالب للعروض",
          "تحليلات أساسية"
        ],
        en: [
          "Unlimited tender recommendations",
          "Advanced AI matching",
          "20 saved tenders",
          "Proposal templates",
          "Basic analytics"
        ]
      },
      "enterprise": {
        ar: [
          "كل ما في الباقة الاحترافية",
          "مطابقة ذكاء اصطناعي متميزة",
          "مناقصات محفوظة غير محدودة",
          "تحليلات وتقارير متقدمة",
          "وصول API",
          "مدير حساب مخصص"
        ],
        en: [
          "Everything in the Professional plan",
          "Premium AI matching",
          "Unlimited saved tenders",
          "Advanced analytics and reports",
          "API access",
          "Dedicated account manager"
        ]
      }
    };
    
    // Get the features list for the plan and language
    const planFeatures = features[plan.toLowerCase()] 
      ? features[plan.toLowerCase()][language === 'ar' ? 'ar' : 'en'] 
      : [];
    
    const startExploringText = language === 'ar' 
      ? 'ابدأ في استكشاف المناقصات' 
      : 'Start Exploring Tenders';
    
    const footerText = language === 'ar' 
      ? `إصدار - منصة مطابقة المناقصات المدعومة بالذكاء الاصطناعي<br>&copy; ${new Date().getFullYear()} إصدار. جميع الحقوق محفوظة.` 
      : `Esddar - AI-Powered Tender Matching Platform<br>&copy; ${new Date().getFullYear()} Esddar. All rights reserved.`;
    
    // Define text direction based on language
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    
    await mailService.send({
      to: email,
      from: 'support@esddar.com',
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; direction: ${direction}; text-align: ${language === 'ar' ? 'right' : 'left'};">
          <!-- Header with Success Banner -->
          <div style="background-color: #059669; padding: 20px; text-align: center; background-image: linear-gradient(135deg, #059669 0%, #10b981 100%);">
            <div style="display: inline-block; width: 40px; height: 40px; background-color: #059669; border-radius: 50%; margin-bottom: 10px;">
              <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; color: white;">
                ✓
              </div>
            </div>
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${headerText}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <h2 style="color: #1e40af; margin-top: 0; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #eef2ff; padding-bottom: 10px;">${greetingText}</h2>
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">${thankYouText}</p>
            
            <!-- Subscription Details -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; margin-bottom: 15px;">${detailsText}</h3>
              <div style="display: flex; margin-bottom: 10px;">
                <div style="min-width: 120px; font-weight: 600; color: #4b5563;">${language === 'ar' ? 'الباقة:' : 'Plan:'}</div>
                <div style="color: #1e40af; font-weight: 600;">${plan}</div>
              </div>
              <div style="display: flex; margin-bottom: 10px;">
                <div style="min-width: 120px; font-weight: 600; color: #4b5563;">${language === 'ar' ? 'صالح حتى:' : 'Valid until:'}</div>
                <div>${endDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</div>
              </div>
            </div>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 25px;">${accessText}</p>
            
            <!-- Features List -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #1e40af; margin-top: 0; font-size: 16px; margin-bottom: 15px;">${featuresText}</h3>
              <ul style="padding-${language === 'ar' ? 'right' : 'left'}: 20px; margin: 0; color: #444;">
                ${planFeatures.map(feature => `
                  <li style="margin-bottom: 10px;">
                    ${feature}
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="/dashboard" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                ${startExploringText}
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">${footerText}</p>
            <div style="margin-top: 15px; border-top: 1px solid #e0e0e0; padding-top: 15px;">
              <a href="#" style="color: #1e40af; text-decoration: none; margin: 0 10px;">
                ${language === 'ar' ? 'إدارة الاشتراك' : 'Manage Subscription'}
              </a>
              <a href="#" style="color: #1e40af; text-decoration: none; margin: 0 10px;">
                ${language === 'ar' ? 'الدعم الفني' : 'Support'}
              </a>
            </div>
          </div>
        </div>
      `,
      text: language === 'ar' 
        ? `
          ${headerText}
          
          ${greetingText}
          
          ${thankYouText.replace(/<\/?strong>/g, '')}
          
          ${detailsText}
          - ${planText}
          - ${validUntilText}
          
          ${accessText}
          
          ${featuresText}
          ${planFeatures.map(feature => `- ${feature}`).join('\n')}
        `
        : `
          ${headerText}
          
          ${greetingText}
          
          ${thankYouText.replace(/<\/?strong>/g, '')}
          
          ${detailsText}
          - ${planText}
          - ${validUntilText}
          
          ${accessText}
          
          ${featuresText}
          ${planFeatures.map(feature => `- ${feature}`).join('\n')}
        `
    });
    
    return true;
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    return false;
  }
}