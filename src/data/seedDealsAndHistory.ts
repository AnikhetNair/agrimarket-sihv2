import {
  Deal,
  DealEvent,
  Offer,
  Payment,
  Review,
  Dispute,
  LogisticsOption,
  StorageOption,
  LogisticsBooking,
  Alert,
} from '../types/domain';

export const GOLDEN_DEAL_ID = 'deal-nk-tom-0926';

// Negotiation history for Golden Lot LOT #NK-TOM-0926
export const GOLDEN_OFFERS: Offer[] = [
  {
    id: 'off-gt-1',
    lot_id: 'lot-nk-tom-0926',
    buyer_id: 'usr-buyer-1',
    buyer_name: 'Arjun Mehta (FreshKart Foods)',
    seller_id: 'usr-farmer-1',
    seller_name: 'Ramesh Patil',
    sender_id: 'usr-buyer-1',
    offer_price: 3050,
    quantity: 30,
    message: 'Initial bid matching our standard warehouse intake rate for Grade A Kuroda Carrots.',
    created_at: '2026-09-06T09:15:00Z',
    expires_at: '2026-09-07T09:15:00Z',
    status: 'COUNTERED',
  },
  {
    id: 'off-gt-2',
    lot_id: 'lot-nk-tom-0926',
    buyer_id: 'usr-buyer-1',
    buyer_name: 'Arjun Mehta (FreshKart Foods)',
    seller_id: 'usr-farmer-1',
    seller_name: 'Ramesh Patil',
    sender_id: 'usr-farmer-1',
    offer_price: 3150,
    quantity: 30,
    message: 'Produce is crate-packed and harvest-fresh with superior firmness. Proposing ₹3,150/Q.',
    created_at: '2026-09-06T10:30:00Z',
    expires_at: '2026-09-07T10:30:00Z',
    status: 'COUNTERED',
    parent_offer_id: 'off-gt-1',
  },
  {
    id: 'off-gt-3',
    lot_id: 'lot-nk-tom-0926',
    buyer_id: 'usr-buyer-1',
    buyer_name: 'Arjun Mehta (FreshKart Foods)',
    seller_id: 'usr-farmer-1',
    seller_name: 'Ramesh Patil',
    sender_id: 'usr-buyer-1',
    offer_price: 3100,
    quantity: 30,
    message: 'We will meet in middle at ₹3,100/Q with guaranteed same-day dock acceptance at Pune.',
    created_at: '2026-09-06T11:45:00Z',
    expires_at: '2026-09-07T11:45:00Z',
    status: 'ACCEPTED',
    parent_offer_id: 'off-gt-2',
  },
];

// Golden Deal object
export const GOLDEN_DEAL: Deal = {
  id: GOLDEN_DEAL_ID,
  deal_number: 'DEAL-2026-0926-CAR',
  lot_id: 'lot-nk-tom-0926',
  accepted_offer_id: 'off-gt-3',
  buyer_id: 'usr-buyer-1',
  buyer_name: 'Arjun Mehta (FreshKart Foods India Ltd)',
  seller_id: 'usr-farmer-1',
  seller_name: 'Ramesh Patil',
  seller_type: 'FARMER',
  commodity: 'Carrot',
  accepted_price: 3100,
  quantity: 30,
  gross_value: 93000, // 30 * 3,100 = ₹93,000
  transport_cost: 2700, // Exact mandated formula check: -₹2,700
  storage_cost: 900, // -₹900
  service_fee: 465, // -₹465 (0.5%)
  net_realisation: 88935, // ₹93,000 - ₹2,700 - ₹900 - ₹465 = ₹88,935
  delivery_mode: 'DELIVERED_TO_BUYER_WAREHOUSE',
  transport_paid_by: 'SELLER',
  pickup_location: 'Patil Farm Gate, Dindori, Nashik',
  delivery_location: 'FreshKart Foods Central Warehouse, Bhosari, Pune',
  status: 'COMPLETED',
  accepted_at: '2026-09-06T12:00:00Z',
  completed_at: '2026-09-07T14:30:00Z',
};

