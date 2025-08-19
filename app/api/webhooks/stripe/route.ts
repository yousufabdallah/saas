import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateStoreSlug } from '@/lib/tenancy';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createServerSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'basic';
        const customerId = session.customer as string;

        if (userId) {
          // Check if user already has a store
          const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('owner_user_id', userId)
            .single();

          if (!existingStore) {
            // Generate unique slug
            const slug = generateStoreSlug('store');
            
            // Create new store
            const { data: store, error: storeError } = await supabase
              .from('stores')
              .insert({
                name: `متجر ${slug}`,
                slug,
                owner_user_id: userId,
                stripe_customer_id: customerId,
                plan,
                active: true,
              })
              .select()
              .single();

            if (storeError) {
              console.error('Error creating store:', storeError);
              break;
            }

            // Add owner to store members
            await supabase.from('store_members').insert({
              store_id: store.id,
              user_id: userId,
              role: 'owner',
            });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = subscription.status === 'active';
        
        // Update store subscription details
        await supabase
          .from('stores')
          .update({
            stripe_subscription_id: subscription.id,
            active: isActive,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Deactivate store
        await supabase
          .from('stores')
          .update({ active: false })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}