"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, ClipboardList, PackageCheck } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrders } from "@/components/front-desk/orders-store"
import { StatusBadge } from "@/components/front-desk/status-badge"
import { CreateOrderDialog } from "@/components/front-desk/create-order-dialog"

type FilterValue = "all" | OrderStatus

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending Approval", label: "Pending" },
  { value: "In Workshop", label: "In Workshop" },
  { value: "Ready for Collection", label: "Ready" },
  { value: "Collected", label: "Collected" },
]

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function OrdersDashboard() {
  const { orders, markCollected } = useOrders()
  const [filter, setFilter] = useState<FilterValue>("all")

  const counts = useMemo(() => {
    const base: Record<FilterValue, number> = {
      all: orders.length,
      "Pending Approval": 0,
      "In Workshop": 0,
      "Ready for Collection": 0,
      Collected: 0,
    }
    for (const o of orders) base[o.status] += 1
    return base
  }, [orders])

  const visible = useMemo(() => {
    const list =
      filter === "all" ? orders : orders.filter((o) => o.status === filter)
    // Surface ready-for-collection first, then by soonest delivery.
    return [...list].sort((a, b) => {
      const aReady = a.status === "Ready for Collection" ? 0 : 1
      const bReady = b.status === "Ready for Collection" ? 0 : 1
      if (aReady !== bReady) return aReady - bReady
      return a.expectedDelivery.localeCompare(b.expectedDelivery)
    })
  }, [orders, filter])

  const readyCount = counts["Ready for Collection"]

  function handleCollect(order: Order) {
    markCollected(order.id)
    toast.success("Marked as collected", {
      description: `${order.id} · ${order.customerName} — recorded just now.`,
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ClipboardList className="size-5" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">
              Front Desk Portal
            </h1>
            <p className="max-w-2xl text-pretty text-muted-foreground">
              Create customer orders, track their progress through the workshop,
              and close them out on collection.
            </p>
          </div>
        </div>
        <CreateOrderDialog />
      </div>

      {readyCount > 0 && (
        <Card className="border-green-300 bg-green-50 dark:border-green-900 dark:bg-green-950/40">
          <CardContent className="flex items-center gap-3 py-3">
            <PackageCheck className="size-5 text-green-700 dark:text-green-300" />
            <p className="text-sm text-green-900 dark:text-green-100">
              <span className="font-semibold">{readyCount}</span>{" "}
              {readyCount === 1 ? "order is" : "orders are"} ready for collection.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterValue)}
        className="gap-4"
      >
        <TabsList className="h-auto flex-wrap">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value} className="gap-1.5">
              {f.label}
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {counts[f.value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Furniture</TableHead>
                <TableHead className="text-right">Quoted</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    No orders in this view.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((order) => {
                const isReady = order.status === "Ready for Collection"
                return (
                  <TableRow
                    key={order.id}
                    className={cn(
                      isReady &&
                        "bg-green-50/70 hover:bg-green-50 dark:bg-green-950/30"
                    )}
                  >
                    <TableCell className="font-medium tabular-nums">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.contact}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.furnitureType}</span>
                        {order.size && (
                          <span className="text-xs text-muted-foreground">
                            {order.size}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currency.format(order.quotedPrice)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(order.expectedDelivery)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <StatusBadge order={order} />
                        {order.status === "Collected" && order.collectedAt && (
                          <span className="text-xs text-muted-foreground">
                            Collected {formatDateTime(order.collectedAt)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {isReady ? (
                        <Button
                          size="sm"
                          onClick={() => handleCollect(order)}
                        >
                          <CheckCircle2 data-icon="inline-start" />
                          Mark Collected
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
