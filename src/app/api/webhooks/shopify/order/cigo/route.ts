import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import { delay } from "@/app/utils/helpers"
import { Order } from "@/app/utils/types"
import crypto from "node:crypto"

export async function POST(req: Request) {
  const body = await req.text()


  // Validate shopify hmac
  const hmac = req.headers.get("X-Shopify-Hmac-Sha256")
  if (!hmac) {
    return Response.json({ success: false, error: "Shopify HMAC not set" }, { status: 401 })
  }
  const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET_ORDERS_UPDATED
  if (!shopifyWebhookSecret) {
    return Response.json({ success: false, error: "Shopify webhook secret not set" }, { status: 500 })
  }
  // Generate HMAC from secret and request body
  const generatedHmac = crypto.createHmac('sha256', shopifyWebhookSecret).update(body).digest('base64')

  // Compare hmacs
  const result = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(generatedHmac))
  const payload = JSON.parse(body)
  console.log(`[${payload.name}] HMAC comparison result:`, result)

  // console.log("payload", JSON.stringify(payload))

  // Return if HMAC is invalid
  if (!result) {
    return Response.json({ success: false, error: "Invalid HMAC" }, { status: 401 })
  }

  // Get the order from Shopify
  let res: any[] = []
  await delay(2000) // Wait for 2 seconds to make sure the order is updated
  const order = payload as Order
  const now = new Date()
  const orderLastUpdated = new Date(order.updated_at || order.updatedAt || "")
  const orderFulfillmentStatus = order.fulfillment_status
  const orderStatus = order.status
  const isPickup = order.tags?.includes("pickup") ?? false
  const isSubscription = order.note_attributes?.some((attribute) => attribute.name.toLowerCase().includes("delivery date")) ?? false

  // Check if order has been updated in the last 24hrs
  if (isSubscription) {
    console.log(`[${order.name}] Order is a subscription order`)
    return Response.json({ success: true, updated: true, addedToCigo: false, res: res, order: order })
  } else if (isPickup) {
    console.log(`[${order.name}] Order is a pickup order`)
    return Response.json({ success: true, updated: true, addedToCigo: false, res: res, order: order })
  } else if (orderLastUpdated.getTime() > (now.getTime() - (24 * 60 * 60 * 1000)) && orderFulfillmentStatus !== "fulfilled" && orderStatus !== "refunded") {
    console.log(`[${order.name}] Order has been updated in the last 24hrs and is not fulfilled and paid`)
    // Add/update the job in CIGO
    // Check if the order has been sent to CIGO
    let existingJobs = []
    const deliveryDates = await cigo.helpers.getDeliveryDates(order)
    // console.log("[CIGO] delivery dates", deliveryDates)
    for (const date of deliveryDates ?? []) {
      // Check if delivery date is before today, if so, we don't want to create a new job
      const deliveryDate = new Date(date)
      if (deliveryDate < now) {
        console.log("[CIGO] delivery date of ", date, " is before today, skipping")
        continue
      }
      const existingJob = await cigo.jobs.search({
        start_date: date,
        invoice_number: `${order.id}-${date}`
      })
      if (existingJob?.post_staging?.count > 0) {
        console.log("[CIGO] job already exists for order name: ", order.name, " with date: ", date)
        existingJobs.push(existingJob?.post_staging?.ids)
      } else {
        console.log("[CIGO] job does not exist for order name: ", order.name, " with date: ", date)
        const data = await cigo.helpers.convertOrderToJob({ order, date, skip_staging: true })
        console.log("[CIGO] creating job for order name: ", order.name, " with date: ", date)
        const job = await cigo.jobs.create(data)
        res.push({ created: job })
      }
    }
    existingJobs = existingJobs.flat()
    console.log("[CIGO] existing jobs", existingJobs)
    // Now update existing jobs with any new job details
    for (const jobId of existingJobs) {
      // Get the job from CIGO
      const jobData = (await cigo.jobs.get(jobId))?.job
      if (jobData) {
        const date = jobData.date
        const jobOrderData = await cigo.helpers.convertOrderToJob({ order, date, skip_staging: true })
        const existingJobData = {
          quick_desc: jobData.quick_desc || "",
          first_name: jobData.first_name || "",
          last_name: jobData.last_name || "",
          phone_number: jobData.phone_number || "",
          mobile_number: jobData.mobile_number || "",
          email: jobData.email || "",
          apartment: jobData.apartment || "",
        }
        const updateJobRequest = {
          quick_desc: jobOrderData.quick_desc,
          first_name: jobOrderData.first_name,
          last_name: jobOrderData.last_name,
          phone_number: jobOrderData.phone_number,
          mobile_number: jobOrderData.mobile_number,
          email: jobOrderData.email,
          apartment: jobOrderData.apartment,
        }

        if (JSON.stringify(existingJobData) !== JSON.stringify(updateJobRequest)) {
          console.log("[CIGO] job data has changed, updating job")
          const updatedJob = await cigo.jobs.update(jobId, updateJobRequest)
          console.log("[CIGO] updated job for order name: ", order.name, " with date: ", date)
          res.push({ updated: true, job: updatedJob })
        } else {
          console.log("[CIGO] job data has not changed, skipping update")
        }

      }
    }
    // const job = await cigo.jobs.create()
    //Send update to SNOMS
    // const res = await fetch("https://snoms.wecohospitality.com/wh/shopify/", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Shopify-Hmac-Sha256": hmac,
    //     "X-Shopify-Topic": "orders/updated"
    //   },
    //   body: JSON.stringify(payload),
    // })
    // console.log(`[${order.name}] sent to SNOMS - status:`, res.status)
    return Response.json({ success: true, updated: true, addedToCigo: true, res: res, order: order })
  } else {
    console.log(`[${order.name}] Order has not been updated in the last 24hrs or is fulfilled already`)
    return Response.json({ success: true, updated: false, addedToCigo: false, res: res, order: order })
  }
}