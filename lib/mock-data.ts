// Shared mock data for the Furniture Management System.
// UI-only scaffold — the real backend will be built in Django.

export type OrderStatus =
  | "Pending Approval"
  | "In Workshop"
  | "Ready for Collection"
  | "Collected"

export type StageStatus = "Pending" | "Active" | "Done"

export interface StageMaterial {
  inventoryItemId: string
  name: string
  quantity: number
  unit: string
}

export interface OrderStage {
  name: string
  headTechId: string
  status: StageStatus
  materials: StageMaterial[]
}

export interface Order {
  id: string
  customerName: string
  contact: string
  furnitureType: string
  size: string
  quotedPrice: number
  orderDate: string // ISO date
  expectedDelivery: string // ISO date
  status: OrderStatus
  stages: OrderStage[]
  originatingBranch: string
  referenceImages?: string[]
  collectedAt?: string // ISO date-time, set when collected
}

export interface Technician {
  id: string
  name: string
  specialty: string
  phone: string
  activeOrders: number
  rate: number // labour cost charged per stage this technician leads
}

export type InventoryCategory =
  | "Wood"
  | "Hardware"
  | "Upholstery"
  | "Finishing"
  | "Adhesive"

export interface InventoryItem {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  reorderLevel: number
  unitCost: number
}

export interface ShopSet {
  id: string
  name: string
  branch: string
  manager: string
  activeOrders: number
}

// --- Technicians ---------------------------------------------------------

export const technicians: Technician[] = [
  {
    id: "tech-1",
    name: "Daniel Okoye",
    specialty: "Cabinetry & Joinery",
    phone: "+234 803 111 2233",
    activeOrders: 3,
    rate: 140,
  },
  {
    id: "tech-2",
    name: "Grace Mensah",
    specialty: "Upholstery",
    phone: "+234 805 444 5566",
    activeOrders: 2,
    rate: 110,
  },
  {
    id: "tech-3",
    name: "Samuel Adeyemi",
    specialty: "Finishing & Polish",
    phone: "+234 807 777 8899",
    activeOrders: 1,
    rate: 90,
  },
  {
    id: "tech-4",
    name: "Fatima Bello",
    specialty: "Frame Assembly",
    phone: "+234 809 222 3344",
    activeOrders: 2,
    rate: 105,
  },
]

// --- Inventory -----------------------------------------------------------

export const inventory: InventoryItem[] = [
  { id: "inv-1", name: "Mahogany Plank", category: "Wood", quantity: 48, unit: "boards", reorderLevel: 20, unitCost: 18.5 },
  { id: "inv-2", name: "Oak Plank", category: "Wood", quantity: 12, unit: "boards", reorderLevel: 15, unitCost: 22.0 },
  { id: "inv-3", name: "Plywood Sheet 18mm", category: "Wood", quantity: 30, unit: "sheets", reorderLevel: 10, unitCost: 14.75 },
  { id: "inv-4", name: "Brass Hinges", category: "Hardware", quantity: 220, unit: "pcs", reorderLevel: 50, unitCost: 1.2 },
  { id: "inv-5", name: "Drawer Slides", category: "Hardware", quantity: 64, unit: "pairs", reorderLevel: 25, unitCost: 3.4 },
  { id: "inv-6", name: "Wood Screws 40mm", category: "Hardware", quantity: 8, unit: "boxes", reorderLevel: 10, unitCost: 4.9 },
  { id: "inv-7", name: "Foam Padding", category: "Upholstery", quantity: 18, unit: "rolls", reorderLevel: 8, unitCost: 9.6 },
  { id: "inv-8", name: "Linen Fabric", category: "Upholstery", quantity: 35, unit: "meters", reorderLevel: 20, unitCost: 6.25 },
  { id: "inv-9", name: "Matte Lacquer", category: "Finishing", quantity: 14, unit: "liters", reorderLevel: 6, unitCost: 12.0 },
  { id: "inv-10", name: "Wood Glue", category: "Adhesive", quantity: 5, unit: "liters", reorderLevel: 6, unitCost: 7.8 },
]

// --- Shop sets -----------------------------------------------------------

export const shopSets: ShopSet[] = [
  { id: "set-1", name: "Central Workshop", branch: "Lagos - Ikeja", manager: "Operations Manager", activeOrders: 4 },
  { id: "set-2", name: "Lekki Showroom", branch: "Lagos - Lekki", manager: "Front Desk", activeOrders: 2 },
  { id: "set-3", name: "Abuja Branch", branch: "Abuja - Wuse", manager: "Front Desk", activeOrders: 1 },
]

// --- Orders --------------------------------------------------------------

