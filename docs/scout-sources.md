# Klawed — Scout Hunting Sources

> The Scout's target list. Generated from the Gemini source directory
> (`Builder Opportunity Source Directory.docx`) + `studentoffers.co`.
> **213 sources** across every board lane. Hunt these DIRECTLY — do not fall back
> to generic web searches, which surface expired/recycled content.
>
> Each entry: **Name | URL | Class | Lanes | Region | Cadence | What to look for**
> `[verify]` = unconfirmed by the source; the Verifier must check it before use.

## How the Scout uses this file
1. Work lane by lane. For each lane, fetch/extract from the listed canonical sources.
2. Apply the **Search-Term Dictionary** (§Search) for phrase-level detection.
3. Apply the **Freshness Heuristics** (§Freshness) before accepting anything.
4. Honour the **Ingestion Schedule** (§Schedule) — daily sources every run, weekly
   sources on the weekly run, per-cohort sources when their cycle is near.
5. Everything found goes to `quarantine/raw/scout_<date>.md` in the standard format.



## Jobs & Remote

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Paystack | paystack.com/careers | Corporate ATS (Lever) | jobs, remote, internships | Nigeria / Africa | Weekly | Target direct Lever board endpoint /jobs/paystack; filter for Engineering, Product, and Design divisions. |
| Flutterwave | flutterwave.com/careers | Corporate ATS (Greenhouse) | jobs, remote, internships | Nigeria / Africa / Global | Weekly | Parse Greenhouse API feed /v1/boards/flutterwave/jobs; identify Lagos and distributed Pan-African openings. |
| Moniepoint (formerly TeamApt) | moniepoint.com/careers | Corporate ATS (Workable) | jobs, remote, internships | Nigeria / Africa / UK | Daily | Monitor Workable board; track engineering, system operations, and financial infrastructure vacancies. |
| Interswitch Group | interswitchgroup.com/careers | Corporate Portal (Oracle Cloud) | jobs, internships | Nigeria / East Africa | Bi-weekly | Inspect /careers search interface; filter by enterprise switching, switching integrations, and merchant operations. |
| Andela | andela.com/careers | Talent Cloud & ATS | jobs, remote | Africa / Global | Daily | Scrape remote technical network intake and internal staff vacancies via Ashby/Lever career feeds. |
| Kuda Technologies | kuda.com/careers | Corporate ATS (Ashby) | jobs, remote, internships | Nigeria / UK | Weekly | Target Ashby public API endpoint /api/candidate-portal/kuda; track banking platform engineering and product design. |
| OPay Nigeria | opayweb.com/join-us | Corporate Portal | jobs, internships | Nigeria / Africa | Monthly | Scrape human resource portal; monitor operations, offline merchant development, and backend banking infra. |
| Sabi AM | sabi.am/careers | Corporate ATS | jobs, remote | Nigeria / Africa | Bi-weekly | Parse B2B retail distribution tech positions and marketplace logistics platform developer hiring. |
| Moove Africa | moove.io/careers | Corporate ATS (Lever) | jobs, remote | Nigeria / Africa / Global | Bi-weekly | Query Lever API /v1/boards/moove; focus on mobility fintech, credit telemetry, and vehicle financing analytics. |
| Cowrywise | cowrywise.com/careers | Corporate ATS | jobs, internships | Nigeria | Ad-hoc | Monitor investment platform hiring; check engineering apprenticeships and product management roles. |
| Termii | termii.com/careers | Corporate ATS | jobs, remote | Nigeria / Africa | Ad-hoc | Track telecommunications API infrastructure roles, messaging integration engineers, and sales engineering. |
| Chimoney | chimoney.io/careers | Corporate ATS | jobs, remote, internships | Global / Africa | Ad-hoc | Parse developer evangelism, global payout API integration engineering, and Web3 gateway infrastructure. |
| Jumia Group | group.jumia.com/careers | Corporate ATS (SmartRecruiters) | jobs, internships | Africa (Pan-African) | Weekly | Parse SmartRecruiters API /companies/jumia; track tech centers in Lagos, Cairo, and Porto. |
| Takealot Group | takealot.com/careers | Corporate ATS | jobs, remote | Africa (South Africa focus) | Weekly | Monitor e-commerce engineering, catalog services, fulfillment logistics software, and data science pipelines. |
| DHL Africa | careers.dhl.com | Enterprise ATS | jobs, internships | Africa / Global | Weekly | Regional supply chain operations and digital express integration engineering across West and East Africa. |
| MTN Nigeria | mtn.ng/careers | Enterprise ATS | jobs, internships | Nigeria | Weekly | Monitor telecommunications software, cloud infra engineering, MoMo fintech core banking, and network operations. |
| Airtel Africa | airtel.africa/careers | Enterprise ATS | jobs, internships | Africa (Pan-African) | Weekly | Query digital labs and telecom analytics boards across Lagos, Nairobi, and London offices. |
| First Bank of Nigeria | firstbanknigeria.com/careers | Enterprise Portal | jobs, internships | Nigeria | Monthly | Monitor annual Graduate Trainee Program and Information Technology Infrastructure operations desks. |
| Zenith Bank | zenithbank.com/careers | Enterprise Portal | jobs, internships | Nigeria | Monthly | Parse digital solutions, core banking transformations, and regional entry-level engineering pipelines. |
| Guaranty Trust Holding (GTCO) | gtbank.com/careers | Enterprise Portal | jobs, internships | Nigeria / West Africa | Monthly | Track HabariPay engineering intake, tech-focused corporate entry initiatives, and data analytics cohorts. |
| Automattic | automattic.com/work-with-us | Direct Remote Career Hub | jobs, remote | Global (Worldwide remote) | Weekly | Track distributed software engineering, WordPress core, WooCommerce, and platform operations roles. |
| GitLab | about.gitlab.com/jobs | Corporate ATS (Greenhouse) | jobs, remote, internships | Global (Worldwide remote) | Weekly | Query Greenhouse API /v1/boards/gitlab/jobs; fully distributed roles supporting international contractor payroll. |
| Deel | deel.com/careers | Corporate ATS (Ashby) | jobs, remote | Global (Worldwide remote) | Daily | Scrape Ashby endpoint; track global payroll infrastructure, compliance tooling, and cross-border billing systems. |
| Remote.com | remote.com/careers | Corporate ATS (Ashby) | jobs, remote | Global (Worldwide remote) | Daily | Track international Employer of Record (EOR) engineering, distributed systems, and localized contractor operations. |
| Toptal | toptal.com/careers | Talent Network ATS | jobs, remote | Global (Worldwide remote) | Weekly | Monitor internal corporate engineering roles and fully distributed client-facing talent network recruitment. |
| Himalayas | himalayas.app/jobs | Niche Remote Aggregator | jobs, remote | Global / Africa filter | Daily | Query public API or /jobs/countries/nigeria for verified global-remote engineering positions with salary bands. |
| We Work Remotely | weworkremotely.com | Remote Job Board | jobs, remote | Global | Daily | Target RSS/Atom feeds by category (e.g., remote-jobs/programming); extract positions labeled "Anywhere in the World". |
| Remotive | remotive.com | Curated Remote Board | jobs, remote | Global | Daily | Query public API endpoint https://remotive.com/api/remote-jobs; parse location tags allowing non-US/EU contractors. |
| Jobspresso | jobspresso.co | Remote Curator | jobs, remote | Global | Weekly | Parse /browse-jobs/ using tag filters for full-stack development, devops, and international eligibility. |
| Dynamite Jobs | dynamitejobs.com | Remote Aggregator | jobs, remote | Global | Daily | Monitor search interface with time-zone and geographic filters configured to GMT-1 to GMT+3. |
| Wellfound (AngelList) | wellfound.com/jobs | Startup Employment Platform | jobs, remote, internships | Global / Africa | Daily | Parse venture-backed startup roles; filter for remote authorization and African builder availability. Account required. |
| Zindi Talent | zindi.africa/jobs | African Data Science Portal | jobs, remote, internships | Africa | Weekly | Monitor machine learning, data engineering, and data analysis vacancies hosted directly on the Zindi ecosystem. |

