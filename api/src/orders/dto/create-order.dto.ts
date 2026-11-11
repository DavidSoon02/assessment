import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsString()
  ticketTypeId: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un entero' })
  @Min(1, { message: 'Debes seleccionar al menos una entrada' })
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  eventId: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1, { message: 'Debes seleccionar al menos una localidad' })
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  discountCode?: string;
}
