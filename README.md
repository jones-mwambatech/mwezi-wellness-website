# 🌙 Mwezi Wellness & Retreat — Website

**Recognize. Reset. Restart.**
Full-stack website for Mwezi Wellness & Retreat Center, Livingstone, Zambia.
Includes WhatsApp notifications via Twilio when a booking is submitted.

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set your environment variables
Create a `.env` file in the root folder (or set them on your hosting platform):

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
MWEZI_WHATSAPP_TO=whatsapp:+260974003694
```

### 3. Start the server
```bash
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 📱 WhatsApp Notification Setup (Step by Step)

Every time someone submits a booking form, Mwezi receives a WhatsApp message like this:

```
🌙 New Booking Request — Mwezi Wellness

👤 Name: Jane Doe
📞 Phone: +260 97X XXX XXX
✉️ Email: jane@example.com
💼 Service: Psychotherapy / Talk Therapy
📅 Preferred date: 2026-07-20

💬 Message:
Looking for individual therapy sessions for anxiety.

🆔 Booking ID: 1720000000000
🕐 Submitted: 7/4/2026, 10:30:00 AM
```

### Step 1 — Create a free Twilio account
Go to https://www.twilio.com and sign up for a free account.

### Step 2 — Get your credentials
In the Twilio Console (https://console.twilio.com):
- Copy your **Account SID** → `TWILIO_ACCOUNT_SID`
- Copy your **Auth Token** → `TWILIO_AUTH_TOKEN`

### Step 3 — Join the WhatsApp Sandbox
1. In the Twilio Console, go to **Messaging → Try it out → Send a WhatsApp message**
2. You'll see a sandbox number (e.g. `+1 415 523 8886`) — this is `TWILIO_WHATSAPP_FROM`
3. On Mwezi's WhatsApp (+260 974 003 694), send the join code shown on screen (e.g. `join silver-tiger`)
4. Once joined, Twilio can send messages to that number

### Step 4 — Go live (production)
When ready to go live (beyond the sandbox):
1. In Twilio Console, go to **Messaging → Senders → WhatsApp senders**
2. Apply for a WhatsApp Business number (requires Meta/Facebook Business verification)
3. Update `TWILIO_WHATSAPP_FROM` to your approved number

> **Note:** The sandbox is free and works immediately for testing.
> The live approved number requires a brief Meta verification process.

---

## Project Structure

```
mwezi-website/
├── index.html          ← Home page
├── about.html          ← About page
├── services.html       ← All 11 services
├── wellness.html       ← Wellness products
├── contact.html        ← Contact + booking form (backend here)
├── style.css           ← Shared stylesheet
├── nav.js              ← Shared nav + scroll JS
├── server.js           ← Express backend + WhatsApp notifications
├── package.json
├── README.md
├── data/
│   └── bookings.json   ← Auto-created, stores all booking requests
└── assets/             ← Product images
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health + WhatsApp status |
| POST | `/api/bookings` | Submit booking + send WhatsApp alert |
| GET | `/api/bookings` | List all bookings |
| GET | `/api/bookings/:id` | Get single booking |
| PATCH | `/api/bookings/:id` | Update booking status |
| DELETE | `/api/bookings/:id` | Delete a booking |
| GET | `/api/stats` | Booking statistics |

---

## Deployment (Render / Railway)

1. Push to GitHub
2. Connect repo to Render.com or Railway.app
3. Add environment variables in the hosting dashboard:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM`
   - `MWEZI_WHATSAPP_TO`
4. Set start command: `node server.js`
5. Deploy

---

## Contact Info
- **Phone:** +260 974 003 694
- **Email:** mweziwellnessandretreat@gmail.com
- **Location:** Airport Rd, Livingstone, Zambia
- **Facebook:** Mwezi Wellness & Retreat Center
