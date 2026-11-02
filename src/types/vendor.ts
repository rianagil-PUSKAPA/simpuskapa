import { VendorPackage } from 'sdk/api'

export type VendorType = {
  icon: JSX.Element
  text: string
}

export type VendorEnumType = 'goods' | 'subscription' | 'misc' | 'services' | 'travel' | 'event' | 'consultant'

export enum VendorEnum {
  GOODS = 'goods',
  SUBSCRIPTIONS = 'subscription',
  MISC = 'misc',
  SERVICES = 'services',
  TRAVEL = 'travel',
  EVENT = 'event',
  CONSULTANT = 'consultant',
}

export type VendorDtoType = {
  id: string
  vendor_type: string
  products_categories: string[]
  about_vendor: string[]
  vendor_packages: VendorPackage[]
}

export type VendorAnnonateType =
  | 'insurance'
  | 'auditor'
  | 'contractor'
  | 'other'
  | 'translator'
  | 'interpreter'
  | 'sign-language'
  | 'transcriber'
  | 'notulen'
  | 'proofreader'
  | 'mc'
  | 'key-person'
  | 'moderator'
  | 'designer'
  | 'editor'
  | 'photographer'
  | 'videographer'
  | 'consultant'
  | 'online-services'
  | 'software'
  | 'accomodations'
  | 'food-services'
  | 'room-rental'
  | 'transportation-rental'
  | 'itemtools-rental'
  | 'travel-agent'
  | 'event-organizer'
  | 'atk'
  | 'itperipherals'
  | 'printing'
  | 'equipment'
  | 'vehicle-rental'
  | 'airfare'
  | 'perdiem'
  | 'transportation'
  | 'accommodation'

export type RolesAnnonateType =
  | 'Staff'
  | 'Supervisor'
  | 'Admin'
  | 'Superadmin'
  | 'Ops Team'
  | 'General Manager'
  | 'Grant Manager'
  | 'Program Manager'
  | 'Program Officer'
  | 'Head of Operation'
  | 'Head of Finance'
  | 'Finance Team'
  | 'Program Team'
  | 'Comms Team'
  | 'Knowledge Team'
