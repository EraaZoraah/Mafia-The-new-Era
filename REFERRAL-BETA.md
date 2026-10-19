# Beta referrals, directories and casino — 1.18.0

## Referral event

Registration has an optional referrer username. The username must resolve to an existing, non-banned, non-deleted human account; bots cannot be named. It cannot be added or changed after registration. A new referred account starts with exactly $25,000,000 total cash. Normal registrations keep the normal starting balance. Account creation, referral linkage and starting cash commit or roll back together.

A referred player qualifies after reaching normal rank 5 (Hustler) and playing on three distinct UTC calendar dates, recorded by the existing server-side presence system. This means three active dates, not 72 accumulated play hours. The account must remain a normal player, not banned/deleted or an autonomous bot. Once eligible and cleared of any required review, the referrer receives $50,000,000 exactly once. A full referrer wallet delays credit safely until space is available.

The referrer gets 30 free Supporter days after five credited qualifying friends and 30 free Grand Supporter days after ten. Each milestone is awarded once. These are membership rewards only: the shop pack's purchase cash/XP is not added. Existing paid membership time is preserved; free time begins afterward. When Grand Supporter is earned, remaining free Supporter time is upgraded to Grand Supporter and the extra 30 days are added. Existing shop bonuses and name/diamond styles automatically use free active membership too.

The event is announced once after an Owner exists and has a public Beta referrals page under The underworld. Referrers and new players can view their own linkage history; Owner/Admin see all links, per-referrer counts, credited cash and review status under Beta referrals in their panels. Review actions require a 5–500 character reason and are recorded in the staff audit log with the reviewing identity. An unpaid approved/rejected link can be reopened with a reason; paid referrals cannot be reopened or paid twice.

## Abuse controls and privacy

Existing authentication/registration rate limits remain enforced. Reused registration networks and normalized email aliases flag a referral for staff review rather than automatically rejecting households. Network fingerprints use a persistent random salt; raw IP addresses are not stored in referral tables or returned to clients. Forwarded IP headers are not trusted. Behind a reverse proxy, many players can therefore share a fingerprint and require manual review; do not blindly trust client-supplied forwarding headers to avoid it.

Until qualification and any review, referral accounts cannot move value through player transfers, family donations, auction bids, bounties or marriage invitations. PvP is also restricted, including attacks against unqualified referral accounts, to prevent looting the starting money into another account. Normal PvE, asset purchases and progression remain playable. Bots are excluded from referral rewards and never create fake referrals. Staff can reject suspicious links; they can use existing account-reset/ban tools when investigation establishes abuse.

These controls are safeguards, not proof that distinct accounts represent distinct people. Email verification is still not configured. Determined users can change networks or email addresses; staff review remains necessary. Referral and reward records survive ordinary restarts/reset scenarios, preventing repeated rewards.

## Collections and directories

The existing The complete gallery achievement requires holding all 25 distinct appraised original art/antique models. Duplicates, reproductions and auction-listed pieces do not count. Its permanent title and medal remain earned after later sales. No duplicate achievement was added.

The underworld now has an All families directory containing every family, without a membership requirement or a top-ten truncation. Search names and compare members, assets, Power, net worth and separate drugs/guns ranks. The existing top-ten rankings remain available. Player/family/staff lists share a framed gold/steel table treatment; family cards use a dedicated new banner and page icon. Staff family search no longer silently stops at 200 families.

## Single casino playing field

Blackjack and Higher or Lower render their authoritative saved round once. Animations operate directly on those displayed cards, including the dealer's genuinely hidden card, rather than creating a second animated copy. Poker uses the same approach for its selectable held cards. Roulette, safe and slots place their animation inside the matching saved-result panel. The selected game's stake controls, animation and outcome share one article/table; other game panels are hidden. Results and transactions remain server-controlled and use existing idempotency/revision checks. Page refresh no longer uses a separately cached clone of the animated card table. Reduced-motion settings are respected.

## Verification and deployment

Tests use in-memory databases and a disposable HTTP fixture, never the saved world. Evidence is in `art/oct18-*-final.log`; browser screenshots cover staff referrals, family directory and desktop/mobile blackjack. English and Dutch rules, notifications and Luca advice are included; ranks stay untranslated. Bots' command coverage remains checked and referral provisioning/staff review are deliberately excluded from autonomous play.

Run `npm ci`, then `npm test` and `npm start` from this project folder after deployment. Preserve the existing data folder and environment. Version and health build are 1.18.0 / 2026-10-18-release-1.18.0. No GitHub upload or live-server deployment was performed.

Browser check details: Blackjack and Higher or Lower used one canonical card table; poker retained the selected King of Clubs while replacing other cards. The slots result [1, 2, 0] matched the final lemon/grape/cherry symbols. Safe and roulette displayed their saved outcomes inside their own tables. Dutch roulette labels now retain explicit English option values (for example displayed rood submits red), fixing rejected localized bets. Stake controls live inside the same saved-round panel. Outcome text stays hidden during the reveal animation, then appears without a second playing field. Current DOM evidence records one visible table, one blackjack table and zero duplicate animated card copies.
