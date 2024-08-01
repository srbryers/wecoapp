'use client'
import { FC } from 'react'
import Button from '@/app/components/Button'
import { CarrierService } from '@/app/utils/types'
import CustomLink from '@/app/components/CustomLink'

type CarrierServicesProps = {
  className?: string
  carrierServices: CarrierService[]
}

const CarrierServices: FC<CarrierServicesProps> = (props) => {

  const sortedCarrierServices = props.carrierServices.sort((a, b) => a.active === b.active ? 0 : a.active ? -1 : 1)

  return (
    <div id="fulfillment-services" className={`flex flex-col gap-4 ${props.className}`}>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Carrier Services</h2>
        <p className="text-sm">Manage carrier services for Shopify.</p>
      </div>
      <div className="flex flex-row flex-wrap gap-4 w-full">
        {/* List Services */}
        {sortedCarrierServices?.length > 0
          ?
          sortedCarrierServices.map((service, index) => {
            return service && (
              <div 
                key={`service-${index}`} 
                className={`flex flex-col gap-2 p-4 rounded-md min-w-[300px] ${!service.active ? 'bg-gray-800' : 'bg-blue-950'}`}
                >
                <div className="service-details flex flex-col gap-2">
                  <p className="text-sm font-bold">{service.name}</p>
                  <p className="text-xs"><b>ID:</b> {service.id}</p>
                  <p className="text-xs"><b>Active:</b> {service.active ? 'Yes' : 'No'}</p>
                </div>
                <div className="service-actions flex flex-row gap-2">
                  <CustomLink href={`shopify/carrierService/${service.legacy_id}`}>View</CustomLink>
                  <CustomLink href={`shopify/carrierService/${service.legacy_id}/edit`}>Edit</CustomLink>
                </div>
              </div>
            )
          })
            :
            <p className="text-sm">No fulfillment services found.</p>
        }
      </div>
      <div className="actions flex flex-row flex-wrap gap-4">
        {/* Create a service */}
        <Button label="Create Carrier Service"/>
      </div>
    </div>
  )
}

export default CarrierServices