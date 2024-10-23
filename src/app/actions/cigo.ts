import { cigoApi } from "../utils/cigo"
import { delay } from "../utils/helpers"
import { Order } from "../utils/types"
import { shopify } from "./shopify"

export interface CigoJobCreate {
  date: string
  first_name: string
  last_name: string
  email: string
  phone_number: string
  mobile_number: string
  address: string
  apartment: string
  postal_code: string
  invoices: string[]
  reference_id: string
  quick_desc: string
  actions?: {
    id: string
    type: string
    description: string
    invoice_number: string
    quantity: number
  }[]
}

export interface CigoJobSearch {
  start_date: string
  end_date?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  invoice_number?: string
  quick_desc?: string
  reference_id?: string
}

export const cigo = {
  jobs: {
    search: async (data: CigoJobSearch) => {
      return await cigoApi({
        method: 'POST',
        path: `jobs/search`,
        body: data
      })
    },
    create: async (data: CigoJobCreate) => {
      return await cigoApi({
        method: 'POST',
        path: `jobs`,
        body: data
      })
    },
    update: async (id: string, data: any) => {
      return await cigoApi({
        method: 'PATCH',
        path: `jobs/id/${id}`,
        body: data
      })
    },
    get: async (id: string) => {
      return await cigoApi({
        method: 'GET',
        path: `jobs/id/${id}`
      })
    },
    delete: async (id: string) => {
      return await cigoApi({
        method: 'DELETE',
        path: `jobs/id/${id}`
      })
    },
    getAll: async (date: string, additionalParams?: any, endDate?: string) => {
      // Get the jobs for a given date
      const jobs = await cigo.jobs.search({
        start_date: date,
        end_date: endDate || date,
        ...additionalParams
      })
      const jobIds = jobs?.post_staging?.ids
      // Loop through the jobs and get the details based on the ids
      const jobsWithDetails: any[] = []

      console.log("[CIGO] jobsWithDetails", jobIds.length)

      for (const jobId of jobIds) {
        console.log(`[CIGO] getting job ${jobIds.findIndex((id: string) => id === jobId) + 1} of ${jobIds.length}`, jobId)
        const jobDetails = await cigo.jobs.get(jobId)
        jobsWithDetails.push(jobDetails)
      }
      return jobsWithDetails
    }
  },
  itineraries: {
    retrieveByDate: async (date: string) => {
      return await cigoApi({
        method: 'GET',
        path: `itineraries/date/${date}`
      })
    },
    removeJob: async (itineraryId: string, jobId: string) => {
      return await cigoApi({
        method: 'PATCH',
        path: `itineraries/id/${itineraryId}`,
        body: {
          delete_ids: [jobId]
        }
      })
    }
  },
  helpers: {
    getDeliveryDates: async (order: Order, deliveryDate?: string) => {
      const lineItems = order.lineItems?.nodes || order.line_items
      let orderDeliveryDates = lineItems?.map((item) => {
        const variantTitle = item.variant_title || item.variant?.title
        // console.log("[CIGO] variant title", variantTitle)
        // Check if variant_title is in YYYY-MM-DD format
        if (variantTitle && variantTitle?.match(/^\d{4}-\d{2}-\d{2}$/) && item.quantity !== item.nonFulfillableQuantity) {
          return variantTitle
        }
      })

      if (deliveryDate) {
        orderDeliveryDates = orderDeliveryDates?.filter((date: string | undefined) => date === deliveryDate)
      }

      // Unique the orderDeliveryDates
      const uniqueOrderDeliveryDates = orderDeliveryDates?.filter((date: string | undefined, index: number) => orderDeliveryDates?.indexOf(date) === index).filter((date: string | undefined) => date) as string[]
      return uniqueOrderDeliveryDates
    },
    convertOrderToJob: async ({
      order,
      date,
      skip_staging
    }: {
      order: Order
      date: string
      skip_staging: boolean
    }) => {
      const dropoffNotes = order.note_attributes ?
        order.note_attributes?.filter((note) => note.name.includes('Drop-off'))
        : order.customAttributes?.filter((note) => note.key.includes('Drop-off'))
      const quickDesc = dropoffNotes?.map((note, index) => {
        if (index === 0) {
          return `C:${note.value.slice(0, 1)}`
        } else if (index === 1) {
          return `DB:${note.value.slice(0, 1)}`
        } else {
          return ''
        }
      }).join(' ').trim()
      const shortOrderId = order.id?.toString().split("/").pop() ?? ""
      const address = order.shipping_address || order.billing_address || order.shippingAddress || order.billingAddress
      const fullAddress = address?.address1 ?
        `${address?.address1 ?? ""} ${address?.address2 ?? ""} ${address?.city ?? ""} ${address?.provinceCode || address?.province_code || ""} ${address?.zip?.slice(0, 5) ?? ""}`
        : `${address?.address1 ?? ""} ${address?.address2 ?? ""} ${address?.city ?? ""} ${address?.provinceCode || address?.province_code || ""} ${address?.zip?.slice(0, 5) ?? ""}`

      const data = {
        date: date,
        first_name: (address?.firstName || address?.first_name) ?? "",
        last_name: (address?.lastName || address?.last_name) ?? "",
        email: order.email ?? "",
        phone_number: (order.customer?.phone || address?.phone) ?? "",
        mobile_number: (order.customer?.phone || address?.phone) ?? "",
        address: fullAddress,
        apartment: (address?.address2) ?? "",
        postal_code: (address?.zip)?.slice(0, 5) ?? "",
        skip_staging: skip_staging ?? false,
        comment: (order.note ? order.note + "\n" : "") + (dropoffNotes?.map((note, index) => {
          if (index === 0) {
            return `Cooler: ${note.value.slice(0, 1)}\n`
          } else if (index === 1) {
            return `Doorbell: ${note.value.slice(0, 1)}\n`
          } else {
            return note.value
          }
        }).join(' ').trim() || ""),
        invoices: [
          `${shortOrderId ?? ""}-${date}`,
        ],
        reference_id: `${shortOrderId}-${date}`,
        quick_desc: quickDesc,

        actions: [
          {
            id: `${shortOrderId ?? ""}-${date}`,
            type: "Delivery",
            description: dropoffNotes?.map((note, index) => {
              if (index === 0) {
                return `C:${note.value}`
              } else if (index === 1) {
                return `DB:${note.value}`
              } else {
                return note.value
              }
            }).join(', ') || "C:N, DB:N",
            invoice_number: `${shortOrderId ?? ""}-${date}`,
            quantity: 1,
          }
        ]
      } as CigoJobCreate

      return data
    },
    createJob: async (order: Order, date: string) => {

      const data = await cigo.helpers.convertOrderToJob({ order, date, skip_staging: true })
      console.log(`[CIGO][${order.name}] creating job for order name: `, order.name, " with date: ", date)

      try {
        const job = await cigo.jobs.create(data)
        console.log(`[CIGO][${order.name}] job created`, job.job_id)
        // Add the job data to the Shopify Order Metafields
        const orderMetafields = await shopify.orders.getMetafields(order.id?.toString().split("/").pop() || "")
        const jobIds = JSON.parse(orderMetafields?.metafields?.find((metafield: any) => metafield.namespace === "cigo" && metafield.key === "job_ids")?.value || "[]")
        await shopify.orders.updateMetafields({
          id: order.id,
          metafields: [
            {
              namespace: "cigo",
              key: "job_ids",
              value: JSON.stringify(jobIds?.length > 0 ? [...jobIds, job.job_id] : [job.job_id])
            }
          ]
        }).catch((error) => {
          console.error(`[CIGO][${order.name}] error updating order metafields`, error)
        })

        return {
          success: true,
          message: "Job created",
          orderNumber: order.name,
          jobIds: jobIds,
          data: job
        }
      } catch (error) {
        console.error(`[CIGO][${order.name}] error creating job`)
        return {
          success: false,
          message: "Error creating job",
          orderNumber: order.name,
          data: error
        }
      }
    }
  }
}