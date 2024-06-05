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


  return {
    createShippingProfile,
    updateShippingProfile,
    deleteShippingProfile,
    shippingProfiles,
    setShippingProfiles,
    loadingProfiles,
  }
}

export default useShippingProfiles;