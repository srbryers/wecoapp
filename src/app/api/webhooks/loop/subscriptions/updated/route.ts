export async function POST(request: Request) {
  const json = await request.json()
  let result

  /**
   * Update the delivery date for a subscription
   * - Fired from a Loop Webhooks
   */

  console.log("Update Subscription Delivery Date", JSON.stringify(json))

  return Response.json(json, { status: 200})
}