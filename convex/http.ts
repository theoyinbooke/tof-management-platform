import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// Clerk webhook endpoint
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    // If there are no Svix headers, error out
    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("No svix headers", { status: 400 });
    }

    // Get the body
    const payload = await request.text();

    // Create a new Webhook instance with your webhook secret
    const wh = new Webhook(webhookSecret);

    let evt: any;

    // Verify the webhook signature
    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook verification failed", { status: 400 });
    }

    // Handle the webhook
    const eventType = evt.type;
    
    switch (eventType) {
      case "user.created":
      case "user.updated": {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        
        if (!email_addresses || email_addresses.length === 0) {
          return new Response("No email address", { status: 400 });
        }

        await ctx.runMutation(api.auth.storeUser, {
          clerkId: id,
          email: email_addresses[0].email_address,
          firstName: first_name || "Unknown",
          lastName: last_name || "User",
          imageUrl: image_url,
        });
        
        break;
      }
      
      case "user.deleted": {
        const { id } = evt.data;
        
        await ctx.runMutation(api.auth.deleteUser, {
          clerkId: id,
        });
        
        break;
      }
      
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }

    return new Response("Webhook processed", { status: 200 });
  }),
});

export default http;