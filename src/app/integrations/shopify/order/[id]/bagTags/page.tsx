"use client"
import BagTags from "@/app/documents/BagTags";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { shopify } from "@/app/actions/shopify";
import { cigo } from "@/app/actions/cigo";

const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  }
);

export default function Page({ params }: { params: { id: string } }) {

  const [order, setOrder] = useState<any>(null)
  const [deliveryDates, setDeliveryDates] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const order = await shopify.orders.get(params.id)
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
    <PDFViewer className="w-full h-full">
      <BagTags order={order} deliveryDate={deliveryDate} />
    </PDFViewer>
  )
}