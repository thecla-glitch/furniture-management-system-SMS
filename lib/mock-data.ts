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
  completedAt?: string // ISO date, set when a stage is marked Done
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
  pin: string // 4-digit login PIN
  active: boolean // inactive techs cannot be assigned to new stages
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

export type MaterialRequestStatus = "Pending" | "Approved" | "Rejected"

export interface MaterialRequest {
  id: string
  orderId: string
  technicianId: string
  technicianName: string
  materialName: string
  quantity: number
  unit: string
  requestedAt: string // ISO date
  status: MaterialRequestStatus
}

export type IssuanceStatus = "Pending" | "Done"

export interface IssuanceLine {
  inventoryItemId: string
  materialName: string
  unit: string
  estimatedQty: number
}

/** A per-order materials estimate sent from the Ops Manager's stage plan. */
export interface OrderIssuance {
  id: string
  orderId: string
  furnitureType: string
  lines: IssuanceLine[]
  status: IssuanceStatus
  issuedAt?: string // ISO date
}

/** An approved extra-material request the Stock Keeper physically issues. */
export interface AdditionalIssuance {
  id: string
  orderId: string
  technicianName: string
  inventoryItemId: string
  materialName: string
  unit: string
  approvedQty: number
  status: IssuanceStatus
  issuedAt?: string // ISO date
}

// --- Shop / Showroom module ----------------------------------------------
// Ready-made furniture sold off the showroom floor. A separate transaction
// type from custom orders — no workshop involvement.

export type BranchCode = "A" | "B" | "C"

export interface Branch {
  id: string
  code: BranchCode
  name: string
  /** When true, Front Desk staff at this branch may apply a sale discount. */
  discountAuthority: boolean
}

export type ShowroomSetStatus =
  | "Available"
  | "Broken"
  | "Sold"
  | "Reserved"
  | "Transferred"

export type SetComponentStatus =
  | "Available"
  | "Sold"
  | "Hold" // kept back by the Director, not for sale
  | "Removed" // split out of the set into a standalone item

/** A single piece within a set (e.g. one chair, the table). */
export interface SetComponent {
  id: string // e.g. ITEM-A-001-T, ITEM-A-001-C1
  label: string // e.g. "Table", "Chair 1"
  individualPrice: number
  componentStatus: SetComponentStatus
}

export type BreakDisposition = "Sold" | "Kept" | "Repriced" | "Hold"

/** Immutable record of how a set was broken up, preserving original prices. */
export interface SetBreakRecord {
  brokenAt: string // ISO date
  customerName: string
  originalFullSetPrice: number
  components: {
    id: string
    label: string
    originalPrice: number
    finalPrice: number
    disposition: BreakDisposition
    newSetId?: string // standalone set created for a remaining component
  }[]
}

/** A showroom set: a parent piece made of one or more component items. */
export interface ShowroomSet {
  id: string // e.g. SET-A-001
  name: string
  description: string
  branchId: string
  fullSetPrice: number
  status: ShowroomSetStatus
  components: SetComponent[]
  photos?: string[]
  dateEntered: string // ISO date
  historyNote?: string
  breakHistory?: SetBreakRecord
}

export type ReservationStatus = "Active" | "Completed" | "Cancelled"

export interface Reservation {
  id: string
  setId: string
  branchId: string
  customerName: string
  contact: string
  depositPaid: number
  reservedAt: string // ISO date
  expiresAt?: string // ISO date the hold lapses
  status: ReservationStatus
  releasedAt?: string // ISO date a hold was released/cancelled
}

export type TransferStatus = "Pending" | "Approved" | "Completed" | "Rejected"

export interface TransferRequest {
  id: string
  setId: string
  fromBranchId: string
  toBranchId: string
  requestedBy: string
  requestedAt: string // ISO date
  status: TransferStatus
  reason?: string
  decidedAt?: string // ISO date the Director approved/declined
  /** True when the Director created it directly (no front-desk request). */
  directorInitiated?: boolean
}

export type PartialSaleStatus = "Pending" | "Approved" | "Declined"

/** A request to sell individual components out of a set, breaking it up. */
export interface PartialSaleRequest {
  id: string
  setId: string
  branchId: string
  componentIds: string[]
  customerName: string
  contact: string
  requestedAt: string // ISO date
  status: PartialSaleStatus
  decidedAt?: string // ISO date the Director approved/declined
}

export type SaleKind = "Full Set" | "Components"

export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Mobile Money"

