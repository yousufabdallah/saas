import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30',
});

export const plans = {
  basic: {
    priceId: process.env.STRIPE_PRICE_BASIC!,
    price: 29,
    features: [
      'حتى 100 منتج',
      'دعم عبر البريد الإلكتروني',
      'تخزين 1GB للصور',
      'تقارير أساسية',
    ],
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    price: 79,
    features: [
      'منتجات غير محدودة',
      'دعم عبر الهاتف والبريد',
      'تخزين 10GB للصور',
      'تقارير متقدمة',
      'تحليلات مفصلة',
      'خصومات وكوبونات',
    ],
  },
};