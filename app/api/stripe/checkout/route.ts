import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { plan, email, userId } = await req.json();

    if (!plan || !email) {
      return NextResponse.json(
        { error: 'Plan and email are required' },
        { status: 400 }
      );
    }

    const priceId = plan === 'pro' 
      ? process.env.STRIPE_PRICE_PRO! 
      : process.env.STRIPE_PRICE_BASIC!;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      metadata: {
        userId: userId || '',
        plan,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}