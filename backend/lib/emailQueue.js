const { Resend } = require('resend');
const { renderPlaceCreatedEmail } = require('./emails/placeCreatedEmail');

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing in .env');
  }

  return new Resend(process.env.RESEND_API_KEY);
}

const queue = [];
let processing = false;

function enqueueEmail(job) {
  queue.push(job);

  if (!processing) {
    processing = true;
    setImmediate(processEmailQueue);
  }
}

async function processEmailQueue() {
  const client = getResendClient();

  while (queue.length > 0) {
    const job = queue.shift();

    try {
      await client.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'no-reply@travel-tracker.app',
        to: job.to,
        subject: job.subject,
        html: job.html,
      });
      console.log('[EmailQueue] Sent email to', job.to);
    } catch (error) {
      console.error('[EmailQueue] Failed sending email to', job.to, error?.message || error);
    }
  }

  processing = false;
}

function enqueuePlaceCreatedEmail({ recipientEmail, userName, place, appUrl }) {
  const html = renderPlaceCreatedEmail({
    userName,
    placeTitle: place.title,
    placeDescription: place.description,
    placeCategory: place.category,
    lat: place.lat,
    lng: place.lng,
    deepLink: `${appUrl}/?place=${place.id}`,
  });

  enqueueEmail({
    to: recipientEmail,
    subject: `Dein neuer Ort „${place.title}“ wurde gespeichert`,
    html,
  });
}

module.exports = {
  enqueuePlaceCreatedEmail,
};
