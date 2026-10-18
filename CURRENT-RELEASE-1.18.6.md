# 1.18.6 — Sunday Funday popup artwork

The event popup referenced /images/crime-bank.jpg, which did not exist. The calendar now exports a dedicated /images/event-sunday-funday.png image; the popup reads that authoritative path. The illustration is displayed in full rather than cropped at the heads. If a notification image fails to load, the feedback component switches once to the existing standard notice illustration.

Browser verification on an isolated page using the actual expansion and feedback components: Sunday Funday shows the new loaded 1672×941 image and the original event description and Commit some Crimes! button. A deliberately missing test image correctly loads outcome-notice.png as fallback. No real player action, reward or account was changed by this preview.

Thirteen calendar, artwork, bot and Luca checks passed. The artwork regression test verifies the server calendar path, real PNG signature, popup image selection and event acknowledgement. Controlled Dutch coverage has no missing entries. Event rewards, eligibility and bot/Luca mechanics are unchanged; push remains paused.

Screenshot: art/sunday-funday-popup.png.
