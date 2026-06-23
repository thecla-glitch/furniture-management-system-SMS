import {
  ClipboardList,
  LayoutDashboard,
  Factory,
  Hammer,
  Boxes,
  type LucideIcon,
} from "lucide-react"

export type RoleId =
  | "front-desk"
  | "director"
  | "operations"
  | "head-technician"
  | "stock-keeper"

export interface NavItem {
  label: string
  available: boolean
  /** When set, the item renders as a real link and can be the active tab. */
  href?: string
}

export interface RoleConfig {
  id: RoleId
  label: string
  description: string
  href: string
  icon: LucideIcon
  nav: NavItem[]
}

export const roles: RoleConfig[] = [
  {
    id: "front-desk",
    label: "Front Desk",
    description: "Capture customer orders, quotes and collection hand-offs.",
    href: "/front-desk",
    icon: ClipboardList,
    nav: [
      { label: "Overview", available: true, href: "/front-desk" },
      { label: "Shop", available: true, href: "/front-desk/shop" },
      { label: "Quotes", available: false },
      { label: "Collections", available: false },
    ],
  },
  {
    id: "director",
    label: "Director",
    description: "Approve orders and monitor workshop performance.",
    href: "/director",
    icon: LayoutDashboard,
    nav: [
      { label: "Overview", available: true, href: "/director" },
      { label: "Shop", available: true, href: "/director/shop" },
      { label: "Revenue", available: false },
      { label: "Branches", available: false },
    ],
  },
  {
    id: "operations",
    label: "Operations Manager",
    description: "Assign work, schedule stages and track production flow.",
    href: "/operations",
    icon: Factory,
    nav: [
      { label: "Overview", available: true, href: "/operations" },
      {
        label: "Showroom Stock",
        available: true,
        href: "/operations/showroom-stock",
      },
      { label: "Scheduling", available: false },
      { label: "Assignments", available: false },
    ],
  },
  {
    id: "head-technician",
    label: "Head Technician",
    description: "Manage assigned stages, materials and craftsmanship.",
    href: "/head-technician",
    icon: Hammer,
    nav: [
      { label: "Overview", available: true },
      { label: "My Stages", available: false },
      { label: "Material Requests", available: false },
    ],
  },
  {
    id: "stock-keeper",
    label: "Stock Keeper",
    description: "Track inventory levels, issue materials and reorder stock.",
    href: "/stock-keeper",
    icon: Boxes,
    nav: [
      { label: "Overview", available: true },
      { label: "Inventory", available: false },
      { label: "Issue Materials", available: false },
      { label: "Reorders", available: false },
    ],
  },
]

export function getRoleById(id: RoleId): RoleConfig {
  return roles.find((r) => r.id === id) ?? roles[0]
}

export function getRoleByHref(pathname: string): RoleConfig | undefined {
  return roles.find((r) => pathname.startsWith(r.href))
}
