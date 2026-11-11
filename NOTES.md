# Notas

## Backend (`api/src/orders`)

Implementé todas las reglas del README en `orders.service.ts`. Preferí sacarlas a funciones pequeñas para que cada regla se lea por separado y no quede todo amontonado en `create()`.

- **404:** si el evento o el tipo de entrada no existen, o si intentas confirmar una orden que no existe.
- **400 por cómo viene el pedido** (`assertValidItems`): sin items, cantidades que no son enteros positivos o un `ticketTypeId` repetido. Sé que el DTO ya revisa casi todo esto por HTTP, pero lo repetí en el service porque las pruebas lo llaman directo y porque no me gustaba que la regla dependiera de que alguien pasara antes por el pipe.
- **400 por inventario** (`assertAvailable`): localidad agotada, más entradas de las que quedan o más del tope por orden. 
- **Nada a medias:** primero reviso todas las líneas y recién después descuento `remaining`. Así, si la segunda línea falla, no queda la primera apartada sin orden. Como todo corre síncrono en un solo proceso, no hay forma de que otro request se cuele entre la validación y el descuento.
- **Dinero:** todo en centavos enteros. Para el cargo uso `Math.round(subtotal * 10 / 100)`. Multiplico antes de dividir a propósito, para no pasar por `0.1`, que en binario no es exacto.
- **Confirmar:** solo funciona si la orden sigue `pending`; si ya estaba confirmada, devuelve 400. El nombre y el correo también los valido en el service, y ahí aproveché para rechazar nombres que son solo espacios, que el `@IsNotEmpty` del DTO deja pasar.

`pnpm test` pasa completo: las 13 pruebas originales 

## Frontend (`web/src`)

Traté de no inventar nada nuevo: seguí la misma estructura (una carpeta por componente con su `index.ts`), usé `useApiQuery` y `useApiMutation` con los endpoints que ya estaban y los mismos estilos de Tailwind.

- **`OrderSummary`:** el resumen con las entradas, el subtotal, el descuento, el cargo y el total. Lo reutilizo en dos lugares: en el checkout como vista previa y en la confirmación con los montos que devolvió la API, sin recalcular nada.
- **`BuyerForm`:** el formulario de nombre y correo con react-hook-form y Yup. El tipo de los datos sale directamente del esquema, así no se pueden desalinear. Si la API devuelve un error (por ejemplo, que se agotaron las entradas), aparece justo encima del botón de pagar.
- **`CheckoutPage`:** aquí me encontré con el detalle más interesante de la prueba. `useApiMutation(confirmOrder, { id })` necesita el `id` de la orden al momento de llamar el hook, pero ese `id` no existe hasta que la orden se crea. Lo resolví guardando la orden en el estado y confirmándola en el render siguiente, sin tener que tocar el hook ni los endpoints. Un efecto secundario que me gustó: si la confirmación falla y la persona vuelve a intentar, se reutiliza la misma orden en lugar de crear otra que aparte entradas de nuevo.
- **`ConfirmationPage`:** carga la orden real desde la API y muestra el comprobante. Contemplé los casos en que todavía está cargando, cuando la orden no existe y cuando alguien abre el enlace de una orden que aún no está confirmada.

## Extra: código `SAVE10`

Elegí este extra porque toca las dos partes del proyecto y tiene una regla de dinero fácil de equivocar.

- La API acepta un `discountCode` opcional. No importa si viene en minúsculas o con espacios; si el código no existe, devuelve 400. Lo valido **antes** de descontar inventario, para que un código mal escrito no deje entradas apartadas.
- El descuento es el 10% del subtotal, y el cargo se calcula sobre el subtotal ya descontado. Por ejemplo: $50.00 − $5.00 de descuento + $4.50 de cargo = $49.50.
- En el checkout, el código se aplica desde el resumen y la vista previa se actualiza al instante. Una vez creada la orden, el campo se bloquea para que lo que se muestra no deje de coincidir con lo que se cobra.
