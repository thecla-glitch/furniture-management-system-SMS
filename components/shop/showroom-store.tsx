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
  partialSaleRequests as seedPartialRequests,
  getBranchById,
  type BreakDisposition,
  type PartialSaleRequest,
  type PaymentMethod,
  type SaleKind,
  type SetBreakRecord,
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

export interface RequestPartialSaleInput {
  setId: string
  branchId: string
  componentIds: string[]
  customerName: string
  contact: string
}

/** Director's decision for one remaining (unsold) component when breaking. */
export interface RemainingDecision {
  componentId: string
  // "keep" / "reprice" → becomes a standalone Available item; "hold" → withheld.
  action: "keep" | "reprice" | "hold"
  price: number
}

export interface BreakSetInput {
  requestId: string
  setId: string
  /** Confirmed components being sold, with their (possibly edited) prices. */
  soldPrices: Record<string, number>
  /** What happens to every other component in the set. */
  remaining: RemainingDecision[]
}

interface ShowroomContextValue {
  sets: ShowroomSet[]
  sales: ShopSale[]
  partialRequests: PartialSaleRequest[]
  /** Returns the generated set ID. */
  addSet: (input: NewSetInput) => string
  sellFullSet: (input: SellFullSetInput) => void
  requestPartialSale: (input: RequestPartialSaleInput) => void
  breakSet: (input: BreakSetInput) => void
  declinePartialSale: (requestId: string) => void
}

const ShowroomContext = createContext<ShowroomContextValue | null>(null)

/** Highest existing per-branch set sequence number (0 when none). */
function highestSeq(sets: ShowroomSet[], branchId: string): number {
  const code = getBranchById(branchId)?.code ?? "X"
  const prefix = `SET-${code}-`
  return sets
    .filter((s) => s.id.startsWith(prefix))
    .reduce((max, s) => {
      const seq = Number.parseInt(s.id.slice(prefix.length), 10)
      return Number.isNaN(seq) ? max : Math.max(max, seq)
    }, 0)
}

/** Next per-branch sequence, e.g. SET-A-007, padded to 3 digits. */
function nextSetId(sets: ShowroomSet[], branchId: string): string {
  const code = getBranchById(branchId)?.code ?? "X"
  const seq = String(highestSeq(sets, branchId) + 1).padStart(3, "0")
  return `SET-${code}-${seq}`
}

