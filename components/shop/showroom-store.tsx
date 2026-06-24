"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  showroomSets as seedSets,
  shopSales as seedSales,
  getBranchById,
  type PaymentMethod,
  type SaleKind,
  type SetComponent,
  type ShopSale,
  type ShowroomSet,
} from "@/lib/mock-data"

/** A single component captured while entering new stock. */
export interface NewComponentInput {
  label: string
  individualPrice: number
}

export interface NewSetInput {
  name: string
  description: string
  branchId: string
  fullSetPrice: number
  components: NewComponentInput[]
  photos: string[]
  dateEntered: string
}

export interface SellFullSetInput {
  setId: string
  customerName: string
  contact: string
  salePrice: number
  paymentMethod: PaymentMethod
  amountReceived: number
}

interface ShowroomContextValue {
  sets: ShowroomSet[]
  sales: ShopSale[]
  /** Returns the generated set ID. */
  addSet: (input: NewSetInput) => string
  sellFullSet: (input: SellFullSetInput) => void
}

const ShowroomContext = createContext<ShowroomContextValue | null>(null)

/** Next per-branch sequence, e.g. SET-A-007, padded to 3 digits. */
function nextSetId(sets: ShowroomSet[], branchId: string): string {
  const code = getBranchById(branchId)?.code ?? "X"
  const prefix = `SET-${code}-`
  const maxSeq = sets
    .filter((s) => s.id.startsWith(prefix))
    .reduce((max, s) => {
      const seq = Number.parseInt(s.id.slice(prefix.length), 10)
      return Number.isNaN(seq) ? max : Math.max(max, seq)
    }, 0)
  const seq = String(maxSeq + 1).padStart(3, "0")
  return `${prefix}${seq}`
}

export function ShowroomProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<ShowroomSet[]>(seedSets)
  const [sales, setSales] = useState<ShopSale[]>(seedSales)

  const addSet = useCallback((input: NewSetInput): string => {
    const id = nextSetId(sets, input.branchId)
    const code = getBranchById(input.branchId)?.code ?? "X"
    const seq = id.slice(`SET-${code}-`.length)

    const components: SetComponent[] = input.components.map((c, i) => ({
      // Simple incrementing suffix keeps component IDs unique within the set.
      id: `ITEM-${code}-${seq}-${i + 1}`,
      label: c.label.trim(),
      individualPrice: c.individualPrice,
      componentStatus: "Available",
    }))

    const newSet: ShowroomSet = {
      id,
      name: input.name.trim(),
      description: input.description.trim(),
      branchId: input.branchId,
      fullSetPrice: input.fullSetPrice,
      status: "Available",
      components,
      photos: input.photos,
      dateEntered: input.dateEntered,
    }

    setSets((prev) => [newSet, ...prev])
    return id
  }, [sets])

  const sellFullSet = useCallback(
    (input: SellFullSetInput) => {
      const target = sets.find((s) => s.id === input.setId)
      if (!target || target.status !== "Available") return

      const sale: ShopSale = {
        id: `SALE-${Date.now()}`,
        setId: target.id,
        setName: target.name,
        branchId: target.branchId,
        kind: "Full Set" as SaleKind,
        customerName: input.customerName.trim(),
        contact: input.contact.trim(),
        listPrice: target.fullSetPrice,
        salePrice: input.salePrice,
        paymentMethod: input.paymentMethod,
        amountReceived: input.amountReceived,
        soldAt: new Date().toISOString().slice(0, 19),
      }

      setSales((prev) => [sale, ...prev])
      setSets((prev) =>
        prev.map((s) =>
          s.id === input.setId
            ? {
                ...s,
                status: "Sold",
                components: s.components.map((c) => ({
                  ...c,
                  componentStatus: "Sold",
                })),
              }
            : s
        )
      )
    },
    [sets]
  )

  const value = useMemo<ShowroomContextValue>(
    () => ({ sets, sales, addSet, sellFullSet }),
    [sets, sales, addSet, sellFullSet]
  )

  return (
    <ShowroomContext.Provider value={value}>
      {children}
    </ShowroomContext.Provider>
  )
}

export function useShowroom(): ShowroomContextValue {
  const ctx = useContext(ShowroomContext)
  if (!ctx) {
    throw new Error("useShowroom must be used within a ShowroomProvider")
  }
  return ctx
}
