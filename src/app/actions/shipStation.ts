import { shipStationApi } from "../utils/shipStation"
import { MenuZone, ShipStationOrder } from "../utils/types"

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
  },
  helpers: {
    getProductionTag: (shipByDate: Date, menuZone: MenuZone) => {
      const productionDate = new Date(shipByDate)
      const productionLeadHours = menuZone.production_lead_time || 0
      const timeZoneOffsetHours = 0
    
      if (productionLeadHours === 0) {
        console.error("Could not find production lead time for menu zone", menuZone)
        return
      }
    
      // Subtract the production lead time from the ship by date
      productionDate.setDate(productionDate.getDate() - ((Number(productionLeadHours) + timeZoneOffsetHours) / 24))
      const productionDay = productionDate.getDay()
      let tags: Number[] = []
    
      // console.log("Production Date", productionDate.toLocaleString())
      // console.log("shipByDate", shipByDate.toLocaleString())
    
      // Ship By Tags
      if (shipByDate.getDay() === 3) {
        tags.push(3371) // Wednesday
      }
    
      // Return the tag based on the menu zone and production date
      if (productionDay === 0) { // Sunday
        if (menuZone.handle === "edison-nj") {
          tags.push(2685, 3365) // Sunday Production (Edison, NJ)
        } else {
          tags.push(3226, 3369) // Sunday Production (Salem, NH)
        }
      } else if (productionDay === 1) { // Monday
        if (menuZone.handle === "edison-nj") {
          tags.push(2686, 3366) // Monday Production (Edison, NJ)
        } else {
          tags.push(2686, 3370) // Monday Production (Salem, NH)
        }
      } else if (productionDay === 2) { // Tuesday
        if (menuZone.handle === "edison-nj") {
          tags.push(2905, 3367) // Tuesday Production
        } else {
          tags.push(2905, 3371) // Tuesday Production
        }
      } else {
        console.log("Production Day not found", productionDay)
      }
    
      return tags
    }
  }
}