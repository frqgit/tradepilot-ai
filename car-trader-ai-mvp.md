# TradePilot.AI – MVP Product Requirements

*AI agent SaaS for professional car traders & small dealerships*

---

## 1. Market Scan – Existing Dealer / Car-Trading SaaS

Below is a non-exhaustive list of relevant platforms and what they focus on. We’ll “borrow” their strongest ideas into our own product design:

1. **DealerCenter** – All-in-one cloud DMS: inventory management, CRM, BHPH, websites, digital marketing. ([dealercenter.com][1])
2. **Virtual Yard** – Cloud DMS for new & used dealers; stock entry once, send to many classified partners; strong AU footprint. ([virtualyard.com][2])
3. **AutoGrab** – “Automotive intelligence platform” with market-wide vehicle data, valuations, and insights powering other platforms. ([AutoGrab][3])
4. **MotorPlatform** – Trade-in/acquisition, valuation & disposal ecosystem; B2B marketplace + pricing engine. ([motorplatform.com.au][4])
5. **EasyCars** – AU dealer management with stock, advertising, invoicing, and dealer websites. ([EasyCars][5])
6. **IndiQator / Cloudlogic DMS** – Cloud DMS with state-specific compliance forms & legislative/statutory support. ([Indiqator Solutions][6])
7. **Autologica Sky DMS** – Cloud DMS covering all dealership departments; includes CRM, BI, app tools. ([Gartner][7])
8. **MotorDesk** – Dealer software with unified omni-channel leads (email, SMS, WhatsApp, social) + deal builder and accounting integrations. ([MotorDesk][8])
9. **AutoManager** – Dealer management + responsive websites, inventory, marketing tools. ([AutoManager][9])
10. **MotorK (StockSparK)** – Stock management & campaign launcher, publishing inventory to many portals from one hub. ([MotorK][10])
11. **CarCollect** – All-in-one B2B platform for trading, logistics, inventory, and valuation. ([CarCollect][11])
12. **Cars2click** – Cross-border B2B trading & fleet operations with asset management tools. ([Cars2click][12])
13. **CarOnSale** – B2B marketplace for used car trading (Europe), tailored to professional dealers. ([CarOnSale][13])
14. **AutoBrief Trading Hub** – Online marketplace specifically for professional car traders (manufacturers, fleets, leasing). ([Autobrief][14])
15. **Flipacar** – Digital B2B vehicle trading, connecting car traders via app. ([Flipacar][15])
16. **Impel AI** – AI-driven automation for dealers across the customer lifecycle (sales + service). ([Impel AI][16])
17. **Matador AI** – Conversational AI for automotive; opportunity search + automated sales & service conversations. ([Matador AI][17])
18. **Drivee AI** – AI platform to predict customer behaviour, personalize interactions, automate sales tasks. ([Drivee AI][18])
19. **DealerAI** – Multi-Agent AI system providing custom dealership agents (trade-in, test drive, specs, etc.). ([dealerai.com][19])
20. **Numa** – AI agent platform for dealerships (call rescue, scheduling, communication visibility). ([numa.com][20])
21. **Fullpath** – AI-powered dealership data platform (first-party data hygiene, marketing, automation). ([Fullpath][21])

**Key gaps / opportunity for our product:**

* Most tools are **heavy DMS or CRM** aimed at full dealerships, not **lean pro-traders** (1–10 people) flipping 2–50 cars/month.
* “AI” is often focused on **lead communication**, not on **deal sourcing, pricing, and P&L-first workflows** for traders.
* B2B trading marketplaces exist, but **no unified AI “co-pilot”** that:

  * scans multiple sources,
  * values cars,
  * predicts margin & days-to-sell,
  * and manages the trader’s mini-pipeline end-to-end.

TradePilot.AI will aim directly at this.

---

## 2. Product Vision

> **TradePilot.AI is an AI co-pilot for car traders that finds, scores, and manages deals across marketplaces – from lead to sold – with a simple web app.**

### 2.1 Target Users

