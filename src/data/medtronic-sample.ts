import { HistoryEntry } from '@/lib/history';

export const MEDTRONIC_SAMPLE: HistoryEntry = {
  id: 'medtronic-demo-2026',
  targetCompany: 'Medtronic',
  userOrganization: 'SAP',
  industryContext: 'Medical Devices & Healthcare Technology',
  completedAt: '2026-03-12T10:00:00.000Z',
  selectedPeers: ['Abbott', 'Boston Scientific', 'Zimmer Biomet', 'Becton Dickinson'],
  benchmarkingTable: [
    {
      dimension: 'Stated IT Priority / Focus Area',
      targetCompany: {
        value: '"Digital Surgery & AI-enabled Care" — robotic surgery expansion (Hugo), connected hospital ecosystem, patient outcomes analytics. CEO Geoff Martha: "We are becoming a digital health company."',
        notes: 'Medtronic Investor Day 2023; CNBC CEO interview, Jan 2024',
      },
      peers: {
        Abbott: {
          value: '"Making medical devices more connected, intelligent and personalised" — real-time continuous monitoring, integrated diagnostics platform, direct-to-consumer digital health.',
          notes: 'Abbott Annual Report 2023; JPMorgan Healthcare Conference 2024 presentation',
        },
        'Boston Scientific': {
          value: 'Procedure-based innovation leadership — minimally invasive technology, physician decision-support tools, procedure scheduling efficiency. Less explicit broad AI messaging.',
          notes: 'Boston Scientific 2023 Investor Presentation; BSci CTO interview, MedTech Dive, 2023',
        },
        'Zimmer Biomet': {
          value: '"Creating a digital ecosystem around musculoskeletal health" — smart implants (Persona IQ), surgical robotics (ROSA), remote rehabilitation (mymobility). CEO Ivan Tornos: "data is our next implant."',
          notes: 'Zimmer Biomet Investor Day 2023; Forbes Healthcare 2024',
        },
        'Becton Dickinson': {
          value: '"Intelligent Connected Care" — lab automation, smart medication management, hospital-at-home connectivity. BD2025 positions digital as core to every product line.',
          notes: 'BD 2023 Annual Report; BD Investor Day 2023 keynote',
        },
      },
    },
    {
      dimension: 'AI / ML & Automation Investments',
      targetCompany: {
        value: 'GI Genius AI colonoscopy detection (FDA cleared, 2021); Hugo robotic-assisted surgery system; Synapse Radio AI for diagnostic imaging. ~$500M+ cumulative AI/digital investment through 2024.',
        notes: 'Lancet Gastroenterology 2021 (GI Genius trial); Medtronic Hugo launch PR; CES 2024 Medtronic keynote',
      },
      peers: {
        Abbott: {
          value: 'FreeStyle Libre CGM AI analytics engine (14-day glucose prediction); AI-powered arrhythmia detection in CardioMEMS; Abbott Laboratories technology ventures fund ($250M committed).',
          notes: 'Abbott FreeStyle Libre product specs; Abbott Ventures announcement, Nov 2023',
        },
        'Boston Scientific': {
          value: 'Rhythmia HDx cardiac mapping with AI-guided electrophysiology; limited public AI investment disclosure; selective ML in remote patient monitoring (Latitude NXT).',
          notes: 'Boston Scientific Rhythmia product page; EuroPCR 2023 presentation',
        },
        'Zimmer Biomet': {
          value: 'ROSA robotic surgical system (knee and spine); Persona IQ smart knee implant (FDA cleared) with embedded sensors; mymobility AI rehabilitation coaching.',
          notes: 'Zimmer Biomet ROSA product data; FDA 510(k) database; J Bone Joint Surg 2023',
        },
        'Becton Dickinson': {
          value: 'BD FocalPoint Slide Profiler AI for cervical cancer screening; multiple AI-driven diagnostic platforms; BD Molecular Diagnostics AI for rapid infectious disease detection.',
          notes: 'BD FocalPoint product page; BD R&D Day 2023; CAP Today, Mar 2024',
        },
      },
    },
    {
      dimension: 'ERP & Core IT Stack',
      targetCompany: {
        value: 'SAP S/4HANA (partial rollout) + Oracle Fusion for select divisions. Multi-ERP landscape across 150+ legal entities; consolidation ongoing since 2021.',
        notes: 'Medtronic FY2023 Annual Report; CIO interview, HIMSS 2023',
      },
      peers: {
        Abbott: {
          value: 'SAP S/4HANA — standardised across Abbott Diagnostics and Medical Devices divisions post-2020 integration. Cloud-first ERP strategy.',
          notes: 'Abbott 2023 10-K; SAP press release Feb 2023',
        },
        'Boston Scientific': {
          value: 'SAP ECC with selective cloud modules (SAP Ariba, Concur); S/4HANA migration planned for 2025–2027.',
          notes: 'Boston Scientific 2023 Annual Report; LinkedIn tech stack signals',
        },
        'Zimmer Biomet': {
          value: 'Oracle ERP Cloud migration underway since 2022, replacing legacy JD Edwards. Targeting full migration by 2025.',
          notes: 'Zimmer Biomet Investor Day 2022; Oracle customer reference',
        },
        'Becton Dickinson': {
          value: 'SAP S/4HANA (BD2025 digital transformation programme); largest single SAP S/4HANA deployment in MedTech as of 2023.',
          notes: 'BD Investor Day 2023; SAP Global Partner Summit case study',
        },
      },
    },
    {
      dimension: 'Digital Commerce & Customer Platform',
      targetCompany: {
        value: 'Medtronic Connection B2B portal for consumables reordering; hospital procurement predominantly via GPO contracts (Premier, Vizient). Limited direct ecommerce capability.',
        notes: 'Medtronic.com product portal; Medtronic Q3 FY2024 earnings call',
      },
      peers: {
        Abbott: {
          value: 'Abbott Point of Care digital ordering; FreeStyle Libre direct-to-consumer ecommerce; strong B2B portal across diagnostics with real-time inventory visibility.',
          notes: 'Abbott 2023 Annual Report; Abbott Digital Health Strategy presentation, JPMorgan HC Conference 2024',
        },
        'Boston Scientific': {
          value: 'BSci Connect digital platform for procedure scheduling and product ordering; MyBSci customer portal with procedural training library and e-procurement integration.',
          notes: 'Boston Scientific product portal; MedCity News, Jan 2024',
        },
        'Zimmer Biomet': {
          value: 'mymobility digital health platform for patient engagement and post-surgical monitoring; Zimmer Biomet Signature ONE personalised surgical planning portal for surgeons.',
          notes: 'Zimmer Biomet mymobility press release; AAOS 2023 presentation',
        },
        'Becton Dickinson': {
          value: 'BD Rowa automated pharmacy dispensing with connected hospital ordering; BD Alaris connected medication management platform — deep hospital system integration.',
          notes: 'BD 2023 Annual Report; ASHP 2023 conference BD presentation',
        },
      },
    },
  ],
  gapAnalysis: [
    {
      capability: 'ERP / Core Data Infrastructure',
      peersBestPractice: 'Becton Dickinson — largest single SAP S/4HANA deployment in MedTech, delivering real-time financial close, supply chain visibility across 50+ countries, and integrated regulatory reporting.',
      targetStatus: 'Medtronic operates a multi-ERP landscape (SAP S/4HANA partial + Oracle Fusion + legacy instances) across 150+ legal entities, creating data silos and slowing period-end close cycles.',
      gapLevel: 'AMBER',
      gapDetail: 'Medtronic\'s S/4HANA rollout is progressing but incomplete; data harmonisation across business units (Cardiovascular, Neuroscience, Medical Surgical) remains a multi-year programme. Integration complexity elevates total cost of ownership.',
      solutionFit: 'SAP S/4HANA Cloud, Private Edition — accelerated MedTech industry rollout with pre-configured best practices for medical device compliance (MDR, FDA 21 CFR Part 11), device serialisation, and revenue recognition (ASC 606).',
      proofPoint: 'BD completed its S/4HANA transformation reducing financial period-end close from 8 days to 3 days and achieving 99.7% inventory accuracy across distribution centres (BD Investor Day 2023).',
    },
    {
      capability: 'Digital Commerce & Customer Experience',
      peersBestPractice: 'Becton Dickinson — BD Rowa automated dispensing cabinets and BD Alaris connected medication management create a deeply embedded hospital digital commerce layer with real-time inventory pull-through.',
      targetStatus: 'Medtronic\'s Medtronic Connection portal covers consumables reordering but lacks integrated GPO price management, real-time hospital inventory visibility, and direct digital channel for capital equipment.',
      gapLevel: 'RED',
      gapDetail: 'Medtronic\'s reliance on GPO intermediaries and field-rep-driven sales limits digital commerce revenue and customer data capture. Peers are building hospital-embedded digital touchpoints that create switching costs and recurring revenue streams.',
      solutionFit: 'SAP Commerce Cloud (B2B) with SAP Customer Data Cloud — healthcare-specific B2B ordering with GPO contract integration, hospital procurement workflows, and customer 360° data platform for personalised engagement.',
      proofPoint: 'Medical device companies deploying integrated B2B commerce platforms report 35–50% reduction in order processing cost and 20–30% improvement in order accuracy (Gartner Magic Quadrant for Digital Commerce, 2023).',
    },
    {
      capability: 'AI / ML & Intelligent Automation',
      peersBestPractice: 'Medtronic leads peers with GI Genius (FDA-cleared AI colonoscopy) and Hugo robotic surgery — the most commercially deployed clinical AI product set in the comparison group.',
      targetStatus: 'Medtronic holds a clinical AI leadership position; however, back-office and supply chain AI (demand sensing, inventory optimisation, regulatory document automation) lag behind the clinical AI investment.',
      gapLevel: 'GREEN',
      gapDetail: 'Medtronic\'s clinical AI portfolio (GI Genius, Hugo, Synapse Radio) differentiates it commercially. The opportunity is to extend AI leadership from clinical devices into enterprise operations — supply chain, pricing, and regulatory intelligence.',
      solutionFit: 'SAP Business AI embedded in S/4HANA — AI-powered demand sensing, intelligent accounts receivable, automated regulatory change impact analysis, and predictive maintenance for manufacturing equipment.',
      proofPoint: 'GI Genius detects 14% more adenomas per colonoscopy vs standard practice (Lancet Gastroenterology, 2021 RCT); SAP Business AI customers report 30% reduction in days sales outstanding (DSO) via intelligent AR automation (SAP Benchmark 2024).',
    },
    {
      capability: 'Contract & Process Automation',
      peersBestPractice: 'Abbott — automated contract lifecycle management integrated with GPO pricing systems, enabling real-time price validation, rebate management, and compliance tracking across 20,000+ hospital contracts.',
      targetStatus: 'Medtronic manages thousands of IDN, GPO, and direct hospital contracts with predominantly manual processes — Excel-based tracking, email-driven approvals, and limited audit trail for price concessions.',
      gapLevel: 'RED',
      gapDetail: 'Manual contract management at Medtronic\'s scale ($32B revenue, 100+ GPO agreements) creates significant revenue leakage through untracked rebates, delayed price updates, and compliance risk. Peers using CLM automation demonstrate materially faster contract cycle times.',
      solutionFit: 'SAP Intelligent Contract Management (CLM) powered by Signavio — AI-assisted contract drafting, automated GPO price waterfall management, real-time rebate accrual, and compliance monitoring with regulatory clause libraries.',
      proofPoint: 'Medical device companies deploying CLM automation report 55–70% reduction in contract cycle time and recover 2–4% of revenue previously lost to contract leakage (Aberdeen Group MedTech CLM Study, 2023).',
    },
    {
      capability: 'Supply Chain / Operational Execution',
      peersBestPractice: 'Becton Dickinson — BD Pyxis automated dispensing cabinets provide real-time point-of-care inventory data across 6,000+ hospital systems, enabling true demand-driven supply chain replenishment.',
      targetStatus: 'Medtronic supply chain underwent significant stress during COVID-19 (ventilator surge, semiconductor shortages); multi-year supply chain transformation underway but hospital-embedded inventory visibility remains limited.',
      gapLevel: 'AMBER',
      gapDetail: 'Medtronic\'s supply chain recovery from COVID disruptions is ongoing. Unlike BD\'s hospital-embedded dispensing model, Medtronic lacks real-time demand signals from point-of-use. This increases forecast error and safety stock requirements, elevating working capital.',
      solutionFit: 'SAP Integrated Business Planning (IBP) for Supply Chain — real-time demand sensing with hospital POS integration, AI-driven forecast accuracy improvement, and end-to-end supply chain control tower with medical device serialisation compliance.',
      proofPoint: 'Medical device manufacturers deploying SAP IBP report average 25–35% reduction in forecast error and 18–22% reduction in inventory carrying costs, with stockout reduction of 30%+ (SAP IBP MedTech Benchmark, 2023).',
    },
    {
      capability: 'Scale & Investment Capacity',
      peersBestPractice: 'Abbott — $43B diversified revenue (Diagnostics, Medical Devices, Nutrition, Established Pharma) provides portfolio resilience and cross-subsidises digital investment; FreeStyle Libre generates $5B+ in recurring CGM revenue funding ongoing AI R&D.',
      targetStatus: 'Medtronic\'s $32B revenue and recent strategic restructuring (Patient Monitoring & Respiratory spin-off to Baxter, now Baxter Healthcare) has sharpened focus but moderated near-term investment capacity for digital transformation.',
      gapLevel: 'AMBER',
      gapDetail: 'Medtronic\'s portfolio rationalisation creates a leaner, higher-margin business focused on Cardiovascular, Neuroscience, and Medical Surgical — but near-term free cash flow is constrained by ongoing S/4HANA investment and Hugo robotic platform CAPEX, limiting simultaneous large-scale digital transformation initiatives.',
      solutionFit: 'SAP RISE with SAP — subscription-based cloud ERP transition converts large upfront CAPEX into predictable OPEX, with managed services reducing internal IT overhead and accelerating time-to-value for digital transformation investment.',
      proofPoint: 'RISE with SAP customers achieve average 23% reduction in total cost of ownership over 5 years vs on-premise equivalents, with 40% faster deployment timelines via pre-configured MedTech industry content (SAP Value Lifecycle Manager benchmark, 2024).',
    },
  ],
};
