import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { api } from '../../../../../convex/_generated/api';
import { fetchMutation } from 'convex/nextjs';

export async function POST(req: Request) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET environment variable');
  }

  // Get headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create new Svix instance with webhook secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  // Handle user creation
  if (eventType === 'user.created') {
    try {
      await fetchMutation(api.auth.storeUser, {
        clerkId: id!,
        email: evt.data.email_addresses[0]?.email_address || '',
        firstName: evt.data.first_name || '',
        lastName: evt.data.last_name || '',
        imageUrl: evt.data.image_url,
      });

      console.log(`✅ User ${id} created in Convex`);
    } catch (error) {
      console.error(`❌ Failed to create user ${id} in Convex:`, error);
      return new Response('Failed to create user in Convex', {
        status: 500,
      });
    }
  }

  // Handle user updates
  if (eventType === 'user.updated') {
    try {
      await fetchMutation(api.auth.storeUser, {
        clerkId: id!,
        email: evt.data.email_addresses[0]?.email_address || '',
        firstName: evt.data.first_name || '',
        lastName: evt.data.last_name || '',
        imageUrl: evt.data.image_url,
      });

      console.log(`✅ User ${id} updated in Convex`);
    } catch (error) {
      console.error(`❌ Failed to update user ${id} in Convex:`, error);
      return new Response('Failed to update user in Convex', {
        status: 500,
      });
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    try {
      await fetchMutation(api.auth.deleteUser, {
        clerkId: id!,
      });

      console.log(`✅ User ${id} deleted/deactivated in Convex`);
    } catch (error) {
      console.error(`❌ Failed to delete user ${id} in Convex:`, error);
      return new Response('Failed to delete user in Convex', {
        status: 500,
      });
    }
  }

  return new Response('Webhook processed successfully', { status: 200 });
}