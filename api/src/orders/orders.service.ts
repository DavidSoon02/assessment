import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { APP_STORE } from '../store/store.constants';
import { AppStore, Order } from '../store/store';

/** Service fee applied on top of the ticket subtotal. */
export const SERVICE_FEE_PERCENT = 10;

/**
 * Shape rules for the requested items (400), checked before touching the
 * store. The DTO already validates this over HTTP; repeating it here keeps
 * the service safe when it is called directly.
 */
function assertValidItems(items: CreateOrderDto['items']): void {
  if (!Array.isArray(items) || items.length === 0) {
    throw new BadRequestException('Debes seleccionar al menos una localidad');
  }

  const seen = new Set<string>();

  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new BadRequestException(
        'La cantidad debe ser un entero mayor o igual a 1',
      );
    }

    if (seen.has(item.ticketTypeId)) {
      throw new BadRequestException(
        `La localidad ${item.ticketTypeId} está repetida en la orden`,
      );
    }

    seen.add(item.ticketTypeId);
  }
}

@Injectable()
export class OrdersService {
  constructor(@Inject(APP_STORE) private readonly store: AppStore) {}

  /**
   * Creates a pending order and holds inventory.
   *
   * The implementation below is intentionally incomplete: the UI can still
   * create orders, but several product rules are missing. See README.md and
   * orders.service.spec.ts.
   */
  create(dto: CreateOrderDto): Order {
    assertValidItems(dto.items);

    const event = this.store.events.find((item) => item.id === dto.eventId);

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    const items = dto.items.map((line) => {
      const ticketType = event.ticketTypes.find(
        (type) => type.id === line.ticketTypeId,
      );

      if (!ticketType) {
        throw new NotFoundException('Localidad no encontrada');
      }

      // TODO: reject quantity > remaining and quantity > maxPerOrder
      // TODO: decrement ticketType.remaining

      return {
        ticketTypeId: ticketType.id,
        name: ticketType.name,
        quantity: line.quantity,
        unitPriceCents: ticketType.priceCents,
        lineTotalCents: ticketType.priceCents * line.quantity,
      };
    });

    const subtotalCents = items.reduce(
      (sum, item) => sum + item.lineTotalCents,
      0,
    );

    // TODO: feeCents should be SERVICE_FEE_PERCENT of subtotalCents, rounded
    const feeCents = 0;

    const order: Order = {
      id: `ord_${randomUUID()}`,
      eventId: event.id,
      status: 'pending',
      items,
      subtotalCents,
      feeCents,
      totalCents: subtotalCents + feeCents,
      buyer: null,
      createdAt: new Date().toISOString(),
    };

    this.store.orders.set(order.id, order);
    return order;
  }

  findById(id: string): Order {
    const order = this.store.orders.get(id);

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  confirm(id: string, dto: ConfirmOrderDto): Order {
    const order = this.findById(id);

    // TODO: reject when the order is not pending

    order.status = 'confirmed';
    order.buyer = { name: dto.name, email: dto.email };
    return order;
  }
}
