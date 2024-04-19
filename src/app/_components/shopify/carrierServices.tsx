import { modalAtom } from '@/app/_utils/atoms'
import { useSetAtom } from 'jotai'
import { FC } from 'react'
import Form from '../forms/form'
import Input from '../forms/input'
import Button from '../global/button'
import useShopifyCarrierServices from '@/app/_utils/shopify/carrierServices'
import { CarrierService } from '@/app/_utils/shopify/api'
import { formatKeyToTitle } from '@/app/_utils/helpers'

type CarrierServicesProps = {
  className?: string
}

const CarrierServices: FC<CarrierServicesProps> = ({ className }) => {

  const setModal = useSetAtom(modalAtom)
  const {
    carrierServices,
    loadingCarrierServices,
    createCarrierService,
    updateCarrierService,
    deleteCarrierService
  } = useShopifyCarrierServices()

  const showCarrierServiceModal = (data?: CarrierService) => {
    console.log('Create a fulfillment service', data)
    setModal({
      visible: true,
      title: 'Create Fulfillment Service',
      description: 'Create a custom fulfillment service for Shopify.',
      children: (
        <Form onSubmit={(form) => {
          if (data?.id) {
            form.id = data.id
            updateCarrierService(form)
          } else {
            createCarrierService(form)
          }
        }} className="max-w-sm mt-4">
          <Input label="Name" type="text" placeholder="Name" name="name" required defaultValue={data?.name} />
          <Input label="Callback URL" type="text" placeholder="Callback URL" name="callback_url" required defaultValue={data?.callback_url} />
          <Input label="Format" type="hidden" placeholder="Format" name="format" value="json" readOnly />
          <div className="checkboxes flex flex-row flex-wrap gap-3">
            {Object.entries(data || {}).map(([key, value], index) => {
              if (typeof value === 'boolean') {
                return (
                  <Input key={`input-${index}`} label={formatKeyToTitle(key)} type="checkbox" name={key} checked={value} />
                )
              }
            })}
          </div>
          <Button label={`${data ? "Update" : "Create"} Carrier Service`} type="submit" />
        </Form>
      )
    })
  }

  return (
    <div id="fulfillment-services" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Carrier Services</h2>
        <p className="text-sm">Manage carrier services for Shopify.</p>
      </div>
      <div className="flex flex-row flex-wrap gap-4 w-full">
        {/* List Services */}
        {carrierServices.length > 0
          ?
          carrierServices.map((service, index) => {
            return service && (
              <div key={`service-${index}`} className="flex flex-col gap-2 p-4 bg-blue-950 rounded-md min-w-[300px]">
                <div className="service-details flex flex-col gap-2">
                  <p className="text-sm font-bold">{service.name}</p>
                  <p className="text-xs"><b>ID:</b> {service.id}</p>
                </div>
                <div className="service-actions flex flex-row gap-2">
                  <Button label="Edit" className="text-xs" onClick={() => {
                    showCarrierServiceModal(service)
                  }} />
                  <Button label="Delete" className="text-xs" onClick={() => {
                    if (confirm("Are you sure you want to delete this fulfillment service?")) {
                      deleteCarrierService(service)
                    }
                  }} />
                </div>
              </div>
            )
          })
          :
          loadingCarrierServices
            ?
            <p className="text-sm">Loading fulfillment services...</p>
            :
            <p className="text-sm">No fulfillment services found.</p>
        }
      </div>
      <div className="actions">
        {/* Create a service */}
        <Button label="Create Carrier Service" onClick={() => {
          showCarrierServiceModal()
        }} />
      </div>
    </div>
  )
}

export default CarrierServices