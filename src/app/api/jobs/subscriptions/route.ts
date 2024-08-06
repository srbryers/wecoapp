import { subscriptions } from "@/app/actions/subscriptions"
import { delay } from "@/app/utils/helpers"

const actions = {
  sendUpcomingSubscriptionEmail: async (days?: number) => {
    let result = []
    // Get all upcoming subscriptions
    const upcomingSubscriptions = (await subscriptions.getUpcomingSubscriptions({
      days: days
    }))
    console.log("upcomingSubscriptions", upcomingSubscriptions?.length)
    
    // Loop through the upcoming subscriptions and trigger the email in Klaviyo
    for (const subscription of upcomingSubscriptions) {
      console.info("Sending upcoming subscription email to customer:", subscription?.lastOrder?.email)
      await delay(200)
      result.push(await subscriptions.actions.sendUpcomingSubscriptionEmail(subscription))
    }
    return result
  },
}

export async function POST(request: Request) {
  
  const json = await request.json()
  let result;

  if (!json.action) {
    Response.json({ "error": "Please provide a valid action" }, { status: 400 })
  }

  switch (json.action) {
    case 'sendUpcomingSubscriptionEmail':
      /**
       * Send upcoming subscription emails to customers
       * - Fired by a scheduled job every day at 4:00am EST in Cloud Scheduler
       */
      result = await actions.sendUpcomingSubscriptionEmail(json?.params?.days)
      return Response.json(result, { status: 200 })
    
    default: 
      Response.json({ "error": "Could not find the provided action" }, { status: 404 })
  }

}