// Deal Events tracking Golden Deal
export const GOLDEN_DEAL_EVENTS: DealEvent[] = [
  {
    id: 'evt-gt-1',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'OFFER_ACCEPTED',
    actor_id: 'usr-farmer-1',
    actor_name: 'Ramesh Patil',
    actor_role: 'FARMER',
    timestamp: '2026-09-06T12:00:00Z',
    title: 'Offer Accepted by Seller',
    description: 'Ramesh Patil accepted ₹3,100/Q counter-offer from FreshKart Foods for 30 Quintals.',
    metadata: { acceptedPrice: 3100, quantity: 30, grossValue: 93000 },
  },
  {
    id: 'evt-gt-2',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'DEAL_CREATED',
    actor_id: 'usr-buyer-1',
    actor_name: 'Arjun Mehta',
    actor_role: 'BUYER',
    timestamp: '2026-09-06T12:05:00Z',
    title: 'Smart Procurement Contract Generated',
    description: 'Deal DEAL-2026-0926-CAR formalized with escrow protection and delivery terms.',
  },
  {
    id: 'evt-gt-3',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'LOGISTICS_SCHEDULED',
    actor_id: 'usr-farmer-1',
    actor_name: 'Ramesh Patil',
    actor_role: 'FARMER',
    timestamp: '2026-09-06T13:30:00Z',
    title: 'Transport Carrier Booked',
    description: 'Sahyadri Agri Logistics allocated dedicated Medium Commercial Vehicle (Bolero Maxi Truck).',
    metadata: { vehicleType: 'Bolero Maxi Truck', trackingRef: 'LOG-MH-NSK-9921', carrierFee: 2700 },
  },
  {
    id: 'evt-gt-4',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'PICKED_UP',
    actor_id: 'carrier-1',
    actor_name: 'Ganesh Shinde (Driver)',
    actor_role: 'LOGISTICS_PARTNER',
    timestamp: '2026-09-06T16:00:00Z',
    title: 'Consignment Loaded at Farm Gate',
    description: '30Q (120 crates) inspected and loaded at Dindori farm gate. Transit to Pune initiated.',
  },
  {
    id: 'evt-gt-5',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'IN_TRANSIT',
    actor_id: 'carrier-1',
    actor_name: 'Sahyadri Tracking Gateway',
    actor_role: 'SYSTEM',
    timestamp: '2026-09-06T19:45:00Z',
    title: 'Vehicle In Transit (Sinnar-Sangamner Highway)',
    description: 'En route via NH60 corridor. Estimated arrival at Pune distribution dock: 22:30 IST.',
  },
  {
    id: 'evt-gt-6',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'DELIVERED',
    actor_id: 'usr-buyer-1',
    actor_name: 'Dock Supervisor (FreshKart)',
    actor_role: 'BUYER',
    timestamp: '2026-09-06T23:00:00Z',
    title: 'Consignment Received at Pune Hub',
    description: 'Produce unloaded and checked into temperature-controlled holding dock.',
  },
  {
    id: 'evt-gt-7',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'QUALITY_INSPECTED',
    actor_id: 'usr-buyer-1',
    actor_name: 'QA Inspector (FreshKart)',
    actor_role: 'BUYER',
    timestamp: '2026-09-07T07:30:00Z',
    title: 'Quality Verification Cleared',
    description: 'Grade A specifications verified (Firmness 4.2 kg/cm², Size 68mm avg, Brix 4.8%). Zero rejections.',
  },
  {
    id: 'evt-gt-8',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'PAYMENT_INITIATED',
    actor_id: 'usr-buyer-1',
    actor_name: 'Finance Desk (FreshKart)',
    actor_role: 'BUYER',
    timestamp: '2026-09-07T10:00:00Z',
    title: 'Simulated Escrow Payment Triggered',
    description: 'Invoice #INV-2026-0926 processed. Escrow release initiated for ₹88,935 net.',
  },
  {
    id: 'evt-gt-9',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'PAYMENT_COMPLETED',
    actor_id: 'bank-system',
    actor_name: 'Demo Banking Gateway',
    actor_role: 'SYSTEM',
    timestamp: '2026-09-07T14:00:00Z',
    title: 'Farmer Account Credited (Simulated Payment)',
    description: 'Net realization ₹88,935 credited to Ramesh Patil (HDFC Bank A/c ending 4412). UTR: DEMORTGS88935.',
  },
  {
    id: 'evt-gt-10',
    deal_id: GOLDEN_DEAL_ID,
    event_type: 'REVIEW_SUBMITTED',
    actor_id: 'usr-buyer-1',
    actor_name: 'Arjun Mehta',
    actor_role: 'BUYER',
    timestamp: '2026-09-07T14:30:00Z',
    title: '5-Star Buyer Review Logged',
    description: 'Exemplary consignment. Perfectly graded and on-schedule delivery.',
  },
];

