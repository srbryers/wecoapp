import { CarrierService, LineItem, Order, CarrierServiceRequest, CarrierServiceResponse } from "@/app/utils/types"
import { shopifyAdminApiRest, shopifyAdminApiGql } from "@/app/utils/shopify"

export const shopify = {
  fulfillmentServices: {
    get: async (): Promise<any>  => {
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
      return (await shopifyAdminApiGql(request)).fulfillmentServices.edges.map((x: any) => x.node)
    }
  },
  carrierServices: {
    get: async (id?: string): Promise<any>  => {
      const request = `
        {
            carrierServices(first: 20 ${id ? `, query: "id:${id}"` : '' }) {
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

      console
      return res.carrierServices.edges.map((x: any) => {
        const legacy_id = Number(x.node.id.split('/').pop())
        return {
          ...x.node,
          legacy_id
        }
      })
    },
    update: async (data: CarrierService): Promise<any> => {
      // Parse the id into a number if it is a number
      let requestData = data
      if (!isNaN(Number(data.id))) {
        requestData.id = Number(data.id)
      }
      // Can only update using the REST API
      return await shopifyAdminApiRest('PUT', `carrier_services/${requestData.id}.json`, { carrier_service: requestData })
    },
    test: async (data: CarrierServiceRequest | { shopify_order_id: string } | { shopify_draft_order_id: string }): Promise<CarrierServiceResponse[]> => {

      let result: CarrierServiceResponse[] = []

      if ('shopify_order_id' in data || 'shopify_draft_order_id' in data) {
        let order: Order | undefined = undefined
        // Get the shopify order or draft_order from the API
        if ('shopify_order_id' in data) {
          const res = (await shopify.orders.get(data.shopify_order_id)) as { order: Order }
          order = res.order
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
                  res.properties = item.properties.reduce((acc: any, property: any) => {
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
        const res = await shopifyAdminApiRest('GET', order_id ? `orders/${order_id}.json` : 'orders.json')
        .then((data) => {
          console.log('Orders:', data)
          return data
        })
        if (order_id) {
          return res as { order: Order }
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
        const res = await shopifyAdminApiRest('POST', 'orders.json', { order: order })
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
        const res = await shopifyAdminApiRest('PUT', `orders/${order.id}.json`, { order: order })
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
        const res = await shopifyAdminApiRest('DELETE', `orders/${order_id}.json`)
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
        const res = await shopifyAdminApiRest('GET', draft_order_id ? `draft_orders/${draft_order_id}.json` : 'draft_orders.json')
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
        const res = await shopifyAdminApiRest('POST', 'draft_orders.json', { draft_order: draft_order })
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
        const res = await shopifyAdminApiRest('PUT', `draft_orders/${draft_order.id}.json`, { draft_order: draft_order })
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
        const res = await shopifyAdminApiRest('DELETE', `draft_orders/${draft_order_id}.json`)
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
  }
}