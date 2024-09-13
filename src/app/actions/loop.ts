import { loopApi } from "../utils/loop"
import { LoopCustomAttributes, LoopResponse, LoopSubscription, LoopSubscriptionRequest } from "../utils/types"

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

export interface LoopSubscriptionResponse extends LoopResponse {
  data: LoopSubscription[]
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
      return (await loopApi({
        method: 'POST',
        path: `customer/${customerId}/sessionToken`
      })).data
    }
  },
  subscriptions: {
    getAll: async (params?: string): Promise<LoopSubscriptionResponse> => {
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
    },
    create: async (data: LoopSubscriptionRequest) => {
      return await loopApi({
        method: 'POST',
        path: `subscription`,
        body: data
      })
    },
    patchCustomAttributes: async (subscriptionId: string, customAttributes: LoopCustomAttributes[]) => {
      return await loopApi({
        method: 'PATCH',
        path: `subscription/${subscriptionId}/customAttribute`,
        body: {
          customAttributes: customAttributes
        }
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