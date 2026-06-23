"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  additionalIssuances as seedAdditional,
  inventory as seedInventory,
  orderIssuances as seedOrderIssuances,
  type AdditionalIssuance,
  type InventoryCategory,
  type InventoryItem,
  type OrderIssuance,
} from "@/lib/mock-data"

export interface NewInventoryInput {
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  reorderLevel: number
  unitCost: number
}

export interface InventoryPatch {
  quantity?: number
  unitCost?: number
  reorderLevel?: number
}

/** A line on a completed issuance, captured for traceability. */
export interface IssuanceRecordLine {
  materialName: string
  quantity: number
  unit: string
}

export interface IssuanceRecord {
  id: string
  ref: string // order id
  kind: "Order" | "Additional"
  detail: string // e.g. furniture type or technician name
  lines: IssuanceRecordLine[]
  date: string // ISO date
}

interface StockContextValue {
  items: InventoryItem[]
  orderIssuances: OrderIssuance[]
  additionalIssuances: AdditionalIssuance[]
  records: IssuanceRecord[]
  lowStockCount: number
  pendingIssuanceCount: number
  addItem: (input: NewInventoryInput) => void
  updateItem: (id: string, patch: InventoryPatch) => void
  /** Issue a per-order estimate, deducting the actual quantities per line. */
  issueOrder: (issuanceId: string, actuals: Record<string, number>) => void
  /** Issue an approved additional request, deducting the approved quantity. */
  issueAdditional: (id: string) => void
}

const StockContext = createContext<StockContextValue | null>(null)

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(seedInventory)
  const [orderIssuances, setOrderIssuances] =
    useState<OrderIssuance[]>(seedOrderIssuances)
  const [additionalIssuances, setAdditionalIssuances] =
    useState<AdditionalIssuance[]>(seedAdditional)
  const [records, setRecords] = useState<IssuanceRecord[]>([])

  // Deduct a set of {inventoryItemId: qty} from on-hand balances.
  const deduct = useCallback((amounts: Record<string, number>) => {
    setItems((prev) =>
      prev.map((item) => {
        const amount = amounts[item.id]
        if (!amount) return item
        return { ...item, quantity: Math.max(0, item.quantity - amount) }
      })
    )
  }, [])

  const addItem = useCallback((input: NewInventoryInput) => {
    setItems((prev) => [
      ...prev,
      { id: `inv-${prev.length + 1}-${Date.now()}`, ...input },
    ])
  }, [])

  const updateItem = useCallback((id: string, patch: InventoryPatch) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }, [])

  // NOTE: side effects (deduct / record) must stay OUT of the issuance state
  // updater — React StrictMode double-invokes updaters, which would otherwise
  // deduct stock twice and log duplicate records.
  const issueOrder = useCallback(
    (issuanceId: string, actuals: Record<string, number>) => {
      const issuance = orderIssuances.find((i) => i.id === issuanceId)
      if (!issuance || issuance.status !== "Pending") return

      deduct(actuals)
      setRecords((r) => [
        {
          id: `rec-${r.length + 1}-${Date.now()}`,
          ref: issuance.orderId,
          kind: "Order",
          detail: issuance.furnitureType,
          date: today(),
          lines: issuance.lines.map((line) => ({
            materialName: line.materialName,
            quantity: actuals[line.inventoryItemId] ?? line.estimatedQty,
            unit: line.unit,
          })),
        },
        ...r,
      ])
      setOrderIssuances((prev) =>
        prev.map((i) =>
          i.id === issuanceId
            ? { ...i, status: "Done" as const, issuedAt: today() }
            : i
        )
      )
    },
    [orderIssuances, deduct]
  )

  const issueAdditional = useCallback(
    (id: string) => {
      const issuance = additionalIssuances.find((i) => i.id === id)
      if (!issuance || issuance.status !== "Pending") return

      deduct({ [issuance.inventoryItemId]: issuance.approvedQty })
      setRecords((r) => [
        {
          id: `rec-${r.length + 1}-${Date.now()}`,
          ref: issuance.orderId,
          kind: "Additional",
          detail: issuance.technicianName,
          date: today(),
          lines: [
            {
              materialName: issuance.materialName,
              quantity: issuance.approvedQty,
              unit: issuance.unit,
            },
          ],
        },
        ...r,
      ])
      setAdditionalIssuances((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, status: "Done" as const, issuedAt: today() }
            : i
        )
      )
    },
    [additionalIssuances, deduct]
  )

  const value = useMemo<StockContextValue>(
    () => ({
      items,
      orderIssuances,
      additionalIssuances,
      records,
      lowStockCount: items.filter((i) => i.quantity <= i.reorderLevel).length,
      pendingIssuanceCount:
        orderIssuances.filter((i) => i.status === "Pending").length +
        additionalIssuances.filter((i) => i.status === "Pending").length,
      addItem,
      updateItem,
      issueOrder,
      issueAdditional,
    }),
    [
      items,
      orderIssuances,
      additionalIssuances,
      records,
      addItem,
      updateItem,
      issueOrder,
      issueAdditional,
    ]
  )

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>
}

export function useStock(): StockContextValue {
  const ctx = useContext(StockContext)
  if (!ctx) {
    throw new Error("useStock must be used within a StockProvider")
  }
  return ctx
}
