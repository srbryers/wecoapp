import { CarrierService } from "../_utils/shopify/api"
import { shopifyAdminApiRest, shopifyAdminApiGql } from "../utils/shopify"

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