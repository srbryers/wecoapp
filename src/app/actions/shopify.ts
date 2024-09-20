import { CarrierService, LineItem, Order, CarrierServiceRequest, CarrierServiceResponse } from "@/app/utils/types"
import { shopifyAdminApiRest, shopifyAdminApiGql } from "@/app/utils/shopify"
import { delay } from "../utils/helpers"
import { klaviyo } from "./klaviyo"

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
      console.log("res", res.carrierServices.edges)

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
    list: async (params?: string) => {
      return await shopifyAdminApiGql(
        `
        query {
          orders(first: 250 ${params || ''}) {
            nodes {
              id
              name
              createdAt
            }
          }
        }
        `
      )
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
}