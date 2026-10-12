# Privacy Policy for the RANDSUM Discord bot

This Privacy Policy describes what information the RANDSUM Discord bot (served from bot.randsum.dev and developed by Alex Jarvis) handles, and how. By using the bot, you agree to the terms of this Privacy Policy.

Information We Process

The bot only receives the slash-command interactions you send it. Discord delivers each interaction to the bot over HTTPS. An interaction payload contains the command and the options you typed (for example a dice notation string), your Discord user ID and username, and the IDs of the server and channel where you used the command. The bot never receives the content of ordinary chat messages: it does not connect to the Discord gateway and has no message-content access.

How We Use Your Information

The bot uses an interaction payload only to compute the roll and send the reply, in memory, while it handles that one request. It does not write interaction payloads to a database or any other storage.

Logs

The bot runs as a Cloudflare Worker with Workers Observability enabled. Cloudflare records request logs for each invocation (such as the time, request path, response status, and errors), which we use to keep the bot running and to debug failures. These logs are kept for Cloudflare's standard Workers Logs retention period and are then deleted.

Sharing Your Information

We do not sell or share your information with third parties. Interactions pass through Discord and Cloudflare, which process them under their own privacy policies. We may disclose information in response to legal process or a request from a law enforcement agency or regulatory authority.

Data Retention

Interaction payloads are not retained after the reply is sent. Request logs are retained only as described under Logs.

Data Security

We take reasonable measures to protect your information from unauthorized access, alteration, or destruction. Every interaction is verified against Discord's signature before it is processed. However, no security measure is perfect, and we cannot guarantee the security of your information.

Changes to this Policy

We may update this Privacy Policy from time to time, and we will post the updated policy in the bot's source repository (github.com/RANDSUM/randsum). Your continued use of the bot after we make changes to this policy indicates your acceptance of the revised policy.

Contact Us

If you have any questions or concerns about this Privacy Policy, please contact us at Alxjrvs at gmail dot com.

Effective Date

This Privacy Policy is effective as of 2026-10-12.
