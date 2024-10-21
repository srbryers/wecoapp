import { CarrierService, LineItem, Order, CarrierServiceRequest, CarrierServiceResponse, MenuZone } from "@/app/utils/types"
import { shopifyAdminApiRest, shopifyAdminApiGql } from "@/app/utils/shopify"
import { delay } from "../utils/helpers"
import { klaviyo } from "./klaviyo"
import { getShipmentZone } from "../utils/carrierServices"
import { shipStation } from "./shipStation"

const metafieldKeys = [
  "custom.summaryData",
  "custom.short_description",
  "custom.reheating_article",
  "custom.badges",
  "filter.allergens",
  "custom.ingredients",
  "global.description_tag",
  "filter.diets",
  "filter.proteins",
  "filter.menu_group",
  "custom.product_size",
  "custom.nutrition_facts",
  "custom.product_type",
  "custom.title_tag"
]

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

      return res ? res.carrierServices?.edges?.map((x: any) => {
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
        requestData.id = String(data.id)
      }
      console.log("requestData", requestData)
      try {
        // Can only update using the REST API
        return await shopifyAdminApiRest({
          method: 'PUT',
          path: `carrier_services/${requestData.id}.json`,
          body: { carrier_service: requestData }
        })
      } catch (e) {
        console.error("Error updating carrier service:", e)
        throw e
      }
    },
    create: async (data: CarrierService): Promise<any> => {
      return await shopifyAdminApiRest({
        method: 'POST',
        path: 'carrier_services.json',
        body: { carrier_service: data }
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
            // console.log('Orders:', data)
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
    },
    list: async (params?: string): Promise<Order[]> => {
      let allOrders: Order[] = []
      console.log("[shopify.orders.list] starting")
      async function fetchOrders(params?: string, pageInfo?: any) {
        const orders = (await shopifyAdminApiGql(
          `
        query {
          orders(first: 100 ${params ? `, ${params}` : ''} ${pageInfo ? `, after: "${pageInfo.endCursor}"` : ''}) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            nodes {
              id
              name
              tags
              email
              createdAt
              cancelledAt
              updatedAt
              displayFinancialStatus
              displayFulfillmentStatus
              channelInformation {
                channelId
                app {
                    title
                }
              }
              customer {
                id
              }
              totalPriceSet {
                presentmentMoney {
                  amount
                }
              }
              totalTaxSet {
                presentmentMoney {
                    amount
                    currencyCode
                }
              }
              shippingLine {
                title
                shippingRateHandle
                code
                source
                
                originalPriceSet {
                    presentmentMoney {
                        amount
                    }
                }
              }
              channelInformation {
                  channelDefinition {
                      handle
                  }
              }
              customer {
                  email
                  firstName
                  lastName
                  phone
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
                    sellingPlan {
                      sellingPlanId
                    }
                    variant {
                        id
                        title
                    }
                    originalUnitPriceSet {
                        presentmentMoney {
                            amount
                            currencyCode
                        }
                    }
                    image {
                        url
                        altText
                    }
                    sku
                    customAttributes {
                        __typename
                        key
                        value
                    }
                }
              }
              billingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                provinceCode
                country
                countryCode
                zip
                phone
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
                  phone          
              }
            }
          }
        }
        `
        ))?.orders
        if (orders.pageInfo?.hasNextPage) {
          allOrders.push(...orders.nodes)
          console.log("[shopify.orders.list] get next page after", orders.pageInfo.endCursor)
          return fetchOrders(params, orders.pageInfo)
        } else {
          allOrders.push(...orders.nodes)
          return allOrders
        }
      }

      await fetchOrders(params)
      console.log("[shopify.orders.list] allOrders", allOrders.length)
      return allOrders
    },
    editAddVariants: async ({
      order_id,
      variantLines,
      allowDuplicates
    }: {
      order_id: string,
      variantLines: any,
      allowDuplicates: boolean
    }) => {
      const orderEditBeginMutation = `
        mutation orderEditBegin($id: ID!) {
          orderEditBegin(id: $id) {
            calculatedOrder {
              # CalculatedOrder fields
              id
              lineItems(first: 20) {
                nodes {
                    id
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `
      const beginEditingRes = await shopifyAdminApiGql(orderEditBeginMutation, { id: order_id })
      const calculatedOrderId = beginEditingRes?.orderEditBegin?.calculatedOrder?.id
      beginEditingRes && console.log("[shopify.orders.edit] began order edit:", calculatedOrderId)
      const variantMutations = variantLines.map((variant: any, index: number) => {
        // console.log("variant", variant.id)
        return `
          addVariant${index}: orderEditAddVariant(id: "${calculatedOrderId}", quantity: ${variant.quantity}, variantId: "${variant.id}", allowDuplicates: $allowDuplicates) {
            calculatedLineItem {
              # CalculatedLineItem fields
              id
            }
            userErrors {
              field
              message
            }
          }
        `
      })

      const orderEditAddVariantsRes = await shopifyAdminApiGql(`
        mutation orderEditAddVariants($allowDuplicates: Boolean!) {
          ${variantMutations.join("\n")}
        }
      `, {
        "allowDuplicates": allowDuplicates
      })

      // Check for errors
      const lineItemErrors = Object.values(orderEditAddVariantsRes).filter((value: any) => value.userErrors.length > 0)
      if (lineItemErrors.length > 0) {
        console.error("[shopify.orders.edit] line item errors:", JSON.stringify(lineItemErrors))
        return {
          success: false,
          lineItemErrors
        }
      }

      // Parse the response to get the calculatedLineItem.id from each mutation
      const calculatedLineItemIds = Object.values(orderEditAddVariantsRes).map((value: any) => {
        return value.calculatedLineItem.id
      })

      orderEditAddVariantsRes && console.log("[shopify.orders.edit] added variants:", JSON.stringify(calculatedLineItemIds))

      const orderEditLineItemDiscountMutation = calculatedLineItemIds.map((id: string, index: number) => {
        return `
          addLineItemDiscount${index}: orderEditAddLineItemDiscount(discount: $discount, id: "${calculatedOrderId}", lineItemId: "${id}") {
            addedDiscountStagedChange {
              id
              value {
                __typename
              }
            }
            userErrors {
              field
              message
            }
          }
        `
      })

      const orderEditAddLineItemDiscountRes = await shopifyAdminApiGql(`
        mutation orderEditAddLineItemDiscount($discount: OrderEditAppliedDiscountInput!) {
          ${orderEditLineItemDiscountMutation.join("\n")}
        }
      `, {
        "discount": {
          "description": "Bundle Product",
          "percentValue": 100
        },
      })

      orderEditAddLineItemDiscountRes && console.log("[shopify.orders.edit] added line item discounts:", JSON.stringify(orderEditAddLineItemDiscountRes))

      const orderEditCommitMutation = `
        mutation orderEditCommit {
          orderEditCommit(id: "${calculatedOrderId}") {
            order {
              # Order fields
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `

      const commitEditingRes = await shopifyAdminApiGql(orderEditCommitMutation)

      commitEditingRes && console.log("[shopify.orders.edit] committed order edit")

      return commitEditingRes

    },
    getWithFulfillments: async (order_id: string) => {
      console.log("getWithFulfillments", order_id)
      const order = await shopifyAdminApiGql(`
        query {
          order(id: "gid://shopify/Order/${order_id}") {
            id
            name
            email
            displayFulfillmentStatus
            fulfillments(first: 5) {
              id
              status
              trackingInfo {
                number
                url
              }
              fulfillmentOrders(first: 5) {
                nodes {
                  id
                }
              }
            }
            fulfillmentOrders(first: 5) {
              nodes {
                  id
                  status
                  destination {
                      firstName
                      lastName
                      address1
                      address2
                      city
                      zip
                      province
                  }
                  lineItems(first: 20) {
                    nodes {
                      id
                      totalQuantity
                      variantTitle
                    }
                  }
                
              }
            }
          }
        }
      `)
      return order
    }
  },
  /**
   * Fulfillments
   */
  fulfillments: {
    create: async ({
      fulfillmentOrderId,
      lineItems,
      trackingInfo
    }: {
      fulfillmentOrderId: string,
      lineItems: {
        id: string,
        quantity: number
      }[]
      trackingInfo: {
        company: string,
        number: string,
        url: string
      }
    }) => {
      console.log("[shopify.fulfillments.create] lineItems", JSON.stringify(lineItems))
      try {
        const res = await shopifyAdminApiGql(`
          mutation fulfillmentCreate($fulfillment: FulfillmentInput!) {
            fulfillmentCreate(fulfillment: $fulfillment) {
              fulfillment {
                # Fulfillment fields
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          fulfillment: {
            lineItemsByFulfillmentOrder: [
              {
                fulfillmentOrderId: fulfillmentOrderId,
                fulfillmentOrderLineItems: lineItems.map((lineItem: any) => ({
                  id: lineItem.id,
                  quantity: lineItem.totalQuantity
                }))
              }
            ],
            notifyCustomer: false,
            trackingInfo: trackingInfo
          }
        })
        return res
      } catch (error) {
        console.error('Error creating fulfillment:', error)
        throw error
      }
    },
    updateTrackingInfo: async ({
      fulfillment_id,
      trackingInfo
    }: {
      fulfillment_id: string,
      trackingInfo: {
        company: string,
        number: string,
        url: string
      }
    }) => {
      console.log("[shopify.fulfillments.updateTrackingInfo] fulfillment_id", fulfillment_id)
      console.log("[shopify.fulfillments.updateTrackingInfo] Tracking Info", JSON.stringify(trackingInfo))
      try {
        const res = await shopifyAdminApiGql(`
          mutation fulfillmentTrackingInfoUpdate($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean!) {
            fulfillmentTrackingInfoUpdate(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) {
              fulfillment {
                # Fulfillment fields
                id
              }
              userErrors {
                field
                message
              }
            }
          }
        `, {
          fulfillmentId: fulfillment_id,
          notifyCustomer: false,
          trackingInfoInput: {
            company: trackingInfo.company || "WECO",
            number: trackingInfo.number || "",
            url: trackingInfo.url || "",
          }
        })
        console.log("[shopify.fulfillments.updateTrackingInfo] res", JSON.stringify(res))
        return res
      } catch (error) {
        console.error('[shopify.fulfillments.updateTrackingInfo] Error updating fulfillment:', error)
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
          transitionDate: '2024-09-11'
        },
        // {
        //   tag: 'Wave0_Lapsed_GroupB',
        //   transitionDate: '2024-09-17'
        // },
        // {
        //   tag: 'Wave0_Lapsed_GroupC',
        //   transitionDate: '2024-09-24'
        // },
        // @TODO:Add remaining transition tags here after they are created in Klaviyo
      ]

      let isSubscriptionCustomer = false

      /* 1. Get the Klaviyo profile */
      const klaviyoQuery = `?filter=equals(email,%22${email}%22)`
      const klaviyoCustomer = (await klaviyo.profiles.get(klaviyoQuery))?.data?.[0]
      const shopifyCustomer = (await shopify.customers.getByEmail(email))?.customers?.[0]
      const orders = await shopify.customers.getOrdersWithMetafields({ email: email })

      if (!klaviyoCustomer) {
        return null // Return null if the Klaviyo profile is not found
      }

      // Check the properties for a TransitionTag
      // const transitionTag = klaviyoCustomer?.attributes?.properties?.TransitionTag

      // if (transitionTag) {
      //   const transitionTagData = transitionTags.find((tag) => tag.tag === transitionTag)
      //   if (transitionTagData) {
      //     const transitionDate = new Date(transitionTagData.transitionDate)
      //     const currentDate = new Date()
      //     if (currentDate >= transitionDate) {
      //       isSubscriptionCustomer = true // Return the subscription experience if the TransitionTag is found
      //     }
      //   }
      // }

      if (orders.length === 0) {
        return null // Return null if the customer has no orders
      }

      // If the customer is only allowed local delivery, return the last order and metafields
      if (shopifyCustomer?.tags?.includes('Local Delivery Only')) {
        return {
          lastOrderId: orders?.[0]?.id,
          metafields: orders?.[0]?.customer?.metafields,
          tags: shopifyCustomer?.tags,
          subscription: {
            isSubscriptionCustomer: false,
            isActive: false
          }
        }
      }

      /* 3. Check if the customer is a subscription customer */
      const subscriptionOrders = orders?.filter((order: any) => {
        return order.tags && order.tags?.includes('Subscription')
      })
      const lastOrder = orders?.[0]

      console.log("subscriptionOrders", subscriptionOrders.map((order: any) => order.name))

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
          isActive: shopifyCustomer?.tags?.includes('Active Subscriber')
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
              price: Number(item.originalUnitPriceSet.presentmentMoney.amount) * 100,
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
  },
  collections: {
    getProducts: async (collection_handle: string) => {

      async function getAllProducts(collection_handle: string, cursor?: string) {
        const variables = { handle: collection_handle, cursor: cursor }
        const res = await shopifyAdminApiGql(`
          fragment MediaImage on MediaImage {
              image {
                  url
                  altText
              }    
          }
          fragment Metaobject on Metaobject {
              handle
              fields {
                  key,
                  value,
                  type,
                  __typename,
                  reference {
                      __typename,
                      ...MediaImage
                  }
              }
          }
          fragment Metafield on Metafield {
              key,
              value,
              type,
              __typename,
              reference {
                  __typename
                  ...MediaImage
                  ...Metaobject
              },
              references(first: 10) {
                  nodes {
                      ...Metaobject
                  }
              }
          }
          query getCollectionFromHandle($handle: String!, $cursor: String) {
            collectionByHandle(handle: $handle) {
              id
              products(first: 50, after: $cursor) {
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                }
                edges {
                  cursor
                  node {
                    id
                    handle
                    title
                    status
                    description
                    tags
                    totalInventory
                    featuredImage {
                        url
                        altText
                    }
                    metafields(first: 20, keys: ${JSON.stringify(metafieldKeys)}) {
                      nodes {
                        __typename
                        ...Metafield
                      }
                    }
                    bundleParent: metafield(namespace: "custom", key: "bundle_parent") {
                      __typename
                      id: value
                    }
                    variants(first: 7) {
                        nodes {
                            id
                            availableForSale
                            inventoryPolicy
                            inventoryQuantity
                            selectedOptions {
                              name
                              value
                            }
                        }
                    }
                    sellingPlanGroups(first: 3) {
                      nodes {
                        id
                        name
                        summary
                        sellingPlans(first: 3) {
                            nodes {
                                id
                                name
                                description
                            }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `, variables)

        const products = res.collectionByHandle.products.edges.map((x: any) => x.node)
        if (res.collectionByHandle.products.pageInfo.hasNextPage) {
          const moreProducts: any = await getAllProducts(collection_handle, res.collectionByHandle.products.edges.pop().cursor)
          return products.concat(moreProducts)
        } else {
          return products
        }

      }

      function parseMetafieldReference(ref: any) {
        if (ref.fields) {
          const referenceFields = ref.fields.map((field: any) => {
            if (field.reference) {
              return {
                [field.key]: parseMetafieldReference(field.reference)
              }
            } else {
              return {
                [field.key]: field.value
              }
            }
          }).reduce((acc: any, obj: any) => {
            return { ...acc, ...obj }
          }, {})
          return {
            handle: ref.handle,
            ...referenceFields
          }
        } else {
          return {
            handle: ref.handle,
            ...ref
          }
        }
      }

      const productNodes = await getAllProducts(collection_handle)
      const products = productNodes.map((node: any) => {
        return {
          ...node,
          metafields: node.metafields.nodes?.map((metafield: any) => {
            let value = metafield.value
            if (metafield.value.includes("[") || metafield.value.includes("{")) {
              value = JSON.parse(metafield.value)
            } else if (metafield.reference) {
              value = parseMetafieldReference(metafield.reference)
            }

            if (metafield.references) {
              value = metafield.references.nodes.map((ref: any) => {
                return parseMetafieldReference(ref)
              })
            }
            return {
              [metafield.key.split(".")[1]]: value
            }
          })?.reduce((acc: any, obj: any) => {
            return { ...acc, ...obj }
          }, {}),
          variants: node.variants.nodes.map((variant: any) => {
            return variant
          }),
          sellingPlanGroups: node.sellingPlanGroups.nodes.map((group: any) => {
            return {
              id: group.id,
              name: group.name,
              summary: group.summary,
              sellingPlans: group.sellingPlans.nodes.map((plan: any) => {
                return {
                  id: plan.id,
                  name: plan.name,
                  description: plan.description
                }
              })
            }
          })
        }
      })
      return products
    }
  },
  products: {
    get: async (product_id: string) => {
      const res = await shopifyAdminApiGql(`
        query {
          product(id: "${product_id}") {
            id
            title
            description
            variants(first: 20) {
              nodes {
                id
                title
                availableForSale
                selectedOptions {
                  name
                  value
                }
                price
                sellingPlanGroups(first: 5) {
                    nodes {
                        sellingPlans(first: 5) {
                            nodes {
                                id
                                name
                            }
                        }
                    }
                }
              }
            }
          }
        }
      `)
      return res.product
    }
  },
  helpers: {
    createFulfillmentsFromJob: async (job: any): Promise<{ success: boolean, fulfillment?: any, order?: any, errors?: any[] } | null> => {

      let result = {
        success: true,
        fulfillment: null,
        order: null,
        errors: []
      }
      const jobDate = job.date
      const jobReferenceId = job.reference_id?.split("-")[0]
      const jobStatus = job?.status
      const trackingNumber = job.post_staging?.tracking.tracking_number
      const trackingUrl = job.post_staging?.tracking.url
      const order = (await shopify.orders.getWithFulfillments(jobReferenceId))?.order

      console.log("[createFulfillmentsFromJob] Evaluating fulfillments for order:", order?.name, jobDate)
      console.log("[createFulfillmentsFromJob] trackingNumber:", trackingNumber)
      console.log("[createFulfillmentsFromJob] trackingUrl:", trackingUrl)
      console.log("[createFulfillmentsFromJob] order fulfillmentStatus:", order?.displayFulfillmentStatus)
      console.log("[fulfillmentOrders]", JSON.stringify(order?.fulfillmentOrders?.nodes))

      // If the order is not already fulfilled, then create a fulfillment
      // if (order?.displayFulfillmentStatus !== "FULFILLED") {

      // If we don't have tracking info and a tracking number, then we can't create a fulfillment
      if (!trackingNumber || !trackingUrl) {
        console.error("No tracking info found for order", order?.name)
        return {
          success: false,
          order: order,
          errors: ["No tracking info found"]
        }
      }

      // Find the first open or in progress fulfillment order
      const fulfillmentOrder = order?.fulfillmentOrders?.nodes?.find((fulfillmentOrder: any) => fulfillmentOrder.status === "OPEN" || fulfillmentOrder.status === "IN_PROGRESS" || fulfillmentOrder.status === "CLOSED")
      // if (!fulfillmentOrder) {
      //   console.error("No open fulfillment order found for order", order?.name)
      //   return {
      //     success: false,
      //     order: order,
      //     errors: ["No open fulfillment order found"]
      //   }
      // }

      // If the fulfillment order is in progress or closed, then update the tracking info
      if (fulfillmentOrder.status === "IN_PROGRESS" || fulfillmentOrder.status === "CLOSED") {
        console.info("[createFulfillmentsFromJob] Fulfillment order is in progress or is CLOSED - attempting to update tracking info")
        // Fin the fulfillments that have a fulfillmentOrderId matching the one we're looking at
        const fulfillment = order?.fulfillments?.find((fulfillment: any) => fulfillment.fulfillmentOrders?.nodes?.find((node: any) => node.id === fulfillmentOrder.id))

        if (fulfillment?.id) {
          // If we already have tracking info, return
          if (fulfillment?.trackingInfo?.length > 0) {
            console.log("[createFulfillmentsFromJob] Order already has tracking info: ", order?.name)
            return {
              success: false,
              errors: ["Order already has tracking info"],
              order: order,
              fulfillment: fulfillment,
            }
          }
          // If fulfillment order is in progress and we don't have tracking info, then update the tracking info 
          try {
            console.log("[createFulfillmentsFromJob] Updating tracking info for order:", order?.name)
            const updateFulfillment = await shopify.fulfillments.updateTrackingInfo({
              fulfillment_id: fulfillment.id,
              trackingInfo: {
                company: "WECO",
                number: trackingNumber,
                url: trackingUrl
              },
            })
            result.fulfillment = updateFulfillment
            result.order = order
          } catch (error) {
            console.error("[createFulfillmentsFromJob] Failed to update tracking info", error)
            return {
              success: false,
              errors: [error],
              order: order,
              fulfillment: fulfillment
            }
          }
        } else {
          console.log("[createFulfillmentsFromJob] Could not find existing fulfillment to update, or tracking info has already been added.")
          return {
            success: false,
            errors: ["Could not find existing fulfillment to update, or tracking info has already been added."],
            order: order
          }
        }
      } else {
        // If the fulfillment order is open, then create a fulfillment
        try {
          const fulfillment = await shopify.fulfillments.create({
            fulfillmentOrderId: fulfillmentOrder.id,
            lineItems: fulfillmentOrder.lineItems.nodes.filter((lineItem: any) => {
              return lineItem.variantTitle.includes(jobDate)
            }),
            trackingInfo: {
              company: "WECO",
              number: trackingNumber,
              url: trackingUrl
            }
          })
          result.fulfillment = fulfillment
          result.order = order
        } catch (error) {
          console.error("Error creating fulfillment", error)
          return {
            success: false,
            order: order,
            errors: [error]
          }
        }
      }

      // } else {
      //   console.log("[createFulfillmentsFromJob] Order is already fulfilled")
      //   return {
      //     success: false,
      //     errors: [],
      //     order: order,
      //     fulfillment: order?.fulfillments?.[0],
      //   }
      // }

      return result
    },
    updateFulfillmentTracking: async (job: any) => {
      const jobDate = job.date
      const jobReferenceId = job.reference_id?.split("-")[0]
      const jobStatus = job?.status
      const trackingNumber = job.post_staging?.tracking.tracking_number
      const trackingUrl = job.post_staging?.tracking.url
      const order = (await shopify.orders.getWithFulfillments(jobReferenceId))?.order

    },
    getFulfillmentCounts: async (daysAgo: number, orderType: string, store: string) => {

      let ordersList: any[] = []
      const startDate = new Date(new Date().getTime() - Number(daysAgo) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      console.log("[getFulfillmentCounts] orderType", orderType, "daysAgo", daysAgo)
      if (orderType === "Subscription") {
        // Get the subscription orders for the given delivery date
        ordersList = await shopify.orders.list(`query: "tag:Subscription AND created_at:>=${startDate}"`)
      } else if (orderType === "delivery") {
        ordersList = await shopify.orders.list(`query: "tag:delivery AND created_at:>=${startDate}"`)
      } else if (orderType === "pickup") {
        ordersList = await shopify.orders.list(`query: "tag:pickup AND created_at:>=${startDate}"`)
      }
      console.log("[getFulfillmentCounts] ordersList", ordersList?.map((order: any) => order.name))
      if (!ordersList || ordersList?.length === 0) {
        return {
          errors: [`No orders found in the last ${daysAgo} days`],
          countsData: [],
        }
      }

      // Get all menu zones
      const menuZones = await shopify.metaobjects.get('menu_zone')
      let errors: { order_number: string, error: string }[] = []
      const countsData: any[] = []

      // Get orders for the delivery date from ShipStation from delivery date back to days ago before today
      const now = new Date()
      // Add one day to the end date to include orders created on the next day
      const endDate = (new Date(new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])).toISOString().split('T')[0]
      console.log("[getFulfillmentCounts] startDate", startDate)
      console.log("[getFulfillmentCounts] endDate", endDate)
      const shipStationOrders = await shipStation.orders.listAll(`?createDateStart=${startDate}&createDateEnd=${endDate}`)
      console.log("[getFulfillmentCounts] shipStationOrders length", shipStationOrders?.length)

      for (let order of ordersList || []) {

        let errorsForOrder: { order_number: string, error: string }[] = []

        // Push an error if no zip code and the order is not refunded yet
        if (!order.shippingAddress?.zip) {
          if (order.displayFinancialStatus !== "REFUNDED") {
            errorsForOrder.push({
              order_number: order.name || "",
              error: `No zip code found for order ${order.name || ""}`
            })
          }
        }

        // Get shipment zone for the order
        const shipmentZones = await getShipmentZone({
          destinationZip: order.shippingAddress?.zip || "",
          lineItems: order.lineItems?.nodes || [],
          menuZones: menuZones as MenuZone[]
        })

        // Push an error if no menu zone and the order is not refunded yet
        if (!shipmentZones) {
          if (order.displayFinancialStatus !== "REFUNDED") {
            errorsForOrder.push({
              order_number: order.name || "",
              error: `No menu zone found for order ${order.name || ""}`
            })
          }
        }


        // Get the menu zone and calculate the ship by date
        const deliveryDate = order.customAttributes?.find((attr: any) => attr.key === "Delivery Date")?.value

        if (!deliveryDate && orderType === "Subscription") {
          console.log(`[getFulfillmentCounts] No delivery date found for order ${order.name}`)
          continue
        } else {
          console.log(`[getFulfillmentCounts][${order.name}] Delivery date found:`, deliveryDate)
        }

        const menuZone: MenuZone = shipmentZones.menuZone
        const leadTime = menuZone?.shipping_lead_time ? Number(menuZone.shipping_lead_time) : 24
        const shipByDate = deliveryDate && new Date(new Date(deliveryDate || "").getTime() - leadTime * 60 * 60 * 1000)
        const createdAt = new Date(order.createdAt || "")
        const shipStationOrder = shipStationOrders?.find((shipStationOrder: any) => shipStationOrder.orderNumber === order.name)
        const shipStationOrderId = shipStationOrder?.orderId

        if (!shipStationOrderId) {
          errorsForOrder.push({
            order_number: order.name || "",
            error: `No ShipStation order found for order ${order.name}`
          })
        }

        // Check that the order has a delivery date note attribute
        const deliveryDateNote = order.customAttributes?.find((attr: any) => attr.key === "Delivery Date")
        if (!deliveryDateNote) {
          errorsForOrder.push({
            order_number: order.name || "",
            error: `No delivery date note found for order ${order.name}`
          })
        }

        // Check if the line item sku is ending with a YYYY-MM-DD date pattern, if it does, return an error
        if (order.lineItems?.nodes?.some((lineItem: any) => lineItem?.sku?.match(/\d{4}-\d{2}-\d{2}$/))) {
          errorsForOrder.push({
            order_number: order.name || "",
            error: `Order has local delivery skus`
          })
        }

        // console.log("================================================")
        // console.log(`[${order.name}] Menu Zone:`, menuZone?.title)
        // console.log(`[${order.name}] Delivery Date`, deliveryDate)
        // console.log(`[${order.name}] Shipping Lead Time:`, leadTime)
        // console.log(`[${order.name}] Ship By Date:`, shipByDate.toISOString().split('T')[0])

        // return { test: true }

        // For each line item, return a line
        for (let lineItem of order.lineItems?.nodes || []) {
          countsData.push({
            order_number: order.name || "",
            shopify_id: `=HYPERLINK("https://admin.shopify.com/store/${store}/orders/${order.id?.toString().split("/").pop()}", "${order.id?.toString().split("/").pop()}")`,
            shipstation_id: shipStationOrderId ? `=HYPERLINK("https://ship14.shipstation.com/orders/all-orders-search-result?quickSearch=${order.name}", ${shipStationOrderId || "MISSING"})` : "MISSING",
            financial_status: order.displayFinancialStatus,
            fulfillment_status: order.displayFulfillmentStatus,
            menu_zone: menuZone?.title || "MISSING",
            zip: `'${order.shippingAddress?.zip}` || "MISSING",
            order_date: createdAt.toISOString().split('T')[0],
            delivery_date: deliveryDate || "MISSING",
            ship_by_date: shipByDate ? shipByDate.toISOString().split('T')[0] : "",
            line_item_title: lineItem.title,
            line_item_sku: lineItem.sku,
            line_item_servings: lineItem.name.split(" - ")[1] || "2",
            line_item_quantity: lineItem.quantity,
            recipient_name: `${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}`,
            recipient_email: order.email,
            recipient_phone: order.shippingAddress?.phone,
            tags: order.tags,
            errors: errorsForOrder.map((error) => error.error).join(", "),
          })
        }

        errors = errors.concat(errorsForOrder)
      }

      // return ordersList

      // console.log("countsData", countsData)

      return {
        errors,
        countsData,
      }
    }
  }
}