export const GOLDEN_PAYMENT: Payment = {
  id: 'pay-gt-0926',
  deal_id: GOLDEN_DEAL_ID,
  gross_amount: 93000,
  deductions: {
    transport: 2700,
    storage: 900,
    service_fee: 465,
  },
  net_amount: 88935,
  payment_method: 'DEMO_ESCROW_RTGS',
  status: 'PAID',
  initiated_at: '2026-09-07T10:00:00Z',
  processed_at: '2026-09-07T12:30:00Z',
  paid_at: '2026-09-07T14:00:00Z',
  reference: 'SIM-RTGS-NK0926-88935',
  is_simulated: true,
};

export const GOLDEN_REVIEW: Review = {
  id: 'rev-gt-1',
  transaction_id: GOLDEN_DEAL_ID,
  reviewer_id: 'usr-buyer-1',
  reviewer_name: 'Arjun Mehta (FreshKart Foods)',
  reviewee_id: 'usr-farmer-1',
  reviewee_name: 'Ramesh Patil',
  rating: 5,
  comment: 'Outstanding quality Grade A carrots. Proper crate packaging preserved shelf life perfectly. Highly reliable seller.',
  created_at: '2026-09-07T14:30:00Z',
};

// --- 25+ COMPLETED HISTORICAL TRANSACTIONS (RELATIONALLY GROUNDED) ---
function generateCompletedHistoricalDeals(): Deal[] {
  const deals: Deal[] = [GOLDEN_DEAL];
  const commodities = ['Carrot', 'Mango', 'Potato', 'Banana', 'Apple'];
  const buyers = [
    { id: 'usr-buyer-1', name: 'FreshKart Foods India Ltd' },
    { id: 'usr-buyer-2', name: 'Metro Agri Logistics & Retail' },
    { id: 'usr-buyer-3', name: 'Capital Harvest Procurements' },
    { id: 'usr-buyer-4', name: 'SouthGreen Retail Chains' },
    { id: 'usr-buyer-5', name: 'Western Agro Processing Corp' },
  ];
  const farmers = [
    { id: 'usr-farmer-1', name: 'Ramesh Patil', location: 'Dindori, Nashik' },
    { id: 'usr-farmer-2', name: 'Suresh Gaikwad', location: 'Niphad, Nashik' },
    { id: 'usr-farmer-3', name: 'Anand Shinde', location: 'Lasalgaon, Nashik' },
    { id: 'usr-farmer-4', name: 'Babasaheb Kute', location: 'Sinnar, Nashik' },
    { id: 'usr-farmer-5', name: 'Santosh Jadhav', location: 'Junnar, Pune' },
    { id: 'usr-farmer-6', name: 'Pravin Pawar', location: 'Sangamner, Ahmednagar' },
    { id: 'usr-farmer-7', name: 'Vishnu Bhor', location: 'Manchar, Pune' },
    { id: 'usr-farmer-8', name: 'Kailas Borse', location: 'Kalwan, Nashik' },
  ];

  for (let i = 1; i <= 25; i++) {
    const cmd = commodities[i % commodities.length];
    const buyer = buyers[i % buyers.length];
    const farmer = farmers[i % farmers.length];
    const qty = 25 + (i % 6) * 15; // 25 to 100 quintals
    let price = 2800;
    if (cmd === 'Carrot') price = 2700 + (i % 5) * 80;
    else if (cmd === 'Mango') price = 2150 + (i % 4) * 60;
    else if (cmd === 'Potato') price = 1750 + (i % 3) * 50;
    else if (cmd === 'Banana') price = 4650 + (i % 4) * 75;
    else price = 2550 + (i % 3) * 60;

    const gross = qty * price;
    const transport = Math.round(qty * 65);
    const storage = Math.round(qty * 25);
    const fee = Math.round(gross * 0.005);
    const net = gross - transport - storage - fee;

    const date = new Date('2026-08-28T10:00:00Z');
    date.setDate(date.getDate() - i);

    deals.push({
      id: `deal-hist-${i}`,
      deal_number: `DEAL-2026-H${100 + i}`,
      lot_id: `lot-hist-${i}`,
      accepted_offer_id: `off-hist-${i}`,
      buyer_id: buyer.id,
      buyer_name: buyer.name,
      seller_id: farmer.id,
      seller_name: farmer.name,
      seller_type: 'FARMER',
      commodity: cmd,
      accepted_price: price,
      quantity: qty,
      gross_value: gross,
      transport_cost: transport,
      storage_cost: storage,
      service_fee: fee,
      net_realisation: net,
      delivery_mode: i % 2 === 0 ? 'DELIVERED_TO_BUYER_WAREHOUSE' : 'BUYER_PICKUP_FARM_GATE',
      transport_paid_by: i % 2 === 0 ? 'SELLER' : 'BUYER',
      pickup_location: farmer.location,
      delivery_location: buyer.name.includes('Pune') ? 'Pune Distribution Hub' : 'Vashi Terminal Hub',
      status: 'COMPLETED',
      accepted_at: date.toISOString(),
      completed_at: new Date(date.getTime() + 86400000 * 2).toISOString(),
    });
  }

  return deals;
}

