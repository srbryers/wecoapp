/**
 * Check fulfillment status of jobs in CIGO for a given date
 */

import { cigo } from "@/app/actions/cigo"
import { shopify } from "@/app/actions/shopify"
import { Order } from "@/app/utils/types"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const first_name = searchParams.get("first_name") || undefined
  const last_name = searchParams.get("last_name") || undefined
  const reference_id = searchParams.get("reference_id") || undefined

  if (!date) {
    return Response.json({ error: "Date is required" }, { status: 400 })
  }

  // Get all jobs for a given date
  const jobsData = await cigo.jobs.getAll(date, {
    ...(first_name && { first_name }),
    ...(last_name && { last_name }),
    ...(reference_id && { reference_id })
  })

  // return Response.json({ jobs })

  // Make sure the order is fulfilled in Shopify
  let result = {
    success: true,
    job: null,
    order: null,
    fulfillments: [] as any[],
    errors: [] as any[]
  }
  for (const jobData of jobsData) {
    const job = jobData.job
    const res = await shopify.helpers.createFulfillmentsFromJob(job)
    if (!res?.success) {
      result.errors.push(...(res?.errors || []))
    }
  }

  return Response.json(result)
}