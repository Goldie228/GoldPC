import { delay, http, HttpResponse } from 'msw';

let wishlistItems: string[] = [];

export const userFeaturesHandlers = [
  http.get('/api/v1/wishlist', async () => {
    await delay(50);
    return HttpResponse.json({ data: wishlistItems });
  }),

  http.post('/api/v1/wishlist/:productId', async ({ params }) => {
    await delay(50);
    const productId = String(params.productId ?? '');
    if (!wishlistItems.includes(productId)) {
      wishlistItems.push(productId);
    }
    return HttpResponse.json({ message: 'ok' });
  }),

  http.delete('/api/v1/wishlist/:productId', async ({ params }) => {
    await delay(50);
    const productId = String(params.productId ?? '');
    wishlistItems = wishlistItems.filter((id) => id !== productId);
    return HttpResponse.json({ message: 'ok' });
  }),

  http.put('/api/v1/wishlist/sync', async ({ request }) => {
    await delay(50);
    const payload = (await request.json()) as string[];
    wishlistItems = Array.isArray(payload) ? [...new Set(payload)] : wishlistItems;
    return HttpResponse.json({ data: wishlistItems });
  }),

  http.post('/api/v1/orders/delivery/quote', async ({ request }) => {
    await delay(60);
    const body = (await request.json()) as { deliveryMethod?: 'Pickup' | 'Delivery'; subtotal?: number; city?: string };
    const subtotal = typeof body.subtotal === 'number' ? body.subtotal : 0;
    const city = (body.city ?? '').toLowerCase();
    const deliveryMethod = body.deliveryMethod ?? 'Delivery';
    const deliveryCost =
      deliveryMethod === 'Pickup'
        ? 0
        : subtotal >= 1500
          ? 0
          : city === 'минск' || city === 'minsk'
            ? 10
            : 20;

    return HttpResponse.json({
      data: {
        subtotal,
        deliveryCost,
        total: subtotal + deliveryCost,
      },
    });
  }),

  http.post('/api/v1/orders', async ({ request }) => {
    await delay(1000);
    const body = (await request.json()) as any;
    
    // Генерируем фейковый заказ
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    return HttpResponse.json({
      data: {
        id: crypto.randomUUID(),
        orderNumber,
        customerFirstName: body.firstName,
        customerLastName: body.lastName,
        customerEmail: body.email,
        customerPhone: body.phone,
        status: 'New',
        total: body.items.reduce((acc: number, item: any) => acc + item.unitPrice * item.quantity, 0) + (body.deliveryMethod === 'Delivery' ? 10 : 0),
        items: body.items.map((item: any) => ({
          ...item,
          id: crypto.randomUUID(),
          totalPrice: item.unitPrice * item.quantity
        })),
        createdAt: new Date().toISOString()
      },
      success: true
    });
  }),

  http.get('/api/v1/orders/number/:orderNumber', async ({ params }) => {
    await delay(100);
    return HttpResponse.json({
      data: {
        orderNumber: params.orderNumber,
        customerEmail: 'customer@example.com',
        status: 'New',
        total: 1185.36,
        createdAt: new Date().toISOString(),
        items: []
      },
      success: true
    });
  }),
];