export const SEED_COMPLETED_DEALS: Deal[] = generateCompletedHistoricalDeals();

// Logistics Options
export const SEED_LOGISTICS_OPTIONS: LogisticsOption[] = [
  {
    id: 'log-1',
    provider: 'Sahyadri Farmer Logistics Service',
    vehicle_type: 'Tata Ace (Chhota Hathi)',
    capacity_quintals: 15,
    base_fee: 500,
    rate_per_km: 14,
    loading_fee: 250,
    unloading_fee: 250,
    estimated_speed_kmh: 40,
  },
  {
    id: 'log-2',
    provider: 'AgriTransit Freight Partners',
    vehicle_type: 'Mahindra Bolero Maxi Truck',
    capacity_quintals: 30,
    base_fee: 900,
    rate_per_km: 18,
    loading_fee: 450,
    unloading_fee: 450,
    estimated_speed_kmh: 45,
  },
  {
    id: 'log-3',
    provider: 'Kisan Cold Chain Express',
    vehicle_type: 'Reefer Van (Temperature-Controlled)',
    capacity_quintals: 50,
    base_fee: 1800,
    rate_per_km: 26,
    loading_fee: 750,
    unloading_fee: 750,
    estimated_speed_kmh: 45,
  },
  {
    id: 'log-4',
    provider: 'Maharashtra Heavy Freight Co-op',
    vehicle_type: 'Eicher 11.10 6-Wheel Truck',
    capacity_quintals: 75,
    base_fee: 1600,
    rate_per_km: 24,
    loading_fee: 1100,
    unloading_fee: 1100,
    estimated_speed_kmh: 45,
  },
  {
    id: 'log-5',
    provider: 'National Agro Haulers',
    vehicle_type: 'Ashok Leyland 1616 10-Ton Truck',
    capacity_quintals: 120,
    base_fee: 2400,
    rate_per_km: 32,
    loading_fee: 1800,
    unloading_fee: 1800,
    estimated_speed_kmh: 50,
  },
];

// Storage Options
export const SEED_STORAGE_OPTIONS: StorageOption[] = [
  {
    id: 'stor-1',
    location: 'Mohadi Industrial Cluster, Dindori, Nashik',
    provider: 'Sahyadri Agro Cold Hub',
    commodity: 'Carrot',
    capacity_quintals: 8000,
    available_capacity_quintals: 2400,
    cost_per_quintal_per_day: 10.0,
    temperature_celsius: 12,
    humidity_percentage: 90,
    available_until: '2026-12-31',
  },
  {
    id: 'stor-2',
    location: 'Lasalgaon Mandi Complex, Nashik',
    provider: 'Lasalgaon Cooperative Ventilated Sheds',
    commodity: 'Mango',
    capacity_quintals: 25000,
    available_capacity_quintals: 9500,
    cost_per_quintal_per_day: 4.5,
    available_until: '2026-11-30',
  },
  {
    id: 'stor-3',
    location: 'Manchar Agro Processing Park, Pune',
    provider: 'Shivneri Multi-Chamber Cold Vault',
    commodity: 'Potato',
    capacity_quintals: 12000,
    available_capacity_quintals: 4200,
    cost_per_quintal_per_day: 8.0,
    temperature_celsius: 4,
    available_until: '2027-01-31',
  },
  {
    id: 'stor-4',
    location: 'APMC Sector 19, Vashi, Navi Mumbai',
    provider: 'Metro Terminal Staging Vault',
    commodity: 'General Perishables',
    capacity_quintals: 6000,
    available_capacity_quintals: 1800,
    cost_per_quintal_per_day: 12.0,
    temperature_celsius: 10,
    available_until: '2026-12-15',
  },
];

