import React from "react"

export type ModalProps = {
  title?: string
  description?: string
  children: React.ReactNode
  visible?: boolean
}

export type CarrierServiceResponse = {
  service_name: string
  description: string
  service_code: string
  currency: string
  total_price: number
  phone_required?: boolean
  min_delivery_date?: string
  max_delivery_date?: string
}

export type PageLayoutProps = {
  children: React.ReactNode
  title?: string
  description?: string
}