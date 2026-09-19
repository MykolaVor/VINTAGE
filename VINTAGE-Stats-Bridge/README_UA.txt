VINTAGE Stats Bridge

Це окремий bridge ТІЛЬКИ для статистики Minecraft. Він НЕ керує whitelist і НЕ містить функцій v29 whitelist bridge.

Потрібно:
- Node.js 18+
- запущений Minecraft-сервер
- server.properties поруч із папкою bridge
- для online-статусу увімкни RCON:
  enable-rcon=true
  rcon.port=25575
  rcon.address=127.0.0.1
  rcon.password=СИЛЬНИЙ_ПАРОЛЬ

Запуск: start-bridge.bat
Bridge читає world/stats/*.json та usercache.json і передає play_time, deaths, player_kills, mob_kills та last_seen на сайт.
Не публікуй config.json.
