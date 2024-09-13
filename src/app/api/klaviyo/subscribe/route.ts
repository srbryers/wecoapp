import { klaviyo } from "@/app/actions/klaviyo"
import { klaviyoApi } from "@/app/utils/klaviyoApi"

interface SubscribeRequest {
  email?: string
  phone_number?: string
  listId: string
  consent: {
    email: {
      marketing: {
        consent: string
        consented_at?: string
      }
    }
    sms: {
      marketing: {
        consent: string
        consented_at?: string
      }
    }
  }
}

interface KlaviyoProfile {
  id?: string
  type: string
  attributes: {
    subscriptions: SubscribeRequest['consent']
    email: string
    phone_number: string
  }
}


export async function POST(request: Request) {
  const req = await request.json()
  const email = req.email
  const phone_number = req.phone_number

  console.log(req)

  let profileData: KlaviyoProfile = {
    "type": "profile",
    "attributes": {
      "subscriptions": {
        "email": {
          "marketing": {
            "consent": req.consent.email.marketing.consent,
          }
        },
        "sms": {
          "marketing": {
            "consent": req.consent.sms.marketing.consent,
          }
        }
      },
      "email": email,
      "phone_number": phone_number
    }
  }

  // Get the Klaviyo profile
  const klaviyoQuery = `?filter=equals(email,%22${email}%22)`
  const klaviyoCustomer = (await klaviyo.profiles.get(klaviyoQuery))?.data?.[0]

  console.log(klaviyoCustomer)

  if (klaviyoCustomer) {
    profileData.id = klaviyoCustomer.id
  }

  const subscribeData ={
    "data": {
      "type": "profile-subscription-bulk-create-job",
      "attributes": {
        "profiles": {
          "data": [
            profileData
          ]
        },
      },
      "relationships": {
        "list": {
          "data": {
            "type": "list",
            "id": req.listId
          }
        }
      }
    }
  } 

  // Subscribe the Klaviyo profile to SMS
  const response = await klaviyo.profiles.subscribe(subscribeData)

  console.log(response)

  return Response.json(response)
}