## Hackathons, Competitions & Bounties

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Devpost | devpost.com/hackathons | Global Hackathon Platform | hackathons, student_deals | Global / Virtual | Daily | Monitor /hackathons?challenge_type[]=online; parse registration deadlines, theme tags, and cash prize pools. |
| Major League Hacking (MLH) | mlh.io/seasons/2026/events | Student / Developer League | hackathons, internships | Global / Virtual | Weekly | Scrape current season event calendar; index virtual hackathons, hardware labs, and MLH Fellowship calls. |
| DoraHacks | dorahacks.io/hackathon | Web3 & AI Hackathon Hub | hackathons, grants | Global / Africa filter | Daily | Scrape /hackathon feed; filter by tags AI, Crypto, Africa, and open submission windows with prize pools. |
| Zindi Africa | zindi.africa/competitions | Pan-African Data Science Hub | hackathons, jobs | Africa | Weekly | Monitor active machine learning challenges; extract closing dates, submission leaderboard metrics, and prize purses. |
| Kaggle | kaggle.com/competitions | ML & Predictive Analytics Hub | hackathons, grants | Global | Weekly | Track active featured, research, and community competitions via Kaggle API /competitions/list. |
| Wema Bank Hackaholics | hackaholics.wemabank.com | Corporate Fintech Hackathon | hackathons, grants | Nigeria | Per-cohort | Monitor annual launch cycles (Hackaholics editions); track pitch dates, regional qualifiers, and grant awards. |
| Superteam Nigeria / Superhack | superhack.fun | Web3 Regional Hub (Solana) | hackathons, grants | Nigeria | Per-cohort | Scrape active student and builder challenges; track Solana bounty disbursements and localized buildathons. |
| ETHGlobal | ethglobal.com/events | Ethereum Hackathon League | hackathons, grants | Global / Virtual | Per-cohort | Monitor upcoming virtual hackathons (e.g., Circuit, Scaling, Agentic); extract project registration timelines. |
| Encode Club | encode.club/hackathons | Developer Education & Bounties | hackathons, internships | Global / Virtual | Bi-weekly | Parse program calendar; monitor accelerator-track hackathons across major blockchain, AI, and cloud verticals. |
| Taikai | taikai.network/hackathons | Hackathon SaaS Platform | hackathons, grants | Global / Emerging Mkts | Weekly | Scrape public challenges directory; extract active submission deadlines, mentor matching, and crypto/fiat prizes. |
| Earn (Superteam Earn) | earn.superteam.fun | Ecosystem Bounty Platform | hackathons, grants, remote | Global / Nigeria Hub | Daily | Parse bounties and freelance grants filtered by regional jurisdiction (Nigeria hub) and global access tags. |
| Gitcoin Bounties / Hackathons | gitcoin.co | Open Source Grants / Bounties | hackathons, grants | Global | Bi-weekly | Track active developer bounties, quadratic funding participation sprints, and open-source contribution drives. |
| NaijaHacks | naijahacks.com [verify] | Regional Developer Hackathon | hackathons | Nigeria | Annual / Ad-hoc | Monitor annual registration announcements targeting Nigerian university and post-graduate engineering talent. |
| Solana Colosseum | colosseum.org | Protocol Hackathon / Pre-Seed | hackathons, accelerators | Global | Bi-annual | Ingest flagship Solana Foundation global hackathon cycles and direct foundation accelerator admissions. |
| HackQuest | hackquest.io | Developer Education & Bounties | hackathons, student_deals | Global / Emerging Mkts | Bi-weekly | Target open developer learning tracks and associated web3 sponsor hackathons with dedicated bounty tracks. |

## Grants & Non-Dilutive Funding

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| XRPL Grants | xrplgrants.org | Protocol Grant Program | grants | Global (inc. Africa) | Per-cohort | Track wave release dates; non-dilutive technical grants for developers building on the XRP Ledger. |
| Ethereum Foundation (ESP) | esp.ethereum.foundation | Protocol Ecosystem Support | grants | Global | Rolling basis | Ingest Ecosystem Support Program open office hours and small grants track (<$30,000 equity-free). |
| Solana Foundation Grants | solana.foundation/grants | Protocol Grant Program | grants | Global | Rolling basis | Monitor open grant submission forms; focus on developer tooling, localized payments, and infrastructure. |
| Gitcoin Grants | grants.gitcoin.co | Quadratic Funding Protocol | grants | Global | Quarterly cohorts | Scrape quarterly Gitcoin Grant Rounds (GG rounds); index community round application deadlines. |
| AWS Activate | aws.amazon.com/activate | Cloud Infrastructure Credits | ai_credits, grants | Global | Rolling basis | Scrape Tier parameters (Portfolio vs. Founders); up to $100,000 in promotional infrastructure credits. |
| Microsoft for Startups Founders Hub | foundershub.startups.microsoft.com | Enterprise Startup Program | ai_credits, grants | Global | Rolling basis | Monitor tier progressions; $150,000 in Azure credits, OpenAI API credits, and enterprise tooling access. |
| Google for Startups Cloud Program | cloud.google.com/startup | Cloud & AI Credit Suite | ai_credits, grants | Global | Rolling basis | Index credit tiers for bootstrapped vs. funded startups ($2,000 to $200,000 in Google Cloud and Firebase). |
| GSMA Innovation Fund | gsma.com/mobilefordevelopment | Telecommunications NGO Fund | grants | Africa / Emerging Mkts | Annual cohorts | Scrape grant calls focused on digital inclusion, climate resilience, and financial technologies. |
| Digital Africa Seed Fund | digital-africa.co | Sovereign Development Fund | grants, accelerators | Africa | Per-cohort | Track ticket sizes (€30m-€50m macro allocation) across piloting (€200k) and scale stages (€500k+). |
| Cisco Global Problem Solver | cisco.com/c/en/us/about/csr/gps | Corporate Social Innovation | grants | Global | Annual cohorts | Monitor annual competition launch ($1M+ total prize purse) for tech solutions addressing economic distress. |
| Tony Elumelu Foundation (TEF) | tonyelumelufoundation.org | Pan-African Philanthropic Fund | grants | Africa | Annual (Jan–Mar) | Monitor annual cohort portal; extract non-refundable $5,000 seed capital application announcements. |
| Nigeria Startup Act Portal | startup.gov.ng | Government Portal (NITDA/NSIA) | grants, accelerators | Nigeria | Rolling / Ad-hoc | Monitor official portal for startup labeling, tax clearance, and Startup Investment Seed Fund calls. |
| Harambeans Africa Jobs Fund | harambeans.com | Diaspora / Venture Alliance | grants, accelerators | Africa / Diaspora | Per-cohort | Scrape application cycle for the $20,000 seed grant and follow-on financing pipeline up to $1,000,000. |
| Commonwealth Foundation Grants | commonwealthfoundation.com | Multilateral Foundation | grants | Commonwealth nations | Annual cohorts | Track calls for funding open to civil society tech initiatives in digital justice and economic access. |
| Lisk Ecosystem Grants | lisk.com | Layer-2 Ecosystem Fund | grants, accelerators | Africa / Emerging Mkts | Rolling basis | Ingest developer grants supporting building on the Optimism Superchain-aligned Lisk L2. |
| Stellar Community Fund (SCF) | communityfund.stellar.org | Open Ecosystem Award Fund | grants | Global (inc. Africa) | Monthly cycles | Scrape monthly submission deadlines and community voting rounds for Soroban smart contract builders. |
| Optimism Foundation Grants | optimism.io | Protocol Public Goods Funding | grants | Global | Seasonal cycles | Monitor RetroPGF cycles and governance mission requests providing OP token allocations for public goods. |
| Seedstars Programs | seedstars.com/community/entrepreneurs/ | Emerging Markets Venture Platform | grants, accelerators | Africa / Emerging Mkts | Per-cohort | Ingest blended finance challenges, climate resilience funds, and gender-lens entrepreneurial grants. |