/** A completed showroom sale (separate ledger from custom workshop orders). */
export interface ShopSale {
  id: string
  setId: string
  setName: string
  branchId: string
  kind: SaleKind
  customerName: string
  contact: string
  listPrice: number
  salePrice: number
  paymentMethod: PaymentMethod
  amountReceived: number
  soldAt: string // ISO datetime
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
    pin: "4821",
    active: true,
  },
  {
    id: "tech-2",
    name: "Grace Mensah",
    specialty: "Upholstery",
    phone: "+234 805 444 5566",
    activeOrders: 2,
    rate: 110,
    pin: "7390",
    active: true,
  },
  {
    id: "tech-3",
    name: "Samuel Adeyemi",
    specialty: "Finishing & Polish",
    phone: "+234 807 777 8899",
    activeOrders: 1,
    rate: 90,
    pin: "1265",
    active: true,
  },
  {
    id: "tech-4",
    name: "Fatima Bello",
    specialty: "Frame Assembly",
    phone: "+234 809 222 3344",
    activeOrders: 2,
    rate: 105,
    pin: "5078",
    active: true,
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
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", completedAt: "2026-06-23", materials: [{ inventoryItemId: "inv-3", name: "Plywood Sheet 18mm", quantity: 6, unit: "sheets" }] },
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
      { name: "Frame Assembly", headTechId: "tech-4", status: "Done", completedAt: "2026-06-24", materials: [{ inventoryItemId: "inv-2", name: "Oak Plank", quantity: 5, unit: "boards" }] },
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
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", completedAt: "2026-06-16", materials: [{ inventoryItemId: "inv-3", name: "Plywood Sheet 18mm", quantity: 3, unit: "sheets" }] },
      { name: "Assembly", headTechId: "tech-4", status: "Done", completedAt: "2026-06-18", materials: [{ inventoryItemId: "inv-5", name: "Drawer Slides", quantity: 2, unit: "pairs" }] },
      { name: "Finishing", headTechId: "tech-3", status: "Done", completedAt: "2026-06-23", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 1, unit: "liters" }] },
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
    collectedAt: "2026-06-20T14:20:00",
    originatingBranch: "Lekki Showroom",
    stages: [
      { name: "Material Sourcing", headTechId: "tech-1", status: "Done", completedAt: "2026-06-15", materials: [{ inventoryItemId: "inv-1", name: "Mahogany Plank", quantity: 4, unit: "boards" }] },
      { name: "Assembly", headTechId: "tech-4", status: "Done", completedAt: "2026-06-17", materials: [] },
      { name: "Finishing", headTechId: "tech-3", status: "Done", completedAt: "2026-06-19", materials: [{ inventoryItemId: "inv-9", name: "Matte Lacquer", quantity: 1, unit: "liters" }] },
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
  {
    id: "ORD-1007",
    customerName: "Zainab Lawal",
    contact: "+234 802 555 0707",
    furnitureType: "TV Console Unit",
    size: "200 x 45 x 50 cm",
    quotedPrice: 870,
    orderDate: "2026-06-18",
    expectedDelivery: "2026-07-15",
    status: "In Workshop",
    originatingBranch: "Lekki Showroom",
    stages: [],
  },
  {
    id: "ORD-1008",
    customerName: "Emeka Nwosu",
    contact: "+234 806 555 0808",
    furnitureType: "Dining Chairs (Set of 4)",
    size: "45 x 45 x 95 cm each",
    quotedPrice: 640,
    orderDate: "2026-06-20",
    expectedDelivery: "2026-07-18",
    status: "In Workshop",
    originatingBranch: "Central Workshop",
    stages: [],
  },
]

// --- Material requests ---------------------------------------------------
// Extra-material requests raised by head technicians mid-build.

export const materialRequests: MaterialRequest[] = [
  {
    id: "req-1",
    orderId: "ORD-1002",
    technicianId: "tech-1",
    technicianName: "Daniel Okoye",
    materialName: "Brass Hinges",
    quantity: 6,
    unit: "pcs",
    requestedAt: "2026-06-23",
    status: "Pending",
  },
  {
    id: "req-2",
    orderId: "ORD-1003",
    technicianId: "tech-2",
    technicianName: "Grace Mensah",
    materialName: "Linen Fabric",
    quantity: 4,
    unit: "meters",
    requestedAt: "2026-06-24",
    status: "Pending",
  },
  {
    id: "req-3",
    orderId: "ORD-1002",
    technicianId: "tech-1",
    technicianName: "Daniel Okoye",
    materialName: "Wood Glue",
    quantity: 2,
    unit: "liters",
    requestedAt: "2026-06-22",
    status: "Pending",
  },
  {
    id: "req-4",
    orderId: "ORD-1003",
    technicianId: "tech-4",
    technicianName: "Fatima Bello",
    materialName: "Oak Plank",
    quantity: 2,
    unit: "boards",
    requestedAt: "2026-06-19",
    status: "Approved",
  },
  {
    id: "req-5",
    orderId: "ORD-1002",
    technicianId: "tech-3",
    technicianName: "Samuel Adeyemi",
    materialName: "Matte Lacquer",
    quantity: 5,
    unit: "liters",
    requestedAt: "2026-06-18",
    status: "Rejected",
  },
]

