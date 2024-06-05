import { FC, useEffect, useState } from 'react'
import Button from '../global/button'
import { CarrierServiceRequest, CarrierServiceResponse, ShippingProfile, ShippingRate } from '@/app/_utils/types'
import { useSetAtom } from 'jotai'
import { modalAtom } from '@/app/_utils/atoms'
import Form from '../forms/form'
import Input from '../forms/input'
import { formatKeyToTitle } from '@/app/_utils/helpers'
import useShippingProfiles, { defaultShippingProfile, shippingProfileRequiredFields, shippingRateRequiredFields } from '@/app/_utils/firestore/shipping_profiles'

type ShippingProfilesProps = {
  className?: string
}

type ShippingProfilesModals = "shippingProfile" | "shippingRate" | "testShippingRate"

const ShippingProfiles: FC<ShippingProfilesProps> = ({ className }) => {

  const setModal = useSetAtom(modalAtom)
  const [activeShippingProfile, setActiveShippingProfile] = useState<ShippingProfile>()
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>()
  const [testRates, setTestRates] = useState<CarrierServiceResponse[]>()
  const [testRateType, setTestRateType] = useState<"manual" | "shopify">("manual")
  const [testOrderID, setTestOrderID] = useState<string>()
  const [activeModal, setActiveModal] = useState<ShippingProfilesModals>()

  const {
    createShippingProfile,
    updateShippingProfile,
    deleteShippingProfile,
    testShippingProfile,
    shippingProfiles,
    loadingProfiles
  } = useShippingProfiles()

  const showShippingProfileModal = (data?: ShippingProfile) => {
    console.log('Create a shipping profile')
    setActiveShippingProfile(data)
    setActiveModal("shippingProfile")
  }

  const showShippingRateModal = (data?: ShippingProfile) => {
    setShippingRates(data?.rates || [])
    setActiveShippingProfile(data)
    setActiveModal("shippingRate")
  }

  const showTestShippingRateModal = () => {
    console.log('Test Shipping Rate')
    setActiveShippingProfile(defaultShippingProfile)
    setActiveModal("testShippingRate")
  }

  /**
   * Handle the shipping profile modal
   */
  useEffect(() => {
    const ModalContent = () => {
      return (
        <Form onSubmit={(form) => {
          if (activeShippingProfile?.id) {
            form.id = activeShippingProfile.id
            updateShippingProfile(form)
          } else {
            createShippingProfile(form)
          }
        }} className="max-w-sm mt-4">
          {Object.entries(activeShippingProfile || {}).map(([key, value], index) => {
            // Check if field is required in the Type
            const required = shippingProfileRequiredFields.includes(key)
            // Return if format or id field
            if (key === 'format' || key === 'id') return null
            if (typeof value === 'string') {
              return (
                <Input
                  key={`input-${index}`}
                  label={formatKeyToTitle(key)}
                  type="text"
                  name={key}
                  defaultValue={value}
                  required={required}
                />
              )
            }
            if (typeof value === 'boolean') {
              return (
                <Input
                  key={`input-${index}`}
                  label={formatKeyToTitle(key)}
                  type="checkbox"
                  name={key}
                  checked={value}
                  required={required}
                />
              )
            }
          }
          )}
          <Input label="Format" type="hidden" placeholder="Format" name="format" value="json" readOnly className="hidden" />
          <Button label={`${activeShippingProfile?.id ? "Update" : "Create"} Fulfillment Service`} type="submit" />
        </Form>
      )
    }
    if (activeShippingProfile && activeModal === "shippingProfile") {
      setModal({
        visible: true,
        title: 'Create Shipping Profile',
        description: 'Create a custom shipping profile for Shopify.',
        children: <ModalContent />,
        onClose: () => { setActiveShippingProfile(undefined); setShippingRates(undefined); setActiveModal(undefined) }
      })
    } else {
      setModal(null)
    }
  }, [activeModal, activeShippingProfile, createShippingProfile, setModal, updateShippingProfile])

  /**
   * Shipping Rate Modal
   */
  useEffect(() => {
    const ShippingRateModal = () => {
      return (
        <Form
          onSubmit={(form) => {
            const ratesArray = shippingRates || []
            Object.entries(form).forEach(([key, value]) => {
              const rateKey = key.split("-")[0] 
              const rateIndex = key.split("-")[1] as unknown as number
              ratesArray[rateIndex] = {
                ...ratesArray[rateIndex],
                [rateKey]: value
              }
            })
            if (activeShippingProfile?.id) {
              const newShippingProfile = activeShippingProfile
              newShippingProfile.rates = ratesArray as ShippingRate[]
              updateShippingProfile(newShippingProfile)
            } else {
              console.error("No active shipping profile found.")
            }
          }}
          className="max-w-sm mt-4 !gap-2">
          {shippingRates && shippingRates.length > 0 && <p className="text-sm font-bold">Rates</p>}
          <div key={`input-rates`} className="flex flex-col gap-4 max-w-lg">
            {shippingRates && shippingRates?.map((rate, i) => (
              <div key={`rate-${i}`} className="flex flex-row gap-2 flex-wrap border rounded-md p-4">
                {Object.entries(rate).map(([rateKey, rateValue], j) => (
                  <Input
                    key={`rate-${i}-${j}`}
                    label={formatKeyToTitle(rateKey)}
                    type="text"
                    name={`${rateKey}-${i}`}
                    defaultValue={rateValue as string}
                    required={shippingRateRequiredFields.includes(rateKey)}
                  />
                ))}
                {/* Delete Rate */}
                <Button
                  label="Remove Rate"
                  type="button"
                  className="flex-none w-full mt-2"
                  onClick={() => {
                    const newRates = shippingRates.filter((rate, index) => index !== i)
                    setShippingRates(newRates)
                  }}
                />
              </div>
            ))}
            {/* Save Rates */}
            <Button
              label="Save Shipping Rates"
              type="submit"
              className=""
            />
            {/* Add a rate */}
            <Button
              label="Add New Rate"
              type="button"
              className=""
              onClick={() => {
                const newRate = {
                  title: '',
                  type: 'price',
                  min: 0,
                  max: 0,
                  price: 0
                } as ShippingRate
                // Add a rate
                setShippingRates([
                  ...shippingRates || [],
                  newRate
                ])
              }} />
          </div>
        </Form>
      )
    }
    if (shippingRates && activeShippingProfile && activeModal === "shippingRate") {
      console.log("set shipping rate modal")
      setModal({
        visible: true,
        title: 'Add a shipping rate',
        description: 'Create a custom rate for a shipping profile.',
        children: <ShippingRateModal />,
        onClose: () => { setActiveShippingProfile(undefined); setShippingRates(undefined); setActiveModal(undefined) }
      })
    }
  }, [activeModal, setModal, shippingRates, activeShippingProfile, updateShippingProfile])

  /**
   * Test Shipping Rate Modal
   */
  useEffect(() => {
    const TestManualRateForm = () => {
      return (
        <Form onSubmit={async (form) => {
          const request: CarrierServiceRequest = {
            rate: {
              origin: {
                country: "US",
                postal_code: "02110",
                province: "MA"
              },
              destination: {
                country: form.shipment_country,
                postal_code: form.shipment_postal_code,
                province: form.shipment_province
              },
              items: [
                {
                  quantity: form.shipment_quantity,
                  weight: 0,
                  price: form.shipment_price
                }
              ],
              currency: "USD",
              locale: "en"
            }
          }
          setTestRates(await testShippingProfile(request))
        }} className="md:w-[300px] mt-4">
          <Input label="Shipment Country" type="text" name="shipment_country" required />
          <Input label="Shipment Postal Code" type="text" name="shipment_postal_code" required />
          <Input label="Shipment Province" type="text" name="shipment_province" required />
          <Input label="Shipment Date" type="date" name="shipment_date" required />
          <Input label="Shipment Price" type="number" name="shipment_price" step=".01" required />
          <Input label="Shipment Quantity" type="number" name="shipment_quantity" required />
          <Button label="Test Shipping Rate" type="submit" />
        </Form>
      )
    }
    const TestShopifyOrderForm = () => {
      return (
        <Form onSubmit={async (form) => {
          setTestRates(await testShippingProfile({ shopify_order_id: form.shopify_order_id }))
        }} className="md:w-[300px] mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold">Shopify Store</label>
            <select name="shopify_store" required className="text-black py-3 px-2 rounded-[4px]">
              <option value="e97e57-2" selected>e97e57-2</option>
            </select>
          </div>
          <Input label="Shopify Order ID" type="text" name="shopify_order_id" required />
          <Button label="Test Shipping Rate" type="submit" />
        </Form>
      )
    }
    const TestShippingRateModal = () => {
      return (
        <div className="flex flex-col gap-2">
          {/* Select Form Type */}
          <div className="flex flex-row gap-4 mt-4">
            <Button label="Manual Rate" className="text-xs" onClick={() => {
              setTestRateType("manual")
            }} />
            <Button label="Shopify Order" className="text-xs" onClick={() => {
              setTestRateType("shopify")
            }} />
          </div>
          {/* Form & Output */}
          <div className="flex flex-row gap-4">
            {/* Test Rate Form */}
            {testRateType === "manual" ? <TestManualRateForm /> : <TestShopifyOrderForm />}
            {/* Test Rate Output */}
            <div className="md:w-[300px] flex flex-col gap-2 p-4 border rounded-md mt-4">
              <p className="text-sm font-bold">Test Rate Output</p>
              <p className="text-sm">
                {testRates ?
                  (testRates.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {testRates.map((rate, index) => (
                        <div key={`rate-${index}`} className="flex flex-col gap-1 border-b pb-2">
                          <p className="text-xs font-bold">{rate.service_name}</p>
                          <p className="text-xs">{rate.description}</p>
                          <p className="text-xs">Total Price: {rate.total_price}</p>
                        </div>
                      ))}
                    </div>
                  ) : "No rates found.")
                  : "Output will appear here."
                }
              </p>
            </div>
          </div>
        </div>
      )
    }
    if (activeModal === "testShippingRate") {
      setModal({
        visible: true,
        title: 'Test Shipping Rate',
        description: 'Test a shipping rate for a shipment date or Shopify order.',
        children: <TestShippingRateModal />,
        onClose: () => { setActiveShippingProfile(undefined); setActiveModal(undefined) }
      })
    }
  }, [activeModal, activeShippingProfile, setModal, testShippingProfile, testRates, testRateType])

  return (
    <div id="shipping-profiles" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Shipping Profiles</h2>
        <p className="text-sm">Manage custom shipping profiles for Shopify.</p>
      </div>
      <div className="flex flex-row gap-4 w-full">
        {/* List Fulfillment Services */}
        {shippingProfiles.length > 0
          ?
          shippingProfiles.map((profile, index) => {
            return profile && (
              <div key={`service-${index}`} className="flex flex-col gap-2 p-4 bg-blue-950 rounded-md min-w-[300px]">
                <div className="service-details flex flex-col gap-2">
                  <p className="text-sm font-bold">{profile.service_name}</p>
                  <p className="text-xs">{profile.description}</p>
                  <p className="text-xs"><b>ID:</b> {profile.id}</p>
                </div>
                <div className="actions flex flex-row gap-2">
                  {/* Shipping Profile: Edit */}
                  <Button label="Edit Profile" className="text-xs" onClick={() => {
                    showShippingProfileModal(profile)
                  }} />
                  {/* Shipping Profile: Edit Rates */}
                  <Button label="Edit Rates" buttonType="primary" className="text-xs" onClick={() => {
                    showShippingRateModal(profile)
                  }} />
                  {/* Shipping Profile: Test Rates */}
                  <Button label="Test Rates" className="text-xs" onClick={() => {
                    showTestShippingRateModal()
                  }} />
                  {/* Shipping Profile: Delete */}
                  <Button label="Delete" className="text-xs" onClick={() => {
                    if (confirm("Are you sure you want to delete this fulfillment service?")) {
                      deleteShippingProfile(profile)
                    }
                  }} />
                </div>
              </div>
            )
          })
          :
          loadingProfiles
            ?
            <p className="text-sm">Loading shipping profiles...</p>
            :
            <p className="text-sm">No Shipping Profiles found.</p>
        }
      </div>
      {/* Actions */}
      <div className="flex flex-row gap-2">
        <Button buttonType="primary" type="button" label="Add Profile" onClick={() => {
          showShippingProfileModal(defaultShippingProfile)
        }} />
      </div>
    </div>
  )
}

export default ShippingProfiles