## Accelerators & Startup Studios

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Y Combinator | ycombinator.com/apply | Global Accelerator | accelerators | Global | Bi-annual (Winter/Summer) | Scan for application deadlines, standard investment terms ($500k), and batch interview scheduling. |
| Techstars | techstars.com/accelerators | Global Accelerator Network | accelerators | Global / Regional | Quarterly cycles | Monitor global application portal; filter for worldwide batches with virtual attendance paths. |
| ARM Labs Lagos Techstars | arm.com.ng/arm-labs/ | Regional Corporate Accelerator | accelerators | Nigeria / Africa | Annual cohorts | Scrape annual cohort announcement; check fintech and proptech tracks with direct Lagos cohort residency. |
| Google for Startups Africa | startup.google.com/programs | Corporate Ecosystem Program | accelerators, grants | Africa | Per-cohort | Target Google for Startups Africa Accelerator call page; non-dilutive equity support, cloud credits, and mentorship. |
| MEST Africa Accelerator | meltwater.org | Entrepreneurship Training/VC | accelerators, grants | Africa (NG, GH, KE, ZA) | Annual cohorts | Scrape flagship training program and seed fund applications; monitor MEST Africa Challenge cycles. |
| Norrsken Accelerator | norrsken.org/accelerator | Impact Venture Studio | accelerators | Global / Africa focus | Annual cohorts | Target Stockholm/Kigali House programs; look for $125k upfront ticket terms and impact tech mandates. |
| Antler Africa | antler.co/location/africa | Global Day-Zero VC | accelerators | Africa (Nairobi/Lagos) | Bi-annual cohorts | Scrape founder residency application cycles; track individual talent scout tracks and pre-idea investment calls. |
| 500 Global | 500.co/accelerators | Global Seed Accelerator | accelerators | Global | Rolling / Per-cohort | Parse Flagship Accelerator application deadlines; monitor regional African investment initiatives. |
| Flat6Labs | flat6labs.com/programs | Regional Seed Investor/Studio | accelerators | North Africa / Pan-Africa | Bi-annual cohorts | Ingest regional cohort submission cycles; track localized seed checks and physical incubation labs. |
| Catalyst Fund | catalystfund.net | Inclusive Tech Accelerator | accelerators, grants | Emerging Mkts / Africa | Per-cohort | Scrape climate resilience and financial inclusion cohort openings; $100k equity plus venture-building runway. |
| Microtraction | microtraction.com | Pre-Seed VC Fund | accelerators | Africa (Nigeria-first) | Rolling basis | Ingest open submission Airtable/Typeform link; track initial pre-seed checks ($100k for 7%) for technical founders. |
| Ingressive Capital | ingressivecapital.com | Early-Stage Venture Fund | accelerators | Africa | Rolling basis | Track pitch submission interface; check initial institutional investment checks (400k) across tech verticals. |
| The Baobab Network | thebaobabnetwork.com/apply-now/ | Early-Stage African Accelerator | accelerators | Africa | Rolling basis | Ingest application FAQ and intake system; $100k USD investments into early-stage tech founders. |
| Founders Factory Africa | foundersfactory.africa | Venture Studio & Accelerator | accelerators | Africa | Rolling / Per-cohort | Parse portfolio studio recruitment; track pre-seed and seed venture funding tracks across healthcare and fintech. |
| Ventures Platform | venturesplatform.com | Early-Stage Venture Fund | accelerators | Africa | Rolling basis | Scrape direct pitch deck submission pipeline; focus on market-creating innovators in enterprise and financial software. |
| Future Africa | future.africa | Early-Stage Innovation Fund | accelerators | Africa | Rolling basis | Track founder intake pipeline; focus on infrastructure-building startups across agricultural, health, and financial tech. |
| Co-Creation Hub (CcHUB) | cchub.africa | Innovation Center & Incubator | acceler[span_67](start_span)[span_67](end_span)ators, grants | Nigeria / Kenya / Rwanda | Rolling / Per-cohort | Scrape open calls across EdTech, governance, creative economy, and physical co-working acceleration batches. |
| Plug and Play Tech Center Africa | plugandplaytechcenter.com | Corporate Innovation Platform | accelerators | Africa / Global | Bi-annual | Ingest enterprise partnership program applications connecting African startups to global corporate clients. |

