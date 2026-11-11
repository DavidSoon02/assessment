import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import {
  ConfirmOrderBody,
  confirmOrder,
  CreateOrderBody,
  createOrder,
  useApiMutation,
} from '~/api';
import { OrderSummary } from '~/components';
import { discountFromSubtotal, feeFromSubtotal } from '~/lib/money';
import { CheckoutState, Order } from '~/types';
import { BuyerForm, BuyerFormValues } from './BuyerForm';
import { DiscountCodeField } from './DiscountCodeField';

function errorMessage(error: unknown): string {
  // fetch() rejects with a TypeError when the API can't be reached at all.
  if (error instanceof TypeError) {
    return 'No pudimos conectar con el servidor. Intenta de nuevo.';
  }

  // apiFetch already turns API errors into the server's message.
  return error instanceof Error && error.message
    ? error.message
    : 'No pudimos procesar tu compra. Intenta de nuevo.';
}

/**
 * Checkout flow: create the order (holds the tickets), then confirm it with
 * the buyer, then go to the confirmation page.
 *
 * `useApiMutation(confirmOrder, { id })` needs the order id when the hook is
 * called, but the id only exists after createOrder resolves. So the created
 * order is kept in state and the confirm runs in an effect on the next render,
 * once the hook has been rebuilt with that id.
 *
 * Keeping the order also means a retry after a failed confirm reuses the same
 * pending order instead of creating (and holding tickets for) a second one.
 */
export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selection = location.state as CheckoutState | null;

  const [order, setOrder] = useState<Order | null>(null);
  const [buyerToConfirm, setBuyerToConfirm] = useState<BuyerFormValues | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState<string | null>(null);

  const { mutateAsync: create, isPending: isCreating } = useApiMutation<
    Order,
    Record<string, never>,
    CreateOrderBody
  >(createOrder);

  const confirmArgs = useMemo(() => ({ id: order?.id ?? '' }), [order]);
  const { mutate: confirm, isPending: isConfirming } = useApiMutation<
    Order,
    { id: string },
    ConfirmOrderBody
  >(confirmOrder, confirmArgs, {
    onSuccess: (confirmed) => {
      navigate(`/orders/${confirmed.id}`, { replace: true });
    },
    onError: (error) => setApiError(errorMessage(error)),
  });

  useEffect(() => {
    if (!order || !buyerToConfirm) return;

    setBuyerToConfirm(null);
    confirm(buyerToConfirm);
  }, [order, buyerToConfirm, confirm]);

  if (!selection?.items.length) {
    return <Navigate to="/" replace />;
  }

  // Preview only: the API recomputes these, and the confirmation page shows
  // the server's numbers. The fee is charged on the discounted subtotal.
  const subtotalCents = selection.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const discountCents = discountFromSubtotal(subtotalCents, discountCode);
  const feeCents = feeFromSubtotal(subtotalCents - discountCents);
  const totalCents = subtotalCents - discountCents + feeCents;

  const onSubmit = async (buyer: BuyerFormValues) => {
    setApiError(null);

    if (order) {
      setBuyerToConfirm(buyer);
      return;
    }

    try {
      const created = await create({
        eventId: selection.eventId,
        items: selection.items.map(({ ticketTypeId, quantity }) => ({
          ticketTypeId,
          quantity,
        })),
        ...(discountCode ? { discountCode } : {}),
      });

      setOrder(created);
      setBuyerToConfirm(buyer);
    } catch (error) {
      setApiError(errorMessage(error));
    }
  };

  const isSubmitting = isCreating || isConfirming || buyerToConfirm !== null;

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_280px]">
      <section className="rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <Link
          to={`/events/${selection.eventId}`}
          className="text-sm text-ink/60"
        >
          ← Volver al evento
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Tus datos
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Completa el checkout para <strong>{selection.eventTitle}</strong>.
        </p>
        <BuyerForm
          onSubmit={onSubmit}
          submitting={isSubmitting}
          error={apiError}
        />
      </section>
      <aside className="h-max rounded-2xl bg-white p-5 ring-1 ring-black/5">
        <h2 className="font-semibold">Resumen</h2>
        <p className="mt-1 text-sm text-ink/60">{selection.eventTitle}</p>
        <div className="mt-4">
          <OrderSummary
            items={selection.items}
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            discountCode={discountCode}
            feeCents={feeCents}
            totalCents={totalCents}
          />
        </div>
        {/* Locked once the order exists: a retry reuses it with its code. */}
        <DiscountCodeField
          value={discountCode}
          onChange={setDiscountCode}
          disabled={order !== null || isSubmitting}
        />
      </aside>
    </main>
  );
}
