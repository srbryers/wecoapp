import { modalAtom } from '@/app/_utils/atoms'
import { FulfillmentService } from '@/app/_utils/shopify/api'
import useShopifyFulfillmentServices from '@/app/_utils/shopify/fulfillmentServices'
import { useSetAtom } from 'jotai'
import { FC } from 'react'
import Form from '../forms/form'
import Input from '../forms/input'
import Button from '../global/button'
import { formatKeyToTitle } from '@/app/_utils/helpers'

type FulfillmentServicesProps = {
  className?: string
  fulfillmentServices: FulfillmentService[]
}

const FulfillmentServices: FC<FulfillmentServicesProps> = async (props) => {

  // const setModal = useSetAtom(modalAtom)
  // const {
  //   fulfillmentServices,
  //   loadingServices,
  //   createFulfillmentService,
  //   updateFulfillmentService,
  //   deleteFulfillmentService
  // } = useShopifyFulfillmentServices()

  // const FulfillmentServiceModal = ({ data }: { data?: FulfillmentService} ) => {
  //   return (
  //     <Form onSubmit={(form) => {
  //       if (data?.id) {
  //         form.id = data.id
  //         updateFulfillmentService(form)
  //       } else {
  //         createFulfillmentService(form)
  //       }
  //     }} className="max-w-sm mt-4">
  //       <Input label="Name" type="text" placeholder="Name" name="name" required defaultValue={data?.name} />
  //       <Input label="Callback URL" type="text" placeholder="Callback URL" name="callback_url" required defaultValue={data?.callback_url} />
  //       <Input label="Format" type="hidden" placeholder="Format" name="format" value="json" readOnly />
  //       <Input label="Fulfillment Orders Opt-in" type="checkbox" name="fulfillment_orders_opt_in" readOnly checked={true} />
  //       <div className="flex flex-row flex-wrap gap-3">
  //         {Object.entries(data || {}).map(([key, value], index) => {
  //           if (typeof value === 'boolean') {
  //             return (
  //               <Input key={`input-${index}`} label={formatKeyToTitle(key)} type="checkbox" name={key} checked={value} />
  //             )
  //           }
  //         })}
  //       </div>
  //       <Button label={`${data ? "Update" : "Create"} Fulfillment Service`} type="submit" />
  //     </Form>
  //   )
  // }

  // const showFulfillmentServiceModal = (data?: FulfillmentService) => {
  //   console.log('Create a fulfillment service', data)
  //   setModal({
  //     visible: true,
  //     title: 'Create Fulfillment Service',
  //     description: 'Create a custom fulfillment service for Shopify.',
  //     children: <FulfillmentServiceModal data={data} />,
  //   })
  // }

  return (
    <div id="fulfillment-services" className={`flex flex-col gap-4 ${props.className}`}>
      <div className="flex flex-col gap-2">
        <h2 className="text-base font-bold">Fulfillment Services</h2>
        <p className="text-sm">Manage custom fulfillment services for Shopify.</p>
      </div>
      {/* Fulfillment Services */}
      <div className="flex flex-row gap-4 w-full">
        {/* List Fulfillment Services */}
        {props.fulfillmentServices?.length > 0
          ?
          props.fulfillmentServices.map((service, index) => {
            return service && (
              <div key={`service-${index}`} className="flex flex-col gap-2 p-4 bg-blue-950 rounded-md min-w-[300px]">
                <div className="service-details flex flex-col gap-2">
                  <p className="text-sm font-bold">{service.name}</p>
                  <p className="text-xs"><b>ID:</b> {service.id}</p>
                </div>
                <div className="service-actions flex flex-row gap-2">
                  <Button label="Edit" className="text-xs" />
                  <Button label="Delete" className="text-xs"/>
                </div>
              </div>
            )
          })
          :
          <p className="text-sm">No fulfillment services found.</p>
        }
      </div>
      <div className="actions">
        {/* Create a fulfillment service */}
        <Button label="Create Fulfillment Service"/>
      </div>
    </div>
  )
}

export default FulfillmentServices