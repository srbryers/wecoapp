import { shipStationApi } from "../utils/shipStation"

export const shipStation = {
  orders: {
    get: async (params?: string) => {
      return await shipStationApi({
        method: 'GET',
        path: `orders${params || ''}`,
      })
    },
    update: async (body: any) => {
      return await shipStationApi({
        method: 'POST',
        path: `orders/createorder`,
        body: body
      })
    }
  },
  tags: {
    get: async (params?: string) => {
      return await shipStationApi({
        method: 'GET',
        path: `accounts/listtags${params || ''}`,
      })
    }
  }
}