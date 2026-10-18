// Gameplay coverage ledger; tests require an autonomous caller for every command.
export const botCapabilities={
 circuit:['circuit/solo','circuit/create','circuit/join','circuit/workshop'],
 art:['art/heist','art/appraise','art/list','art/bid'],
 bribery:['bribery/pay','bribery/decline'],
 crimes:['action'],pvp:['pvp'],supplies:['armory/buy'],assets:['assets/buy'],employees:['employees/hire'],
 shipments:['shipments/run'],familyAssets:['family/buy','compound/upgrade','family/donate'],
 teams:['team-missions/create','team-missions/join','team-missions/leave','team-missions/launch'],
 marriage:['marriage/invite','marriage/respond','marriage/divorce'],crypto:['crypto/trade'],
 respect:['respect/give','family/respect/give'],chat:['world-chat/send','family/chat/send','messages','conversation/read'],
 mystery:['mystery/resolve'],territory:['family/map/buy','family/war/capture'],
 rewards:['daily/claim','achievements/claim','gifts/collect','bounties/collect','income/claim','promotion/ack','notifications/ack','news/read','calendar/ack'],
 banking:['bank'],casino:['casino/start','casino/action','casino-extra/play','casino-extra/draw','casino-extra/collect','lottery/buy','lottery/collect'],
 investments:['investments/open','investments/claim'],freight:['production/start','production/ship','production/sell'],
 vehicles:['vehicles/auction/list','vehicles/auction/bid','vehicles/store','vehicles/sell','vehicles/ship','vehicles/car/sell'],appearance:['profile/settings','title'],
 recruitment:['families','families/join','family/invite','family/respond'],
 leadership:['family/role','family/kick','family/transfer-don','family/preferences','family/leave'],
 diplomacy:['family/alliance'],war:['family/war/declare','family/war/surrender','family/raid','family/war/sabotage','family/war/team/create','family/war/team/join','family/war/team/leave','family/war/team/cancel','family/war/team/launch'],
 planning:['family/plans/save','family/plans/status','family/plans/join','family/plans/leave'],
 bounties:['bounties/post'],care:['custody/pay','custody/report','custody/breakout'],transfers:['transfers'],
 security:['player/backfire','protection','security/muscle','security/personal','family/guards'],
 community:['player-controls','support/create','support/reply'],travel:['airport/fly']
};
export const botCommandBoundaries={
 'push/save':'Browser-device permission and encrypted subscription; bots have no browser devices.',
 'push/remove':'Browser-device notification preferences; no autonomous browser permission.',
 'shop/checkout':'Real payment is disabled for the game; bots never make real purchases.',
 'world-chat/hide':'Staff-only moderation.',
 'presence/heartbeat':'The scheduler uses shared presence.touch/offline for sessions.',
 'register':'Account provisioning is separate from autonomous play.',
 'login':'The scheduler authenticates an existing enabled player identity; no exposed passwords.',
 'logout':'The scheduler calls presence.offline; bots do not create browser sessions.',
 'account/password':'No autonomous credential changes.',
 'account/logout-all':'No browser sessions to revoke.',
 'family/request':'Reserved legacy route has no action handler; applications use families/join.'
};
// GET-only pages have no mutation to execute. Exploration/knowledge uses these views.
export const botReadOnlyRoutes=['referrals','family-directory','push','circuit','art','bribery','empire','custody','underworld','health','me','leaderboard','crypto','employees','gifts','news','conversation','family/dashboard','statistics','inbox','players/search','compound/upgrades','daily','bulletins','notifications','family','family/map','family/possessions','family/rivals','mystery','assets','calendar','catalog','guide','players','world-chat','investments','achievements','directory','family/respect','seasons','airport','armory','production','support','support/ticket','player/progress','bounties','marriage','presence','shop','vehicles','team-missions','casino','casino-extra','respect','family/chat','family/plans','family/alliances'];
