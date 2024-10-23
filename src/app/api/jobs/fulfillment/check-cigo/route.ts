/**
 * Check CIGO for jobs that are present in Shopify but not in CIGO
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import { slack } from "@/app/actions/slack"
import { delay } from "@/app/utils/helpers"

const slackWebhookUrls = JSON.parse(process.env.SLACK_WEBHOOK_URLS ?? "{}")

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const deliveryDate = searchParams.get("deliveryDate")
  const days = searchParams.get("days")

  // Get the next x days of delivery dates
  let deliveryDates = Array.from({ length: days ? parseInt(days) : 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i + 1)
    return date.toISOString().split("T")[0]
  })

  if (deliveryDate) {
    deliveryDates = [deliveryDate]
  }

  console.log("[Check CIGO] deliveryDates", deliveryDates)

  // Get all orders for all delivery dates
  const orders = await shopify.orders.list(`query: "tag:${deliveryDates.join(" OR tag:")} AND tag:delivery AND NOT tag:Subscription AND NOT financial_status:refunded"`)

  // return Response.json(orders)
  console.log("[Check CIGO] Shopify orders", orders.length)
  // Log order tags and order ids

  // Get all jobs from CIGO for the given date
  const startDate = new Date(deliveryDates[0])
  startDate.setDate(startDate.getDate() - 1)

  // Find orders that are not in CIGO
  const ordersMessages = []
  const ordersWithJobs: any[] = []
  const ordersNotInCigo: any[] = []
  const createdJobs: any[] = []

  for (const order of orders) {
    const orderDeliveryDates = await cigo.helpers.getDeliveryDates(order)
    // Filter out delivery dates that are not in the list that we are checking for
    const filteredDeliveryDates = orderDeliveryDates?.filter((date: string) => {
      return deliveryDates.includes(date)
    })

    for (const deliveryDate of filteredDeliveryDates) {
      const invoiceId = order.id?.toString().split("/").pop() + "-" + deliveryDate
      const searchParams = {
        start_date: deliveryDate,
        end_date: deliveryDate,
        invoice_number: invoiceId
      }
      console.log("[Check CIGO] searching for invoiceId", invoiceId)
      const jobSearchResults = await cigo.jobs.search(searchParams)
      // console.log("[Check CIGO] jobSearchResults", jobSearchResults)
      const job_id = jobSearchResults?.post_staging?.ids?.[0] || jobSearchResults?.in_staging?.ids?.[0]
      if (job_id) {
        ordersWithJobs.push(order)
        console.log(`[Check CIGO] order ${orders.findIndex((o: any) => o.id === order.id) + 1} of ${orders.length} - invoice:`, invoiceId)
        // Get existing metafield
        const metafields = order.metafields as any
        const existingMetafield = metafields?.edges?.find((metafield: any) => metafield.node.namespace === "cigo" && metafield.node.key === "job_ids")
        const jobIds = JSON.parse(existingMetafield?.node?.value || "[]")

        // Update the order metafield with the job id
        if (!jobIds.includes(job_id)) {
          await shopify.orders.updateMetafields({
            id: order.id,
            metafields: [{ namespace: "cigo", key: "job_ids", value: JSON.stringify([...jobIds, job_id]) }]
          })
          await delay(100)
        }
      } else {
        console.log("[Check CIGO] no job found for order", invoiceId)
        if (ordersNotInCigo.findIndex((o: any) => o.id === order.id) === -1) {
          ordersNotInCigo.push(order)
        }
      }
    }
  }

  /**
   * Create jobs for orders that are not in CIGO
   */
  for (const order of ordersNotInCigo) {
    const orderDeliveryDates = await cigo.helpers.getDeliveryDates(order)
    const orderId = order.id?.toString().split("/").pop()
    const orderNumber = order.name
    const orderUrl = `https://admin.shopify.com/store/e97e57-2/orders/${orderId}`

    console.log("[Check CIGO] missing job for order", orderNumber, orderId)

    for (const deliveryDate of orderDeliveryDates ?? []) {
      const invoiceId = `${orderId}-${deliveryDate}`
      // Create the job
      try {
        console.log(`[Check CIGO] creating job for order ${ordersNotInCigo.findIndex((o: any) => o.id === order.id) + 1} of ${ordersNotInCigo.length}`)
        const res = await cigo.helpers.createJob(order, deliveryDate)
        if (!res.success) {
          console.error(`[Check CIGO] error creating job for order ${orderNumber} with date ${deliveryDate}`)
          ordersMessages.push(`>*Order ID:* ${invoiceId}\n>*Order Number:* <${orderUrl}|${orderNumber}>\n>*Delivery Date:* ${deliveryDate}`)
        } else {
          console.log(`[Check CIGO] job created for order ${orderNumber} with date ${deliveryDate}`)
          createdJobs.push({
            orderNumber,
            invoiceId,
            deliveryDate,
            jobId: res.data.id
          })
        }
      } catch (error) {
        console.error(`[Check CIGO] error creating job for order ${orderNumber} with date ${deliveryDate}`, error)
        ordersMessages.push(`>*Order ID:* ${invoiceId}\n>*Order Number:* <${orderUrl}|${orderNumber}>\n>*Delivery Date:* ${deliveryDate}`)
      }
    }
    // If there are order messages about failling to create jobs, send them to slack
    if (ordersMessages.length > 0) {
      await slack.sendMessage({
        text: `
        [Check CIGO] Failed to create ${ordersNotInCigo.length} orders missing in CIGO for dates: ${deliveryDates.join(", ")}.
        \n\n${ordersMessages.join("\n\n")}`,
      },
        slackWebhookUrls.lastMile
      )
    }
  }

  return Response.json({
    dates: deliveryDates,
    missingOrders: ordersNotInCigo.length,
    createdJobs: createdJobs.length,
    existingJobs: ordersWithJobs.length,
    missingOrdersData: ordersNotInCigo,
    createdJobsData: createdJobs,
    existingJobsData: ordersWithJobs,
  })
}
