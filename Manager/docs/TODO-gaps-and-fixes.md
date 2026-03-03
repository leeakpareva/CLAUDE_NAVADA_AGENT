# NAVADA Edge: Gaps & Fixes TODO
**Date**: 2026-03-03
**Status**: Pending (pick up tomorrow)

---

## Issues to Fix

### 1. WhatsApp Sandbox StatusCallback Bug
- **Problem**: Sending WhatsApp requires `StatusCallback` override every time due to `none` value in sandbox settings
- **Fix**: Twilio Console → Messaging → Try it out → Send a WhatsApp message → Sandbox settings → clear the Status Callback URL field
- **Effort**: 2 min (manual in console)

### 2. trading-api Has 451 Restarts
- **Problem**: FastAPI trading process crashing periodically. Online now but restart count is high
- **Fix**: Investigate crash logs (`pm2 logs trading-api --err --lines 50`)
- **Effort**: 10 min

### 3. SMS Webhook Only Replies to Lee's Number
- **Problem**: If anyone else texts +447446994961, it forwards to Telegram but doesn't auto-reply
- **Decision needed**: Should Claude reply to all inbound SMS or only Lee's?
- **Effort**: 5 min once decided

---

## Gaps to Close

### 4. No WhatsApp Webhook Yet
- **Problem**: When WhatsApp Business is approved, need inbound WhatsApp message handler
- **Fix**: Add `/twilio/whatsapp` webhook endpoint in telegram-bot.js (same pattern as SMS)
- **Blocked by**: Meta WhatsApp Business approval (24-48hrs)
- **Effort**: 20 min

### 5. SMS Has No Conversation Memory
- **Problem**: Each SMS reply is standalone with no context. Claude doesn't remember previous texts
- **Fix**: Add per-number conversation history (similar to Telegram per-user memory)
- **File**: `Automation/telegram-bot.js` (webhook handler)
- **Effort**: 15 min

### 6. No SMS/Call Cost Tracking
- **Problem**: Twilio send_sms and make_call calls aren't logged to `cost-tracker.js`
- **Fix**: Add `costTracker.logCall()` in send_sms and make_call tool executors
- **File**: `Automation/telegram-bot.js`
- **Effort**: 10 min

### 7. Cloudflare API Key in Bash History
- **Problem**: Global API key `f2712d43...` was used in curl commands during setup
- **Fix**: Rotate key in Cloudflare dashboard (My Profile → API Tokens), or clear bash history
- **Priority**: Low (own machine)
- **Effort**: 5 min

---

## Hardware: Ethernet Cable

Moving from WiFi to ethernet will fix:
- WiFi drops that kill Cloudflare tunnel connections (5-10s reconnect gap)
- More stable Tailscale mesh for iPhone access
- Lower latency on Twilio webhook responses (faster SMS replies)
- WorldMonitor dashboard loads faster on iPhone

---

## Priority Order

| # | Task | Effort | Status |
|---|------|--------|--------|
| 1 | Fix WhatsApp sandbox callback | 2 min | Pending |
| 2 | Add SMS conversation memory | 15 min | Pending |
| 3 | Add SMS/call cost tracking | 10 min | Pending |
| 4 | Plug in ethernet + test | 5 min | Waiting for cable |
| 5 | Add WhatsApp webhook (after approval) | 20 min | Blocked (Meta) |
| 6 | Investigate trading-api restarts | 10 min | Pending |
| 7 | Rotate Cloudflare API key | 5 min | Low priority |

**Total estimated effort: ~1 hour**