## Visas & Talent Immigration

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| UK Global Talent Visa | gov.uk/global-talent | Official Government Portal | visas | UK | Monthly policy updates | Track designated endorsing bodies (specifically Tech Nation / founders/engineers framework) for criteria modifications. |
| Germany Opportunity Card (Chancenkarte) | digital.diplo.de/chancenkarte | Consular Services Portal | visas, jobs | Germany | Monthly updates | Scrape official Consular Portal and make-it-in-germany.com; monitor points matrix, ZAB credential comparability, and €1,091/month blocked account rules. |
| Portugal D8 Digital Nomad Visa | vistos.mne.gov.pt | Ministry of Foreign Affairs | visas, remote | Portugal | Quarterly updates | Scrape Temporary Stay Visa (up to 1 yr) and Residence Visa (>1 yr); monitor remote income threshold set at 4x Portuguese national minimum wage. |
| Spain Digital Nomad Visa (DNV) | exteriores.gob.es | Ministry of Foreign Affairs | visas, remote | Spain | Quarterly updates | Parse Law 28/2022 framework (UGE-CE); track telework visa rules, 3-year residency cards, and foreign company tenure rules. |
| Estonia Digital Nomad Visa & e-Residency | e-resident.gov.ee | Official Digital Agency | visas, remote | Estonia (EU) | Quarterly updates | Monitor e-Residency digital ID portal and the DNV (Type D) income thresholds (€4,500/month gross verified over 6 prior months). |
| Canada Global Skills & Start-up Visa | canada.ca/en/immigration-refugees-citizenship.html | IRCC Official Portal | visas | Canada | Monthly updates | Track Global Skills Strategy 2-week processing tracks and Start-up Visa designated angel/incubator partner lists. |
| Netherlands Start-up Visa | ind.nl/en/residence-permits/work/start-up | Dutch Immigration Service (IND) | visas | Netherlands | Quarterly updates | Scrape 1-year residence permit rules for foreign founders working under a recognized Dutch facilitator/incubator. |
| Japan Digital Nomad Visa | mofa.go.jp/ca/fna/pagewe_000001_00046.html | Ministry of Foreign Affairs | visas, remote | Japan | Monthly updates | Monitor Designated Activities framework (Digital Nomad route); track 6-month non-extendable status, JPY 10M annual income proof, and private health cover. |
| UAE Golden Visa (Federal ICP) | smartservices.icp.gov.ae | Federal Authority (ICP) | visas | UAE (Federal) | Monthly updates | Scrape specialized talent, software coding, and entrepreneur nomination tracks; extract ministerial accreditation steps. |
| UAE Golden Visa (Dubai GDRFA) | gdrfad.gov.ae/en/golden-visa-appointment | Dubai Immigration Portal | visas | UAE (Dubai) | Monthly updates | Monitor GDRFA verification scheduling, executive salary benchmarks (AED 30k+), and fast-tracked AI/tech professional tracks. |
| Make it in Germany Portal | make-it-in-germany.com/en/ | Federal Government Portal | visas, jobs | Germany | Weekly updates | Scrape Skilled Immigration Act updates, shortage occupation tables (IT specialists), and the Chancenkarte self-check tool. |

## Scholarships & Fellowships

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Mastercard Foundation Scholars | mastercardfdn.org/all/scholars/ | Philanthropic Program | scholarships, internships | Africa | Seasonal (Aug–Dec) | Scrape direct partner university recruitment portals (CMU Africa, Edinburgh, McGill, UCT) for funded STEM programs. |
| Chevening Scholarships | chevening.org/scholarships | UK FCDO Official Portal | scholarships | Global / Nigeria Hub | Annual (Aug–Nov) | Scrape UK government 1-year fully funded Master's portal; track intake opening dates and English testing waivers. |
| DAAD Scholarship Database | daad.de/en/study-and-research-in-germany/scholarships/ | German Academic Exchange | scholarships | Global / Africa focus | Bi-weekly | Parse searchable database for EPOS, Helmut-Schmidt, and In-Country/In-Region African Master's/PhD funding tracks. |
| Commonwealth Scholarships | cscuk.fcdo.gov.uk/scholarships | UK FCDO Scheme | scholarships | Commonwealth (inc. NG) | Annual (Sep–Dec) | Parse Master's and PhD tracks; monitor National Nominating Agency deadlines versus direct advisor routes. |
| Erasmus Mundus (EMJMD) | erasmus-plus.ec.europa.eu | EU Commission Directory | scholarships | Global | Annual (Oct–Jan) | Parse Catalogue of Joint Master Degrees; extract programs offering fully funded EU tuition and €1,400/month living allowances. |
| Gates Cambridge Scholarship | gatescambridge.org/apply/ | University Foundation | scholarships | Global | Annual (Sep–Dec) | Track Cambridge University graduate application deadlines; fully funded postgraduate tuition and maintenance allowance. |
| Rhodes Trust Scholarships | rhodeshouse.ox.ac.uk/scholarships | University Trust | scholarships | Global (inc. West Africa) | Annual (Jun–Oct) | Parse West Africa regional selection criteria; fully funded Oxford University postgraduate awards. |
| AfDB Japan Africa Scholarship | afdb.org | Multilateral Dev Bank | scholarships | Africa | Annual | Scrape African Development Bank training programs; focus on engineering and agricultural technology Master's degrees. |
| Mandela Washington Fellowship (YALI) | state.gov / irex.org | US Dept of State / IREX | scholarships, accelerators | Africa | Annual (Aug–Oct) | Scrape 6-week executive track at US universities for young African leaders; tracks in Business and Civic Engagement. |
| NUTM Scholars Program | nutmng.org/scholars-program | Technology Institute (Nigeria) | scholarships, internships | Nigeria / Africa | Annual cohorts | Scrape full scholarships for postgraduate technology, entrepreneurship, and software development training in Lagos. |
| Opportunity Desk (OD) | opportunityde[span_63](start_span)[span_63](end_span)sk.org | Opportunity Aggregator | scholarships, grants, visas | Global / Africa focus | Daily | Parse article publication feeds; filter for verified funding calls, dated deadlines, and official external links. |
| Opportunities for Africans (OFA) | opportunitiesforafricans.com | Regional Aggregator | scholarships, fellowships | Africa | Daily | Scrape RSS category /scholarships/feed; extract application closing deadlines and direct institutional links. |
| Africademics | africademics.com | African Academic Network | scholarships, fellowships | Africa | Weekly | Monitor scholarship database and weekly digest; track Pan-African and international funding opportunities. |
| Scholarship Region | scholarshipregion.com | Nigerian Scholarship Portal | scholarships, internships | Nigeria / Africa | Daily | Parse dated posts across undergraduate, master's, and fellowship categories; track deadlines and primary host institutions. |
| AfterSchoolAfrica | afterschoolafrica.com | Education Portal | scholarships, grants | Africa | Daily | Ingest dated scholarship calls, regional research competitions, and graduate study funding programs. |
| Youth Opportunities | youthop.com | Global Youth Aggregator | scholarships, fellowships | Global / Emerging Mkts | Daily | Scrape fully funded international conferences, exchange fellowships, and youth grant competitions. |

## AI Credits & Student Programmes

