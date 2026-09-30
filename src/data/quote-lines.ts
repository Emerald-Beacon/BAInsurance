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
