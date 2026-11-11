import { formatUsd } from '~/lib/money';
import { OrderItem } from '~/types';

export type OrderSummaryLine = Pick<
  OrderItem,
  'ticketTypeId' | 'name' | 'quantity' | 'unitPriceCents'
>;

export type OrderSummaryProps = {
  items: OrderSummaryLine[];
  subtotalCents: number;
  feeCents: number;
  totalCents: number;
};

/**
 * Ticket lines plus subtotal, service fee and total. Amounts are passed in
 * (not recomputed) so the confirmation can show exactly what the API charged.
 */
export function OrderSummary({
  items,
  subtotalCents,
  feeCents,
  totalCents,
}: OrderSummaryProps) {
  return (
    <div className="text-sm">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.ticketTypeId} className="flex justify-between gap-4">
            <span>
              {item.quantity} × {item.name}
              <span className="block text-xs text-ink/60">
                {formatUsd(item.unitPriceCents)} c/u
              </span>
            </span>
            <span className="tabular-nums">
              {formatUsd(item.unitPriceCents * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 border-t border-black/10 pt-4">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatUsd(subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Cargo por servicio</dt>
          <dd className="tabular-nums">{formatUsd(feeCents)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatUsd(totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
