# Security rollout

- Revoke the previously exposed SMTP authorization credential immediately. Removing it from this branch does not remove it from Git history, forks or clones. Review email account activity. Never commit the replacement.
- Set SMTP_USER, SMTP_PASS, and optionally SMTP_HOST in Railway before deploying; SMTP requires validated STARTTLS. Keep JWT_SECRET private and use a high-entropy key.
- Deploy the updated server and mobile app together: registration now requires the six-digit code in the register request. Older mobile versions cannot register until updated. Existing password login remains supported.
- Email codes and IP rate limits are bounded but process-local. Run one backend replica until a shared atomic store (e.g. Redis) is implemented. Behind a reverse proxy, requests may share the proxy IP. Configure trusted proxy hops only after verifying the topology; never blindly trust forwarded IP headers.
- Run server npm ci, npm run build, npm test; run mobile npm ci, TypeScript checks and Android build. Test registration using a staging SMTP account.
- Follow-up: migrate JWT storage to Android Keystore/iOS Keychain, use a protected release signing key (coordinate signing migration for existing installs), audit dependencies and old commits, and implement shared throttling before scaling.
