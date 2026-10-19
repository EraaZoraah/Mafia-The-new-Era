# Mafia: The New Era 1.19.2

19 October 2026. Sidebar implementation based on the supplied 17-second reference video.

- Three sidebar sections: Overview (Dashboard, Daily objectives, Announcements & events, Messages), Your world (My character, Crimes & missions, My empire, My family, Money & trading, The city, Help & information), Extras & staff (Premium shop and role-protected staff links).
- All 61 existing page routes retained exactly once. Compact gold outline icons, indented children, active-page highlight and one expanded category during ordinary browsing. Page search matches English and selected-language labels, expands matching results, supports Enter/Escape and a clear button, and never exposes staff links to players.
- Mobile uses a closable side drawer/backdrop and full-width page content. Ordinary page selection closes it. Existing desktop hide/show and sidebar scroll restoration remain.
- Luca indexes authoritative section/category paths in EN/NL and can clear an active search/open a hidden drawer when highlighting a destination. Warehouse advice and weapons FAQ follow the new paths. No external AI service or gameplay balance changes.
- Isolated tests cover route preservation, role scoping, translations, escaping, shared guide knowledge and bot gameplay coverage. Browser preview checks desktop, mobile, accordion and keyboard search on disposable data only.

GitHub main remains untouched pending the earlier approval about remote starter-data deletion. This update can be reviewed on update/menu-notices-v1.19.1. Real world data and the local snapshot backup are preserved. Device push remains paused.
