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
  rates?: ShippingRate[]
}

export type ShippingRate = {
  title: string
  type: 'price' | 'weight' | 'quantity'
  min: number
  max: number
  price: number
  currency?: string
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
  className?: string
}

export type Query = {
  id?: string
  query: string
  name: string
  sheet_id?: string
  sheet_tab_name?: string
}

export interface FormValues {
  [key: string]: any
}

/**
 * Shopify Types
 */
export type FulfillmentService = {
  id?: number,
  name?: string,
  callback_url?: string,
  inventory_management?: boolean,
  tracking_support?: boolean,
  requires_shipping_method?: boolean,
  format?: string,
  permits_sku_sharing?: boolean,
  fulfillment_orders_opt_in?: boolean
}

export type CarrierService = {
  id?: number
  active?: boolean
  callback_url?: string
  name?: string
  service_discovery?: boolean
  carrier_service_type?: "api" | "legacy"
  legacy_id?: number
}

export type LineItem = {
  id?: number
  product_id?: number
  variant_id?: number
  quantity?: number
  price?: number
  title?: string
  sku?: string
  [key: string]: any
}

export type Address = {
  first_name?: string
  last_name?: string
  company?: string
  address1?: string
  address2?: string
  country?: string
  country_code?: string
  province?: string
  province_code?: string
  zip?: string
  city?: string
}

export type Order = {
  id?: number
  email?: string
  phone?: string
  name?: string
  shipping_address?: Address
  billing_address?: Address
  city?: string
  province?: string
  country?: string
  zip?: string
  currency?: string
  locale?: string
  line_items?: LineItem[]
}

export type MenuZone = {
  title: string
  zip_code_json?: string
  week_day_availability?: string[]
  shipping_service_name?: string
  cutoff_hours?: number
  cutoff_time?: string
  menu_type?: string
  free_shipping_minimum?: string
  shipping_cost?: string
}

export interface LoopSubscription {
  id: string
  customer: {
    id: number
    shopifyId: number
  }
  nextBillingDateEpoch: number
  deliveryPolicy: {
    interval: string
    intervalCount: number
  }
  shippingAddress: {
    firstName: string
    lastName: string
    provinceCode: string
    zip: string
  },
  action: React.ReactNode
}