"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import {
  orders as seedOrders,
  type Order,
  type OrderStage,
  type OrderStatus,
} from "@/lib/mock-data"

export interface NewOrderInput {
  customerName: string
  contact: string
  furnitureType: string
  size: string
  quotedPrice: number
  orderDate: string
  expectedDelivery: string
  requiresApproval: boolean
  referenceImages: string[]
  /** Branch the order was raised at (defaults to "Front Desk"). */
  originatingBranch?: string
  /** Set when the order was created from an approved custom quote. */
  quoteId?: string
}

// A planned stage before statuses are assigned by the workflow.
export type StagePlan = Omit<OrderStage, "status" | "completedAt">

interface OrdersContextValue {
  orders: Order[]
  addOrder: (input: NewOrderInput) => Order
  markCollected: (orderId: string) => void
  approveOrder: (orderId: string, customerPrice: number) => void
  /** Save a production plan. The order becomes "Planned" — no work has started
   * and stages are all Pending until wages are set and Start Work is pushed. */
  assignStages: (orderId: string, stages: StagePlan[]) => void
  /** Attach bargained wages to each stage (index-aligned). */
  priceStages: (orderId: string, wages: number[]) => void
  /** Push "Start Work" — activates the first stage and moves the order into
   * production. Requires every stage to be priced first. */
  startWork: (orderId: string) => void
  /** Mark a stage Done and activate the next pending stage on the same order. */
  completeStage: (orderId: string, stageIndex: number) => void
  /** Last technician hands a finished order back to the Front Desk. */
  returnToFrontDesk: (orderId: string) => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

function makeOrderId(existing: Order[]): string {
  const maxNum = existing.reduce((max, o) => {
    const num = Number.parseInt(o.id.replace(/\D/g, ""), 10)
    return Number.isNaN(num) ? max : Math.max(max, num)
  }, 1000)
  return `ORD-${maxNum + 1}`
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(seedOrders)

  const addOrder = useCallback((input: NewOrderInput): Order => {
    const status: OrderStatus = input.requiresApproval
      ? "Pending Approval"
      : "In Workshop"

    const newOrder: Order = {
      id: makeOrderId(orders),
      customerName: input.customerName,
      contact: input.contact,
      furnitureType: input.furnitureType,
      size: input.size,
      quotedPrice: input.quotedPrice,
      orderDate: input.orderDate,
      expectedDelivery: input.expectedDelivery,
      status,
      originatingBranch: input.originatingBranch ?? "Front Desk",
      referenceImages: input.referenceImages,
      quoteId: input.quoteId,
      // Production stages are planned later by the Operations Manager.
      stages: [],
    }

    setOrders((prev) => [newOrder, ...prev])
    return newOrder
  }, [orders])

  const markCollected = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: "Collected", collectedAt: new Date().toISOString() }
          : o
      )
    )
  }, [])

  const approveOrder = useCallback((orderId: string, customerPrice: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              quotedPrice: customerPrice,
              status: "In Workshop",
              // Stages are (re)planned by the Operations Manager after approval.
              stages: [],
            }
          : o
      )
    )
  }, [])

  const assignStages = useCallback((orderId: string, stages: StagePlan[]) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              // Plan saved — no financials, no work started yet.
              status: "Planned",
              stages: stages.map((stage) => ({
                ...stage,
                status: "Pending" as const,
              })),
            }
          : o
      )
    )
  }, [])

  const priceStages = useCallback((orderId: string, wages: number[]) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              stages: o.stages.map((stage, index) => ({
                ...stage,
                wage: wages[index] ?? stage.wage,
              })),
            }
          : o
      )
    )
  }, [])

  const startWork = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId || o.status !== "Planned" || o.stages.length === 0) {
          return o
        }
        return {
          ...o,
          status: "In Workshop",
          stages: o.stages.map((stage, index) => ({
            ...stage,
            // First technician's stage goes live; the rest keep waiting.
            status: index === 0 ? ("Active" as const) : ("Pending" as const),
          })),
        }
      })
    )
  }, [])

  const completeStage = useCallback((orderId: string, stageIndex: number) => {
    const today = new Date().toISOString().slice(0, 10)
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o
        const stages = o.stages.map((stage, index) => {
          if (index === stageIndex) {
            return { ...stage, status: "Done" as const, completedAt: today }
          }
          // Activate the next stage only if it was waiting.
          if (index === stageIndex + 1 && stage.status === "Pending") {
            return { ...stage, status: "Active" as const }
          }
          return stage
        })
        // Once every stage is done the piece still isn't ready to collect —
        // the last technician must physically return it to the Front Desk.
        const allDone = stages.every((s) => s.status === "Done")
        return {
          ...o,
          stages,
          status: allDone ? ("Awaiting Return" as const) : o.status,
        }
      })
    )
  }, [])

  const returnToFrontDesk = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId && o.status === "Awaiting Return"
          ? {
              ...o,
              status: "Ready for Collection",
              returnedAt: new Date().toISOString(),
            }
          : o
      )
    )
  }, [])

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      addOrder,
      markCollected,
      approveOrder,
      assignStages,
      priceStages,
      startWork,
      completeStage,
      returnToFrontDesk,
    }),
    [
      orders,
      addOrder,
      markCollected,
      approveOrder,
      assignStages,
      priceStages,
      startWork,
      completeStage,
      returnToFrontDesk,
    ]
  )

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext)
  if (!ctx) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return ctx
}
