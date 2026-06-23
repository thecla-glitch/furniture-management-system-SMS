"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ClipboardCheck } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { useOrders } from "@/components/front-desk/orders-store"
import { OrderDetailDialog } from "@/components/director/order-detail-dialog"
import { formatCurrency } from "@/lib/costing"
import type { Order } from "@/lib/mock-data"

export function ApprovalQueue() {
  const { orders, approveOrder } = useOrders()
  const [selected, setSelected] = useState<Order | null>(null)
  const [open, setOpen] = useState(false)

  const pending = orders.filter((o) => o.status === "Pending Approval")

  function openOrder(order: Order) {
    setSelected(order)
    setOpen(true)
  }

  function handleApprove(orderId: string, customerPrice: number) {
    approveOrder(orderId, customerPrice)
    const order = orders.find((o) => o.id === orderId)
    toast.success("Order approved & released", {
      description: `${orderId} · ${order?.furnitureType ?? ""} — now In Workshop at ${formatCurrency(
        customerPrice,
      )}.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval queue</CardTitle>
        <CardDescription>
          {pending.length > 0
            ? `${pending.length} order${pending.length > 1 ? "s" : ""} awaiting your price decision.`
            : "No orders are waiting on price approval."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardCheck />
              </EmptyMedia>
              <EmptyTitle>Queue is clear</EmptyTitle>
              <EmptyDescription>
                Approved orders move on to the Operations Manager for scheduling.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Furniture</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Quoted price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => openOrder(order)}
                  >
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.furnitureType}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.size}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.quotedPrice
                        ? formatCurrency(order.quotedPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          openOrder(order)
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <OrderDetailDialog
        order={selected}
        open={open}
        onOpenChange={setOpen}
        onApprove={handleApprove}
      />
    </Card>
  )
}
