import { FC } from 'react'
import Button from '../global/button'
import { ShippingProfile } from '@/app/_utils/types'
import { useSetAtom } from 'jotai'
import { modalAtom } from '@/app/_utils/atoms'
import Form from '../forms/form'
import Input from '../forms/input'
import { formatKeyToTitle } from '@/app/_utils/helpers'
import useShippingProfiles, { defaultShippingProfile, shippingProfileRequiredFields } from '@/app/_utils/firestore/shipping_profiles'

type ShippingProfilesProps = {
  className?: string
}

const ShippingProfiles: FC<ShippingProfilesProps> = ({ className }) => {

  const setModal = useSetAtom(modalAtom)

  const { 
    createShippingProfile, 
    updateShippingProfile, 
    deleteShippingProfile,
    shippingProfiles,
    loadingProfiles
  } = useShippingProfiles()

  const ModalContent = ({ data }: { data?: ShippingProfile }) => {
    return (
      <Form onSubmit={(form) => {
        if (data?.id) {
          form.id = data.id
          updateShippingProfile(form)
        } else {
          createShippingProfile(form)
        }
      }} className="max-w-sm mt-4">
        {Object.entries(data || {}).map(([key, value], index) => {
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
        <Button label={`${data?.id ? "Update" : "Create"} Fulfillment Service`} type="submit" />
      </Form>
    )
  }

  const showModal = (data?: ShippingProfile) => {
    console.log('Create a fulfillment service', data)
    setModal({
      visible: true,
      title: 'Create Shipping Profile',
      description: 'Create a custom shipping profile for Shopify.',
      children: <ModalContent data={data} />,
    })
  }

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
                  <Button label="Edit" className="text-xs" onClick={() => {
                    showModal(profile)
                  }} />
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
          showModal(defaultShippingProfile)
        }} />
      </div>
    </div>
  )
}

export default ShippingProfiles