export const orders: Order[] = [
  {
    id: "ORD-1001",
    customerName: "Amina Yusuf",
    contact: "+234 802 555 0101",
    furnitureType: "6-Seater Dining Table",
    size: "180 x 90 x 76 cm",
    quotedPrice: 1450,
    orderDate: "2026-06-10",
    expectedDelivery: "2026-07-05",
    status: "Pending Approval",
    originatingBranch: "Lekki Showroom",
    referenceImages: ["/reference/dining-table-1.png", "/reference/dining-table-2.png"],
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Pending", materials: [{ inventoryItemId: "inv-1", name: "Mahogany Plank", quantity: 8, unit: "boards" }] },
      { name: "Frame Assembly", headTechId: "tech-4", status: "Pending", materials: [{ inventoryItemId: "inv-6", name: "Wood Screws 40mm", quantity: 1, unit: "boxes" }] },
      { name: "Finishing", headTechId: "tech-3", status: "Pending", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 2, unit: "liters" }] },
    ],
  },
  {
    id: "ORD-1002",
    customerName: "Chidi Okonkwo",
    contact: "+234 806 555 0202",
    furnitureType: "Wardrobe (3-Door)",
    size: "150 x 60 x 210 cm",
    quotedPrice: 980,
    orderDate: "2026-06-02",
    expectedDelivery: "2026-06-28",
    status: "In Workshop",
    originatingBranch: "Central Workshop",
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", materials: [{ inventoryItemId: "inv-3", name: "Plywood Sheet 18mm", quantity: 6, unit: "sheets" }] },
      { name: "Carcass Build", headTechId: "tech-1", status: "Active", materials: [{ inventoryItemId: "inv-4", name: "Brass Hinges", quantity: 12, unit: "pcs" }, { inventoryItemId: "inv-5", name: "Drawer Slides", quantity: 3, unit: "pairs" }] },
      { name: "Finishing", headTechId: "tech-3", status: "Pending", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 3, unit: "liters" }] },
    ],
  },
  {
    id: "ORD-1003",
    customerName: "Blessing Eze",
    contact: "+234 803 555 0303",
    furnitureType: "3-Seater Sofa",
    size: "210 x 95 x 85 cm",
    quotedPrice: 1620,
    orderDate: "2026-05-20",
    expectedDelivery: "2026-06-22",
    status: "In Workshop",
    originatingBranch: "Central Workshop",
    stages: [
      { name: "Frame Assembly", headTechId: "tech-4", status: "Done", materials: [{ inventoryItemId: "inv-2", name: "Oak Plank", quantity: 5, unit: "boards" }] },
      { name: "Upholstery", headTechId: "tech-2", status: "Active", materials: [{ inventoryItemId: "inv-7", name: "Foam Padding", quantity: 2, unit: "rolls" }, { inventoryItemId: "inv-8", name: "Linen Fabric", quantity: 12, unit: "meters" }] },
      { name: "Quality Check", headTechId: "tech-3", status: "Pending", materials: [] },
    ],
  },
  {
    id: "ORD-1004",
    customerName: "Tunde Bakare",
    contact: "+234 807 555 0404",
    furnitureType: "Office Desk",
    size: "140 x 70 x 75 cm",
    quotedPrice: 720,
    orderDate: "2026-05-12",
    expectedDelivery: "2026-06-18",
    status: "Ready for Collection",
    originatingBranch: "Abuja Branch",
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", materials: [{ inventoryItemId: "inv-3", name: "Plywood Sheet 18mm", quantity: 3, unit: "sheets" }] },
      { name: "Assembly", headTechId: "tech-4", status: "Done", materials: [{ inventoryItemId: "inv-5", name: "Drawer Slides", quantity: 2, unit: "pairs" }] },
      { name: "Finishing", headTechId: "tech-3", status: "Done", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 1, unit: "liters" }] },
    ],
  },
  {
    id: "ORD-1005",
    customerName: "Ngozi Okafor",
    contact: "+234 805 555 0505",
    furnitureType: "Bookshelf",
    size: "90 x 30 x 200 cm",
    quotedPrice: 540,
    orderDate: "2026-04-28",
    expectedDelivery: "2026-05-30",
    status: "Collected",
    collectedAt: "2026-05-31T14:20:00",
    originatingBranch: "Lekki Showroom",
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", materials: [{ inventoryItemId: "inv-1", name: "Mahogany Plank", quantity: 4, unit: "boards" }] },
      { name: "Assembly", headTechId: "tech-4", status: "Done", materials: [] },
      { name: "Finishing", headTechId: "tech-3", status: "Done", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 1, unit: "liters" }] },
    ],
  },
  {
    id: "ORD-1006",
    customerName: "Ibrahim Sani",
    contact: "+234 809 555 0606",
    furnitureType: "King Bed Frame",
    size: "200 x 180 x 120 cm",
    quotedPrice: 1320,
    orderDate: "2026-06-15",
    expectedDelivery: "2026-07-12",
    status: "Pending Approval",
    originatingBranch: "Central Workshop",
    referenceImages: ["/reference/bed-frame-1.png", "/reference/bed-frame-2.png"],
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Pending", materials: [{ inventoryItemId: "inv-2", name: "Oak Plank", quantity: 7, unit: "boards" }] },
      { name: "Frame Assembly", headTechId: "tech-4", status: "Pending", materials: [{ inventoryItemId: "inv-6", name: "Wood Screws 40mm", quantity: 2, unit: "boxes" }] },
      { name: "Upholstery", headTechId: "tech-2", status: "Pending", materials: [{ inventoryItemId: "inv-7", name: "Foam Padding", quantity: 1, unit: "rolls" }] },
    ],
  },
]

// --- Helpers -------------------------------------------------------------

export function getTechnicianById(id: string): Technician | undefined {
  return technicians.find((t) => t.id === id)
}

export function getInventoryById(id: string): InventoryItem | undefined {
  return inventory.find((i) => i.id === id)
}

export const orderStatuses: OrderStatus[] = [
  "Pending Approval",
  "In Workshop",
  "Ready for Collection",
  "Collected",
]
