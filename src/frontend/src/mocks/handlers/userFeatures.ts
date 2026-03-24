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
];