export function ShowroomProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<ShowroomSet[]>(seedSets)
  const [sales, setSales] = useState<ShopSale[]>(seedSales)
  const [partialRequests, setPartialRequests] = useState<PartialSaleRequest[]>(
    seedPartialRequests
  )

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

  // Front Desk raises a request only — no stock moves until the Director acts.
  const requestPartialSale = useCallback((input: RequestPartialSaleInput) => {
    setPartialRequests((prev) => {
      const id = `PSR-${String(prev.length + 1).padStart(3, "0")}-${Date.now()}`
      const request: PartialSaleRequest = {
        id,
        setId: input.setId,
        branchId: input.branchId,
        componentIds: input.componentIds,
        customerName: input.customerName.trim(),
        contact: input.contact.trim(),
        requestedAt: new Date().toISOString().slice(0, 10),
        status: "Pending",
      }
      return [request, ...prev]
    })
  }, [])

  const declinePartialSale = useCallback((requestId: string) => {
    setPartialRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "Declined" as const,
              decidedAt: new Date().toISOString().slice(0, 10),
            }
          : r
      )
    )
  }, [])

  // Director-only: break a set into sold + remaining standalone items.
  const breakSet = useCallback(
    (input: BreakSetInput) => {
      const today = new Date().toISOString().slice(0, 10)
      const target = sets.find((s) => s.id === input.setId)
      if (!target || target.status !== "Available") return

      const code = getBranchById(target.branchId)?.code ?? "X"
      const soldIds = new Set(Object.keys(input.soldPrices))
      const remainingById = new Map(
        input.remaining.map((r) => [r.componentId, r])
      )

      // Build standalone sets for kept/repriced components, sequencing IDs off
      // the current set list so they never collide.
      const newSets: ShowroomSet[] = []
      let seqCursor = highestSeq(sets, target.branchId)

      const historyComponents: SetBreakRecord["components"] = target.components.map(
        (comp) => {
          if (soldIds.has(comp.id)) {
            return {
              id: comp.id,
              label: comp.label,
              originalPrice: comp.individualPrice,
              finalPrice: input.soldPrices[comp.id],
              disposition: "Sold" as BreakDisposition,
            }
          }

          const decision = remainingById.get(comp.id)
          if (decision && decision.action === "hold") {
            return {
              id: comp.id,
              label: comp.label,
              originalPrice: comp.individualPrice,
              finalPrice: comp.individualPrice,
              disposition: "Hold" as BreakDisposition,
            }
          }

          // keep or reprice → spin out a standalone Available item.
          const finalPrice = decision ? decision.price : comp.individualPrice
          seqCursor += 1
          const seq = String(seqCursor).padStart(3, "0")
          const newSetId = `SET-${code}-${seq}`
          newSets.push({
            id: newSetId,
            name: `${comp.label} (from ${target.name})`,
            description: `Standalone piece split from ${target.name}.`,
            branchId: target.branchId,
            fullSetPrice: finalPrice,
            status: "Available",
            components: [
              {
                id: `ITEM-${code}-${seq}-1`,
                label: comp.label,
                individualPrice: finalPrice,
                componentStatus: "Available",
              },
            ],
            dateEntered: today,
            historyNote: `Remaining from ${target.id}`,
          })
          return {
            id: comp.id,
            label: comp.label,
            originalPrice: comp.individualPrice,
            finalPrice,
            disposition: (decision?.action === "reprice"
              ? "Repriced"
              : "Kept") as BreakDisposition,
            newSetId,
          }
        }
      )

      const breakRecord: SetBreakRecord = {
        brokenAt: today,
        customerName:
          partialRequests.find((r) => r.id === input.requestId)?.customerName ??
          "",
        originalFullSetPrice: target.fullSetPrice,
        components: historyComponents,
      }

      // Record the component sale in the showroom ledger.
      const soldTotal = Object.values(input.soldPrices).reduce(
        (sum, p) => sum + p,
        0
      )
      const soldOriginalTotal = target.components
        .filter((c) => soldIds.has(c.id))
        .reduce((sum, c) => sum + c.individualPrice, 0)
      const sale: ShopSale = {
        id: `SALE-${Date.now()}`,
        setId: target.id,
        setName: target.name,
        branchId: target.branchId,
        kind: "Components" as SaleKind,
        customerName: breakRecord.customerName,
        contact:
          partialRequests.find((r) => r.id === input.requestId)?.contact ?? "",
        listPrice: soldOriginalTotal,
        salePrice: soldTotal,
        paymentMethod: "Cash",
        amountReceived: soldTotal,
        soldAt: new Date().toISOString().slice(0, 19),
      }

      setSales((prev) => [sale, ...prev])
      setSets((prev) => [
        ...newSets,
        ...prev.map((s) => {
          if (s.id !== input.setId) return s
          return {
            ...s,
            status: "Broken" as const,
            components: s.components.map((comp) => {
              if (soldIds.has(comp.id)) {
                return { ...comp, componentStatus: "Sold" as const }
              }
              const decision = remainingById.get(comp.id)
              if (decision?.action === "hold") {
                return { ...comp, componentStatus: "Hold" as const }
              }
              return { ...comp, componentStatus: "Removed" as const }
            }),
            historyNote: `Broken on ${today}. Original set price $${target.fullSetPrice.toLocaleString()}.`,
            breakHistory: breakRecord,
          }
        }),
      ])
      setPartialRequests((prev) =>
        prev.map((r) =>
          r.id === input.requestId
            ? { ...r, status: "Approved" as const, decidedAt: today }
            : r
        )
      )
    },
    [sets, partialRequests]
  )

  const value = useMemo<ShowroomContextValue>(
    () => ({
      sets,
      sales,
      partialRequests,
      addSet,
      sellFullSet,
      requestPartialSale,
      breakSet,
      declinePartialSale,
    }),
    [
      sets,
      sales,
      partialRequests,
      addSet,
      sellFullSet,
      requestPartialSale,
      breakSet,
      declinePartialSale,
    ]
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
