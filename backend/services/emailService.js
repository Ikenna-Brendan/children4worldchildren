const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

// Models and services
const { EmailLog } = require('../models');
const EmailTemplateService = require('../utils/emailTemplates');
const logger = require('../utils/logger');

// Email service configuration
const config = {
  // Default from address
  from: process.env.SMTP_FROM || `"${process.env.APP_NAME || 'No-Reply'}" <noreply@example.com>`,
  
  // Reply-to address
  replyTo: process.env.SUPPORT_EMAIL || 'support@example.com',
  
  // Test mode - when true, emails are logged but not sent
  testMode: process.env.NODE_ENV === 'test',
  
  // Max retry attempts for failed sends
  maxRetries: 3,
  
  // Retry delay in milliseconds
  retryDelay: 5000
};

// Create a test account for development
let testAccount;
let transporter;

/**
 * Initialize email service
 */
const initTransporter = async () => {
  if (transporter) return transporter;
  
  // In test environment, use ethereal email
  if (process.env.NODE_ENV === 'test' || !process.env.SMTP_HOST) {
    logger.info('Using Ethereal test email account');
    testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      logger: false,
      debug: process.env.NODE_ENV === 'development'
    });
    
    // Log test account credentials
    logger.info('Test account credentials:', {
      email: testAccount.user,
      password: testAccount.pass,
      webmail: 'https://ethereal.email/login'
    });
    
    return transporter;
  }
  
  // Use real SMTP in production/staging
  logger.info('Initializing SMTP transport');
  
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  };
  
  // Handle self-signed certificates
  if (process.env.SMTP_IGNORE_TLS === 'true') {
    smtpConfig.tls = { rejectUnauthorized: false };
  }
  
  transporter = nodemailer.createTransport(smtpConfig);
  
  // Verify connection configuration
  try {
    await transporter.verify();
    logger.info('SMTP connection verified successfully');
  } catch (error) {
    logger.error('Failed to verify SMTP connection:', error);
    throw new Error('Failed to initialize email service');
  }
  
  return transporter;
};

/**
 * Create an email log entry
 * @param {Object} options - Email options
 * @param {Object} templateInfo - Template information
 * @param {string} status - Initial status
 * @returns {Promise<Object>} Email log entry
 */
const createEmailLog = async (options, templateInfo, status = 'pending') => {
  try {
    const logData = {
      id: uuidv4(),
      templateId: templateInfo?.id || null,
      templateName: templateInfo?.name || 'custom',
      from: options.from || config.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : null,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : null,
      subject: options.subject || '',
      status,
      error: null,
      messageId: null,
      metadata: {
        ip: options.ip,
        userAgent: options.userAgent,
        ...(options.metadata || {})
      },
      retryCount: 0
    };

    const log = await EmailLog.create(logData);
    return log.get({ plain: true });
  } catch (error) {
    logger.error('Failed to create email log:', error);
    throw error;
  }
};

/**
 * Update email log status
 * @param {string} logId - Email log ID
 * @param {Object} update - Update data
 * @returns {Promise<void>}
 */
const updateEmailLog = async (logId, update) => {
  try {
    await EmailLog.update(update, {
      where: { id: logId },
      silent: true // Don't update timestamps
    });
  } catch (error) {
    logger.error('Failed to update email log:', error);
    // Don't throw to avoid breaking email sending flow
  }
};

/**
 * Send an email with retry logic
 * @param {Object} mailOptions - Nodemailer mail options
 * @param {Object} log - Email log entry
 * @param {number} attempt - Current attempt number
 * @returns {Promise<Object>} Email sending result
 */
const sendWithRetry = async (mailOptions, log, attempt = 1) => {
  const transport = await initTransporter();
  
  try {
    const info = await transport.sendMail(mailOptions);
    
    // Update log with success
    await updateEmailLog(log.id, {
      status: 'sent',
      messageId: info.messageId,
      sentAt: new Date(),
      metadata: {
        ...(log.metadata || {}),
        envelope: info.envelope,
        response: info.response
      }
    });
    
    // Log the email preview URL in development
    if (testAccount && info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        logger.info(`Preview email: ${previewUrl}`);
      }
    }
    
    return { success: true, info };
  } catch (error) {
    // Update log with error
    await updateEmailLog(log.id, {
      status: attempt >= config.maxRetries ? 'failed' : 'retrying',
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        attempt,
        maxAttempts: config.maxRetries
      },
      retryCount: attempt
    });
    
    // Retry if we haven't reached max retries
    if (attempt < config.maxRetries) {
      logger.warn(`Email send attempt ${attempt} failed, retrying in ${config.retryDelay}ms...`, {
        error: error.message,
        messageId: log.messageId
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
      return sendWithRetry(mailOptions, log, attempt + 1);
    }
    
    logger.error(`Failed to send email after ${attempt} attempts:`, error);
    return { success: false, error };
  }
};

/**
 * Send an email using a template
 * @param {string} templateName - Name of the template to use
 * @param {Object} data - Data to render the template with
 * @param {Object} options - Additional email options
 * @returns {Promise<Object>} Result of the email sending operation
 */
