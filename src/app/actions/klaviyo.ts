import { klaviyoApi } from "../utils/klaviyoApi"

export const klaviyo = {
  events: {
    create: async (event: any) => {
      return await klaviyoApi({
        method: 'POST',
        path: '/events',
        body: event
      })
    },
    getAll: async (params?: string) => {
      return await klaviyoApi({
        method: 'GET',
        path: `/events${params || ''}`
      })
    }
  },
  profiles: {
    get: async (params?: string) => {
      return await klaviyoApi({
        method: 'GET',
        path: `/profiles${params || ''}`
      })
    },
    createOrUpdate: async (profile: any) => {
      return await klaviyoApi({
        method: 'POST',
        path: '/profile-import',
        body: profile
      }).catch((error) => {
        console.error("Error creating or updating Klaviyo profile", error)
      })
    },
    subscribe: async (data: any) => {
      return await klaviyoApi({
        method: 'POST',
        path: '/profile-subscription-bulk-create-jobs',
        body: data
      })
    }
  }
}