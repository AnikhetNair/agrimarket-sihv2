import { Deal, DealEvent, DealEventType, LotStatus } from '../types/domain';

// Valid sequence of lifecycle states
const VALID_FORWARD_TRANSITIONS: Record<LotStatus, LotStatus[]> = {
  DRAFT: ['LISTED', 'CANCELLED'],
  LISTED: ['MATCHED', 'OFFER_RECEIVED', 'EXPIRED', 'CANCELLED'],
  MATCHED: ['OFFER_RECEIVED', 'NEGOTIATING', 'CANCELLED'],
  OFFER_RECEIVED: ['NEGOTIATING', 'ACCEPTED', 'LISTED', 'CANCELLED'],
  NEGOTIATING: ['ACCEPTED', 'OFFER_RECEIVED', 'LISTED', 'CANCELLED'],
  ACCEPTED: ['LOGISTICS_PENDING', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'CANCELLED', 'DISPUTED'],
  LOGISTICS_PENDING: ['PICKUP_SCHEDULED', 'IN_TRANSIT', 'DISPUTED', 'CANCELLED'],
  PICKUP_SCHEDULED: ['IN_TRANSIT', 'DELIVERED', 'DISPUTED', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'DISPUTED'],
  DELIVERED: ['PAYMENT_PENDING', 'PAID', 'DISPUTED'],
  PAYMENT_PENDING: ['PAID', 'DISPUTED'],
  PAID: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [], // Terminal
  DISPUTED: ['RESOLVED' as any, 'UNDER_REVIEW' as any, 'CANCELLED'],
  CANCELLED: [], // Terminal
  EXPIRED: [], // Terminal
};

export const ORDERED_LIFECYCLE_STEPS: LotStatus[] = [
  'LISTED',
  'MATCHED',
  'OFFER_RECEIVED',
  'NEGOTIATING',
  'ACCEPTED',
  'LOGISTICS_PENDING',
  'PICKUP_SCHEDULED',
  'IN_TRANSIT',
  'DELIVERED',
  'PAYMENT_PENDING',
  'PAID',
  'COMPLETED',
];

export function validateStateTransition(currentState: LotStatus, nextState: LotStatus): boolean {
  if (currentState === nextState) return true; // Idempotent
  const allowed = VALID_FORWARD_TRANSITIONS[currentState] || [];
  return allowed.includes(nextState);
}

export function createDealEvent(params: {
  dealId: string;
  eventType: DealEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
}): DealEvent {
  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    deal_id: params.dealId,
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_name: params.actorName,
    actor_role: params.actorRole,
    timestamp: new Date().toISOString(),
    title: params.title,
    description: params.description,
    metadata: params.metadata || {},
  };
}

/**
 * State Transition Service
 * Enforces transition validity, idempotency, and audit logging
 */
export function transitionDealState(
  deal: Deal,
  nextState: LotStatus,
  actor: { id: string; name: string; role: string },
  metadata?: Record<string, any>
): { updatedDeal: Deal; newEvent: DealEvent } {
  if (deal.status === 'COMPLETED') {
    throw new Error('Transaction is already completed. Terminal state cannot be altered.');
  }

  // Idempotency: if already in that state, return as-is
  if (deal.status === nextState) {
    return {
      updatedDeal: deal,
      newEvent: createDealEvent({
        dealId: deal.id,
        eventType: 'DEAL_CREATED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        title: `Deal confirmed in state: ${nextState}`,
        description: `Idempotent state confirmation for deal ${deal.deal_number}.`,
        metadata,
      }),
    };
  }

  // Strict transition check
  if (!validateStateTransition(deal.status, nextState)) {
    throw new Error(
      `Invalid state transition: Cannot transition deal ${deal.deal_number} from "${deal.status}" to "${nextState}".`
    );
  }

  const updatedDeal: Deal = {
    ...deal,
    status: nextState,
    completed_at: nextState === 'COMPLETED' ? new Date().toISOString() : deal.completed_at,
  };

  // Map state to appropriate DealEventType
  let eventType: DealEventType = 'DEAL_CREATED';
  let title = `Status changed to ${nextState}`;
  let description = `Transaction transitioned from ${deal.status} to ${nextState} by ${actor.name} (${actor.role}).`;

  switch (nextState) {
    case 'ACCEPTED':
      eventType = 'OFFER_ACCEPTED';
      title = 'Offer Accepted & Deal Sealed';
      description = `Seller ${deal.seller_name} accepted procurement terms from ${deal.buyer_name} for ${deal.quantity}Q at ₹${deal.accepted_price}/Q.`;
      break;
    case 'LOGISTICS_PENDING':
      eventType = 'LOGISTICS_SCHEDULED';
      title = 'Logistics Scheduling In Progress';
      description = `Carrier booking initiated for dispatch from ${deal.pickup_location} to ${deal.delivery_location}.`;
      break;
    case 'PICKUP_SCHEDULED':
      eventType = 'PICKUP_SCHEDULED';
      title = 'Farm-Gate Pickup Slated';
      description = `Dedicated freight vehicle allocated. Pickup slot confirmed.`;
      break;
    case 'IN_TRANSIT':
      eventType = 'IN_TRANSIT';
      title = 'Produce Dispatched & In Transit';
      description = `Consignment loaded. Vehicle departed origin heading to destination mandi/warehouse.`;
      break;
    case 'DELIVERED':
      eventType = 'DELIVERED';
      title = 'Consignment Delivered & Verified';
      description = `Produce reached destination. Quality and quantity physically verified at dock.`;
      break;
    case 'PAYMENT_PENDING':
      eventType = 'PAYMENT_INITIATED';
      title = 'Payment Settlement Initiated';
      description = `Invoice generated for gross ₹${deal.gross_value.toLocaleString('en-IN')}. Escrow release triggered.`;
      break;
    case 'PAID':
      eventType = 'PAYMENT_COMPLETED';
      title = 'Simulated Escrow Payment Settled';
      description = `Net remittance of ₹${deal.net_realisation.toLocaleString('en-IN')} transferred to seller account.`;
      break;
    case 'COMPLETED':
      eventType = 'SETTLEMENT_DISTRIBUTED';
      title = 'Deal Lifecycle Fully Completed';
      description = `Final settlement confirmed. Contributor shares and facilitation fee reconciled.`;
      break;
    case 'DISPUTED':
      eventType = 'DISPUTE_RAISED';
      title = 'Dispute Raised on Transaction';
      description = `Dispute filed regarding consignment or payment parameters.`;
      break;
  }

  const newEvent = createDealEvent({
    dealId: deal.id,
    eventType,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    title,
    description,
    metadata,
  });

  return { updatedDeal, newEvent };
}
