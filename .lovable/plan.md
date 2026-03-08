

# QR Code Payment System for Dhan Wallet

## What We're Building

A UPI-style QR code system within the Dhan wallet: each user gets a personal QR code that others can scan to pay them directly.

## How It Works

1. **"My QR" tab/button** on the Wallet page generates a QR code encoding the user's Vanshmala ID (e.g., `vanshmala://pay?id=VM-0001&name=Prashant`)
2. **"Scan & Pay" button** opens the device camera (via `navigator.mediaDevices`) to scan another user's QR code
3. On successful scan, it auto-fills the Transfer dialog with the recipient's Vanshmala ID, verifies them, and lets the user enter amount and pay

## Technical Details

### No Database Changes Needed
The QR code simply encodes the existing `vanshmala_id` from profiles. The transfer flow already handles payment via `process_wallet_transfer` RPC.

### New Dependencies
- **qrcode.react** -- to render the QR code SVG
- **html5-qrcode** -- lightweight browser-based QR scanner (no native plugins needed, works in Capacitor WebView too)

### Changes to `src/pages/Wallet.tsx`

1. Add two new action chips in the hero card:
   - **"My QR"** (QrCode icon) -- opens a dialog showing the user's QR code with their name and Vanshmala ID, plus a download/share button
   - **"Scan"** (ScanLine icon) -- opens a dialog with camera-based QR scanner

2. **My QR Dialog**:
   - Renders a styled QR code via `qrcode.react` containing: `vanshmala://pay?id={vanshmala_id}&name={full_name}`
   - Shows user's name, Vanshmala ID, and avatar above the QR
   - "Share QR" button to download as image

3. **Scan & Pay Dialog**:
   - Uses `html5-qrcode` to access camera and decode QR
   - On scan, parses the `vanshmala://pay` URL, extracts the Vanshmala ID
   - Auto-opens the Transfer dialog with pre-filled recipient, triggers verification, user just enters amount and confirms

### File Changes Summary

| File | Change |
|------|--------|
| `src/pages/Wallet.tsx` | Add QR and Scan action chips, My QR dialog, Scan & Pay dialog, auto-fill transfer logic |
| `package.json` | Add `qrcode.react` and `html5-qrcode` |

