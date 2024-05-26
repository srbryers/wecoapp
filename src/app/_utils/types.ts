import React from "react"

export type ModalProps = {
  title?: string
  description?: string
  children: React.ReactNode
  visible?: boolean
  onClose?: () => void
}

export type ShippingProfile =  {
  id?: string
  service_name: string
  description: string
  service_code: string
  currency: string
  total_price: number
  phone_required?: boolean
  min_delivery_date?: string
  max_delivery_date?: string
}

export type CarrierServiceResponse = ShippingProfile

export type CarrierServiceRequest = {
  rate: {
    origin: {
      [key: string]: string | number
    }
    destination: {
      [key: string]: string | number
    }
    items: {
      [key: string]: string | number
    }[]
    currency: string
    locale: string
  }
}

export type PageLayoutProps = {
  children: React.ReactNode
  title?: string
  description?: string
}