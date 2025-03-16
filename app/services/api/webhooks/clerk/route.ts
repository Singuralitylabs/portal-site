import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { addNewUser } from "@/app/services/api/user";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not set", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id: clerkId, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses[0]?.email_address;

    if (!email) {
      console.error("No email address found for user");
      return new Response("No email address found", { status: 400 });
    }

    const displayName =
      first_name && last_name ? `${last_name} ${first_name}` : first_name || email.split("@")[0];

    try {
      const { error } = await addNewUser({ clerkId, email, displayName });

      if (error) {
        console.error("Error inserting user to Supabase:", error);
        return new Response("Error inserting user", { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  } else if (eventType === "user.updated") {
    // ユーザー情報更新の処理をここに追加
    // ...
  } else if (eventType === "user.deleted") {
    // ユーザー削除の処理をここに追加
    // ...
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
