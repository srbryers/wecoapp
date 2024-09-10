import { CarrierService, LineItem, Order, CarrierServiceRequest, CarrierServiceResponse } from "@/app/utils/types"
import { shopifyAdminApiRest, shopifyAdminApiGql } from "@/app/utils/shopify"
import { delay } from "../utils/helpers"
import { klaviyo } from "./klaviyo"

export const shopify = {
  fulfillmentServices: {
    get: async (): Promise<any> => {
      const request = `
        query {
          fulfillmentServices(first: 50) {
            edges {
              node {
                id,
                name,
                callbackUrl,
                format,
                fulfillmentOrdersOptIn
              }
            }
          }
        }
      `
      return (await shopifyAdminApiGql(request))?.fulfillmentServices.edges.map((x: any) => x.node)
    }
  },
  carrierServices: {
    get: async (id?: string): Promise<any> => {
      const request = `
        {
            carrierServices(first: 20 ${id ? `, query: "id:${id}"` : ''}) {
                edges {
                    node {
                        id
                        name
                        callbackUrl
                        formattedName
                        active
                    }
                }
            }
        }
      `
      const res = await shopifyAdminApiGql(request)

      return res ? res.carrierServices.edges.map((x: any) => {
        const legacy_id = Number(x.node.id.split('/').pop())
        return {
          ...x.node,
          legacy_id
        }
      }) : null

    },
    update: async (data: CarrierService): Promise<any> => {
      // Parse the id into a number if it is a number
      let requestData = data
      if (!isNaN(Number(data.id))) {
        requestData.id = Number(data.id)
      }
      // Can only update using the REST API
      return await shopifyAdminApiRest({
        method: 'PUT',
        path: `carrier_services/${requestData.id}.json`,
        body: { carrier_service: requestData }
      })
    },
    test: async (data: CarrierServiceRequest | { shopify_order_id: string } | { shopify_draft_order_id: string }): Promise<CarrierServiceResponse[]> => {

      let result: CarrierServiceResponse[] = []

      if ('shopify_order_id' in data || 'shopify_draft_order_id' in data) {
        let order: Order | undefined = undefined
        // Get the shopify order or draft_order from the API
        if ('shopify_order_id' in data) {
          const res = (await shopify.orders.get(data.shopify_order_id))
          order = res
        } else if ('shopify_draft_order_id' in data) {
          const res = (await shopify.draftOrders.get(data.shopify_draft_order_id)) as { draft_order: Order }
          order = res.draft_order
        }

        // If we have an order, test the shipping profile
        if (!order) {
          throw new Error('Order not found')
        } else {
          console.log("[testShippingProfile] got Order:", order)
          const carrierServiceRequest = {
            id: order.id,
            rate: {
              origin: {
                country: "US",
                postal_code: "01720",
                province: "MA",
                city: "Acton"
              },
              destination: {
                country: order.shipping_address?.country_code,
                postal_code: order.shipping_address?.zip,
                province: order.shipping_address?.province,
                city: order.shipping_address?.city
              },
              items: order.line_items?.map((item: LineItem) => {
                let res = item
                // Map the properties from an array to an object
                if (item.properties) {
                  res.properties = item.properties?.reduce((acc: any, property: any) => {
                    acc[property.name] = property.value
                    return acc
                  }, {})
                }
                // Update the variant price
                if (item.price) {
                  res.price = Number(item.price) * 100
                }
                const shipment_date = item?.sku?.split("-")
                if (!shipment_date) {
                  return res
                }
                shipment_date.shift()
                if (shipment_date.length > 0) {
                  return {
                    name: item.name,
                    quantity: item.quantity,
                    price: Number(item.price) * 100,
                    grams: item.grams,
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    requires_shipping: item.requires_shipping,
                    sku: item.sku,
                    // shipment_date: shipment_date.join("-")
                  }
                } else {
                  return item
                }
              }).filter((value: any) => value !== undefined),
              currency: order.currency,
              locale: order.locale
            }
          }
          console.log('CarrierServiceRequests:', carrierServiceRequest)
          const res = await fetch('/api/shopify/carrierService', {
            method: 'POST',
            body: JSON.stringify(carrierServiceRequest)
          })
          const json = await res.json()
          console.log('Tested shipping profile:', json)
          result = json.rates as CarrierServiceResponse[]
        }
      } else {
        const res = await fetch('/api/shopify/carrierService', {
          method: 'POST',
          body: JSON.stringify(data)
        })
        const json = await res.json()
        console.log('Tested shipping profile:', json)
        result = json.rates as CarrierServiceResponse[]
      }
      return result
    }
  },
  orders: {
    get: async (order_id?: string) => {
      try {
        const res = await shopifyAdminApiRest({
          method: 'GET',
          path: order_id ? `orders/${order_id}.json` : 'orders.json'
        })
          .then((data) => {
            console.log('Orders:', data)
            return data
          })
        if (order_id) {
          return res.order as any
        } else {
          return res as { orders: Order[] }
        }
      } catch (error) {
        console.error('Error getting orders:', error)
        throw error
      }
    },
    post: async (order: Order) => {
      console.log("createOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'POST',
          path: 'orders.json',
          body: { order: order }
        })
          .then((data) => {
            console.log('Order:', data)
            return data
          })
        return res as { order: Order }
      } catch (error) {
        console.error('Error creating order:', error)
        throw error
      }
    },
    put: async (order: Order) => {
      console.log("updateOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'PUT',
          path: `orders/${order.id}.json`,
          body: { order: order }
        })
          .then((data) => {
            console.log('Order:', data)
            return data
          })
        return res as { order: Order }
      } catch (error) {
        console.error('Error updating order:', error)
        throw error
      }
    },
    delete: async (order_id: string) => {
      console.log("deleteOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'DELETE',
          path: `orders/${order_id}.json`
        })
          .then((data) => {
            console.log('Order:', data)
            return data
          })
        return res
      } catch (error) {
        console.error('Error deleting order:', error)
        throw error
      }
    }
  },
  /**
   * Draft Orders
   */
  draftOrders: {
    get: async (draft_order_id?: string) => {
      console.log("getDraftOrders")
      try {
        const res = await shopifyAdminApiRest({
          method: 'GET', 
          path: draft_order_id ? `draft_orders/${draft_order_id}.json` : 'draft_orders.json'
        })
          .then((data) => {
            console.log('Draft Orders:', data)
            return data
          })
        if (draft_order_id) {
          return res as { draft_order: Order }
        } else {
          return res as { draft_orders: Order[] }
        }
      } catch (error) {
        console.error('Error getting draft orders:', error)
        throw error
      }
    },
    post: async (draft_order: Order) => {
      console.log("createDraftOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'POST', 
          path: 'draft_orders.json', 
          body: { draft_order: draft_order }
        })
          .then((data) => {
            console.log('Draft Order:', data)
            return data
          })
        return res as { draft_order: Order }
      } catch (error) {
        console.error('Error creating draft order:', error)
        throw error
      }
    },
    put: async (draft_order: Order) => {
      console.log("updateDraftOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'PUT', 
          path: `draft_orders/${draft_order.id}.json`, 
          body: { draft_order: draft_order }
        })
          .then((data) => {
            return data
          })
        return res as { draft_order: Order }
      } catch (error) {
        console.error('Error updating draft order:', error)
        throw error
      }
    },
    delete: async (draft_order_id: string) => {
      console.log("deleteDraftOrder")
      try {
        const res = await shopifyAdminApiRest({
          method: 'DELETE', 
          path: `draft_orders/${draft_order_id}.json`
        })
          .then((data) => {
            return data
          })
        return res
      } catch (error) {
        console.error('Error deleting draft order:', error)
        throw error
      }
    }
  },
  metaobjects: {
    get: async (type: string) => {
      const request = `
        query {
          metaobjects(type: "${type}", first: 50) {
            # MetaobjectConnection fields
            edges {
                node {
                    handle,
                    displayName,
                    fields {
                        key,
                        value
                    }
                }
            }
          }
        }
      `
      return (await shopifyAdminApiGql(request)).metaobjects.edges.map((x: any) => x.node)
    }
  },
  customers: {
    getOrders: async (customer_id: string) => {
      return await shopifyAdminApiRest({
        method: 'GET',
        path: `customers/${customer_id}/orders.json`
      })
    },
    getByEmail: async (email: string) => {
      return await shopifyAdminApiRest({
        method: 'GET',
        path: `customers.json?email=${email}`
      })
    },
    getPublicProfile: async (email: string) => {

      const transitionTags = [
        {
          tag: 'Wave0_Lapsed_GroupA',
          transitionDate: '2024-09-10'
        },
        {
          tag: 'Wave0_Lapsed_GroupB',
          transitionDate: '2024-09-17'
        },
        {
          tag: 'Wave0_Lapsed_GroupC',
          transitionDate: '2024-09-24'
        },
        // @TODO:Add remaining transition tags here after they are created in Klaviyo
      ]

      let isSubscriptionCustomer = false

      /* 1. Get the Klaviyo profile */
      const klaviyoQuery = `?filter=equals(email,%22${email}%22)`
      const klaviyoCustomer = (await klaviyo.profiles.get(klaviyoQuery))?.data?.[0]

      if (!klaviyoCustomer) {
        return null // Return null if the Klaviyo profile is not found
      }

      // Check the properties for a TransitionTag
      const transitionTag = klaviyoCustomer?.attributes?.properties?.TransitionTag
      
      if (transitionTag) {
        const transitionTagData = transitionTags.find((tag) => tag.tag === transitionTag)
        if (transitionTagData) {
          const transitionDate = new Date(transitionTagData.transitionDate)
          const currentDate = new Date()
          if (currentDate >= transitionDate) {
            isSubscriptionCustomer = true // Return the subscription experience if the TransitionTag is found
          }
        }
      }

      /* 2. Get the Shopify customer and orders */
      const shopifyCustomer = (await shopify.customers.getByEmail(email))?.customers?.[0]
      const orders = await shopify.customers.getOrdersWithMetafields({ email: email })
      
      if (orders.length === 0) {
        return null // Return null if the customer has no orders
      }

      /* 3. Check if the customer is a subscription customer */
      const subscriptionOrders = orders?.filter((order: any) => {
        return order.tags?.includes('Subscription')
      })
      const lastOrder = orders?.[0]

      if (!shopifyCustomer?.tags?.includes('Local Delivery Only')) {
        if (shopifyCustomer?.tags?.includes('Subscription') || subscriptionOrders.length > 0) {
          isSubscriptionCustomer = true
        }
      }

      return {
        lastOrderId: lastOrder.id,
        metafields: lastOrder.customer.metafields,
        tags: shopifyCustomer?.tags,
        subscription: {
          isSubscriptionCustomer: isSubscriptionCustomer,
          isActive: lastOrder.customer.tags?.includes('Active Subscriber')
        }
      }
    },
    getOrdersWithMetafields: async ({
      customer_id,
      email
    }: {
      customer_id?: string,
      email?: string
    }) => {

      if (!customer_id && !email) {
        throw new Error('Must provide either customer_id or email')
      }

      const querySelector = customer_id ? `customer_id:${customer_id}` : email ? `email:${email}` : ''
      const res = await shopifyAdminApiGql(`
        query Orders {
          orders(first: 20, query: "${querySelector}", reverse: true) {
            nodes {
                    id
                    name
                    tags
                    email
                    createdAt
                    customer {
                        email
                        firstName
                        lastName
                        tags
                        metafields(first: 10) {
                            nodes {
                                key
                                namespace
                                value
                                __typename
                            }
                        }
                    }
                    customAttributes {
                        __typename
                        key
                        value
                    }
                    lineItems(first: 20) {
                        nodes {
                            id
                            name
                            title
                            quantity
                            originalUnitPriceSet {
                                presentmentMoney {
                                    amount
                                    currencyCode
                                }
                            }
                            sku
                            customAttributes {
                                __typename
                                key
                                value
                            }
                        }
                    }
                    shippingAddress {
                        address1
                        address2
                        city
                        province
                        provinceCode
                        country
                        company
                        firstName
                        lastName
                        zip               
                    }
                }
            }
        }
      `)

      // Reformat the nodes
      const formattedNodes = res.orders.nodes.map((node: any) => {
        return {
          ...node,
          customer: {
            ...node.customer,
            metafields: node.customer.metafields.nodes?.map((metafield: any) => {
              return {
                [metafield.key]: metafield.value
              }
            })?.reduce((acc: any, obj: any) => {
              return { ...acc, ...obj }
            }, {})
          },
          customAttributes: node.customAttributes?.map((attr: any) => {
            return {
              [attr.key]: attr.value
            }
          })?.reduce((acc: any, obj: any) => {
            return { ...acc, ...obj }
          }, {}),
          lineItems: node.lineItems.nodes?.map((item: any) => {
            return {
              ...item,
              price: Number(item.originalUnitPriceSet.presentmentMoney.amount)*100,
              properties: item.customAttributes.map((attr: any) => {
                return {
                  [attr.key]: attr.value
                }
              })?.reduce((acc: any, obj: any) => {
                return { ...acc, ...obj }
              }, {})
            }
          }),
        }
      })
      // console.log("formattedNodes", formattedNodes)
      return formattedNodes
    },
    updateMetafield: async (customer_id: string, metafield: any) => {
      return await shopifyAdminApiRest({
        method: 'POST',
        path: `customers/${customer_id}/metafields.json`,
        body: { metafield: metafield }
      })
    },
    updateMetafields: async (customer_id: string, metafields: any[]) => {
      const result = []
      for (let metafield of metafields) {
        result.push(await shopify.customers.updateMetafield(customer_id, metafield))
        await delay(100)
      }
      return result
    },
  }
}