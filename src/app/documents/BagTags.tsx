/**
 * Bag Tags
 * 1. Create bag tags from the order
 * 2. Turn the bag tags into a PDF
 * 3. Refer to this component to render the bag tags
 */
"use client"

import Image from "next/image"
import { Order } from "../utils/types"
import Link from "next/link"

export const BagTags = ({
  order,
  deliveryDate
}: {
  order: Order
  deliveryDate: string
}): JSX.Element => {

  const lineItems = order.line_items || order.lineItems?.nodes || []
  const phone = order?.customer?.phone || order?.billingAddress?.phone || order?.shippingAddress?.phone || ""

  return (
    <div className="flex flex-col bg-white text-black w-[600px] p-8 gap-4">
      {/* Header */}
      <div className="flex flex-col pb-4 border-b border-gray-300 relative">
        <h1 className="text-2xl font-bold mb-2">#{order.name}</h1>
        <div className="flex flex-row">
          <div className="flex-1">Customer</div>
          <div className="flex-1">{`${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`}</div>
        </div>
        <div className="flex flex-row">
          <div className="flex-1">Phone</div>
          <div className="flex-1">{formatPhone(phone) || ""}</div>
        </div>
        <div className="flex flex-row">
          <div className="flex-1">Delivery Date</div>
          <div className="flex-1">{new Date(deliveryDate).toLocaleDateString("en-US", { year: 'numeric', weekday: 'long', month: 'long', day: 'numeric' }) || ""}</div>
        </div>
        <div className="absolute top-0 right-0">
          <img src="/logo-square-green.png" alt="CIGO" width={60} height={60} />
        </div>
      </div>
      {/* Line Items */}
      <div className="flex flex-col gap-4 border-b border-gray-300 pb-4">
        <div className="flex flex-row justify-between w-full gap-8 text-xl font-bold">
          Your Menu
        </div>
        {lineItems.map((item, index) => (
          <div key={index} className="flex flex-row gap-4">
            <div className="image rounded-md h-[100px] w-[100px] min-w-[100px] overflow-hidden">
              <img src={item.image.url} alt={item.name} width={100} height={100} className="object-cover object-center h-full w-full" />
            </div>
            <div className="flex flex-row justify-between w-full gap-8 py-2">
              <div className="flex-1 max-w-[250px]">{item.name.split(" - ")[0]}</div>
              <div className="flex-1">{`x ${item.quantity}`}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Footer */}
      <div className="pb-4">
        Issues with your order? Reach out to us at <a href="mailto:weco@wecohospitality.com" className="font-bold text-black border-b-2 border-black">weco@wecohospitality.com</a>
      </div>
    </div>
  )
}