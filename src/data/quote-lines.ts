export type FieldType =
  | 'text' | 'tel' | 'email' | 'number' | 'date'
  | 'select' | 'radio' | 'checkbox-group' | 'textarea';

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  help?: string;
}

export interface LineSeo {
  title: string;
  description: string;
  h1: string;
  intro: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Line {
  id: string;
  label: string;
  category: 'personal' | 'business' | 'health';
  landingPage: boolean;
  slug?: string;
  seo?: LineSeo;
  fields: Field[];
  faqs?: Faq[];
}

export const CATEGORY_LABELS: Record<Line['category'], string> = {
  personal: 'Personal',
  business: 'Business',
  health: 'Health & Medicare',
};

export const LINES: Line[] = [
  {
    id: 'auto', label: 'Auto', category: 'personal',
    landingPage: true, slug: 'auto',
    seo: {
      title: "Utah Auto Insurance Quote — Including SR-22",
      description: "Compare Utah auto insurance across multiple carriers with an independent Bountiful agency. High-risk records and SR-22 filings welcome.",
      h1: "Auto Insurance Quote",
      intro: "Utah sets its required liability limits low enough that a single serious at-fault accident can run straight past them and reach your savings. Because we are independent, we can place a clean record and a messy one alike — including SR-22 filings after a suspension — without handing you to a call center to be re-sold. Tell us what you drive and who drives it.",
    },
    faqs: [
      { q: "Do I need more than Utah's minimum auto coverage?", a: "Utah's statutory minimums are among the lower limits in the country, and they have not kept pace with what vehicles and medical care now cost. If you own a home, have retirement savings, or earn a wage a court could garnish, higher limits and an umbrella policy are usually the cheapest protection you will ever buy." },
      { q: "Can you help after a DUI or a suspension?", a: "Yes. We work with carriers that specialise in nonstandard auto and we file SR-22s routinely. An SR-22 is not an insurance policy — it is proof of financial responsibility your carrier files with the state — and letting it lapse restarts the clock, so it is worth having an agent watching it." },
      { q: "Will bundling home and auto actually save money?", a: "Often, but not always. Bundling commonly saves ten to twenty-five percent and simplifies billing. Sometimes two separate carriers still beat one bundle, particularly with an older roof or a blemished driving record. We check both and tell you which is which." },
    ],
    fields: [
      { name: 'auto-vehicle-count', label: 'How many vehicles?', type: 'select', options: ['1', '2', '3 or more'] },
      { name: 'auto-vehicle-1', label: 'Vehicle 1 — year, make, model', type: 'text', placeholder: '2021 Toyota RAV4' },
      { name: 'auto-additional-vehicles', label: 'Additional vehicles', type: 'textarea', placeholder: 'One per line' },
      { name: 'auto-driver-count', label: 'How many drivers?', type: 'select', options: ['1', '2', '3', '4 or more'] },
      { name: 'auto-incidents-3yr', label: 'Accidents or violations in the last 3 years?', type: 'radio', options: ['None', '1', '2 or more', 'Not sure'] },
      { name: 'auto-sr22-needed', label: 'Do you need an SR-22?', type: 'radio', options: ['Yes', 'No', 'Not sure'] },
      { name: 'auto-current-carrier', label: 'Current carrier', type: 'text', placeholder: 'e.g. Progressive' },
      { name: 'auto-current-premium', label: 'Current premium', type: 'text', placeholder: 'e.g. $142/mo' },
      { name: 'auto-renewal-date', label: 'Policy renews on', type: 'date' },
    ],
  },
  {
    id: 'home', label: 'Homeowners', category: 'personal',
    landingPage: true, slug: 'home',
    seo: {
      title: "Utah Home Insurance Quote — Bountiful & Davis County",
      description: "Homeowners insurance quotes for Bountiful and Davis County, Utah. We price earthquake and flood coverage alongside the base policy.",
      h1: "Homeowners Insurance Quote",
      intro: "Every standard homeowners policy written in Utah excludes earthquake damage, which is a strange thing to accept quietly when the Wasatch Fault runs the length of the valley you live in. Flood is excluded as well, and priced separately again. We quote the base policy and both endorsements together, so you see what it actually costs to cover the risks your address carries.",
    },
    faqs: [
      { q: "Does my homeowners policy cover earthquake damage?", a: "No. Earthquake is excluded from standard homeowners forms and has to be added by endorsement or written as a separate policy. The deductible is normally a percentage of your dwelling limit rather than a flat dollar amount, which surprises people, so it is worth seeing the real number before you decide." },
      { q: "How much dwelling coverage do I actually need?", a: "It should reflect what rebuilding would cost, not what the house would sell for. Those two numbers move independently, and in a market where land carries much of the value they can differ sharply. We work from replacement cost so you are neither underinsured nor paying for coverage you cannot use." },
      { q: "Is flood insurance worth it away from a flood zone?", a: "Frequently, yes. A large share of flood claims come from outside high-risk zones, and homeowners policies exclude flood everywhere. Communities taking part in FEMA's Community Rating System earn premium discounts for their residents, so it is worth checking what your specific address qualifies for." },
    ],
    fields: [
      { name: 'home-address', label: 'Property address', type: 'text', placeholder: '123 S Main St, Bountiful' },
      { name: 'home-year-built', label: 'Year built', type: 'number', placeholder: '1998' },
      { name: 'home-sqft', label: 'Approximate square footage', type: 'number', placeholder: '2400' },
      { name: 'home-roof-age', label: 'Roof age', type: 'select', options: ['0–5 years', '6–10 years', '11–20 years', 'Over 20 years', 'Not sure'] },
      { name: 'home-value', label: 'Rebuild cost or purchase price', type: 'text', placeholder: 'e.g. $520,000' },
      { name: 'home-claims-5yr', label: 'Claims in the last 5 years?', type: 'radio', options: ['None', '1', '2 or more'] },
      { name: 'home-current-carrier', label: 'Current carrier', type: 'text' },
      { name: 'home-renewal-date', label: 'Policy renews on', type: 'date' },
      { name: 'home-earthquake-interest', label: 'Interested in earthquake coverage?', type: 'radio', options: ['Yes', 'No', 'Tell me more'], help: 'Standard Utah homeowners policies exclude earthquake damage.' },
      { name: 'home-flood-interest', label: 'Interested in flood coverage?', type: 'radio', options: ['Yes', 'No', 'Tell me more'] },
    ],
  },
  {
    id: 'boat', label: 'Boat & Watercraft', category: 'personal',
    landingPage: true, slug: 'boat',
    seo: {
      title: "Utah Boat & Watercraft Insurance Quote",
      description: "Boat, jet ski and pontoon insurance quotes from an independent Bountiful, Utah agency covering Bear Lake, Lake Powell and Utah Lake.",
      h1: "Boat & Watercraft Insurance Quote",
      intro: "Utah does not require liability insurance to register a boat, which is exactly why so many owners find their coverage gap only after something goes wrong on the water. Homeowners policies cap watercraft at a low limit and usually exclude anything above a modest horsepower threshold, ruling out most ski boats. Tell us what you run and where you run it.",
    },
    faqs: [
      { q: "Is boat insurance required in Utah?", a: "Utah does not mandate liability coverage to register recreational watercraft. Marinas, slip contracts and lenders very often do require it, and concessionaires at Lake Powell have their own rules. Going uninsured leaves you personally exposed for injury and property damage claims that can be substantial." },
      { q: "Doesn't my homeowners policy already cover the boat?", a: "Usually only in part. Most homeowners forms carry a small watercraft limit with horsepower and length restrictions attached, which commonly excludes jet skis and ski boats outright or covers them for a fraction of their value. We will read your current form and show you precisely where it stops." },
    ],
    fields: [
      { name: 'boat-type', label: 'Watercraft type', type: 'select', options: ['Boat', 'PWC / jet ski', 'Pontoon', 'Sailboat', 'Other'] },
      { name: 'boat-year-make-model', label: 'Year, make, model', type: 'text', placeholder: '2019 Malibu Wakesetter' },
      { name: 'boat-length', label: 'Length', type: 'text', placeholder: '23 ft' },
      { name: 'boat-engine-hp', label: 'Engine horsepower', type: 'text', placeholder: '450' },
      { name: 'boat-value', label: 'Approximate value', type: 'text', placeholder: 'e.g. $78,000' },
      { name: 'boat-storage', label: 'Where is it stored?', type: 'select', options: ['Trailer at home', 'Marina slip', 'Storage facility', 'Other'] },
      { name: 'boat-primary-water', label: 'Primary water', type: 'select', options: ['Utah Lake', 'Bear Lake', 'Lake Powell', 'Jordanelle', 'Other'] },
    ],
  },
  {
    id: 'rv', label: 'RV & Motorhome', category: 'personal',
    landingPage: true, slug: 'rv',
    seo: {
      title: "Utah RV & Motorhome Insurance Quote",
      description: "RV, travel trailer and fifth wheel insurance quotes in Utah. Full-time and seasonal coverage compared across carriers by an independent agency.",
      h1: "RV & Motorhome Insurance Quote",
      intro: "An RV parked nine months of the year and an RV you live in are two different insurance problems, and carriers rate them on entirely different forms. Full-timers need liability and personal property provisions closer to a homeowners policy than an auto one. Buying the wrong form is the sort of mistake nobody discovers until a claim, so tell us how you genuinely use it.",
    },
    faqs: [
      { q: "Does full-time RV living need a different policy?", a: "Yes, and this is the single most common gap we find. A standard recreational RV policy assumes the vehicle is a vacation asset, not a residence, and can limit or deny liability and contents claims accordingly. Full-timer coverage adds the personal liability and personal property provisions a home policy would normally supply." },
      { q: "Is my travel trailer covered by my auto policy while towing?", a: "Your auto liability generally extends to the trailer while it is attached, but that is liability only — it does nothing for damage to the trailer itself, its contents, or anything that happens while it is parked and unhitched. Those need coverage written on the trailer." },
    ],
    fields: [
      { name: 'rv-type', label: 'RV type', type: 'select', options: ['Class A', 'Class B', 'Class C', 'Travel trailer', 'Fifth wheel', 'Pop-up'] },
      { name: 'rv-year-make-model', label: 'Year, make, model', type: 'text', placeholder: '2022 Winnebago View' },
      { name: 'rv-value', label: 'Approximate value', type: 'text', placeholder: 'e.g. $95,000' },
      { name: 'rv-full-time', label: 'Do you live in it full time?', type: 'radio', options: ['Yes', 'No', 'Seasonally'], help: 'Full-time occupancy needs a different policy form.' },
      { name: 'rv-storage', label: 'Where is it stored?', type: 'select', options: ['At home', 'Storage facility', 'RV park', 'Other'] },
      { name: 'rv-towed-vehicle', label: 'Towed vehicle, if any', type: 'text', placeholder: '2018 Jeep Wrangler' },
    ],
  },
  {
    id: 'atv', label: 'ATV & Off-Road', category: 'personal',
    landingPage: true, slug: 'atv',
    seo: {
      title: "Utah ATV, UTV & Off-Road Insurance Quote",
      description: "ATV, UTV, dirt bike and snowmobile insurance quotes in Utah, including public land riding and street-legal conversions.",
      h1: "ATV & Off-Road Insurance Quote",
      intro: "Utah requires off-highway vehicles to be registered for public land use, and a street-legal conversion changes what your machine needs on paper as much as on the trail. Homeowners policies rarely follow an ATV past the end of your own driveway. Tell us what you ride and where you ride it, and we will match it to a carrier that writes off-road properly.",
    },
    faqs: [
      { q: "Is ATV insurance required in Utah?", a: "Liability insurance is not universally mandated for off-highway use, but registration is required to ride public land, and a machine converted to street-legal must meet the same financial responsibility rules as any other vehicle on the road. Many trail systems and private landowners impose their own requirements too." },
      { q: "Does my homeowners policy cover my UTV?", a: "Almost never once it leaves your property. Homeowners forms typically cover an off-road vehicle only while it is on the insured premises, which means the trailhead is where your coverage ends. A dedicated policy follows the machine, and can include the trailer and accessories as well." },
    ],
    fields: [
      { name: 'atv-type', label: 'Type', type: 'select', options: ['ATV', 'UTV / side-by-side', 'Dirt bike', 'Snowmobile'] },
      { name: 'atv-unit-count', label: 'How many units?', type: 'select', options: ['1', '2', '3 or more'] },
      { name: 'atv-year-make-model', label: 'Year, make, model', type: 'text', placeholder: '2023 Polaris RZR' },
      { name: 'atv-value', label: 'Approximate value', type: 'text', placeholder: 'e.g. $22,000' },
      { name: 'atv-street-legal', label: 'Registered street legal?', type: 'radio', options: ['Yes', 'No', 'Not sure'] },
      { name: 'atv-riding-location', label: 'Where do you ride?', type: 'radio', options: ['Public land', 'Private property', 'Both'] },
    ],
  },
  {
    id: 'commercial', label: 'Commercial', category: 'business',
    landingPage: true, slug: 'commercial',
    seo: {
      title: "Davis County Commercial Insurance Quote",
      description: "Commercial insurance quotes for Bountiful and Davis County businesses: liability, property, workers comp, bonds and hard-to-place risks.",
      h1: "Commercial Insurance Quote",
      intro: "Most calls we take from Utah businesses begin the same way: a client, a landlord or a general contractor has asked for a certificate of insurance, and there is a deadline attached. We can usually work to that deadline. We also place risks the standard markets decline, which is the part a single-carrier agent simply cannot do for you. Tell us what the business does.",
    },
    faqs: [
      { q: "What insurance is a Utah business actually required to carry?", a: "Workers' compensation is required of most Utah employers once you have employees, with narrow exceptions. Everything else is typically driven by contract rather than statute — your lease, your lender, or the client demanding a certificate. We separate what the law requires from what your paperwork requires." },
      { q: "What if my business has been declined by standard carriers?", a: "That is routine work for an independent agency. Contractors, trucking, anything with a claims history, and genuinely unusual operations often belong in surplus lines or specialty markets rather than standard ones. Being declined is a routing problem, not a verdict." },
      { q: "Do I need professional liability if I already carry general liability?", a: "If you give advice or provide a professional service, yes. General liability answers for physical harm — someone injured, something damaged. Professional liability, or E&O, answers for the economic harm caused by your work being wrong. A claim that your advice cost a client money falls entirely outside a general liability policy." },
    ],
    fields: [
      { name: 'commercial-business-name', label: 'Business name', type: 'text' },
      { name: 'commercial-industry', label: 'What does the business do?', type: 'text', placeholder: 'e.g. residential electrical contractor' },
      { name: 'commercial-years-in-business', label: 'Years in business', type: 'select', options: ['Under 1', '1–3', '4–10', 'Over 10'] },
      { name: 'commercial-employee-count', label: 'Number of employees', type: 'select', options: ['Just me', '2–5', '6–20', '21–50', 'Over 50'] },
      { name: 'commercial-revenue-range', label: 'Annual revenue', type: 'select', options: ['Under $250k', '$250k–$1M', '$1M–$5M', 'Over $5M'] },
      { name: 'commercial-coverages', label: 'Coverage needed', type: 'checkbox-group', options: ['General liability', 'Commercial property', 'Commercial auto', "Workers' compensation", 'Professional liability (E&O)', 'Cyber liability', 'Surety bond', 'BOP', 'Umbrella'] },
      { name: 'commercial-current-carrier', label: 'Current carrier', type: 'text' },
      { name: 'commercial-renewal-date', label: 'Policy renews on', type: 'date' },
      { name: 'commercial-coi-required', label: 'Is a certificate of insurance being required of you?', type: 'radio', options: ['Yes', 'No', 'Not sure'], help: 'A client, landlord, or general contractor asking for a COI usually means a deadline.' },
    ],
  },
  {
    id: 'medicare', label: 'Medicare', category: 'health',
    landingPage: true, slug: 'medicare',
    seo: {
      title: "Utah Medicare Plan Quote & Comparison",
      description: "Compare Medicare Supplement, Advantage and Part D options in Utah with a licensed local agent. No cost to you — carriers pay us.",
      h1: "Medicare Plan Comparison",
      intro: "Medicare runs on enrollment windows, and the windows are unforgiving: miss the initial period around your sixty-fifth birthday and a late penalty can follow you for as long as you hold the coverage. Annual enrollment each autumn is the other door in. We go through your prescriptions and your doctors before recommending anything, because the plan that suits your neighbor rarely suits you.",
    },
    faqs: [
      { q: "What is the difference between Medicare Supplement and Medicare Advantage?", a: "Supplement, or Medigap, sits alongside Original Medicare and pays the deductibles and coinsurance Medicare leaves to you, with wide provider freedom and a monthly premium. Advantage replaces Original Medicare with a private plan, often with a low premium and extra dental or vision benefits, but with a network and prior authorisation. Neither is better in the abstract." },
      { q: "When can I enroll?", a: "Your Initial Enrollment Period spans the seven months around your sixty-fifth birthday. Annual Enrollment runs each autumn and lets you change plans for January. There is also a Medicare Advantage open enrollment period early in the year, and Special Enrollment Periods triggered by events such as moving or losing employer coverage." },
      { q: "Does your help cost anything?", a: "No. Our agents are compensated by the carriers, never by you, and a plan does not cost less if you enroll without an agent. What you get for it is someone local who checks your medications against each plan's formulary and your doctors against each network before you commit." },
    ],
    fields: [
      { name: 'medicare-dob', label: 'Date of birth', type: 'date' },
      { name: 'medicare-status', label: 'Where are you today?', type: 'radio', options: ['Currently on Medicare', 'Turning 65 within 12 months', 'Not yet eligible'] },
      { name: 'medicare-ab-effective-date', label: 'Part A & B effective date, if known', type: 'date' },
      { name: 'medicare-interest', label: 'What are you looking at?', type: 'radio', options: ['Supplement (Medigap)', 'Advantage', 'Part D', 'Not sure'] },
      { name: 'medicare-prescriptions', label: 'Do you take regular prescriptions?', type: 'radio', options: ['Yes', 'No'] },
      { name: 'medicare-providers-to-keep', label: 'Doctors or hospitals you want to keep', type: 'textarea' },
      { name: 'medicare-soa-products', label: 'Which would you like an agent to discuss with you?', type: 'checkbox-group', options: ['Medicare Advantage (Part C)', 'Medicare Supplement (Medigap)', 'Prescription drug (Part D)', 'Dental, vision and hearing', 'Not sure yet'], help: 'Your agent completes a formal Scope of Appointment before any plan discussion.' },
    ],
  },
  {
    id: 'small-group-health', label: 'Small Group Health', category: 'health',
    landingPage: true, slug: 'small-group-health',
    seo: {
      title: "Utah Small Group Health Insurance Quote",
      description: "Small group health plans for Utah employers. Compare medical, dental and vision options and renewal pricing with an independent agency.",
      h1: "Small Group Health Quote",
      intro: "Offering coverage is usually how a small Utah employer stops losing good people to larger competitors, and the cost is rarely as punishing as owners assume once contribution strategy and plan design are actually on the table. Renewal season is where most of the leverage sits. Give us your headcount and your renewal date and we will show you what the market looks like.",
    },
    faqs: [
      { q: "How many employees do I need to offer a group plan?", a: "Small group coverage in Utah generally starts at two enrolled employees, so most genuinely small businesses qualify. Employers under fifty full-time equivalents are not required to offer coverage at all, which means anything you do offer is a retention decision rather than a compliance one." },
      { q: "Can I control what this costs?", a: "Yes, and more than most owners expect. Your contribution percentage, the plan tiers you offer, and whether you pair a higher deductible with an HSA all move the number substantially. We model a few combinations against your actual census rather than quoting a single plan and leaving you to react to it." },
    ],
    fields: [
      { name: 'small-group-health-business-name', label: 'Business name', type: 'text' },
      { name: 'small-group-health-eligible-employees', label: 'Eligible employees', type: 'select', options: ['2–5', '6–10', '11–25', '26–50', 'Over 50'] },
      { name: 'small-group-health-currently-offering', label: 'Do you offer coverage today?', type: 'radio', options: ['Yes', 'No'] },
      { name: 'small-group-health-current-carrier', label: 'Current carrier', type: 'text' },
      { name: 'small-group-health-renewal-date', label: 'Renews on', type: 'date' },
      { name: 'small-group-health-priority', label: 'What matters most?', type: 'radio', options: ['Lowest cost', 'Broadest network', 'Low deductibles', 'Dental & vision included'] },
      { name: 'small-group-health-interest', label: 'Interested in', type: 'checkbox-group', options: ['Medical', 'Dental', 'Vision', 'Life', 'Disability'] },
    ],
  },
  { id: 'umbrella', label: 'Umbrella', category: 'personal', landingPage: false, fields: [] },
  { id: 'motorcycle', label: 'Motorcycle', category: 'personal', landingPage: false, fields: [] },
  { id: 'renters', label: 'Renters or Condo', category: 'personal', landingPage: false, fields: [] },
  { id: 'life', label: 'Life Insurance', category: 'personal', landingPage: false, fields: [] },
  { id: 'individual-health', label: 'Individual Health Plan', category: 'health', landingPage: false, fields: [] },
  { id: 'workers-comp', label: "Workers' Compensation", category: 'business', landingPage: false, fields: [] },
];

export const LANDING_LINES: Line[] = LINES.filter((l) => l.landingPage);

export function lineById(id: string): Line | undefined {
  return LINES.find((l) => l.id === id);
}
