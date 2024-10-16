import { shipStationApi } from "../utils/shipStation"
import { ShipStationOrder } from "../utils/types"

export const shipStation = {
  orders: {
    get: async (params?: string) => {
      return await shipStationApi({
        method: 'GET',
        path: `orders${params || ''}`,
      })
    },
    create: async (body: ShipStationOrder) => {
      return await shipStationApi({
        method: 'POST',
        path: `orders/createorder`,
        body: body
      })
    },
    update: async (body: ShipStationOrder) => {
      return await shipStationApi({
        method: 'POST',
        path: `orders/createorder`,
        body: body
      })
    },
    delete: async (orderId: string) => {
      return await shipStationApi({
        method: 'DELETE',
        path: `orders/${orderId}`,
      })
    },
    list: async (params?: string) => {
      return await shipStationApi({
        method: 'GET',
        path: `orders/list${params || ''}`,
      })
    },
    listAll: async (params?: string) => {
      let allOrders: any[] = []
      const getAllOrders = async (page: number) => {
        console.log(`[shipStation.orders.listAll] getting page ${page}`)
        const orders = await shipStation.orders.list(`${params || ''}&page=${page}&pageSize=500`)
        // console.log(`[shipStation.orders.listAll] got page`, orders?.orders)
        if (orders?.page === orders?.pages) {
          allOrders.push(...orders?.orders)
        } else {
          allOrders.push(...orders?.orders)
          await getAllOrders(page + 1)
        }
      }
      await getAllOrders(1)
      console.log(`[shipStation.orders.listAll] got all orders`, allOrders?.length)
      return allOrders
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