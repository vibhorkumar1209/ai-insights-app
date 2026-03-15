import { HistoryEntry } from '@/lib/history';

export const MEDTRONIC_SAMPLE: HistoryEntry = {
  id: 'medtronic-demo-2026',
  moduleType: 'peer-benchmarking',
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
      dimension: 'ERP / Core Data Infrastructure',
      peersBestPractice: '**BD** — largest single **SAP S/4HANA** deployment in MedTech • Real-time financial close across **50+ countries** • Integrated regulatory reporting',
      gapLevel: 'AMBER',
      solutionFit: '**SAP S/4HANA Cloud**, Private Edition • Pre-configured MedTech compliance (**MDR, FDA 21 CFR Part 11**) • Device serialisation and **ASC 606** revenue recognition',
    },
    {
      dimension: 'Digital Commerce & Customer Experience',
      peersBestPractice: '**BD Rowa** automated dispensing and **BD Alaris** connected medication management • Hospital-embedded digital commerce with **real-time inventory** pull-through',
      gapLevel: 'RED',
      solutionFit: '**SAP Commerce Cloud** (B2B) with Customer Data Cloud • Healthcare-specific B2B ordering with **GPO contract integration** • Customer 360° data platform',
    },
    {
      dimension: 'AI / ML & Intelligent Automation',
      peersBestPractice: '**Medtronic** leads with **GI Genius** (FDA-cleared AI colonoscopy) and **Hugo** robotic surgery • Most commercially deployed clinical AI product set in comparison group',
      gapLevel: 'GREEN',
      solutionFit: '**SAP Business AI** embedded in S/4HANA • **AI-powered** demand sensing • Intelligent accounts receivable • Automated regulatory change impact analysis',
    },
    {
      dimension: 'Contract & Process Automation',
      peersBestPractice: '**Abbott** — automated **CLM** integrated with GPO pricing • Real-time price validation across **20,000+ hospital contracts** • Automated rebate management',
      gapLevel: 'RED',
      solutionFit: '**SAP Intelligent Contract Management** powered by Signavio • AI-assisted contract drafting • Automated **GPO price waterfall** management • Real-time rebate accrual',
    },
    {
      dimension: 'Supply Chain / Operational Execution',
      peersBestPractice: '**BD Pyxis** automated dispensing across **6,000+ hospital systems** • Real-time point-of-care inventory data • True **demand-driven** replenishment',
      gapLevel: 'AMBER',
      solutionFit: '**SAP IBP** for Supply Chain • Real-time demand sensing with hospital POS integration • **AI-driven** forecast accuracy • End-to-end supply chain control tower',
    },
  ],
};