_Includes `studentoffers.co` (596+ verified student discounts, category-indexed, regularly refreshed) — a strong cross-check for the student_deals lane._

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| GitHub Education | education.github.com/pack | Student Developer Suite | student_deals, ai_credits | Global | Rolling basis | Ingest GitHub Student Developer Pack roster (free GitHub Copilot Pro, Heroku/DigitalOcean credits, Namecheap domains). |
| JetBrains Education | jetbrains.com/community/education/ | Developer Tooling Suite | student_deals | Global | Rolling basis | Track free individual educational licenses across all JetBrains IDEs (IntelliJ, PyCharm, WebStorm) renewed annually. |
| Notion for Education & Startups | notion.so/product/notion-for-education | Workspace SaaS | student_deals, grants | Global | Rolling basis | Scrape Plus Plan educational exemptions and up to $1,000 in workspace credits for venture-backed and affiliated startups. |
| Figma for Education | figma.com/education | Collaborative Design SaaS | student_deals | Global | Rolling basis | Monitor free Figma Enterprise/Professional tier access for verified educational accounts and design bootcamps. |
| Canva for Education & Nonprofits | canva.com/canva-for-education | Visual Design Suite | student_deals, grants | Global | Rolling basis | Parse free Canva Pro access rules for K-12 students, academic staff, and eligible registered non-profit bodies. |
| DigitalOcean Hatch | digitalocean.com/hatch | Startup Cloud Incubator | ai_credits, grants | Global | Rolling basis | Scrape 12 months of cloud infrastructure credit options (10,000), technical mentorship, and platform support. |
| AWS Educate | aws.amazon.com/education/awseducate/ | Cloud Learning / Sandboxes | student_deals, ai_credits | Global | Rolling basis | Track student cloud labs requiring no credit card; provisioned AWS sandbox environments and foundational training. |
| Google Cloud for Startups | cloud.google.com/startup | Cloud & AI Credit Tier | ai_credits, grants | Global | Rolling basis | Ingest Web3 and AI-specialized tracks; grants up to $350k in compute for funded AI builders using Google infrastructure. |
| OpenAI Researcher & Founder Access | openai.com/form/researcher-access-program | AI Compute Subsidy | ai_credits, grants | Global | Rolling / Ad-hoc | Monitor Researcher Access Form; API credits for academic researchers and novel model evaluation initiatives. |
| Anthropic Console Startup Perks | anthropic.com [verify] | AI API Enablement | ai_credits | Global | Rolling / Partner | Ingest platform perks provided through partner programs (e.g., AWS Activate, YC) for Claude API credit provisioning. |
| Replit for Education | replit.com/site/education | Cloud Development Env | student_deals | Global | Rolling basis | Track collaborative workspace provisioning, deployment tiers, and compute credits for registered academic accounts. |
| MongoDB for Students | mongodb.com/students | Database Infrastructure | student_deals | Global | Rolling basis | Ingest MongoDB Student Pack ($500 in Atlas database credits, free certification exams, and compass learning paths). |
| Termly for Startups | termly.io | Compliance SaaS | student_deals, grants | Global | Rolling basis | Monitor startup incubator discounts; free generation of GDPR/NDPR privacy policies and compliance tooling. |
| Namecheap Student Pack | namecheap.com/students | Domain & SSL Infrastructure | student_deals | Global | Rolling basis | Parse complimentary .me domain registration, SSL certificates, and DNS hosting bundled via GitHub Education. |
| Postman Student Programs | postman.com/student-program | API Developer Tooling | student_deals | Global | Rolling basis | Monitor Postman Student Expert certification tracks and free collaborative workspace access for teams. |
| Microsoft Learn Student Ambassadors | studentambassadors.microsoft.com | Global Student Program | student_deals, ai_credits | Global | Quarterly cohorts | Track free Azure credit allocations ($150/month), Microsoft 365 subscriptions, and certification exam vouchers. |
| StudentOffers.co | https://www.studentoffers.co/tools | Verified student-discount directory (596+ offers, category-indexed, refreshed regularly) | student_deals, ai_credits | Global | Weekly | Category index at /tools?category=… — ai-and-machine-learning, cloud-and-hosting, development-tools, productivity, design-and-creative; each offer has a direct claim link. Also carries the GitHub Student Pack as a featured pack. Cross-check against education.github.com/pack. |

## Media Desks & Opportunity Feeds

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| TechCabal | techcabal.com/category/events/ | Digital Media | accelerators, grants, hackathons | Africa (Pan-African) | Daily | Monitor events, competitions (e.g., TC Battlefield), and the Entering Tech newsletter column for openings. |
| Techpoint Africa | techpoint.africa/general/job-vacancies/ | Tech Journal / Media | jobs, internships, grants | Nigeria / Africa | Weekly | Scrape the Jobs Weekly feature and /tag/opportunities/; extract enterprise and startup technical vacancies. |
| Disrupt Africa | disrupt-africa.com/category/funding-opportunities/ | Startup Media Portal | grants, accelerators | Africa (Pan-African) | Bi-weekly | Parse the Funding Opportunities section; track calls for early-stage startup funding and pitch competitions. |
| Condia (formerly Benjamindada) | condia.com | Technology Media Portal | jobs, accelerators, grants | Nigeria / West Africa | Daily | Monitor Jobs and Opportunities tags; track ecosystem funding announcements and regional hiring updates. |
| Ventures Africa | venturesafrica.com | Business & Tech Media | grants, accelerators | Africa | Weekly | Parse innovation and entrepreneurship feeds; track non-dilutive social enterprise and SME tech challenges. |
| Innovation Village | innovation-village.com/category/opportunities/ | Regional Tech Blog | grants, accelerators, hackathons | Nigeria / Africa | Daily | Monitor /category/opportunities/; index dated open calls for female founders, agritech challenges, and hackathons. |
| Nairametrics | nairametrics.com/category/careers/ | Financial Tech News | jobs, internships | Nigeria | Daily | Ingest corporate graduate trainee announcements, Tier-1 Nigerian bank tech drives, and regulatory employment calls. |
| WeeTracker | weetracker.com | African Venture Media | accelerators, grants | Africa (Pan-African) | Weekly | Parse venture funding and early-stage startup programs; monitor venture builder cohorts and institutional prizes. |
| Menterprise Africa | menterprise.africa | Ecosystem Intelligence Desk | grants, accelerators, hackathons | Africa | Monthly roundups | Scrape structured monthly opportunity summaries; extract closing dates, grant sizes, and application forms. |
| Techloy | techloy.com | Emerging Markets Media | jobs, accelerators | Africa / Global | Weekly | Track venture announcements, technical leadership hires, and international investment initiatives. |
| Daily Investor Africa | dailyinvestor.com | Business & Technology | jobs, grants | Southern Africa / Pan-Africa | Daily | Parse southern regional corporate technology openings, enterprise fintech programs, and private capital funding calls. |

