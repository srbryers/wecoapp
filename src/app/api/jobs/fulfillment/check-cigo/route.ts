/**
 * Check CIGO for jobs that are present in Shopify but not in CIGO
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams
  const deliveryDate = searchParams.get("deliveryDate")

  if (!deliveryDate) {
    return Response.json({ error: "Date is required" }, { status: 400 })
  }

  const orders = await shopify.orders.list(`query: "tag:${deliveryDate} AND tag:delivery"`)

  // Get all jobs from CIGO for the given date
  const jobs = (await cigo.jobs.getAll(deliveryDate))?.map((item: any) => item.job)

  console.log("[Check CIGO] jobs", jobs.length)

  // Find orders that are not in CIGO
  const ordersNotInCigo = orders.filter((order: any) => !jobs.some((job: any) => {
    const invoiceId = order.id.toString().split("/").pop() + "-" + deliveryDate
    return job.invoices.includes(invoiceId)
  }))

  return Response.json({ missingJobs: ordersNotInCigo.length, data: ordersNotInCigo })
}