1. **Solo / small car traders** (2–10 staff)

   * Buy/sell used cars, often part-time or semi-professional.
   * Pain: too many listings, hard to know what’s a “good buy”, manual spreadsheets.

2. **Small independent dealers (used cars only)**

   * 10–50 cars in stock, limited IT capacity.
   * Pain: no one wants to implement full DMS; want “deal radar + AI assistant”.

3. **Wholesalers / B2B traders** (future)

   * Focused on bulk trades; requires B2B integrations.

### 2.2 Problems To Solve

* Browsing multiple sites manually to find profitable cars is **time-consuming**.
* Pricing is **uncertain** – fear of overpaying or getting stuck with slow-selling stock.
* No simple view of **expected margin, holding cost, and risk** for each deal.
* Communication with sellers/buyers is scattered (phone, SMS, FB, email).
* Traders are not data scientists; they want **recommendations**, not charts.

### 2.3 MVP Goals

* Help a trader **find and evaluate good car deals 2–3x faster** than their current manual process.
* Provide **AI-generated “buy or skip” recommendations** for candidate vehicles.
* Maintain a simple **deal pipeline** (sourcing → offer → acquired → recondition → listed → sold).
* Offer **basic communication AI** (templated outreach & replies), not full CRM.

---

## 3. Scope – MVP vs Out of Scope

### In Scope (MVP)

* Web SaaS app with login & subscription.
* Deal-sourcing “feed” (manual import + basic connectors/APIs where possible).
* AI valuation & margin estimation (best effort, transparent “confidence”).
* Simple pipeline / kanban for deals.
* Basic vehicle & contact data storage.
* Simple AI messaging assistant for outreach templates & follow-ups.
* Export of purchased cars to a CSV/template suitable for manual upload to marketplaces.

### Out of Scope (MVP)

* Full DMS (accounting, F&I, full compliance, trust accounting).
* Workshop / service bookings.
* Deep OEM integrations.
* Fully automated listing publishing to multiple classified sites (Phase 2+).
* Phone-call AI agents / voice bots (Phase 2+).

---

## 4. Core User Flows

### 4.1 Deal Sourcing & Evaluation

1. User logs in and sees **Deal Feed**.
2. They **add sources**:

   * Manual: paste listing URLs or bulk-import CSV.
   * Semi-automatic: use browser extension or simple scraping for common marketplaces (future).
3. System fetches listing data (title, year, make, model, km, location, price, photos).
4. AI **Valuation Agent**:

   * Uses historical data (internal + external APIs where available) to estimate fair value & days-to-sell.
   * Calculates recommended buy price, target sell price, estimated gross profit, and risk rating.
5. User gets a ranked list of potential deals with tags: **“Strong Buy”, “Maybe”, “Skip”**.

### 4.2 Deal Pipeline Management

1. User drags a deal from `SOURCED` → `CONTACTED` → `OFFERED` → `ACQUIRED` → `LISTED` → `SOLD`.
2. Each stage shows key metrics: expected vs actual purchase price, reconditioning cost, days-in-stock.
3. AI suggests next best action (e.g. “Message seller with this offer”, “Raise price”, “Liquidate”).

### 4.3 AI Messaging / Communication

1. From any deal, user clicks **“Contact Seller”**.
2. AI drafts a message based on: listing details, target margin, negotiation style (configurable).
3. User copies & sends via their preferred channel (email/SMS/WhatsApp/FB for MVP).
4. Future: inbound messages piped in and summarised.

---

## 5. Feature List – MVP

### 5.1 Must Have

1. **Authentication & Accounts**

   * Email/password login, password reset.
   * Single organization per account (MVP).

2. **Deal Feed**

   * Add listing manually via URL or form.
   * Auto-parse title/make/model/year/price where possible.
   * Show AI-computed fields: fair value range, recommended buy, target sell, margin, risk band.

3. **Pricing & Margin Engine (AI-assisted)**

   * Heuristic + ML model for:

     * Price benchmark vs similar vehicles (using internal DB + external sources when available).
     * Estimated days-to-sell (low/medium/high).
   * Expose “assumptions” clearly to build trust.