## Social — X (Twitter)

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Opportunity Desk | @Opps_DeskHQ | — | scholarships, grants, fellowships | Global / Africa | Daily | Monitor tweets linking to external grant and fellowship deadlines; look for direct application URLs. |
| Opportunities for Africans | @oppsforafricans | — | scholarships, grants, accelerators | Africa | Daily | Track dated scholarship notices, youth assemblies, and creative prizes open to African citizens. |
| Emmy (Remote Jobs) | @ChuksEmma947401 | — | jobs, remote | Global / Nigeria Hub | Daily | Parse daily remote engineering, product, and AI workflows; extract hiring thread links and corporate career pages. |
| Remote Job With Tessy | @RemotejobWtessy | — | jobs, remote, internships | Global / Nigeria Hub | Daily | Scrape direct job openings, international contractor links, and tech support roles hiring African talent. |
| Victoria Igbeke | @IgbekeVictoria | — | scholarships, visas, grants | Global / Nigeria Hub | Weekly threads | Parse curated threads of fully funded academic scholarships and international visa sponsorship roles. |
| DevCareer | @dev_careers | — | internships, student_deals, jobs | Africa (NG, GH, KE) | Weekly | Track #Laptops4Developers calls, developer training cohorts, and junior engineering placements. |
| She Code Africa | @SheCodeAfrica | — | internships, grants, jobs | Africa (Pan-African) | Weekly | Scrape technical mentorship cohorts, cloud engineering academy applications, and partner jobs. |
| Tech4Dev | @Tech4DevHQ | — | scholarships, internships, jobs | Africa | Bi-weekly | Parse Women Techsters fellowship intakes, digital skills initiatives, and corporate junior job pairings. |
| Superteam Nigeria | @SuperteamNG | — | hackathons, grants, jobs | Nigeria | Daily / Weekly | Monitor Solana ecosystem hackathon launches, localized developer bounties, and student hack tracks. |
| Ingressive for Good | @Ingressive4Good | — | scholarships, student_deals, internships | Africa | Monthly cohorts | Track micro-scholarships, Coursera/DataCamp tech training vouchers, and student community perks. |
| Wema Bank | @wemabank | — | hackathons, grants | Nigeria | Seasonal | Parse announcements tagged #Hackaholics for pitch registrations, cash grant prizes, and tour dates. |
| Y Combinator | @ycombinator | — | accelerators | Global | Weekly | Track batch application release dates, early application deadlines, and international founder meetups. |
| Techstars | @Techstars | — | accelerators | Global | Weekly | Monitor global accelerator open calls, virtual info sessions, and corporate partnership batch launches. |
| Himalayas Jobs | @himalayasapp | — | jobs, remote | Global | Daily | Parse new worldwide remote developer listings, remote salary disclosures, and international hires. |
| We Work Remotely | @weworkremotely | — | jobs, remote | Global | Daily | Ingest automated tweets broadcasting software development and devops vacancies open globally. |
| Techpoint Africa | @TechpointDotNg | — | jobs, grants, accelerators | Nigeria / Africa | Daily | Track native tweets broadcasting breaking news on accelerator applications, tech events, and job roundups. |
| TechCabal | @TechCabal | — | jobs, grants, accelerators | Africa | Daily | Parse ecosystem dispatches, pitch competitions, and corporate recruitment initiatives across Africa. |
| Microtraction | @microtraction | — | accelerators, grants | Africa | Bi-weekly | Monitor founder funding announcements, open pitch intake sessions, and portfolio startup job vacancies. |
| OSC Africa | @oscafrica | — | hackathons, grants, jobs | Africa | Weekly | Track Open Source Community Africa events, contributor bounties, and open-source project sponsorships. |
| DTech Talent | @DTechTalent [verify] | — | jobs, remote, internships | Africa / Global | Daily | Scrape junior developer opportunities, international internships, and entry-level technical roles. |

## Social — LinkedIn

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Techpoint Africa Company Page | linkedin.com/company/techpointafrica | Publication Page | jobs, grants, hackathons | Nigeria / Africa | Daily | Track native job circulars, ecosystem event updates, and links to weekly curated hiring articles. |
| TechCabal Company Page | linkedin.com/company/techcabal | Publication Page | jobs, accelerators, grants | Africa | Daily | Monitor editorial posts covering corporate accelerator cycles and early-stage startup pitch battles. |
| Andela Official Page | linkedin.com/company/andela | Talent Platform | jobs, remote | Africa / Global | Weekly | Parse technical talent network intake updates and internal distributed corporate job openings. |
| She Code Africa Page | linkedin.com/company/she-code-africa | Non-Profit Body | internships, scholarships, jobs | Africa | Weekly | Track training cohort applications, corporate recruitment partnerships, and sponsored bootcamps. |
| Ingressive for Good | linkedin.com/company/ingressive-for-good | Non-Profit Body | scholarships, int[span_181](start_span)[span_181](end_span)[span_184](start_span)[span_184](end_span)ernships | Africa | Weekly | Ingest program announcements for student developer hardware cohorts and certified training scholarships. |
| Moniepoint Inc. | linkedin.com/company/moniepointhq | Corporate Entity | jobs, remote, internships | Nigeria / Global | Daily | Monitor executive engineering appointments and direct links to high-volume infrastructure roles. |
| Flutterwave | linkedin.com/company/flutterwave | Corporate Entity | jobs, internships | Africa / Global | Weekly | Track corporate internship drives, graduate recruitments, and technical solutions engineer vacancies. |
| ALX Africa | linkedin.com/company/alx-africa | Training Provider | inte[span_18](start_span)[span_18](end_span)rnships, scholarships, jobs | Africa | Weekly | Scrape software engineering, data science, and cloud computing cohort application dates. |
| Africa Tech Space | linkedin.com/groups [verify] | Community Group | jobs, remote, hackathons | Africa | Daily | Monitor member job postings, remote contract referrals, and localized tech founder meetups. |
| Nigeria Tech Community | linkedin.com/groups [verify] | Community Group | jobs, internships, grants | Nigeria | Daily | Parse junior-to-mid engineering openings, internship availability notices, and local training drives. |

## Social — Facebook

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| TechCabal Facebook Page | facebook.com/TechCabal | Media Page | grants, accelerators, hackathons | Africa | Daily | Monitor posts announcing Battlefield competitions, pitch events, and ecosystem conferences. |
| Wema Bank Plc Page | facebook.com/wemabankpl[span_197](start_span)[span_197](end_span)c | Corporate Bank Page | hackathons, grants | Nigeria | Seasonal | Scrape video and banner announcements for Hackaholics registration cycles and university pitch centers. |
| Opportunities for Africans Page | facebook.com/opportunitiesforafricans | Aggregator Page | scholarships, fellowships, grants | Africa | Daily | Target real-time updates linking directly to fully funded postgraduate scholarship deadlines. |
| Youth Opportunities Global | facebook.com/YouthOpps | Aggregator Page | scholarships, internships, fellowships | Global | Daily | Parse international youth forum calls, social impact grants, and exchange opportunities. |
| Scholarship Region Group | facebook.com/scholarshipregion [verify] | Community Page | scholarships, internships | Nigeria / Africa | Daily | Ingest verified undergraduate and postgraduate award circulars along with corporate internship forms. |
| Opportunities Circle | facebook.com/OpportunitiesCircle | Aggregator Page | scholarships, internships, grants | Global / Emerging Mkts | Daily | Scrape conference invitations, short training courses, and non-degree student exchange awards. |

## Social — Telegram & WhatsApp

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Jobs Region Telegram | t.me/jobsregion | Telegram Channel | jobs, remote, internships | Nigeria / Global | Daily | Webhook monitor for messages matching Remote Job at..., parsing salary bands, and extracting apply links. |
| Scholarship Region Telegram | t.me/scholarshipregion | Telegram Channel | scholarships, fellowships, grants | Global / Nigeria | Daily | Filter updates for fully funded master's, corporate grants (MTN/Meta), and global internships. |
| JobsToday Nigeria | t.me/jbtoday | Telegram Channel | jobs, internships | Nigeria | Daily | Extract graduate trainee recruitment notices, oil & gas tech jobs, and multinational contracts. |
| Job Network NG | t.me/jobnetworkng | Telegram Channel | jobs, internships | Nigeria | Daily | Ingest localized corporate vacancies, bank IT departments, and technology entry-level roles. |
| Legit Remote Jobs | t.me/legitremotejobs | Telegram Channel | jobs, remote | Global / Africa focus | Daily | Filter for global contractor roles, developer listings, and verified international remote employers. |
| Scholarship Region WhatsApp | whatsapp.com/channel/0029VbDDeFN3GJOvYnu5Cd28 | WhatsApp Channel | scholarships, internships | Nigeria / Africa | Daily | Monitor broadcast feed for immediate alerts on international university scholarship application openings. |
| Jobs Region WhatsApp | whatsapp.com/channel/0029Vb81BNJ2f3EGNudeHd1w | WhatsApp Channel | jobs, remote, internships | Nigeria | Daily | Monitor direct message dispatches for rapid application links and salary benchmarks in Nigeria. |
| Your Opportunities Africa | youropportunitiesafrica.com (Telegram) | Telegram Channel | scholarships, fellowships, grants | Africa | Weekly | Scrape broadcast updates for African student travel awards, youth summits, and project grants. |
| Opportunity Desk Telegram | t.me/opportunitydesk [verify] | Telegram Channel | scholarships, grants, fellowships | Global / Africa | Daily | Ingest instant channel alerts mirroring priority editorial opportunities posted on the main portal. |
| Techie Jobs Africa | t.me/techiejobsafrica [verify] | Telegram Channel | jobs, remote | Africa | Daily | Scrape junior and senior engineering postings across African startup ecosystems. |

