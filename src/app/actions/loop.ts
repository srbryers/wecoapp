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
    get: async (email?: string): Promise<LoopCustomer[]> => {
      return await loopApi({
        method: 'GET',
        path: `customer/${email ? '?email='+email : ''}`
      })
    }
  }
}