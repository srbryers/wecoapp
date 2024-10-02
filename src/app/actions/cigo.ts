import { cigoApi } from "../utils/cigo"

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
    }
  }
}