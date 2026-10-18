# Deferred work

## Device push notifications — PAUSED by user, 18 October 2026

Keep delivery disabled by default. Existing in-game notifications continue. Do not silently activate on future updates.

When the user requests activation: configure the final HTTPS domain and persistent VAPID keys via server secrets; explicitly set PUSH_ENABLED=true; verify browser consent, service-worker lifecycle, real-device delivery (desktop/mobile), expiry/unsubscribe and the income warning against the 24-active-hour cycle. Preserve current attack/family/income preference separation. Never commit VAPID private keys.

GitHub upload is authorized again as of 18 October 2026; the earlier pause no longer applies. The existing target repository must remain private while it contains the authorized starter world and password hashes.