// --- Issuances -----------------------------------------------------------
// Per-order materials estimates arriving from stage assignments, awaiting
// physical issue by the Stock Keeper.

export const orderIssuances: OrderIssuance[] = [
  {
    id: "iss-1",
    orderId: "ORD-1002",
    furnitureType: "Wardrobe (3-Door)",
    status: "Pending",
    lines: [
      { inventoryItemId: "inv-3", materialName: "Plywood Sheet 18mm", unit: "sheets", estimatedQty: 6 },
      { inventoryItemId: "inv-4", materialName: "Brass Hinges", unit: "pcs", estimatedQty: 12 },
      { inventoryItemId: "inv-5", materialName: "Drawer Slides", unit: "pairs", estimatedQty: 3 },
      { inventoryItemId: "inv-9", materialName: "Matte Lacquer", unit: "liters", estimatedQty: 3 },
    ],
  },
  {
    id: "iss-2",
    orderId: "ORD-1003",
    furnitureType: "3-Seater Sofa",
    status: "Pending",
    lines: [
      { inventoryItemId: "inv-2", materialName: "Oak Plank", unit: "boards", estimatedQty: 5 },
      { inventoryItemId: "inv-7", materialName: "Foam Padding", unit: "rolls", estimatedQty: 2 },
      { inventoryItemId: "inv-8", materialName: "Linen Fabric", unit: "meters", estimatedQty: 12 },
    ],
  },
  {
    id: "iss-3",
    orderId: "ORD-1007",
    furnitureType: "TV Console Unit",
    status: "Pending",
    lines: [
      { inventoryItemId: "inv-3", materialName: "Plywood Sheet 18mm", unit: "sheets", estimatedQty: 4 },
      { inventoryItemId: "inv-6", materialName: "Wood Screws 40mm", unit: "boxes", estimatedQty: 1 },
    ],
  },
]

// Approved additional-material requests handed off for physical issue.
export const additionalIssuances: AdditionalIssuance[] = [
  {
    id: "add-1",
    orderId: "ORD-1003",
    technicianName: "Fatima Bello",
    inventoryItemId: "inv-2",
    materialName: "Oak Plank",
    unit: "boards",
    approvedQty: 2,
    status: "Pending",
  },
  {
    id: "add-2",
    orderId: "ORD-1002",
    technicianName: "Daniel Okoye",
    inventoryItemId: "inv-4",
    materialName: "Brass Hinges",
    unit: "pcs",
    approvedQty: 6,
    status: "Pending",
  },
]

// --- Branches ------------------------------------------------------------

export const branches: Branch[] = [
  // Flagship branches may discount; Lekki sells at list price only.
  { id: "branch-a", code: "A", name: "Ikeja Showroom", discountAuthority: true },
  { id: "branch-b", code: "B", name: "Lekki Showroom", discountAuthority: false },
  { id: "branch-c", code: "C", name: "Abuja Showroom", discountAuthority: true },
]

// --- Showroom sets -------------------------------------------------------

