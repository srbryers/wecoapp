import { CarrierServiceRequest, CarrierServiceResponse } from "@/app/_utils/types"
import Form from "../forms/form"
import Input from "../forms/input"
import Button from "../global/button"
import { FC, useEffect, useState } from "react"
import useShopifyCarrierServices from "@/app/_utils/shopify/carrierServices"
import { modalAtom } from "@/app/_utils/atoms"
import { useSetAtom } from "jotai"

type TestCarrierServiceProps = {
  className?: string
}

const TestCarrierService: FC<TestCarrierServiceProps> = ({ className }) => {

  const setModal = useSetAtom(modalAtom)
  const [activeModal, setActiveModal] = useState<string | undefined>()
  const [testRates, setTestRates] = useState<CarrierServiceResponse[]>()
  const [testRateType, setTestRateType] = useState<"manual" | "shopify_order" | "shopify_draft_order">("manual")
  const [testOrderID, setTestOrderID] = useState<string>()

  const {
    testCarrierService
  } = useShopifyCarrierServices()

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
          setTestRates(await testCarrierService(request))
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
          const res = await testCarrierService({ shopify_order_id: form.shopify_order_id })
          console.log("res", res)
          setTestRates(res)
        }} className="md:w-[300px] mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold">Shopify Store</label>
            <select name="shopify_store" required className="text-black py-3 px-2 rounded-[4px]" defaultValue="e97e57-2">
              <option value="e97e57-2">e97e57-2</option>
            </select>
          </div>
          <Input label="Shopify Order ID" type="text" name="shopify_order_id" required />
          <Button label="Test Shipping Rate" type="submit" />
        </Form>
      )
    }
    const TestShopifyDraftOrderForm = () => {
      return (
        <Form onSubmit={async (form) => {
          const res = await testCarrierService({ shopify_draft_order_id: form.shopify_draft_order_id })
          console.log("res", res)
          setTestRates(res)
        }} className="md:w-[300px] mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold">Shopify Store</label>
            <select name="shopify_store" required className="text-black py-3 px-2 rounded-[4px]" defaultValue="e97e57-2">
              <option value="e97e57-2">e97e57-2</option>
            </select>
          </div>
          <Input label="Shopify Draft Order ID" type="text" name="shopify_draft_order_id" required />
          <Button label="Test Shipping Rate" type="submit" />
        </Form>
      )
    }
    const TestRateForm = () => {
      switch (testRateType) {
        case "manual":
          return <TestManualRateForm />
        case "shopify_order":
          return <TestShopifyOrderForm />
        case "shopify_draft_order":
          return <TestShopifyDraftOrderForm />
      }
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
              setTestRateType("shopify_order")
            }} />
            <Button label="Shopify Draft Order" className="text-xs" onClick={() => {
              setTestRateType("shopify_draft_order")
            }} />
          </div>
          {/* Form & Output */}
          <div className="flex flex-row gap-4">
            {/* Test Rate Form */}
            <TestRateForm />
            {/* Test Rate Output */}
            <div className="md:w-[300px] flex flex-col gap-2 p-4 border rounded-md mt-4">
              <p className="text-sm font-bold">Test Rate Output</p>
              <div className="text-sm">
                {testRates ?
                  (testRates.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {testRates.map((rate, index) => (
                        <div key={`rate-${index}`} className="flex flex-col gap-1 border-b pb-2">
                          <p className="text-xs font-bold">{rate.service_name}</p>
                          <p className="text-xs">{rate.description}</p>
                          <p className="text-xs">Total Price: {(Number(rate.total_price)/100).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  ) : "No rates found.")
                  : "Output will appear here."
                }
              </div>
            </div>
          </div>
        </div>
      )
    }
    if (activeModal === "testCarrierService") {
      setModal({
        visible: true,
        title: 'Test Shipping Rate',
        description: 'Test a shipping rate for a shipment date or Shopify order.',
        children: <TestShippingRateModal />,
        onClose: () => { setActiveModal(undefined) }
      })
    }
  }, [activeModal, setModal, testRates, testRateType, testCarrierService])

  return (
    <div id="test-carrier-service" className={`flex flex-col gap-4 ${className}`}>
      <Button label="Test Carrier Service" onClick={() => setActiveModal("testCarrierService")} />
    </div>
  )
}

export default TestCarrierService
