import { Navigate, useLocation } from 'react-router';
import { OrderSummary } from '~/components';
import { feeFromSubtotal } from '~/lib/money';
import { CheckoutState } from '~/types';

/**
 * TODO (frontend)
 *
 * Wire this page up. You already receive the selected tickets in
 * `location.state` (see CheckoutState).
 *
 * 1. Validate name + email with react-hook-form (Yup is already a dependency).
 * 2. Show a summary with the same 10% fee as the event page (`feeFromSubtotal`).
 * 3. On submit: useApiMutation with `createOrder`, then `confirmOrder`.
 * 4. Surface API errors (sold out, validation) and a submitting state.
 *
 * Suggested route after success: `/orders/:orderId`
 *
 *   const { mutateAsync: create } = useApiMutation<Order, Record<string, never>, CreateOrderBody>(createOrder);
 *   const { mutateAsync: confirm } = useApiMutation<Order, { id: string }, ConfirmOrderBody>(confirmOrder, { id });
 */
export function CheckoutPage() {
  const location = useLocation();
  const selection = location.state as CheckoutState | null;

  if (!selection?.items.length) {
    return <Navigate to="/" replace />;
  }

  // Preview only: the API recomputes these, and the confirmation page shows
  // the server's numbers. Same rule as EventDetailPage.
  const subtotalCents = selection.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const feeCents = feeFromSubtotal(subtotalCents);
  const totalCents = subtotalCents + feeCents;

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_280px]">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h1 className="text-2xl font-semibold tracking-tight">Tus datos</h1>
        <p className="mt-2 text-sm text-ink/70">
          Completa el checkout para <strong>{selection.eventTitle}</strong>.
          Esta pantalla es tuya: el formulario todavía no envía nada.
        </p>
        <p className="mt-8 rounded-xl bg-paper px-4 py-3 text-sm text-ink/70">
          Implementa el formulario aquí. Revisa <code>README.md</code>,{' '}
          <code>useApiMutation</code> y los endpoints en <code>~/api</code>.
        </p>
      </section>
      <aside className="h-max rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="font-semibold">Resumen</h2>
        <p className="mt-1 text-sm text-ink/60">{selection.eventTitle}</p>
        <div className="mt-4">
          <OrderSummary
            items={selection.items}
            subtotalCents={subtotalCents}
            feeCents={feeCents}
            totalCents={totalCents}
          />
        </div>
      </aside>
    </main>
  );
}
