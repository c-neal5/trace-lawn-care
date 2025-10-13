# Commercial Property Solutions | Trace Lawn Care Backend  
(Powered by Prime Pilot Agents)

This repository contains the production backend for the Trace Lawn Care AI Booking Assistant, built and managed by Commercial Property Solutions using the Prime Pilot Agents automation framework.

It connects the Retell AI assistant to Google Calendar and Twilio, enabling real-time scheduling, confirmation texts, and automated appointment management.

---

## Overview

This backend handles:
- Real-time Google Calendar integration to check staff availability
- Appointment creation, rescheduling, and cancellation
- SMS notifications to customers and the business owner via Twilio
- Serverless deployment on Vercel for scalability
- Secure credential storage using environment variables

This is the first live deployment under the Commercial Property Solutions automation framework for property-service businesses.

---

## API Endpoints

| Endpoint | Description |
|-----------|--------------|
| `POST /api/availability` | Checks staff availability and suggests open slots |
| `POST /api/book` | Books an appointment and syncs it to Google Calendar |
| `POST /api/sms` | Sends text notifications using Twilio |
| `POST /api/modify` | Reschedules or cancels existing appointments |
| `POST /api/owner.notify` | Sends the business owner booking alerts |
| `GET /api/memory.get` | Retrieves stored client information (optional) |
| `POST /api/memory.upsert` | Updates or saves client information (optional) |

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/c-neal5/trace-lawn-care.git
cd trace-lawn-care
