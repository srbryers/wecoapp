import { loopApi } from "../utils/loop"

export interface LoopCustomer {
  id: number
  shopifyId: number
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  activeSubscriptionsCount: number
  pausedSubscriptionsCount: number
  cancelledSubscriptionsCount: number
  expiredSubscriptionsCount: number
  allSubscriptionsCount: number
}

export const loop = {
  customers: {
    getAll: async (email?: string): Promise<LoopCustomer[]> => {
      return await loopApi({
        method: 'GET',
        path: `customer/${email ? '?email='+email : ''}`
      })
    },
    get: async (customerId?: number): Promise<LoopCustomer> => {
      return await loopApi({
        method: 'GET',
        path: `customer/${customerId || ''}`
      })
    },
    getSessionToken: async (customerId: number): Promise<{ sessionToken: string } | undefined> => {
      console.log("[getSessionToken] customerId", customerId)
      return await loopApi({
        method: 'POST',
        path: `customer/${customerId}/sessionToken`
      })
    }
  },
  subscriptions: {
    getAll: async (params?: string) => {
      return await loopApi({
        method: 'GET',
        path: `subscription${params || ''}`
      })
    },
    get: async (subscriptionId?: string) => {
      return await loopApi({
        method: 'GET',
        path: `subscription/${subscriptionId || ''}`
      })
    }
  },
  orders: {
    getUpcoming: async (subscriptionId: string) => {
      return await loopApi({
        method: 'GET',
        path: `subscription/${subscriptionId}/order/schedule`
      })
    },
    getHistory: async (subscriptionId: string) => {
      return await loopApi({
        method: 'GET',
        path: `subscription/${subscriptionId}/order/history`
      })
    },
    getAll: async (params?: string) => {
      return await loopApi({
        method: 'GET',
        path: `order${params || ''}`
      })
    }
  }
}