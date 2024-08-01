import { shipStationApi } from "../utils/shipStation"

export const shipStation = {
  orders: {
    get: async (params?: string) => {
      return await shipStationApi({
        method: 'GET',
        path: `orders${params || ''}`,
      })
    }
  }
}