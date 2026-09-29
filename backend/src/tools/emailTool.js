/**
 * Email Tool (COMMUNICATION / INTERNAL / Sensitive)
 */
async function executeEmail(params) {
  const { recipient, subject, body } = params;
  return {
    messageId: `msg_${Date.now()}`,
    status: 'sent',
    recipient,
    subject,
    bytesSent: Buffer.byteLength(body || '', 'utf8'),
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  id: 'email_sender',
  name: 'Corporate Email Dispatcher',
  category: 'COMMUNICATION',
  sensitivity: 'INTERNAL',
  destinations: ['smtp.internal.company.com', 'https://mail.company.com'],
  schema: {
    type: 'object',
    properties: {
      recipient: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' },
    },
    required: ['recipient', 'subject', 'body'],
  },
  execute: executeEmail,
};