4. **Pipeline Board**

   * Columns representing deal stages.
   * Drag & drop between columns.
   * Per-deal notes, estimated and actual numbers.

5. **AI Deal Summary & Recommendation**

   * One-click generation of summary:

     * Pros/cons, risks, suggested max buy price, probability of achieving target margin.
   * Simple explanation in plain English.

6. **AI Outreach Templates**

   * Pre-built templates (initial inquiry, negotiation, follow-up).
   * AI fills in car details and tone (polite, firm, urgent).

7. **Basic Analytics**

   * Simple dashboard:

     * # deals reviewed, # bought, win rate.
     * Average gross margin & days-in-stock (historical).

8. **Billing (Stripe)**

   * Simple monthly subscription, minimum one plan for MVP.

### 5.2 Nice To Have (Post-MVP)

* Multi-user teams, roles & permissions.
* Multi-channel messaging inside app (email/SMS/WhatsApp integration).
* Direct marketplace integrations (listings & data).
* B2B marketplace connectivity (CarOnSale, AutoBrief, etc., where APIs/partnerships permit).
* Voice AI / phone number support like Numa. ([numa.com][20])

---

## 6. System Architecture (High-Level)

### 6.1 Tech Stack (Recommended)

* **Frontend**:

  * **Next.js (React + TypeScript)** – ideal for Vercel deployment, SEO, SSR.
  * UI: Tailwind CSS + component library (e.g. shadcn/ui).

* **Backend**:

  * **Node.js + NestJS** (or Express with clear modular APIs).
  * Expose REST (and optionally GraphQL) endpoints for web client.
  * Hosted on Vercel serverless functions or a Node host (Railway/Fly.io/etc).

* **Database**:

  * **PostgreSQL (Neon)** – serverless Postgres, good with Vercel.
  * ORM: **Prisma** for type-safe data access.

* **AI Layer**:

  * Use OpenAI / similar LLM for:

    * Deal summary & recommendation.
    * Message template generation.
  * Optional: a small pricing model (sklearn/lightGBM) for numeric predictions hosted in backend.

* **Integration / Messaging**:

  * Stripe SDK for billing.
  * Future: email/SMS via providers (SendGrid, Twilio etc.).

* **Infrastructure / DevOps**:

  * Vercel for frontend + serverless APIs.
  * Neon for Postgres DB.
  * GitHub Actions or Vercel CI for deploys.

### 6.2 Logical Architecture

* **Client (Next.js)**

  * Pages: `/login`, `/signup`, `/deals`, `/deals/:id`, `/dashboard`, `/settings`.
  * State management: React Query / TanStack Query + some context.

* **API Services (NestJS modules)**

  * `auth` – JWT, session management.
  * `users` – profiles & settings.
  * `deals` – listing import, evaluation, pipeline.
  * `pricing` – pricing engine & AI valuation.
  * `ai` – LLM endpoints (summary, recommendations, messaging).
  * `billing` – Stripe webhooks & plan checks.

* **Data Storage**

  * PostgreSQL for relational data.
  * Object storage (e.g. Supabase storage / S3) for images/log files (later).

---

## 7. Data Model (Initial)

### 7.1 Core Tables

* `users`

  * `id`, `email`, `password_hash`, `name`, `created_at`, `org_id`, `role`.

* `organizations`

  * `id`, `name`, `country`, `timezone`, `created_at`, `plan`.

* `vehicles`

  * `id`, `org_id`, `source_listing_id` (nullable),
  * `vin` (optional), `year`, `make`, `model`, `variant`, `odometer`, `transmission`, `fuel_type`, `body_type`,
  * `colour`, `features_json`, `created_at`.

* `deal_sources`

  * `id`, `org_id`, `type` (manual, marketplace_x, csv_import),
  * `name`, `url_pattern` (optional).

