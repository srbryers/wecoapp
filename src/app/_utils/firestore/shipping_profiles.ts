import { useEffect, useState } from "react";
import { ShippingProfile } from "../types";
import { useSetAtom } from "jotai";
import { modalAtom } from "../atoms";

export const defaultShippingProfile: ShippingProfile = {
  service_name: '',
  description: '',
  service_code: '',
  currency: '',
  total_price: 0,
  phone_required: false,
}

export const shippingProfileRequiredFields = [
  'service_name',
  'description',
  'service_code',
  'currency',
  'total_price',
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
    const profile = await fetch('/api/database/shipping_profiles', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    const json = await profile.json() as ShippingProfile
    console.log('Updated shipping profile:', json)
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