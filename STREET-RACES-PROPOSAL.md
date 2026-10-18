# Street races — proposal only

Implemented on 16 October 2026. See MIDNIGHT-CIRCUIT.md for the final rules, limits and verification. The original proposal below is retained as design history.

The Midnight Circuit would make the purchased and stolen collections playable without making the most expensive car an automatic winner:

1. Each city has three short illustrated routes: a technical street circuit, a highway sprint and a mixed escape run. Visible route requirements favour handling, acceleration or reliability rather than price alone.
2. Cars have a performance class separate from market value. Match opponents within that class and a narrow race-rating range. A prized classic may be a valuable collectible without beating a modern supercar in a sprint. Vehicle condition affects reliability; no permanent cosmetic condition loss without an explicit repair/wear system.
3. Before starting, choose a strategy (clean, balanced, aggressive), tires/setup and an optional mechanic. Three animated stages reveal server-decided results. No reflex or network-latency advantage. The server locks entry costs and rolls the race; reloads cannot reroll it.
4. Solo time trials provide low-risk practice and a daily capped reward. Asynchronous 2–4-player races use fully escrowed entry fees and a small house commission. Bots use the same cars, costs, matching and validation.
5. Police Heat and driving mistakes create choices: a clean run is safer, an aggressive shortcut may win but raises arrest/damage risk. Optional bribery uses the existing arrest system. Do not take the player's entire car as an unannounced penalty.
6. Race XP unlocks 15 driver ranks and cosmetic titles, trophies and garage display items. Modest bounded racing perks, no compounding crime-income multiplier. Weekly city leaderboards use best results and limited scored entries so constant play cannot win by volume alone.
7. A simple repair/tuning workshop would be the first follow-up: quote the cost before accepting, cap upgrades by class, retain collection value and explain effects. No pink-slip races or transfer of a rare car in the first release.

Implementation order: solo route/garage selection and server race ledger; animations and replay; class-matched player entries with escrow and timeout refunds; bot strategy and Luca live recommendations; weekly cosmetics. Each phase gets transaction, replay, insufficient-funds, custody and mobile tests before the next.
