import { cigoApi } from "../utils/cigo"
import { Order } from "../utils/types"

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

export const cigo = {
  jobs: {
    search: async (data: any) => {
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
        method: 'PUT',
        path: `jobs/${id}`,
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
        path: `jobs/${id}`
      })
    },
  },
  helpers: {
    convertOrderToJob: async ({
      order,
      date,
      skip_staging
    }: {
      order: Order
      date: string
      skip_staging: boolean
    }) => {
      const dropoffNotes = order.customAttributes?.filter((note) => note.key.includes('Drop-off'))
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
      const fullAddress = order.shippingAddress?.address1 ?
        `${order.shippingAddress?.address1 ?? ""} ${order.shippingAddress?.address2 ?? ""} ${order.shippingAddress?.city ?? ""} ${order.shippingAddress?.provinceCode ?? ""} ${order.shippingAddress?.zip?.slice(0, 5) ?? ""}`
        : `${order.billingAddress?.address1 ?? ""} ${order.billingAddress?.address2 ?? ""} ${order.billingAddress?.city ?? ""} ${order.billingAddress?.provinceCode ?? ""} ${order.billingAddress?.zip?.slice(0, 5) ?? ""}`

      const data = {
        date: date,
        first_name: (order.shippingAddress?.firstName || order.billingAddress?.firstName) ?? "",
        last_name: (order.shippingAddress?.lastName || order.billingAddress?.lastName) ?? "",
        email: order.email ?? "",
        phone_number: (order.customer?.phone || order.shippingAddress?.phone || order.billingAddress?.phone) ?? "",
        mobile_number: (order.customer?.phone || order.shippingAddress?.phone || order.billingAddress?.phone) ?? "",
        address: fullAddress,
        apartment: (order.shippingAddress?.address2 || order.billingAddress?.address2) ?? "",
        postal_code: (order.shippingAddress?.zip || order.billingAddress?.zip)?.slice(0, 5) ?? "",
        skip_staging: skip_staging ?? false,
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
    }
  }
}