const sendTemplatedEmail = async (templateName, data = {}, options = {}) => {
  try {
    // 1. Load and render the template
    const template = await EmailTemplateService.renderTemplate(templateName, data);
    
    // 2. Prepare email options
    const mailOptions = {
      from: options.from || config.from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || config.replyTo,
      subject: options.subject || template.subject,
      html: template.html,
      text: template.text || stripHtml(template.html).result,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
        ...(options.headers || {})
      },
      // Additional Nodemailer options
      ...options
    };
    
    // 3. Create email log
    const log = await createEmailLog(mailOptions, { name: templateName });
    
    // 4. Send email (or simulate in test mode)
    if (config.testMode) {
      logger.info('Test mode: Email not sent (test mode enabled)');
      await updateEmailLog(log.id, { status: 'test', testMode: true });
      return { success: true, testMode: true, messageId: `test-${Date.now()}` };
    }
    
    // 5. Send with retry logic
    const result = await sendWithRetry(mailOptions, log);
    
    if (!result.success) {
      // If we get here, all retries have failed
      logger.error('All retry attempts failed for email:', {
        template: templateName,
        to: mailOptions.to,
        error: result.error?.message
      });
      
      // Notify admin of critical email failures
      if (process.env.NODE_ENV === 'production') {
        await notifyAdminOfEmailFailure(log, result.error);
      }
    }
    
    return {
      success: result.success,
      messageId: result.info?.messageId,
      logId: log.id
    };
    
  } catch (error) {
    logger.error('Error in sendTemplatedEmail:', error);
    throw error;
  }
};

/**
 * Send a custom email without using a template
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Result of the email sending operation
 */
const sendEmail = async (options) => {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Recipient email address is required');
    }
    
    if (!options.subject && !options.text && !options.html) {
      throw new Error('Email must have a subject and either text or HTML content');
    }
    
    // Prepare email options
    const mailOptions = {
      from: options.from || config.from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || config.replyTo,
      subject: options.subject || '(No subject)',
      text: options.text,
      html: options.html,
      headers: {
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
        ...(options.headers || {})
      },
      // Additional Nodemailer options
      ...options
    };
    
    // Create email log
    const log = await createEmailLog(mailOptions, { name: 'custom' });
    
    // Send email (or simulate in test mode)
    if (config.testMode) {
      logger.info('Test mode: Email not sent (test mode enabled)');
      await updateEmailLog(log.id, { status: 'test', testMode: true });
      return { success: true, testMode: true, messageId: `test-${Date.now()}` };
    }
    
    // Send with retry logic
    const result = await sendWithRetry(mailOptions, log);
    
    if (!result.success) {
      logger.error('Failed to send custom email:', {
        to: mailOptions.to,
        error: result.error?.message
      });
    }
    
    return {
      success: result.success,
      messageId: result.info?.messageId,
      logId: log.id
    };
    
  } catch (error) {
    logger.error('Error in sendEmail:', error);
    throw error;
  }
};

/**
 * Send event reminder email
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.eventTitle - Event title
 * @param {string} params.eventDate - Event date
 * @param {string} params.eventLocation - Event location
 * @param {string} params.attendeeName - Attendee name
 * @returns {Promise<Object>} Result of the email sending operation
 */
const sendEventReminderEmail = async ({ to, eventTitle, eventDate, eventLocation, attendeeName }) => {
  try {
    const result = await sendTemplatedEmail('event_reminder', {
      eventTitle,
      eventDate,
      eventLocation,
      attendeeName,
      eventLink: `${process.env.FRONTEND_URL}/events`
    }, {
      to,
      subject: `Reminder: ${eventTitle} is coming up soon!`,
      metadata: {
        event: eventTitle,
        type: 'event_reminder'
      }
    });

    return result;
  } catch (error) {
    logger.error('Error sending event reminder email:', error);
    throw error;
  }
};

/**
 * Notify admin of email sending failure
 * @private
 */
async function notifyAdminOfEmailFailure(log, error) {
  if (!process.env.ADMIN_EMAIL) return;
  
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `[${process.env.APP_NAME || 'App'}] Email Sending Failed`,
      text: `An email failed to send after multiple attempts.

Details:
- To: ${log.to}
- Subject: ${log.subject}
- Template: ${log.templateName || 'N/A'}
- Error: ${error?.message || 'Unknown error'}
- Log ID: ${log.id}

Please check the logs for more details.`,
      metadata: {
        type: 'admin_notification',
        relatedLogId: log.id
      }
    });
  } catch (adminError) {
    logger.error('Failed to send admin notification:', adminError);
  }
}

/**
 * Strip HTML tags to create plain text version
 * @private
 */
function stripHtml(html) {
  if (!html) return { result: '' };
  
  try {
    // Simple HTML tag stripper
    const result = html
      .replace(/<[^>]*>?/gm, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
    
    return { result };
  } catch (error) {
    logger.warn('Error stripping HTML:', error);
    return { result: html.replace(/<[^>]*>?/gm, '') };
  }
}

// Initialize transporter on startup
initTransporter().catch(error => {
  logger.error('Failed to initialize email transporter:', error);
});

module.exports = {
  initTransporter,
  sendTemplatedEmail,
  sendEmail,
  sendEventReminderEmail,
  EmailTemplateService,
  config
};
