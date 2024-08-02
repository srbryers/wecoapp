import { ApiKeySession, ProfilesApi, EventsApi } from 'klaviyo-api'

const session = new ApiKeySession(process.env.KLAVIYO_API_KEY || '')
export const profilesApi = new ProfilesApi(session)
export const eventsApi = new EventsApi(session)