## Social — Discord

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Open Source Community Africa (OSCA) | discord.com/invite/open-source-community-africa-676252299093475348 | Discord Server | hackathons, grants, internships | Africa | Daily | Listen to #announcements, #hackathons, and #opportunities; monitor Open Source Festival sprint calls. |
| Web3 Nigeria Community | web3nigeria.org/communities | Discord Server | hackathons, grants, jobs | Nigeria | Daily | Parse channels dedicated to ecosystem builds across Starknet Africa, Arbitrum, Lisk, and Superteam NG. |
| DoraHacks Community Discord | discord.com/invite/dorahacks | Discord Server | hackathons, grants | Global | Daily | Monitor #bounties, #hackathon-announcements, and regional hacker house application channels. |
| Developer DAO | discord.gg/devdao [verify] | Discord Server | grants, jobs, hackathons | Global | Daily | Track Web3 developer job boards, guild funding grants, hackathon team recruitments, and sponsor tooling. |
| Superteam Global Discord | discord.gg/superteam [verify] | Discord Server | hackathons, grants, remote | Global / Regional Hubs | Daily | Ingest localized African sub-channels for Solana hackathon deadlines, grant proposals, and project reviews. |
| Qeda Africa Tech Community | discordgate.com/servers/1Q3Pf9yxWCg/ | Discord Server | jobs, remote, grants | Africa / Diaspora | Weekly | Monitor PaaS developer deployment updates, African infrastructure discussions, and technical openings. |
| Starknet Africa Discord | discord.gg/starknet | Discord Server | grants, hackathons | Africa / Global | Daily | Ingest regional African developer channels focusing on Cairo language bootcamps and base layer grants. |
| Arbitrum Developers | discord.gg/arbitrum | Discord Server | grants, hackathons | Global / Regional Hubs | Weekly | Monitor dev-bounties and localized Nigerian hacker house sponsorships. |

## Social — Reddit & Forums

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| r/remotework | reddit.com/r/remotework/ | Reddit Subreddit | remote, jobs | Global | Daily | Scrape posts with flair Hiring; cross-reference against international hiring permissions. |
| r/digitalnomad | reddit.com/r/digitalnomad/ | Reddit Subreddit | visas, remote | Global | Daily | Monitor discussions on verified digital nomad visa processing times (Spain, Portugal D8, Japan, Estonia). |
| r/forhire | reddit.com/r/forhire/ | Reddit Subreddit | jobs, remote | Global | Daily | Parse posts prefixed with [Hiring[span_71](start_span)[span_71](end_span)]; extract software engineering, devops, and graphic design contracts. |
| Nairaland Job Vacancies | nairaland.com/jobs | Nigerian Forum | jobs, internships | Nigeria | Daily | Monitor top-level threads in the Job Vacancies section; require a verification step to drop unverified agent listings. |

## Newsletters & Digests

| Source | URL | Class | Lanes | Region | Cadence | What to look for |
|---|---|---|---|---|---|---|
| Entering Tech by TechCabal | techcabal.com | Substack / Mailchimp | jobs, internships, scholarships | Africa | Weekly | Parse weekly curated junior and mid-level tech jobs, training opportunities, and tools. |
| Techpoint Digest | techpoint.africa | Substack / Web | jobs, grants, accelerators | Africa (Nigeria-first) | Daily / Weekly | Ingest editorially highlighted accelerator calls, regional startup competitions, and venture updates. |
| Condia Brief | condia.com | Ghost / Email | jobs, grants, accelerators | Nigeria / Africa | Weekly | Scrape executive tech vacancies, startup grant announcements, and African corporate restructuring news. |
| The Baobab Network Newsletter | thebaobabnetwork.com | Substack / Web | accelerators, grants | Africa | Monthly | Scrape cohort application calls, African tech market maps, and early-stage capital disbursements. |
| Menterprise Africa Digest | menterprise.africa | Web / Email | grants, accelerators, fellowships | Africa | Monthly | Parse comprehensive monthly roundups indexing pan-African grants, seed funding, and global competitions. |
| AfterSchoolAfrica Digest | afterschoolafrica.com | Mailchimp / Web | scholarships, grants | Africa | Weekly | Ingest aggregated student funding deadlines, master's calls, and young innovator competitions. |
| Frontier Fintech Africa | frontierfintech.substack.com [verify] | Substack | jobs, accelerators | Africa | Bi-weekly | Parse fintech leadership changes, early-stage equity funding, and corporate venture capital programs. |
| Africa: The Big Deal | thebigdeal.substack.com | Substack | accelerators, grants | Africa | Weekly | Track early-stage venture capital deals, corporate accelerators, and non-dilutive grant capital distributions. |

## §Search — Per-Category Search-Term Dictionary

Use these EXACT high-intent phrases. Never search bare words like "job" or "hackathon".

