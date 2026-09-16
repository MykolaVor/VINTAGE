VINTAGE v22 — REDESIGN + PLAYER PROFILES

Base: VINTAGE v21 (password recovery + current Supabase/SMTP-compatible auth).

Preserved functionality:
- Supabase authentication, registration, login/logout
- Password recovery via update-password.html
- Personal profile and Minecraft nickname editing
- Whitelist applications and admin review
- Community chat, emoji picker, edit/delete own messages, highlight own messages
- Admin moderation: timed/permanent mute and ban, reasons, clear mute/ban
- Minecraft server status and IP copy
- TerraFirmaGreg guide with era navigation

Redesign:
- New premium dark VINTAGE visual system
- Responsive glass panels, navigation, forms, chat and guide
- Admin area transformed into a Player Profiles dashboard
- Player cards + searchable profiles
- Player profile modal with email, Minecraft nickname, registration date, whitelist state and moderation state
- Moderation controls remain available from the player profile
- Admin navigation is now labeled “Гравці”

No new Supabase migration is required for the redesign itself. Existing v17/v18 database functions and policies are used.
