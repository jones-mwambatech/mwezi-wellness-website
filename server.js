// =============================================
// MWEZI WELLNESS & RETREAT — server.js
// Node.js + Express Backend
// WhatsApp notifications via Twilio
// =============================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'bookings.json');

// ---- TWILIO CONFIG ----
// Set these as environment variables — never hardcode secrets
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio sandbox default
const MWEZI_WHATSAPP_TO    = process.env.MWEZI_WHATSAPP_TO   || 'whatsapp:+260974003694'; // Mwezi's number

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  console.log('✅ Twilio WhatsApp notifications enabled.');
} else {
  console.warn('⚠️  Twilio credentials not set. WhatsApp notifications disabled.');
  console.warn('   Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN as environment variables.');
}

// ---- WHATSAPP NOTIFICATION ----
async function sendWhatsAppNotification(booking) {
  if (!twilioClient) return;

  const date = booking.preferred_date
    ? `📅 Preferred date: ${booking.preferred_date}`
    : '📅 No preferred date specified';

  const message =
`🌙 *New Booking Request — Mwezi Wellness*

👤 *Name:* ${booking.fullname}
📞 *Phone:* ${booking.phone}
${booking.email ? `✉️ *Email:* ${booking.email}` : ''}
💼 *Service:* ${booking.service}
${date}
${booking.message ? `\n💬 *Message:*\n${booking.message}` : ''}

🆔 Booking ID: ${booking.id}
🕐 Submitted: ${new Date(booking.submitted_at).toLocaleString('en-ZM', { timeZone: 'Africa/Lusaka' })}

Reply to this client within 24 hours.`;

  try {
    await twilioClient.messages.create({
      from: TWILIO_WHATSAPP_FROM,
      to: MWEZI_WHATSAPP_TO,
      body: message
    });
    console.log(`[WhatsApp] Notification sent for booking ${booking.id}`);
  } catch (err) {
    console.error(`[WhatsApp] Failed to send notification:`, err.message);
  }
}

// ---- MIDDLEWARE ----
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify([]));

// ---- HELPERS ----
function readBookings() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}
function writeBookings(bookings) {
  fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
}
function validateBooking(data) {
  const errors = [];
  if (!data.fullname || data.fullname.trim().length < 2) errors.push('Full name is required.');
  if (!data.phone || data.phone.trim().length < 7) errors.push('Valid phone number is required.');
  if (!data.service || data.service.trim() === '') errors.push('Please select a service.');
  return errors;
}

// ---- ROUTES ----

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mwezi Wellness API',
    whatsapp: twilioClient ? 'enabled' : 'disabled'
  });
});

// POST — Create a booking + send WhatsApp notification
app.post('/api/bookings', async (req, res) => {
  const { fullname, phone, email, service, message, preferred_date } = req.body;
  const errors = validateBooking(req.body);
  if (errors.length > 0) return res.status(400).json({ success: false, errors });

  const bookings = readBookings();
  const newBooking = {
    id: Date.now().toString(),
    fullname: fullname.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    service: service.trim(),
    message: message ? message.trim() : '',
    preferred_date: preferred_date || null,
    status: 'pending',
    submitted_at: new Date().toISOString()
  };

  bookings.push(newBooking);
  writeBookings(bookings);
  console.log(`[NEW BOOKING] ${newBooking.fullname} — ${newBooking.service}`);

  // Send WhatsApp notification (non-blocking — don't fail the request if it errors)
  sendWhatsAppNotification(newBooking);

  res.status(201).json({
    success: true,
    message: 'Booking request received. We will contact you within 24 hours.',
    booking_id: newBooking.id
  });
});

// GET — List all bookings
app.get('/api/bookings', (req, res) => {
  let bookings = readBookings();
  const { status, service } = req.query;
  if (status) bookings = bookings.filter(b => b.status === status);
  if (service) bookings = bookings.filter(b => b.service.toLowerCase().includes(service.toLowerCase()));
  res.json({ success: true, count: bookings.length, bookings: bookings.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)) });
});

// GET — Single booking
app.get('/api/bookings/:id', (req, res) => {
  const booking = readBookings().find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  res.json({ success: true, booking });
});

// PATCH — Update booking status
app.patch('/api/bookings/:id', (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
  const bookings = readBookings();
  const idx = bookings.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Booking not found.' });
  bookings[idx].status = status;
  bookings[idx].updated_at = new Date().toISOString();
  writeBookings(bookings);
  res.json({ success: true, message: `Booking updated to "${status}".`, booking: bookings[idx] });
});

// DELETE — Remove a booking
app.delete('/api/bookings/:id', (req, res) => {
  let bookings = readBookings();
  if (!bookings.find(b => b.id === req.params.id)) return res.status(404).json({ success: false, message: 'Booking not found.' });
  bookings = bookings.filter(b => b.id !== req.params.id);
  writeBookings(bookings);
  res.json({ success: true, message: 'Booking deleted.' });
});

// GET — Stats
app.get('/api/stats', (req, res) => {
  const bookings = readBookings();
  const byService = {};
  bookings.forEach(b => { byService[b.service] = (byService[b.service] || 0) + 1; });
  const byStatus = {};
  ['pending', 'confirmed', 'cancelled', 'completed'].forEach(s => { byStatus[s] = bookings.filter(b => b.status === s).length; });
  res.json({ success: true, total: bookings.length, by_status: byStatus, by_service: byService });
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ---- START ----
app.listen(PORT, () => {
  console.log(`\n🌙 Mwezi Wellness & Retreat Server`);
  console.log(`   Running at http://localhost:${PORT}`);
  console.log(`   Bookings stored in: ${DB_FILE}\n`);
});

module.exports = app;
