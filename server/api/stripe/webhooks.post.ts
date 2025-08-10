import { serverSupabaseServiceRole } from "#supabase/server";
import Stripe from "stripe";

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event);
  const signature = getHeader(event, "stripe-signature");

  if (!body || !signature) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing body or signature",
    });
  }

  const config = useRuntimeConfig();
  const supabase = await serverSupabaseServiceRole(event);
  const stripe = new Stripe(config.STRIPE_SECRET_KEY);

  try {
    const webhook = stripe.webhooks.constructEvent(
      body,
      signature,
      config.STRIPE_WEBHOOK_SECRET
    );

    // Handle subscription events
    if (webhook.type === "checkout.session.completed") {
      const session = webhook.data.object as Stripe.Checkout.Session;
      const { user_id, plan_id } = session.metadata || {};

      if (user_id && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subscription.status,
            stripe_subscription_id: session.subscription as string,
            plan_id: plan_id,
            subscription_end_date: subscription.items.data[0].current_period_end
              ? new Date(
                  subscription.items.data[0].current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("id", user_id);
      }

      // Handle proposal payment completion (backup for immediate payment methods)
      if (session.metadata?.proposal_id && session.payment_status === "paid") {
        const proposalId = session.metadata.proposal_id;

        // Only update if the proposal is still in payment_pending status
        const { data: proposal } = await supabase
          .from("proposals")
          .select("status")
          .eq("id", proposalId)
          .single();

        if (proposal?.status === "payment_pending") {
          await supabase
            .from("proposals")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", proposalId);

          console.log(
            `Proposal ${proposalId} payment completed via checkout.session.completed`
          );

          // Update project remaining_amount if project_id is available
          if (session.metadata?.project_id) {
            const projectId = session.metadata.project_id;

            // Get current project data
            const { data: project } = await supabase
              .from("projects")
              .select("remaining_amount, initial_price")
              .eq("id", projectId)
              .single();

            if (
              project &&
              project.remaining_amount &&
              project.remaining_amount > 0
            ) {
              // Calculate new remaining amount (subtract deposit amount)
              const proposalData = await supabase
                .from("proposals")
                .select("deposit_amount")
                .eq("id", proposalId)
                .single();

              if (proposalData.data?.deposit_amount) {
                const newRemainingAmount = Math.max(
                  0,
                  project.remaining_amount - proposalData.data.deposit_amount
                );

                await supabase
                  .from("projects")
                  .update({
                    remaining_amount: newRemainingAmount,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", projectId);

                console.log(
                  `Project ${projectId} remaining_amount updated to ${newRemainingAmount} after proposal payment (checkout.session.completed)`
                );
              }
            }
          }
        }
      }

      // Handle gallery payment completion (backup for immediate payment methods)
      if (session.metadata?.gallery_id && session.payment_status === "paid") {
        const galleryId = session.metadata.gallery_id;

        // Only update if the gallery is still in payment_pending status
        const { data: gallery } = await supabase
          .from("galleries")
          .select("status")
          .eq("id", galleryId)
          .single();

        if (gallery?.status === "payment_pending") {
          await supabase
            .from("galleries")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", galleryId);

          console.log(
            `Gallery ${galleryId} payment completed via checkout.session.completed`
          );

          // Check if project should be marked as completed
          if (session.metadata?.project_id) {
            const projectId = session.metadata.project_id;

            // Get project to check remaining_amount
            const { data: project } = await supabase
              .from("projects")
              .select("remaining_amount, status")
              .eq("id", projectId)
              .single();

            // Update remaining_amount to 0 since this is the final payment
            if (
              project &&
              project.remaining_amount &&
              project.remaining_amount > 0
            ) {
              await supabase
                .from("projects")
                .update({
                  remaining_amount: 0,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", projectId);

              console.log(
                `Project ${projectId} remaining_amount set to 0 after gallery payment (checkout.session.completed)`
              );
            }

            // If remaining_amount is 0 or null, mark project as completed
            if (
              project &&
              (project.remaining_amount === 0 ||
                project.remaining_amount === null)
            ) {
              await supabase
                .from("projects")
                .update({
                  status: "completed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", projectId);

              console.log(
                `Project ${projectId} marked as completed after gallery payment (checkout.session.completed)`
              );
            }
          }
        }
      }
    }

    if (webhook.type === "customer.subscription.updated") {
      const subscription = webhook.data.object as Stripe.Subscription;

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (userProfile) {
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subscription.status,
            subscription_end_date: subscription.items.data[0].current_period_end
              ? new Date(
                  subscription.items.data[0].current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("id", userProfile.id);
      }
    }

    if (webhook.type === "customer.subscription.deleted") {
      const subscription = webhook.data.object as Stripe.Subscription;

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (userProfile) {
        await supabase
          .from("user_profiles")
          .update({
            subscription_status: subscription.status,
            subscription_end_date: subscription.items.data[0].current_period_end
              ? new Date(
                  subscription.items.data[0].current_period_end * 1000
                ).toISOString()
              : null,
          })
          .eq("id", userProfile.id);
      }
    }

    // Handle payment intent events for proposals (PRIMARY EVENT)
    if (webhook.type === "payment_intent.succeeded") {
      const paymentIntent = webhook.data.object as Stripe.PaymentIntent;

      if (paymentIntent.metadata?.proposal_id) {
        const proposalId = paymentIntent.metadata.proposal_id;

        // Update proposal status to completed
        await supabase
          .from("proposals")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", proposalId);

        console.log(
          `Proposal ${proposalId} payment intent succeeded - marking as completed`
        );

        // Update project remaining_amount if project_id is available
        if (paymentIntent.metadata?.project_id) {
          const projectId = paymentIntent.metadata.project_id;

          // Get current project data
          const { data: project } = await supabase
            .from("projects")
            .select("remaining_amount, initial_price")
            .eq("id", projectId)
            .single();

          if (
            project &&
            project.remaining_amount &&
            project.remaining_amount > 0
          ) {
            // Calculate new remaining amount (subtract deposit amount)
            const proposal = await supabase
              .from("proposals")
              .select("deposit_amount")
              .eq("id", proposalId)
              .single();

            if (proposal.data?.deposit_amount) {
              const newRemainingAmount = Math.max(
                0,
                project.remaining_amount - proposal.data.deposit_amount
              );

              await supabase
                .from("projects")
                .update({
                  remaining_amount: newRemainingAmount,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", projectId);

              console.log(
                `Project ${projectId} remaining_amount updated to ${newRemainingAmount} after proposal payment`
              );
            }
          }
        }
      }

      // Handle gallery payment intent success
      if (paymentIntent.metadata?.gallery_id) {
        const galleryId = paymentIntent.metadata.gallery_id;

        // Update gallery status to completed
        await supabase
          .from("galleries")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", galleryId);

        console.log(
          `Gallery ${galleryId} payment intent succeeded - marking as completed`
        );

        // Check if project should be marked as completed
        if (paymentIntent.metadata?.project_id) {
          const projectId = paymentIntent.metadata.project_id;

          // Get project to check remaining_amount
          const { data: project } = await supabase
            .from("projects")
            .select("remaining_amount, status")
            .eq("id", projectId)
            .single();

          // Update remaining_amount to 0 since this is the final payment
          if (
            project &&
            project.remaining_amount &&
            project.remaining_amount > 0
          ) {
            await supabase
              .from("projects")
              .update({
                remaining_amount: 0,
                updated_at: new Date().toISOString(),
              })
              .eq("id", projectId);

            console.log(
              `Project ${projectId} remaining_amount set to 0 after gallery payment`
            );
          }

          // If remaining_amount is 0 or null, mark project as completed
          if (
            project &&
            (project.remaining_amount === 0 ||
              project.remaining_amount === null)
          ) {
            await supabase
              .from("projects")
              .update({
                status: "completed",
                updated_at: new Date().toISOString(),
              })
              .eq("id", projectId);

            console.log(
              `Project ${projectId} marked as completed after gallery payment`
            );
          }
        }
      }
    }

    if (webhook.type === "payment_intent.payment_failed") {
      const paymentIntent = webhook.data.object as Stripe.PaymentIntent;

      if (paymentIntent.metadata?.proposal_id) {
        const proposalId = paymentIntent.metadata.proposal_id;

        // Update proposal status back to awaiting_client
        await supabase
          .from("proposals")
          .update({
            status: "awaiting_client",
            updated_at: new Date().toISOString(),
          })
          .eq("id", proposalId);

        console.log(
          `Proposal ${proposalId} payment failed - reverting to awaiting_client`
        );
      }

      // Handle gallery payment intent failure
      if (paymentIntent.metadata?.gallery_id) {
        const galleryId = paymentIntent.metadata.gallery_id;

        // Update gallery status back to awaiting_client
        await supabase
          .from("galleries")
          .update({
            status: "awaiting_client",
            updated_at: new Date().toISOString(),
          })
          .eq("id", galleryId);

        console.log(
          `Gallery ${galleryId} payment failed - reverting to awaiting_client`
        );
      }
    }

    return { received: true };
  } catch (error) {
    console.error("Webhook error:", error);
    throw createError({
      statusCode: 400,
      statusMessage: "Webhook error",
    });
  }
});
