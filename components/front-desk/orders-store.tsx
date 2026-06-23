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
}

// A planned stage before statuses are assigned by the workflow.
export type StagePlan = Omit<OrderStage, "status" | "completedAt">

interface OrdersContextValue {
  orders: Order[]
  addOrder: (input: NewOrderInput) => void
  markCollected: (orderId: string) => void
  approveOrder: (orderId: string, customerPrice: number) => void
  assignStages: (orderId: string, stages: StagePlan[]) => void
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

  const addOrder = useCallback((input: NewOrderInput) => {
    setOrders((prev) => {
      const status: OrderStatus = input.requiresApproval
        ? "Pending Approval"
        : "In Workshop"

      const newOrder: Order = {
        id: makeOrderId(prev),
        customerName: input.customerName,
        contact: input.contact,
        furnitureType: input.furnitureType,
        size: input.size,
        quotedPrice: input.quotedPrice,
        orderDate: input.orderDate,
        expectedDelivery: input.expectedDelivery,
        status,
        originatingBranch: "Front Desk",
        referenceImages: input.referenceImages,
        // Production stages are planned later by the Operations Manager.
        stages: [],
      }

      return [newOrder, ...prev]
    })
  }, [])

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
              status: "In Workshop",
              stages: stages.map((stage, index) => ({
                ...stage,
                // First stage starts Active, the rest wait as Pending.
                status: index === 0 ? "Active" : "Pending",
              })),
            }
          : o
      )
    )
  }, [])

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, addOrder, markCollected, approveOrder, assignStages }),
    [orders, addOrder, markCollected, approveOrder, assignStages]
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
