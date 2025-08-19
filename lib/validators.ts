import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(1, 'اسم المنتج مطلوب'),
  description: z.string().optional(),
  price_cents: z.number().min(1, 'السعر يجب أن يكون أكبر من صفر'),
  sku: z.string().optional(),
  active: z.boolean().default(true),
});

export const orderSchema = z.object({
  customer_email: z.string().email('بريد إلكتروني غير صحيح'),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().min(1),
  })),
});

export const storeSchema = z.object({
  name: z.string().min(1, 'اسم المتجر مطلوب'),
  description: z.string().optional(),
});