| Lane | Primary intake strings | Freshness/boundary markers | Exclusions |
|---|---|---|---|
| Jobs | "we are hiring", "now hiring software engineer", "apply for this role", "career opportunity" | "Lagos", "Nigeria", "Full-time", "competitive salary", "job description", "experience required" | "application is now closed", "hiring frozen", "the position has been filled", "career advice" |
| Remote | "work from anywhere", "100% remote", "worldwide remote", "independent contractor", "remote developer" | "any timezone", "GMT+1", "African hours", "remote (global)", "EOR", "B2B contract", "invoicing" | "US only", "must be US citizen", "EU residents only", "hybrid in-office", "requires relocation" |
| Hackathons | "call for submissions", "hackathon registration open", "register your team", "hackathon begins" | "prize pool", "devpost", "dorahacks", "submission deadline", "virtual hackathon", "judging criteria" | "hackathon winners announced", "past edition", "recap of the hackathon", "registration ended" |
| Grants | "call for applications", "request for proposals", "grant applications are open", "non-dilutive funding" | "equity-free", "application deadline", "pilot phase", "grant award", "disbursed", "letter of intent" | "grants awarded to", "congratulations to recipients", "how to write a grant", "closed for review" |
| Accelerators | "now accepting applications for cohort", "apply for our next batch", "applications close on", "accelerator program" | "pre-seed investment", "equity", "demo day", "terms: $100k", "batch 2026", "accelerator cohort" | "meet the cohort", "announcing the graduates of", "portfolio companies", "applications are now closed" |
| Visas | "application requirements", "eligibility criteria", "designated endorsing body", "points calculator" | "official portal", "minimum income requirement", "valid for 1 year", "residence permit", "skilled worker" | "visa processing scams", "how I moved to", "relocation vlog", "consultancy services fee" |
| Scholarships | "fully funded scholarship", "applications are invited for the", "call for scholarship applications" | "tuition waiver", "monthly stipend", "academic year 2026/2027", "eligible African countries", "apply by" | "winners of the scholarship", "scholarship ended", "top 10 scholarships (listicle)", "closed" |
| Internships | "now accepting applications for graduate trainee", "software engineering intern", "internship cohort" | "paid internship", "stipend", "undergraduate", "NYSC", "6-month placement", "mentorship included" | "internship diary", "our past interns", "unpaid volunteers only", "applications closed" |
| AI Credits | "apply for compute credits", "startup program", "free API credits", "cloud credits for developers" | "AWS activate", "Azure for startups", "promotional credit", "monthly token tier", "OpenAI credits" | "how to get free credits hack", "expired voucher", "reseller promo code", "credit card required" |
| Student Deals | "student developer pack", "free for students", "academic verification", "student discount license" | ".edu email required", "SheerID verification", "annual renewable", "valid student ID", "free tier" | "student deal expired", "promo ended", "coupon code generator", "black hat tools" |

## §Freshness — Freshness Heuristics (apply before accepting any find)

1. **HTTP status + DOM introspection.** Drop 404 / 410 / 502 / redirect loops >3 hops.
   But a 200 can still be a CLOSED role — parse the DOM for closure strings:
   Greenhouse: "This job is no longer available" / missing `#application-form`;
   Lever: "This position has been closed" / missing `.postings-btn-wrapper`;
   Ashby: "This job is no longer accepting applications";
   Workable: banner "This vacancy has closed". A closed-state page is a DROP.
2. **Semantic date extraction + sliding window.** Parse any explicit deadline
   ("Applications close:", "Apply before:"). Past date = DROP. For rolling items,
   take the publish timestamp; if `now - published > 60 days` = DROP as stale,
   UNLESS the page carries an override ("rolling basis", "continuous review").
   Evergreen pages with no publication metadata are suspect — treat with caution.
3. **Application mechanism must be interactive.** There must be a live form / apply
   widget (ATS form, Airtable, Typeform, Google Form). Follow hosted forms and check
   they are not closed ("The form is no longer accepting responses" = DROP).
4. **Canonical link resolution + dedup.** Unroll every shortener (bit.ly, t.co,
   ow.ly) to the final landing page BEFORE verifying. Dedup key:
   `SHA256(normalized org + normalized title + normalized location)` — a match
   within the preceding 90 days means update-or-discard, never double-post.
5. **Platform-specific status.** DoraHacks/Devpost expose JSON-LD status fields —
   read them directly. For scholarships, validate the academic cycle: notices for
   past years (2023/2024, 2024/2025) are DROPPED.

## §Schedule — Ingestion Cadence

**DAILY** (high-yield, listings fill in hours):
- Corporate ATS: Moniepoint (Workable), Flutterwave (Greenhouse), Paystack (Lever),
  Deel (Ashby), Remote.com (Ashby)
- Telegram: t.me/jobsregion, t.me/scholarshipregion, t.me/jbtoday
- X curators: @ChuksEmma947401, @RemotejobWtessy, @Opps_DeskHQ
- Aggregator APIs: himalayas.app/jobs, We Work Remotely RSS (programming),
  Devpost online-competitions queue

**WEEKLY** (Sunday evening / Monday morning):
- Media: Techpoint Africa Jobs Weekly, TechCabal Entering Tech, Condia
- Hackathon/bounty: Zindi competitions, DoraHacks Africa/AI, Superteam Earn Nigeria
- Communities: @dev_careers (DevCareer), @SheCodeAfrica, OSCA Discord #announcements,
  Web3 Nigeria Discord
- Aggregators: opportunitiesforafricans.com, Opportunity Desk, studentoffers.co

**PER-COHORT / ON-DEMAND** (14–30 day cycles or fixed calendar triggers):
- Accelerators: Y Combinator (bi-annual), ARM Labs Techstars Lagos, Google for
  Startups Accelerator Africa, The Baobab Network
- Corporate hackathons: Wema Hackaholics, Superteam Nigeria Superhack
- Scholarships: Chevening (Aug–Nov window), Mastercard Foundation partner pages,
  DAAD EP.1019, Gates Cambridge
- Immigration: UK Global Talent (Tech Nation), Germany Chancenkarte, Portugal Vistos
  MNE digital nomad, Japan MOFA specified-activity visas

## §Top20 — Highest-value sources for a Nigeria-first audience

Paystack Careers (Lever) · Moniepoint Careers (Workable) · Flutterwave Careers
(Greenhouse) · Jobs Region Telegram · Scholarship Region Telegram · Wema Hackaholics ·
Superteam Nigeria / superhack.fun · Open Source Community Africa Discord · DevCareer
(@dev_careers) · She Code Africa (@SheCodeAfrica) · The Baobab Network · ARM Labs
Lagos Techstars · Techpoint Africa Jobs Weekly · Condia · TechCabal Entering Tech ·
Himalayas Remote · Opportunities for Africans · GitHub Student Developer Pack ·
Make it in Germany (Chancenkarte) · UK Global Talent (Tech Nation)

## §Traps — Structural pathologies & fraud to actively filter

1. **Zombie aggregator feedback loop.** Low-tier sites mirror each other's scrapes
   recursively, so a listing removed from the primary ATS can persist across dozens
   of secondary sites for months. ALWAYS resolve to the primary ATS page — never
   trust a repost as proof the role is live.
2. **Engagement-farming social accounts.** Curators rewrite OLD/closed listings to
   grow followers ("Drop your CV", "Tag a friend", "Repost"). Treat undated social
   reposts as unverified until the primary source confirms.
3. **Evergreen "zombie" portals.** Some banks/telcos keep "Talent Pool" /
   "Spontaneous Application" forms open forever. These are NOT live vacancies —
   a permanent application form is not an open position. DROP unless a specific
   role is named.
4. **Fee scams.** Fake recruiters/embassies/scholarship bodies demanding payment
   for "processing" a remote role or relocation. Any request for money = DROP.
5. **The "global remote" filtering trap.** Boards tag listings "Remote" while the
   body restricts to US/EU residency, US citizenship, or EST-timezone overlap.
   Read the eligibility text, not the tag. Tag region honestly (`nigeria`/`africa`/
   `global`) based on what a Nigerian builder can actually apply for.

## §Internships note
No dedicated internships table exists in the source directory — internships ride
inside the jobs/ATS tables (most corporate ATS boards above carry `internships` in
their lanes) and surface through the media and Telegram/community lanes. Hunt
internships through those sources with the `internship` lane strings.

## §Verify list
Entries marked `[verify]` in the tables above (e.g. NaijaHacks) must be link-checked
by the Verifier before any listing from them is published.