* `deals`

  * `id`, `org_id`, `vehicle_id`, `source_url`, `source_site`,
  * `status` (enum: sourced, contacted, offered, acquired, listed, sold, lost),
  * `ask_price`, `negotiated_price`,
  * `estimated_fair_value_low`, `estimated_fair_value_high`,
  * `estimated_target_sell_price`,
  * `estimated_margin`, `estimated_days_to_sell`, `risk_score`,
  * `actual_purchase_price`, `actual_sell_price`, `reconditioning_cost`,
  * `created_at`, `updated_at`.

* `contacts`

  * `id`, `org_id`, `name`, `phone`, `email`, `type` (seller, buyer), `notes`.

* `deal_contacts`

  * `deal_id`, `contact_id`, `role` (seller, buyer).

* `notes`

  * `id`, `org_id`, `deal_id`, `author_id`, `content`, `created_at`.

* `ai_insights`

  * `id`, `deal_id`, `type` (summary, recommendation, risk_analysis),
  * `content`, `model`, `created_at`.

* `subscriptions`

  * `org_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `renewal_date`.

---

## 8. AI Agent Design

### 8.1 Agent Types (Conceptual)

1. **Sourcing Agent**

   * Input: listing URL / structured data (price, make, model, year, km, location).
   * Tasks: normalise data, infer missing attributes, tag vehicle.

2. **Pricing & Margin Agent**

   * Uses numeric model + LLM explanation.
   * Output: fair value range, recommended buy price, target sell price, days-to-sell estimate, risk score.

3. **Deal Advisor Agent**

   * Reads all data for a deal + user’s preferences (min margin, max days-in-stock).
   * Output: natural-language recommendation (Buy / Maybe / Skip) + reasoning & bullet-point pros/cons.

4. **Messaging Agent**

   * Templates plus few-shot examples for negotiation style.
   * Output: ready-to-copy message for seller/buyer.

### 8.2 Agent Tooling / Inputs

* Access to `vehicles` & `deals` tables through backend tools.
* Access to pricing model predictions via backend function.
* Access to user profile (preferred margin %, tone).

---

## 9. UX – Key Screens

### 9.1 Deals Feed

* Table/card layout with:

  * Car summary (photo, year/make/model, km).
  * Ask price, fair value band, recommended buy, estimated margin %, days-to-sell, risk colour.
  * Action buttons: `View`, `Summarise`, `Create Message`, `Move to Pipeline`.

### 9.2 Deal Detail

* Sections:

  * **Header**: car details & pricing card.
  * **AI Summary**: explanation of recommendation.
  * **Financials**: estimated vs actual numbers, reconditioning cost.
  * **Timeline**: status changes, notes.
  * **Messages**: AI-generated templates.

### 9.3 Pipeline Board

* Kanban columns with deal cards.
* Each card: car summary, margin, days-in-stage.
* Quick actions: change status, open details, add note.

### 9.4 Settings

* Organization profile, country, default GST/VAT handling (future).
* AI preferences: negotiation tone, target margin, risk tolerance.

---

## 10. Non-Functional Requirements

* **Performance**:

  * Deal feed loads in <1.5s for 100 deals.
  * AI calls return in <8s (with loading states).

* **Security & Compliance**:

  * HTTPS everywhere.
  * Store only required personal data.
  * JWT-based auth; hashed passwords (argon2/bcrypt).

* **Reliability**:

  * Daily automated backups of database.

* **Observability**:

  * Basic logging for API errors.
  * Metrics on AI call volume & latency.

---

## 11. Success Metrics (MVP)

* ≥ 5–10 active pilot traders using the system weekly.
* Users can evaluate and decide on deals **at least 2x faster** vs their previous manual workflow (based on interviews).
* ≥ 70% of AI recommendations considered **“useful” or “very useful”** by users.
* Churn < 20% in first 3 months for paying users.

---

## 12. Implementation Roadmap (High-Level)

**Phase 1 – Foundation**

* Auth, orgs, basic DB schema.
* Manual deal creation & listing view.
* Basic heuristic pricing engine (no ML yet).

**Phase 2 – AI & Pipeline**

* LLM-based deal summary & recommendation.
* Pipeline board + simple analytics.
* AI messaging templates.

**Phase 3 – Refinement**

* Improve pricing model via historical data.
* Basic imports (CSV, simple scrapers/extension).
* Billing & subscription.

---

If you like, next step I can:

* Turn this into a **file structure + initial Next.js/NestJS/Prisma boilerplate plan**, or
* Focus just on the **AI pricing agent design and training plan** (features, labels, evaluation).

You can copy-paste this entire answer as `tradepilot-ai-prd.md` and start building.

* [The Times](https://www.thetimes.co.uk/article/motorway-qdlg77r79?utm_source=chatgpt.com)
* [The Australian](https://www.theaustralian.com.au/business/technology/amazon-of-used-cars-cars24-looking-to-shake-up-dealers-undercutting-prices-by-up-to-5pc/news-story/4568a527eeb65e6ec59e7a0b48793c22?utm_source=chatgpt.com)
* [reuters.com](https://www.reuters.com/business/autos-transportation/ford-sell-used-vehicles-amazon-joining-hyundai-2025-11-17/?utm_source=chatgpt.com)

[1]: https://www.dealercenter.com/?utm_source=chatgpt.com "Dealer Management System | Dealer CRM | Dealer Software"
[2]: https://virtualyard.com/?utm_source=chatgpt.com "Virtual Yard | All-in-One Dealership Management System ..."
[3]: https://autograb.com.au/?utm_source=chatgpt.com "AutoGrab – Automotive Software Solutions & Intelligence"
[4]: https://www.motorplatform.com.au/?utm_source=chatgpt.com "MotorPlatform - Driving Dealership Success"
[5]: https://www.easycars.com.au/?utm_source=chatgpt.com "EasyCars: Automotive Dealer Management Systems | Dealer ..."
[6]: https://indiqator.com.au/dms/?utm_source=chatgpt.com "Dealer Management System (DMS)"
[7]: https://www.gartner.com/reviews/market/dealer-management-systems?utm_source=chatgpt.com "Best Dealer Management Systems Reviews 2025"
[8]: https://motordesk.com/?utm_source=chatgpt.com "MotorDesk: Used Car Dealership Software"
[9]: https://www.automanager.com/?utm_source=chatgpt.com "Dealer Management Software & Dealer Websites | Used Car ..."
[10]: https://www.motork.io/?utm_source=chatgpt.com "MotorK, SaaS Solution and Software for automotive ..."
[11]: https://www.carcollect.com/?utm_source=chatgpt.com "CarCollect - The all-in-one automotive platform"
[12]: https://cars2click.com/?utm_source=chatgpt.com "Cars2click"
[13]: https://www.caronsale.com/en?utm_source=chatgpt.com "B2B marketplace for car dealers - Buy & Sell"
[14]: https://autobrief.io/trading-hub/?utm_source=chatgpt.com "AutoBrief Trading Hub for vehicle sourcing"
[15]: https://flipacar.com/flipacar-delivers-digital-b2b-vehicle-trading-by-connecting-car-traders/?utm_source=chatgpt.com "FLIPACAR Delivers Digital B2B Vehicle Trading By ..."
[16]: https://impel.ai/?utm_source=chatgpt.com "Impel AI: Automotive AI-Powered Customer Lifecycle ..."
[17]: https://matador.ai/?utm_source=chatgpt.com "Matador AI – #1 Conversational AI for Automotive"
[18]: https://drivee.ai/?utm_source=chatgpt.com "Drivee AI | AI for Car Dealerships [Best AI Car Sales software]"
[19]: https://dealerai.com/?utm_source=chatgpt.com "DealerAI: AI for Car Dealerships"
[20]: https://www.numa.com/?utm_source=chatgpt.com "Numa | AI for Dealerships"
[21]: https://www.fullpath.com/ai-solutions-for-car-dealerships/?utm_source=chatgpt.com "AI for Car Dealerships - Automotive AI Services & Solutions"
