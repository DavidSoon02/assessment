import { Link, useParams } from 'react-router';
import { eventById, orderById, useApiQuery } from '~/api';
import { OrderSummary } from '~/components';
import { formatEventWhen } from '~/lib/datetime';
import { formatUsd } from '~/lib/money';
import { EventRecord, Order } from '~/types';

/**
 * Receipt for a confirmed order. Amounts come from the API's order, not from
 * the checkout preview, so this shows exactly what was charged.
 */
export function ConfirmationPage() {
  const { orderId = '' } = useParams();
  const {
    data: order,
    isPending,
    isError,
  } = useApiQuery<Order>(
    orderById,
    { id: orderId },
    { enabled: Boolean(orderId) },
  );
  // Only for the title/venue; the receipt still renders if this fails.
  const { data: event } = useApiQuery<EventRecord>(
    eventById,
    { id: order?.eventId ?? '' },
    { enabled: Boolean(order?.eventId) },
  );

  if (isPending) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-ink/60">
        Cargando tu orden…
      </main>
    );
  }

  if (isError || !order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>No encontramos esta orden.</p>
        <Link to="/" className="mt-3 inline-block text-accent">
          Volver a eventos
        </Link>
      </main>
    );
  }

  const isConfirmed = order.status === 'confirmed';

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-wide text-accent">
          {isConfirmed ? 'Compra confirmada' : 'Orden pendiente'}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {isConfirmed ? '¡Gracias por tu compra!' : 'Tu orden aún no está confirmada'}
        </h1>
        {isConfirmed && order.buyer && (
          <p className="mt-3 text-ink/70">
            Enviaremos tus entradas a <strong>{order.buyer.email}</strong>.
          </p>
        )}
      </div>

      <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-black/5">
        <h2 className="font-semibold">{event?.title ?? 'Tu evento'}</h2>
        {event && (
          <p className="mt-1 text-sm text-ink/60">
            {event.venue} · {formatEventWhen(event.startsAt)}
          </p>
        )}

        <dl className="mt-4 space-y-1 border-b border-black/10 pb-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink/60">Orden</dt>
            <dd className="truncate font-mono text-xs leading-5">{order.id}</dd>
          </div>
          {order.buyer && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Nombre</dt>
                <dd>{order.buyer.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/60">Correo</dt>
                <dd className="truncate">{order.buyer.email}</dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-4">
          <OrderSummary
            items={order.items}
            subtotalCents={order.subtotalCents}
            discountCents={order.discountCents}
            discountCode={order.discountCode}
            feeCents={order.feeCents}
            totalCents={order.totalCents}
          />
        </div>

        {isConfirmed && (
          <p className="mt-4 rounded-xl bg-paper px-4 py-3 text-center text-sm">
            Total pagado: <strong>{formatUsd(order.totalCents)}</strong>
          </p>
        )}
      </section>

      <div className="mt-8 text-center">
        <Link to="/" className="text-accent">
          Volver a eventos
        </Link>
      </div>
    </main>
  );
}
