VINTAGE FINAL v24 — PUBLIC RELEASE

Base: VINTAGE v23 (Supabase + Brevo SMTP compatible).

FINAL CHECKLIST
- Responsive premium VINTAGE design across all pages.
- Supabase authentication, registration, login/logout.
- Password recovery via Brevo SMTP + update-password.html.
- Personal profile and Minecraft nickname editing.
- Whitelist submission, status history and admin review.
- Pending Whitelist applications cannot be duplicated while one is waiting.
- Community chat with realtime updates, emoji picker, own-message edit/delete/highlight.
- Admin can delete any chat message.
- Admin moderation: timed/permanent mute and ban, reasons and clearing.
- Player Profiles admin center with search and profile modal.
- Minecraft server status and IP copy.
- TerraFirmaGreg guide with era navigation.
- Mobile navigation and responsive layouts.
- Fixed Whitelist UI: action buttons appear only for pending applications.

DATABASE
No new SQL migration is required for v24. Keep the existing v17 and v18 migrations that are already installed in Supabase.

DEPLOY
Upload the contents of this folder to the same Cloudflare Worker/Pages deployment used by the VINTAGE site.
After deployment, hard refresh the browser once (Ctrl+F5) to load style.css?v=24 and script.js?v=24.

SUPABASE
Project URL and publishable key are already present in script.js. Never expose SMTP keys in the website or repository.
