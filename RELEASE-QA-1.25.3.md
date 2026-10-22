# Release 1.25.3 startup hotfix

Root cause: app.js gained a static import of public/stat-fitting.js in 1.25.2, but server.js's explicit public asset allowlist did not include it. Production returned HTTP 404 for a required ES module, so app.js never executed and the initial loading screen remained visible. The earlier permissive preview server served the module and failed to reveal this deployment-specific omission.

Fix: add only /stat-fitting.js with the JavaScript MIME type to the existing allowlist. All security boundaries remain intact; root server source is still inaccessible. No saved game data or economy rules change. Keep the 1.25.2 responsive amounts and crypto Sell maximum controls.

Regression coverage: the actual production server runs against a disposable database. A recursive test follows every static and literal dynamic import reachable from app.js and pwa.js, requiring HTTP 200 and a JavaScript Content-Type. It explicitly checks stat-fitting.js and verifies /server.js remains 404. Future frontend work instructions require this check.

Evidence: before the fix, the new HTTP regression test failed with Missing browser module: /stat-fitting.js (404 != 200). After the fix, the full import-graph test passes. Language coverage audits report zero missing keys for NL/ES/FR/DE. Full suite: 450 passed, 0 failed. Results are recorded in .preview-portfolio-review/release1253-suite.log.

Version: 1.25.3. Translated release announcement included. Users must redeploy/re-pull the corrected build; the faulty 1.25.2 container cannot be fixed by a browser refresh alone. Existing service-worker policy already loads live documents and modules from the network.

Bots and Luca: no gameplay mutations changed. Their existing server validation, trading and guide tests are included in the isolated full suite.
