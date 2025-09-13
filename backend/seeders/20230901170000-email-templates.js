'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if templates already exist
    const existingTemplates = await queryInterface.sequelize.query(
      'SELECT name FROM "EmailTemplates" WHERE name IN (\'event_registration_confirmation\', \'event_registration_admin_notification\')',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingTemplateNames = existingTemplates.map(t => t.name);
    
    // Only insert templates that don't exist
    if (!existingTemplateNames.includes('event_registration_confirmation')) {
      const confirmationTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Confirmation - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Thank you for registering!</h1>
    <p>Dear {{attendeeName}},</p>
    <p>Your registration for <strong>{{eventTitle}}</strong> has been confirmed. We're excited to have you join us!</p>
    <div style="background-color: #fff; border-left: 4px solid #3498db; padding: 10px 15px; margin: 20px 0;">
      <p style="margin: 0;"><strong>Registration ID:</strong> {{registrationId}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Date:</strong> {{date}}</p>
    </div>
    <p>You can view and manage your registration details by visiting:</p>
    <p><a href="{{manageRegistrationUrl}}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0;">View Registration</a></p>
    <p>If you have any questions or need to make changes to your registration, please don't hesitate to contact us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>
    <p>We look forward to seeing you at the event!</p>
    <p>Best regards,<br>The {{appName}} Team</p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      await queryInterface.bulkInsert('EmailTemplates', [{
        id: uuidv4(),
        name: 'event_registration_confirmation',
        subject: 'Your Registration Confirmation for {{eventTitle}}',
        content: confirmationTemplate,
        variables: JSON.stringify(["eventTitle","attendeeName","registrationId","date","manageRegistrationUrl","supportEmail","appName","currentYear"]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
    
    if (!existingTemplateNames.includes('event_registration_admin_notification')) {
      const adminTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Registration - {{eventTitle}}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
    <h1 style="color: #2c3e50; margin-top: 0;">New Event Registration</h1>
    <p>A new registration has been received for <strong>{{eventTitle}}</strong>.</p>
    <div style="background-color: #fff; border-left: 4px solid #2ecc71; padding: 10px 15px; margin: 20px 0;">
      <p style="margin: 0 0 5px 0;"><strong>Attendee:</strong> {{attendeeName}}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> {{attendeeEmail}}</p>
      <p style="margin: 5px 0;"><strong>Registration ID:</strong> {{registrationId}}</p>
      <p style="margin: 5px 0 0 0;"><strong>Registration Date:</strong> {{registrationDate}}</p>
    </div>
    <p><strong>Registration Details:</strong></p>
    <ul style="margin-top: 5px; padding-left: 20px;">
      <li>Number of attendees: {{numAttendees}}</li>
      {{#if organization}}<li>Organization: {{organization}}</li>{{/if}}
      {{#if phone}}<li>Phone: {{phone}}</li>{{/if}}
      {{#if dietaryRequirements}}<li>Dietary Requirements: {{dietaryRequirements}}</li>{{/if}}
      {{#if specialRequirements}}<li>Special Requirements: {{specialRequirements}}</li>{{/if}}
    </ul>
    <p>You can view and manage this registration in the admin panel:</p>
    <p><a href="{{adminRegistrationUrl}}" style="display: inline-block; background-color: #2ecc71; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0;">View Registration in Admin</a></p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

      await queryInterface.bulkInsert('EmailTemplates', [{
        id: uuidv4(),
        name: 'event_registration_admin_notification',
        subject: 'New Registration: {{eventTitle}} - {{attendeeName}}',
        content: adminTemplate,
        variables: JSON.stringify(["eventTitle","attendeeName","attendeeEmail","registrationId","registrationDate","numAttendees","organization","phone","dietaryRequirements","specialRequirements","adminRegistrationUrl"]),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('EmailTemplates', {
      name: {
        [Sequelize.Op.in]: [
          'event_registration_confirmation',
          'event_registration_admin_notification'
        ]
      }
    });
  }
};
