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
  id?: string
  active?: boolean
  callbackUrl?: string
  name?: string
  serviceDiscovery?: boolean
  carrierServiceType?: "api" | "legacy"
  legacyId?: number
}

export type LineItem = {
  id?: number | string
  product_id?: number
  variant_id?: number
  quantity?: number
  price?: number
  title?: string
  sku?: string
  [key: string]: any
  variant?: {
    id: number
    title: string
  }
  product?: {
    id: number
    title: string
  }
  originalUnitPriceSet?: {
    presentmentMoney?: {
      amount?: string
    }
  }
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
  firstName?: string
  lastName?: string
  phone?: string
  countryCode?: string
  provinceCode?: string
}

export type Order = {
  id?: number
  email?: string
  phone?: string
  name?: string
  note?: string
  created_at?: string
  cancelled_at?: string
  createdAt?: string
  cancelledAt?: string
  processedAt?: string
  channelInformation?: {
    channelId: string
    app?: {
      title: string
    }
  }
  shipping_address?: Address
  shippingAddress?: Address
  billing_address?: Address
  billingAddress?: Address
  totalTaxSet?: {
    presentmentMoney?: {
      amount?: string
      currencyCode?: string
    }
  }
  shippingLine?: {
    title: string
    shippingRateHandle: string
    code: string
    source: string
    originalPriceSet?: {
      presentmentMoney?: {
        amount?: string
      }
    }
  }
  city?: string
  province?: string
  country?: string
  zip?: string
  currency?: string
  locale?: string
  status?: string
  line_items?: LineItem[]
  updated_at?: string
  updatedAt?: string
  fulfillment_status?: string
  fulfillmentStatus?: string
  displayFulfillmentStatus?: string
  displayFinancialStatus?: string
  totalPriceSet?: {
    presentmentMoney?: {
      amount?: string
    }
  }
  lineItems?: {
    nodes?: LineItem[]
  }
  customAttributes?: {
    key: string
    value: string
  }[]
  tags?: string[] | string
  note_attributes?: {
    name: string
    value: string
  }[]
  customer?: {
    id?: string | number
    email?: string
    phone?: string
    first_name?: string
    last_name?: string
    firstName?: string
    lastName?: string
  }
}

export type MenuZone = {
  title: string
  handle: string
  zip_code_json?: string
  week_day_availability?: string[]
  shipping_service_name?: string
  cutoff_hours?: number
  cutoff_time?: string
  menu_type?: string
  free_shipping_minimum?: string
  shipping_cost?: string
  shipping_lead_time?: string
  production_lead_time?: string
}

export interface LoopResponse {
  data: any
  code: string
  pageInfo?: {
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface LoopSubscriptionRequest {
  customerShopifyId: number
  nextBillingDateEpoch: number
  currencyCode: string
  paymentMethodId: string
  billingPolicy: {
    interval: "WEEK" | "MONTH" | "YEAR"
    intervalCount: number
  }
  deliveryPolicy: {
    interval: "WEEK" | "MONTH" | "YEAR"
    intervalCount: number
  }
  lines: {
    variantShopifyId: number
    quantity: number
  }
  shippingAddress: Address
}

export interface LoopSubscription {
  id: string
  shopifyId: string
  customer: {
    id: number
    shopifyId: number
  }
  nextBillingDateEpoch?: number
  nextOrderDateEpoch?: number
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
  customAttributes?: LoopCustomAttributes[]
  email?: string
  orders?: any[]
  sortedOrders?: Order[]
  lastOrder?: Order
  nextBillingDate?: Date
  nextBillingDateString?: string
  nextDeliveryDate?: Date
  nextDeliveryDateString?: string
  lastOrderDeliveryDate?: string
  nextOrderDeliveryDate?: string
  klaviyoProfile?: any
  klaviyoEvents?: any
}

export interface LoopCustomAttributes {
  key: string
  value: string
}

/**
 * Shipstation
 */
export interface ShipStationTags {
  tagId: number,
  name: string,
  color: string
}

export interface ShipStationAddress {
  name: string
  company?: string
  street1: string
  street2?: string
  street3?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  residential?: boolean
  readonly addressVerified?: string
}

export interface ShipStationWeight {
  value: number
  units: "pounds" | "ounces" | "grams"
}

export interface ShipStationDimensions {
  length: number
  width: number
  height: number
  units: "inches" | "centimeters"
}

export interface ShipStationInsuranceOptions {
  provider: "shipsurance" | "carrier" | "provider" | "xcover" | "parcelguard"
  insureShipment: boolean
  insuredValue: number
}

export interface ShipStationInternationalOptions {
  contents: "merchandise" | "documents" | "gift" | "returned_goods" | "sample"
}

export interface ShipStationAdvancedOptions {
  warehouseId?: number
  nonMachinable?: boolean
  saturdayDelivery?: boolean
  containsAlcohol?: boolean
  storeId?: number
  customField1?: string
  customField2?: string
  customField3?: string
  source?: string
  readonly mergedOrSplit?: boolean
  readonly mergedIds?: string[] 
  readonly parentId?: number
  billToParty?: "myaccount" | "my_other_account" | "recipient" | "thirdparty"
  billToAccount?: string
  billToPostalCode?: string
  billToCountryCode?: string
  billToMyOtherAccount?: string
}

export interface ShipStationOrderItem {
  orderItemId?: number
  lineItemKey?: string
  sku?: string
  name?: string
  imageUrl?: string
  weight?: ShipStationWeight
  quantity: number
  unitPrice: number
  taxAmount?: number
  shippingAmount?: number
  warehouseLocation?: string
  options?: {
    name: string
    value: string
  }[]
  productId?: number
  fulfillmentSku?: string
  adjustment?: boolean
  upc?: string
  readonly createDate?: string
  readonly modifyDate?: string
}

export interface ShipStationOrder {
  orderNumber: string
  orderKey?: string
  orderDate: string
  paymentDate?: string
  shipByDate?: string
  orderStatus: "awaiting_payment" | "awaiting_shipment" | "shipped" | "on_hold" | "cancelled" | "pending_fulfillment"
  customerUsername?: string
  customerEmail?: string
  billTo?: ShipStationAddress
  shipTo?: ShipStationAddress
  items?: ShipStationOrderItem[]
  amountPaid?: number
  taxAmount?: number
  shippingAmount?: number
  customerNotes?: string
  internalNotes?: string
  gift?: boolean
  giftMessage?: string
  paymentMethod?: string
  requestedShippingService?: string
  carrierCode?: string
  serviceCode?: string
  packageCode?: string
  confirmation?: "none" | "signature" | "adult_signature" | "direct_signature"
  shipDate?: string
  weight?: ShipStationWeight
  dimensions?: ShipStationDimensions
  insuranceOptions?: ShipStationInsuranceOptions
  internationalOptions?: ShipStationInternationalOptions
  customsCountryCode?: string
  advancedOptions?: ShipStationAdvancedOptions
  tagIds?: number[] | null
}