export const showroomSets: ShowroomSet[] = [
  {
    id: "SET-A-001",
    name: "Royal 6-Seater Dining Set",
    description: "Solid mahogany dining table with six matching chairs.",
    branchId: "branch-a",
    fullSetPrice: 2400,
    status: "Available",
    dateEntered: "2026-05-14",
    photos: ["/reference/dining-table-1.png"],
    components: [
      { id: "ITEM-A-001-T", label: "Dining Table", individualPrice: 900, componentStatus: "Available" },
      { id: "ITEM-A-001-C1", label: "Chair 1", individualPrice: 260, componentStatus: "Available" },
      { id: "ITEM-A-001-C2", label: "Chair 2", individualPrice: 260, componentStatus: "Available" },
      { id: "ITEM-A-001-C3", label: "Chair 3", individualPrice: 260, componentStatus: "Available" },
      { id: "ITEM-A-001-C4", label: "Chair 4", individualPrice: 260, componentStatus: "Available" },
      { id: "ITEM-A-001-C5", label: "Chair 5", individualPrice: 260, componentStatus: "Available" },
    ],
  },
  {
    id: "SET-A-002",
    name: "Heritage 4-Door Wardrobe",
    description: "Standalone oak wardrobe with mirror panels.",
    branchId: "branch-a",
    fullSetPrice: 1150,
    status: "Available",
    dateEntered: "2026-06-01",
    components: [
      { id: "ITEM-A-002-W", label: "Wardrobe", individualPrice: 1150, componentStatus: "Available" },
    ],
  },
  {
    id: "SET-B-001",
    name: "Lekki Lounge Set",
    description: "Three-seater sofa, two armchairs and a glass coffee table.",
    branchId: "branch-b",
    fullSetPrice: 3100,
    status: "Reserved",
    dateEntered: "2026-05-28",
    photos: ["/reference/bed-frame-1.png"],
    components: [
      { id: "ITEM-B-001-S", label: "3-Seater Sofa", individualPrice: 1500, componentStatus: "Available" },
      { id: "ITEM-B-001-A1", label: "Armchair 1", individualPrice: 600, componentStatus: "Available" },
      { id: "ITEM-B-001-A2", label: "Armchair 2", individualPrice: 600, componentStatus: "Available" },
      { id: "ITEM-B-001-CT", label: "Coffee Table", individualPrice: 400, componentStatus: "Available" },
    ],
  },
  {
    id: "SET-B-002",
    name: "Classic Bookshelf Trio",
    description: "Set of three stacking bookshelves. One unit already sold.",
    branchId: "branch-b",
    fullSetPrice: 870,
    status: "Broken",
    dateEntered: "2026-04-19",
    historyNote: "One shelf sold individually on 2026-06-10.",
    components: [
      { id: "ITEM-B-002-S1", label: "Shelf 1", individualPrice: 300, componentStatus: "Sold" },
      { id: "ITEM-B-002-S2", label: "Shelf 2", individualPrice: 300, componentStatus: "Available" },
      { id: "ITEM-B-002-S3", label: "Shelf 3", individualPrice: 300, componentStatus: "Available" },
    ],
  },
  {
    id: "SET-C-001",
    name: "Imperial Bedroom Suite",
    description: "King bed frame, two nightstands and a dresser.",
    branchId: "branch-c",
    fullSetPrice: 2750,
    status: "Available",
    dateEntered: "2026-06-05",
    components: [
      { id: "ITEM-C-001-B", label: "Bed Frame", individualPrice: 1400, componentStatus: "Available" },
      { id: "ITEM-C-001-N1", label: "Nightstand 1", individualPrice: 350, componentStatus: "Available" },
      { id: "ITEM-C-001-N2", label: "Nightstand 2", individualPrice: 350, componentStatus: "Available" },
      { id: "ITEM-C-001-D", label: "Dresser", individualPrice: 700, componentStatus: "Available" },
    ],
  },
  {
    id: "SET-C-003",
    name: "Accent Side Tables (Pair)",
    description: "Two walnut side tables remaining from a larger set.",
    branchId: "branch-c",
    fullSetPrice: 520,
    status: "Available",
    dateEntered: "2026-06-12",
    historyNote: "Remaining from SET-C-002.",
    components: [
      { id: "ITEM-C-003-T1", label: "Side Table 1", individualPrice: 280, componentStatus: "Available" },
      { id: "ITEM-C-003-T2", label: "Side Table 2", individualPrice: 280, componentStatus: "Available" },
    ],
  },
]

// --- Reservations / transfers / partial sales ----------------------------

export const reservations: Reservation[] = [
  {
    id: "RES-001",
    setId: "SET-B-001",
    branchId: "branch-b",
    customerName: "Halima Abdullahi",
    contact: "+234 803 555 0909",
  depositPaid: 500,
  reservedAt: "2026-06-21",
  expiresAt: "2026-07-05",
  status: "Active",
  },
]

export const transferRequests: TransferRequest[] = [
  {
    id: "TR-001",
    setId: "SET-A-002",
    fromBranchId: "branch-a",
    toBranchId: "branch-c",
    requestedBy: "Abuja Showroom",
    requestedAt: "2026-06-22",
    status: "Pending",
  },
]

export const partialSaleRequests: PartialSaleRequest[] = [
  {
    id: "PSR-001",
    setId: "SET-C-001",
    branchId: "branch-c",
    componentIds: ["ITEM-C-001-N1"],
    customerName: "Yakubu Garba",
    contact: "+234 805 555 0123",
    requestedAt: "2026-06-23",
    status: "Pending",
  },
]

// Completed showroom sales (history). New sales are appended at runtime.
export const shopSales: ShopSale[] = [
  {
    id: "SALE-0001",
    setId: "SET-A-003",
    setName: "Compact Study Desk",
    branchId: "branch-a",
    kind: "Full Set",
    customerName: "Ngozi Eze",
    contact: "+234 802 555 0110",
    listPrice: 480,
    salePrice: 450,
    paymentMethod: "Bank Transfer",
    amountReceived: 450,
    soldAt: "2026-06-15T11:20:00",
  },
]

// --- Helpers -------------------------------------------------------------

export function getTechnicianById(id: string): Technician | undefined {
  return technicians.find((t) => t.id === id)
}

export function getBranchById(id: string): Branch | undefined {
  return branches.find((b) => b.id === id)
}

export function getShowroomSetById(id: string): ShowroomSet | undefined {
  return showroomSets.find((s) => s.id === id)
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
