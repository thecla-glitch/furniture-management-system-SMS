"use client"

import { PackageCheck } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOrders } from "@/components/front-desk/orders-store"
import { AssignStagesDialog } from "@/components/operations/assign-stages-dialog"

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US")}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function OpsQueue() {
  const { orders } = useOrders()

  // Price-confirmed orders that still need a production plan.
  const queue = orders.filter(
    (o) => o.status === "In Workshop" && o.stages.length === 0
  )

  if (queue.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Queue is clear</EmptyTitle>
          <EmptyDescription>
            Every confirmed order has a production plan. New approved orders will
            appear here for stage assignment.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <PackageCheck className="size-4 shrink-0 text-primary" />
        {queue.length} order{queue.length === 1 ? "" : "s"} awaiting a production
        plan. Assign stages and head technicians to start the build.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Furniture</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Confirmed price</TableHead>
              <TableHead>Expected delivery</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="font-medium">
                  {order.customerName}
                </TableCell>
                <TableCell>{order.furnitureType}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.size}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(order.quotedPrice)}
                </TableCell>
                <TableCell>{formatDate(order.expectedDelivery)}</TableCell>
                <TableCell className="text-right">
                  <AssignStagesDialog order={order} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