// Historical Reviews
export const SEED_REVIEWS: Review[] = [
  GOLDEN_REVIEW,
  {
    id: 'rev-2',
    transaction_id: 'deal-hist-1',
    reviewer_id: 'usr-buyer-2',
    reviewer_name: 'Metro Agri Logistics & Retail',
    reviewee_id: 'usr-farmer-2',
    reviewee_name: 'Suresh Gaikwad',
    rating: 5,
    comment: 'Clean produce, exact weight compliance at arrival weighing scale.',
    created_at: '2026-08-29T11:00:00Z',
  },
  {
    id: 'rev-3',
    transaction_id: 'deal-hist-2',
    reviewer_id: 'usr-buyer-3',
    reviewer_name: 'Capital Harvest Procurements',
    reviewee_id: 'usr-farmer-3',
    reviewee_name: 'Anand Shinde',
    rating: 4,
    comment: 'Good dry mango lot. Quality within agreed specifications.',
    created_at: '2026-08-30T14:00:00Z',
  },
  {
    id: 'rev-4',
    transaction_id: 'deal-hist-3',
    reviewer_id: 'usr-farmer-1',
    reviewer_name: 'Ramesh Patil',
    reviewee_id: 'usr-buyer-1',
    reviewee_name: 'FreshKart Foods India Ltd',
    rating: 5,
    comment: 'Payment processed in under 18 hours. Prompt unloading at warehouse.',
    created_at: '2026-08-31T09:30:00Z',
  },
  {
    id: 'rev-5',
    transaction_id: 'deal-hist-4',
    reviewer_id: 'usr-farmer-4',
    reviewer_name: 'Babasaheb Kute',
    reviewee_id: 'usr-buyer-4',
    reviewee_name: 'SouthGreen Retail Chains',
    rating: 5,
    comment: 'Driver arrived exactly on schedule for farm-gate pickup. Seamless transaction.',
    created_at: '2026-09-01T15:00:00Z',
  },
];

// Seeded Disputes (Empty by default; disputes are created during user/demo interaction)
export const SEED_DISPUTES: Dispute[] = [];

// Seeded Alerts
export const SEED_ALERTS: Alert[] = [
  {
    id: 'alt-1',
    user_id: 'usr-farmer-1',
    type: 'PRICE_MOVEMENT',
    title: 'Carrot Modal Price Surged +7.2%',
    message: 'Lasalgaon and Nashik mandis report sharp arrival drops; modal rate touched ₹2,850/Q.',
    timestamp: '2026-09-07T06:30:00Z',
    read: false,
    priority: 'HIGH',
  },
  {
    id: 'alt-2',
    user_id: 'usr-farmer-1',
    type: 'BUYER_DEMAND',
    title: 'High-Value Buyer Match for Grade A Carrots',
    message: 'FreshKart Foods posted requirement for 30Q at ₹3,050/Q delivery to Pune Warehouse.',
    timestamp: '2026-09-06T07:45:00Z',
    read: false,
    priority: 'HIGH',
    related_entity_id: 'req-freshkart-tom-15',
  },
  {
    id: 'alt-3',
    user_id: 'usr-fpo-1',
    type: 'BUYER_DEMAND',
    title: 'Institutional Procurement Match: 150Q Mango',
    message: 'Western Agro posted requirement matching Sahyadri pooled mango lot with farm-gate pickup terms.',
    timestamp: '2026-09-05T11:00:00Z',
    read: false,
    priority: 'MEDIUM',
  },
  {
    id: 'alt-4',
    user_id: 'usr-farmer-1',
    type: 'PAYMENT',
    title: 'Simulated Settlement Credited: ₹88,935',
    message: 'Escrow payment for DEAL-2026-0926-CAR successfully disbursed to your registered account.',
    timestamp: '2026-09-07T14:00:00Z',
    read: true,
    priority: 'MEDIUM',
    related_entity_id: GOLDEN_DEAL_ID,
  },
];
