import { useEffect, useState } from "react";
import { CarrierServiceRequest, CarrierServiceResponse, ShippingProfile } from "../types";
import { useSetAtom } from "jotai";
import { modalAtom } from "../atoms";
import { LineItem, Order, shopify } from "../shopify/api";

export const defaultShippingProfile: ShippingProfile = {
  service_name: '',
  description: '',
  service_code: '',
  currency: '',
  total_price: 0,
  phone_required: false,
  rates: [
    {
      title: '',
      type: 'price',
      min: 0,
      max: 0,
      price: 0,
      currency: 'USD'
    }
  ]
}

export const shippingProfileRequiredFields = [
  'service_name',
  'description',
  'service_code',
  'currency',
  'total_price',
  'rates'
]

export const shippingRateRequiredFields = [
  'title',
  'type',
  'price'
]

const useShippingProfiles = () => {

  /* Global State */
  const setModal = useSetAtom(modalAtom)

  /* Local State */
  const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/database/shipping_profiles')
      const json = await res.json() as ShippingProfile[]
      setShippingProfiles(json)
      setLoadingProfiles(false)
      console.log("Finished fetching shipping profiles.")
    }
    if (loadingProfiles) {
      fetchData()
    }
  }, [
    loadingProfiles,
    shippingProfiles
  ])

  /**
   * Create a Shipping Profile
   * @param data ShippingProfile
   */
  const createShippingProfile = async (data: ShippingProfile) => {
    console.log('Creating shipping profile:', data)
    const profile = await fetch('/api/database/shipping_profiles', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    const json = await profile.json() as ShippingProfile
    console.log('Created shipping profile:', json)
    setShippingProfiles([...shippingProfiles, json])
    setModal(null)
  }

  /**
   * Update a Shipping Profile
   * @param data ShippingProfile
   */
  const updateShippingProfile = async (data: ShippingProfile) => {
    console.log('Updating shipping profile:', data)
    await fetch('/api/database/shipping_profiles', {
      method: 'PUT',
      body: JSON.stringify(data)
    }).then(async (res) => {
      return await res.json()
    })
      .catch((err) => console.error(err))
    const updatedProfiles = shippingProfiles.map((profile) => {
      return profile.id === data.id ? data : profile
    })
    setShippingProfiles(updatedProfiles)
    setModal(null)
  }

  /**
   * Delete a Shipping Profile
   * @param data ShippingProfile
   */
  const deleteShippingProfile = async (data: ShippingProfile) => {
    console.log('Deleting shipping profile:', data)
    const profile = await fetch('/api/database/shipping_profiles', {
      method: 'DELETE',
      body: JSON.stringify(data)
    })
    const json = await profile.json() as ShippingProfile
    console.log('Deleted shipping profile:', json)
    const updatedProfiles = shippingProfiles.filter((profile) => {
      return profile.id !== data.id
    })
    setShippingProfiles(updatedProfiles)
  }

  /**
   * Test a Shipping Profile
   * @param rateRequest CarrierServiceRequest
   * @returns CarrierServiceResponse
   */
  const testShippingProfile = async (rateRequest: CarrierServiceRequest | { shopify_order_id: string }) => {
    // Handle the case where we are testing a shipping profile with an order ID
    if ('shopify_order_id' in rateRequest) {
      // Get the shopify order from the API
      const res = (await shopify.orders.get(rateRequest.shopify_order_id)) as { order: Order }
      const order = res.order
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
              const shipment_date = item?.sku?.split("-")
              if (!shipment_date) {
                return
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
              }
            }).filter((value: any) => value !== undefined),
            currency: order.currency,
            locale: order.locale
          }
        }
        console.log('CarrierServiceRequests:', carrierServiceRequest)
        const carrierServiceResponse = await fetch('/api/shopify/carrierService', {
          method: 'POST',
          body: JSON.stringify(carrierServiceRequest)
        }).then(async (res) => {
          return await res.json()
        })
        console.log('Tested shipping profile:', carrierServiceResponse)
        return carrierServiceResponse as CarrierServiceResponse[]
      }
    } else {
      const res = await fetch('/api/shopify/carrierService', {
        method: 'POST',
        body: JSON.stringify(rateRequest)
      })
      const json = await res.json()
      console.log('Tested shipping profile:', json)
      return json as CarrierServiceResponse[]
    }
  }


  return {
    createShippingProfile,
    updateShippingProfile,
    deleteShippingProfile,
    testShippingProfile,
    shippingProfiles,
    setShippingProfiles,
    loadingProfiles,
  }
}

export default useShippingProfiles;