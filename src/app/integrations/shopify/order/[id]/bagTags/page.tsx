"use client"
import { BagTags } from "@/app/documents/BagTags";
import { useEffect, useState } from "react";
import { shopify } from "@/app/actions/shopify";
import { cigo } from "@/app/actions/cigo";

export default function Page({ params }: { params: { id: string } }) {

  const [order, setOrder] = useState<any>(null)
  const [deliveryDates, setDeliveryDates] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const orderData = await shopify.orders.list(`query: "id:${params.id}"`)
      console.log("[BagTags] orderData", orderData)
      const order = orderData?.orders?.nodes?.[0]
      const deliveryDates = await cigo.helpers.getDeliveryDates(order)
      setOrder(order)
      setDeliveryDates(deliveryDates)
    }
    if (!order) {
      fetchData()
    }
  }, [params.id])

  const deliveryDate = deliveryDates?.[0]

  return order && deliveryDate && (
    <BagTags order={order} deliveryDate={deliveryDate} />
  )
}