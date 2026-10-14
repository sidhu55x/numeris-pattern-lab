# Numeris · Pattern Lab

A mobile-friendly Lotto Max forecasting experiment with an auditable prediction ledger, chronological comparisons, rule-aware training and scheduled updates. No dependencies for the browser or Node engine.

## Run

Node 22+ and Python 3 are required. `npm run dev` serves http://localhost:8080. `npm test` runs forecasting constraints and leakage checks. `npm run analyze` recomputes scores from the bundled history. `npm run refresh` downloads current data and recomputes analysis (requires curl and Poppler's pdftotext; macOS: `brew install poppler`; Ubuntu: `sudo apt-get install poppler-utils`).

## What the first experiment does

- Imports national main draws from September 25, 2009, retaining dates, seven main numbers, bonus and provenance. MAXMILLIONS, MAXPLUS and regional EXTRA are excluded from training.
- Checks every scheduled main draw is present; validates number ranges, distinct main/bonus numbers and consistency wherever official sources overlap. This is structural validation, not independent verification of every number.
- Resets training at changes from 49 to 50 to 52 numbers. Each era has 30 training draws before test scoring starts.
- Evaluates uniform inclusion probabilities, smoothed frequency, recent 30/100 draw frequencies, a gap hypothesis, a last-draw overlap transition hypothesis and an adaptive weighted ensemble.
- Updates ensemble weights using only earlier test losses. Model settings are fixed in `dist/engine.js` and versioned.
- Measures marginal Brier loss, selected-line overlap, 3+ matches and paired improvement intervals. Uniform random expected overlap is 49/N; marginal Brier baseline is (7/N)(1-7/N).
- Uses a conservative exploratory promotion gate: 100 current-era test draws and a positive lower 3-SE paired improvement interval. This is a heuristic gate, not a formal multiple-testing or dependence-adjusted significance test. Future live evaluation is required. Current model settings were designed after historical data existed; chronological reconstruction is not equivalent to a preregistered live test.
- Records a forecast for the next scheduled draw; existing target/version entries are retained. The ledger stores every candidate's numbers and inclusion probabilities. After actual outcomes arrive, it adds scores without changing the saved prediction. Source Git commits provide a reviewable audit trail; a repository owner can still edit history.

`dist/data/analysis.json` contains all-era aggregates and the last 104 detailed test records. `history.json` retains full history. `predictions.json` is the shared forward ledger. UI refresh fetches published JSON; it does not scrape official websites from the browser.

## Learning after each draw

The refresh job scores the frozen forecast and all candidate forecasts against the outcome, including probabilities assigned to each actual number. The dashboard separates reconstructed historical tests from live records. Ensemble weights automatically adapt to accumulated earlier losses. Inventing a new model requires a code change, new engine version, tests and future validation; this program does not autonomously rewrite its own algorithms. A single missed draw does not determine which change improves forecasting.

## Rule timeline and sources

- September 25, 2009: first draw; 7/49, Friday draws.
- July 2015: cap raised from $50M to $60M (prize context; unchanged number matrix).
- May 14, 2019: 7/50, Tuesday and Friday schedule, RNG transition, $70M cap and secondary prize changes. OLG FAQ describes the May 2019 draw-mechanism change; historical game conditions and national lottery histories establish the matrix boundary.
- September 10, 2024: $80M cap; same 7/50 matrix.
- April 14, 2026: 7/52, $6 for four lines, $90M cap and MAXPLUS.

Sources: [WCLC full history](https://www.wclc.com/display-on/display-on-downloads/lotto-max-since-inception.htm), [WCLC recent results](https://www.wclc.com/winning-numbers/lotto-max-extra.htm), [OLG FAQ](https://www.olg.ca/en/frequently-asked-questions/lottery-games/lotto-max.html), [OLG 2024 announcement](https://about.olg.ca/an-even-bigger-lotto-max-coming-september-2024/), [OLG 2026 announcement](https://about.olg.ca/the-new-lotto-max-is-here/).

### Explicit archive corrections

The WCLC PDF contains source errors and inconsistent date punctuation. No general numeric truncation or guessed correction is applied. The importer stops if any other invalid record or missing scheduled draw occurs.

- `December 31, 2020` between December 2019 and January 2020 is corrected to 2019-12-31. [Independent record](https://www.lotto.net/canada-lotto-max/numbers/december-31-2019).
- `January 2, 2025` immediately before January 6, 2026 is corrected to 2026-01-02. [Independent record](https://www.lotto.net/canada-lotto-max/numbers/january-02-2026).
- 2022-01-25: malformed bonus 374 corrected to 37. [Independent record](https://www.lotto.net/canada-lotto-max/numbers/january-25-2022).
- 2024-11-26: incomplete PDF row replaced with 20,24,31,33,36,41,49 + bonus 50. [Independent record](https://www.lotto.net/canada-lotto-max/numbers/november-26-2024).
- 2026-03-03: impossible main number 61 corrected to 31. [Independent record](https://www.lotterypost.com/results/zz/lottomax/extradraws/2026/3/3).

Data sources retain their respective rights. This repository is an independent hobby project with no OLG affiliation.

## GitHub and phone access

There is no daily refresh schedule. Click **Refresh latest data** on the page to fetch the official monthly archive and recent results through the Vercel `/api/latest` endpoint, validate complete coverage, rerun all model comparisons, score saved predictions, and generate the next forecast. The server uses the bundled validated history as its historical base and appends new archived/recent draws; it checks overlapping recent official records for disagreements.

The page retains the refreshed data and forward ledger in this browser's local storage. Records do not sync between devices. Export experiment data for a backup. If a fetch, validation or computation fails, the current page results remain intact and the button allows retry. Browser storage failures are reported. Server requests have timeouts and do not accept arbitrary upstream URLs. No credentials are exposed to the browser.

GitHub Pages publishes source updates on push. The optional GitHub Actions manual workflow remains available to refresh the committed dataset; it has no timer. The Vercel deployment supplies the on-demand endpoint. The earlier private Sites deployment is an initial snapshot; use the GitHub Pages URL for the current app.

## Adding games

Keep game rules and result ingestion separate from scoring. Add a new adapter with its outcome space, validation, baseline, schedule and scoring; do not apply Lotto Max inclusion probabilities to roulette. The existing interface implements Lotto Max only.
