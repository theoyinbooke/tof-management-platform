import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { fetchMutation } from 'convex/nextjs';
import { api } from '../../../../../convex/_generated/api';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await fetchMutation(api.clerk.handleUserCreated, {
          userId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || '',
          firstName: evt.data.first_name || '',
          lastName: evt.data.last_name || '',
          publicMetadata: evt.data.public_metadata || {},
        });
        break;

      case 'user.updated':
        await fetchMutation(api.clerk.handleUserUpdated, {
          userId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || '',
          firstName: evt.data.first_name || '',
          lastName: evt.data.last_name || '',
          publicMetadata: evt.data.public_metadata || {},
        });
        break;

      case 'user.deleted':
        await fetchMutation(api.clerk.handleUserDeleted, {
          userId: evt.data.id || '',
        });
        break;

      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}