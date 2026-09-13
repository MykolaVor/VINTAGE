VINTAGE — Minecraft server website

Pack: TerraFirmaGreg: Modern
Minecraft: 1.20.1 / Forge
CurseForge: https://www.curseforge.com/minecraft/modpacks/terrafirmagreg-modern

Included:
- VINTAGE branding
- Interactive living-world background with parallax, fog, light sweep, particles and ambient dust
- Pixel-inspired custom cursor
- Supabase Auth, whitelist applications, chat and admin panel

Supabase frontend uses the publishable key only. Never put a secret/service-role key in the browser.

Replace play.example.com in script.js with the real Minecraft server IP.


V8: Кабінет винесено на окрему сторінку account.html.

VINTAGE v17 — separate sections
- account.html — login/register
- profile.html — player profile
- whitelist.html — whitelist applications
- chat.html — community chat with emoji picker and personal highlights
- admin.html — admin console with users, whitelist review, mute/ban controls
- guide.html — guide

IMPORTANT:
Run SUPABASE_MIGRATION_V17.sql once in Supabase SQL Editor before using moderation/highlight features.
The migration creates user_moderation, chat message highlights, server-side moderation checks, and admin RPCs.
No passwords are stored in the public profiles table; authentication remains in Supabase Auth.


V18 patch: fixed Supabase relation ambiguity for whitelist_applications (two profiles foreign keys), and added own-message edit/delete plus admin delete.
SQL: run SUPABASE_MIGRATION_V18.sql once after V17.
