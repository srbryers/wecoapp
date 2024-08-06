/**
 * Subscription Helpers
 */

import { getShipmentZone } from "../utils/carrierServices"
import { calculateAvailableDeliveryDates, delay } from "../utils/helpers"
import { LoopResponse, LoopSubscription } from "../utils/types"
import { klaviyo } from "./klaviyo"
import { loop } from "./loop"
import { shopify } from "./shopify"

type LoopSubscriptionAction = "sendUpcomingSubscriptionEmail" | "updateKlaviyoProfile"
interface LoopSubscriptionActions {
  [key: string]: any
}
interface Subscriptions {
  actions: LoopSubscriptionActions
  [key: string]: any
}
interface GetAllSubscriptionsRequest {
  query?: string
  page?: number
}

export const subscriptions: Subscriptions = {
  /**
   * Get All Subscriptions
   * @param page the number of the page in the Loop request
   * @returns enriched LoopSubscription data
   */
  getAll: async (props: GetAllSubscriptionsRequest): Promise<LoopResponse> => {

    const res = await loop.subscriptions.getAll(`?pageNo=${props.page || 1}${props.query ? '&'+props.query : ''}`)
    const menuZones = await shopify.metaobjects.get('menu_zone')

    // Loop through the subscriptions and get enrich with Shopify order and date data
    const subs = await Promise.all(res?.data?.map(async (sub) => {

      // Get the shopify orders associated with the subscription and sort them
      const orders = await shopify.customers.getOrdersWithMetafields(`${sub.customer.shopifyId}`)
      const sortedOrders = orders.sort((a: any, b: any) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }).filter((order: any) => {
        // Only return orders that have a Subscription tag
        return order.tags.includes("Subscription")
      })

      // console.info("[getAll] orders", orders)

      // Parse the order details into a format we can use
      const nextBillingDate = new Date(sub.nextBillingDateEpoch * 1000)
      const lastOrder = sortedOrders?.[0]
      const lastOrderDeliveryDate = new Date(lastOrder?.customAttributes["Delivery Date"])
      const nextOrderDeliveryDate = new Date(lastOrderDeliveryDate)
      nextOrderDeliveryDate.setDate(nextOrderDeliveryDate.getDate() + 7)

      // Set the email address
      sub.email = lastOrder?.email || ''

      // console.log("[getAll] email", sub.email)
      // console.log("[getAll] nextBillingDate", nextBillingDate.toLocaleString())
      // console.log("------------------------")

      // Get the next delivery date
      let dates
      let nextDeliveryDate = nextOrderDeliveryDate
      let nextDeliveryDateString = nextOrderDeliveryDate.toLocaleString().split("T")[0]

      // Get the applicable shipment zone based on Shopify's metaobjects
      if (lastOrder?.shippingAddress) {
        const menuZone = await getShipmentZone({
          destinationZip: lastOrder?.shippingAddress.zip.split("-")[0],
          lineItems: lastOrder?.lineItems,
          menuZones: menuZones
        })
        // If we have an applicable menu zone, then update the delivery date
        if (menuZone) {
          const nextAvailableDeliveryDates = calculateAvailableDeliveryDates(menuZone.menuZone, nextBillingDate)
          if (!nextAvailableDeliveryDates.includes(nextDeliveryDateString)) {
            nextDeliveryDate = new Date(nextAvailableDeliveryDates[0])
          }
        }

        // Set the hours for the delivery date
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 1)
        nextDeliveryDate.setHours(12)

        // Tidy up/organize all the dates
        dates = {
          nextBillingDate: nextBillingDate,
          nextBillingDateString: nextBillingDate.toLocaleDateString(),
          nextDeliveryDate: nextDeliveryDate,
          nextDeliveryDateString: nextDeliveryDate.toLocaleDateString(),
          lastOrderDeliveryDate: lastOrderDeliveryDate.toLocaleDateString(),
          nextOrderDeliveryDate: nextOrderDeliveryDate.toLocaleDateString()
        }
      }

      delay(200)
      return {
        ...sub,
        lastOrder,
        sortedOrders,
        ...dates
      } as LoopSubscription
    }))

    return {
      pageInfo: res.pageInfo,
      code: res.code,
      data: subs
    }
  },
  /**
   * Get Upcoming Subscriptions
   * @param days the number of days to look ahead for upcoming subscriptions
   * @returns the list of upcoming subscriptions
   */
  getUpcomingSubscriptions: async (days?: number) => {
    // Get the current date and the date in the future in epoch format
    let page = 1
    let subscriptionsList: LoopSubscription[] = []
    // Start from tomorrow
    const dateStart = new Date()
    dateStart.setHours(0, 0, 0, 0)
    dateStart.setDate(dateStart.getDate() + (days || 2))
    // End at the end of the day
    const dateEnd = new Date()
    dateEnd.setHours(23, 59, 59, 999)
    dateEnd.setDate(dateEnd.getDate() + (days || 2)) // Look ahead 2 days by default

    const getAllSubscriptions = async (page: number) => {
      const res = await subscriptions.getAll({
        page: page,
        query: `status=ACTIVE&nextBillingStartEpoch=${Math.floor(dateStart.valueOf() / 1000)}&nextBillingEndEpoch=${Math.floor(dateEnd.valueOf() / 1000)}`
      })
      subscriptionsList = [
        ...subscriptionsList, 
        ...res.data.sort((a: LoopSubscription, b: LoopSubscription) => {
          return a.nextBillingDateEpoch - b.nextBillingDateEpoch
        })
      ]
      if (res.pageInfo.hasNextPage) {
        page++
        await getAllSubscriptions(page)
      }
    }
    console.info("[getUpcomingSubscriptions] dateStart", dateStart.toLocaleString())
    console.info("[getUpcomingSubscriptions] dateEnd", dateEnd.toLocaleString())
    // Get all the subscriptions with recursive calls
    await getAllSubscriptions(page)

    return subscriptionsList
  },
  actions: {
    sendUpcomingSubscriptionEmail: async (data: LoopSubscription) => {
      // Get the loop session token
      const sessionToken = await loop.customers.getSessionToken(data.customer.shopifyId)
      const loginUrl = `https://e97e57-2.myshopify.com/a/loop_subscriptions/customer/${data.customer.shopifyId}?sessionToken=${sessionToken?.sessionToken}`

      console.info("[sendUpcomingSubscriptionEmail] send email to customer", data.email)

      if (data.email) {
        const event = {
          data: {
            type: "event",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email: data.email,
                    properties: {
                      "Next Billing Date": data.nextBillingDate,
                      "Next Billing Date (Display)": data.nextBillingDateString,
                      "Next Billing Date (Time)": `${data.nextBillingDate?.toLocaleTimeString()}`,
                      "Next Delivery Date": data.nextDeliveryDate,
                      "Next Delivery Date (Display)": data.nextDeliveryDateString,
                      "Login URL": loginUrl
                    }
                  }
                }
              },
              metric: {
                data: {
                  type: "metric",
                  attributes: {
                    name: "Upcoming Subscription"
                  }
                }
              },
              properties: {
                "Next Billing Date": data.nextBillingDate,
                "Next Billing Date (Display)": data.nextBillingDateString,
                "Next Billing Date (Time)": `${data.nextBillingDate?.toLocaleTimeString()}`,
                "Next Delivery Date": data.nextDeliveryDate,
                "Next Delivery Date (Display)": data.nextDeliveryDateString,
                "Login URL": loginUrl
              }
            }
          }
        }

        // console.info("[sendUpcomingSubscriptionEmail] event", event)
        const triggerEvent = await klaviyo.events.create(event)

        // Update the customer's metafields in Shopify
        await subscriptions.actions.updateShopifyCustomer({
          data,
          metafields: [
            {
              key: "upcoming_subscription_email_sent",
              value: new Date().toISOString().split("T")[0],
              type: "date",
              namespace: "subscriptions"
            }
          ]
        })

        return triggerEvent
        
      } else {
        console.error("Customer not found")
      }
    },
    updateShopifyCustomer: async ({ data, metafields }: { data: LoopSubscription, metafields?: any[] }) => {
      // Update customer "subscriptions.upcoming_subscription_email_sent" metafield in Shopify with the current date
      const request = [
        {
          key: "next_billing_date",
          value: data.nextBillingDate?.toISOString().split("T")[0],
          type: "date",
          namespace: "subscriptions"
        },
        {
          key: "next_delivery_date",
          value: data.nextDeliveryDate?.toISOString().split("T")[0],
          type: "date",
          namespace: "subscriptions"
        }, 
      ]

      metafields && metafields.forEach((metafield) => {
        request.push(metafield)
      })

      // console.log("[updateShopifyCustomer] request", request)

      const updatedCustomer = await shopify.customers.updateMetafields(`${data.customer.shopifyId}`, request)

      // console.log("[updateShopifyCustomer] updatedCustomer", updatedCustomer)
      return updatedCustomer
    },
    updateKlaviyoProfile: async (data: LoopSubscription, updateSessionToken?: boolean) => {

      const profile = {
        data: {
          type: "profile",
          attributes: {
            email: data.email,
            properties: {
              "Next Billing Date": data.nextBillingDate,
              "Next Billing Date (Display)": data.nextBillingDateString,
              "Next Billing Date (Time)": `${data.nextBillingDate?.toLocaleTimeString()}`,
              "Next Delivery Date": data.nextDeliveryDate,
              "Next Delivery Date (Display)": data.nextDeliveryDateString,
            }
          }
        }
      } as any

      if (updateSessionToken) {
        const sessionToken = await loop.customers.getSessionToken(data.customer.shopifyId)
        profile.data.attributes.properties["Login URL"] = `https://e97e57-2.myshopify.com/a/loop_subscriptions/customer/${data.customer.shopifyId}?sessionToken=${sessionToken?.sessionToken}`
      }

      const updatedProfile = await klaviyo.profiles.createOrUpdate(profile)

      // Update the customer's metafields in Shopify
      await subscriptions.actions.updateShopifyCustomer({ data })

      console.info("[updateKlaviyoProfile] updatedProfile", updatedProfile)
      return updatedProfile

    },
  }
}