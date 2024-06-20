import { modalAtom } from '@/app/_utils/atoms'
import { useSetAtom } from 'jotai'
import { FC, useEffect, useState } from 'react'
import Form from '../forms/form'
import Input from '../forms/input'
import Button from '../global/button'
import useShopifyCarrierServices from '@/app/_utils/shopify/carrierServices'
import { CarrierService } from '@/app/_utils/shopify/api'
import { formatKeyToTitle } from '@/app/_utils/helpers'
import { CarrierServiceRequest } from '@/app/_utils/types'

import '@/app/_assets/example-carrierRequest.json'
import TestCarrierService from './TestCarrierService'

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

  /* Local State */
  const [activeCarrierService, setActiveCarrierService] = useState<CarrierService | undefined>(undefined)
  const [carrierServiceUrl, setCarrierServiceUrl] = useState<string>('')
  const [activeModal, setActiveModal] = useState<string>('')

  useEffect(() => {
    /**
   * Test sending data to the carrier service
   */
    const testCarrierService = async (service: CarrierService, request: CarrierServiceRequest) => {
      console.log('Test carrier service', service)
      const serviceUrl = service && (process.env.NODE_ENV === 'development' && service.callback_url ? 
                service.callback_url.replace(/(https?:\/\/)(.*?)(\/.*)/g, '' + '$3') : service.callback_url) || ''
      // If local, replace hostname with localhost
      if (!serviceUrl) {
        alert('Service URL is missing.')
        return
      } else {
        const result = await fetch(serviceUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        })
        const data = await result.json()
        console.log('Carrier service response', data)
      }
    }
    /**
   * Show the carrier service modal
   * @param data CarrierService
   */
    const showCarrierServiceModal = (data?: CarrierService) => {
      console.log('Create a carrier service', data)
      setModal({
        visible: true,
        title: 'Create Carrier Service',
        description: 'Create a custom carrier service for Shopify.',
        onClose: () => { setActiveCarrierService(undefined); setActiveModal(''); },
        children: (
          <Form onSubmit={(form) => {

            console.log("submit carrier service", form)
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
                    <Input
                      key={`input-${index}`}
                      label={formatKeyToTitle(key)}
                      type="checkbox"
                      name={key}
                      checked={value}
                    />
                  )
                }
              })}
            </div>
            <Button label={`${data ? "Update" : "Create"} Carrier Service`} type="submit" />
          </Form>
        )
      })
    }

    /**
     * Show the test carrier service modal
     */
    const showTestCarrierServiceModal = () => {
      const services = carrierServices.filter(service => service.callback_url !== undefined)
      const exampleCarrierServiceRequest = require('@/app/_assets/example-carrierRequest.json')
      let serviceUrl = services[0]?.callback_url
      setModal({
        visible: true,
        title: 'Test Carrier Service',
        description: 'Test a carrier service with a sample request.',
        onClose: () => { setActiveCarrierService(undefined); setActiveModal('') },
        children: (
          <Form onSubmit={(form) => {
            const service = carrierServices.find(service => service.id === Number(form.service))
            service && testCarrierService(service, exampleCarrierServiceRequest)
          }} className="max-w-sm mt-4">
            <select name="service" className="p-2 border border-black text-black rounded-[4px]" onChange={(e) => {
              const service = carrierServices.find(service => service.id === Number(e.target.value))
              setCarrierServiceUrl(service?.callback_url || '')
            }}>
              {/* Only show carrier services that have a callback URL */}
              {services.map((service, index) => {
                return (
                  <option key={`service-${index}`} value={service.id}>{service.name}</option>
                )
              }
              )}
            </select>
            <p className="text-xs"><b>Endpoint:</b> {carrierServiceUrl || serviceUrl || "N/A"}</p>
            <Button label="Test Carrier Service" type="submit" />
          </Form>
        )
      })
    }
    if (activeModal === 'testCarrierService') {
      showTestCarrierServiceModal()
    }
    if (activeModal === 'createCarrierService') {
      showCarrierServiceModal(activeCarrierService)
    }
  }, [activeModal, activeCarrierService, carrierServices, createCarrierService, updateCarrierService, setModal, deleteCarrierService, carrierServiceUrl])

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
                    setActiveCarrierService(service)
                    setActiveModal('createCarrierService')
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
      <div className="actions flex flex-row flex-wrap gap-4">
        {/* Create a service */}
        <Button label="Create Carrier Service" onClick={() => {
          setActiveModal('createCarrierService')
        }} />
        {/* Test a service */}
        <TestCarrierService />
      </div>
    </div>
  )
}

export default CarrierServices