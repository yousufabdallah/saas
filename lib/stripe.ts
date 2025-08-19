import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-07-30.basil',
});

export const plans = {
  basic: {
    priceId: process.env.STRIPE_PRICE_BASIC || 'price_placeholder_basic',
    price: 29,
    features: [
      'حتى 100 منتج',
      'دعم عبر البريد الإلكتروني',
      'تخزين 1GB للصور',
      'تقارير أساسية',
    ],
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO || 'price_placeholder_pro',
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