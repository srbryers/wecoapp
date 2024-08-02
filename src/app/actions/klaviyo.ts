import { klaviyoApi } from "../utils/klaviyoApi"

export const klaviyo = {
  events: {
    create: async (event: any) => {
      return await klaviyoApi({
        method: 'POST',
        path: '/events',
        body: event
      })
    }
  },
  profiles: {
    createOrUpdate: async (profile: any) => {
      return await klaviyoApi({
        method: 'POST',
        path: '/profile-import',
        body: profile
      }).catch((error) => {
        console.error("Error creating or updating Klaviyo profile", error)
      })
    }
  }
}