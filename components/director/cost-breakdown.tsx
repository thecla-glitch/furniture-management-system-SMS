"use client"

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
import { cn } from "@/lib/utils"
import { useOrders } from "@/components/front-desk/orders-store"
import { StatusBadge } from "@/components/front-desk/status-badge"
import { getOrderCosting, formatCurrency } from "@/lib/costing"

export function CostBreakdown() {
  const { orders } = useOrders()

  // Totals across all orders that have stage data.
  const totals = orders.reduce(
    (acc, order) => {
      const c = getOrderCosting(order)
      if (!c.hasStages) return acc
      acc.materials += c.materialsCost
      acc.labour += c.labourCost
      acc.total += c.totalCost
      acc.revenue += c.customerPrice
      acc.margin += c.grossMargin
      return acc
    },
    { materials: 0, labour: 0, total: 0, revenue: 0, margin: 0 },
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryStat label="Total revenue" value={formatCurrency(totals.revenue)} />
        <SummaryStat label="Total cost" value={formatCurrency(totals.total)} />
        <SummaryStat label="Materials" value={formatCurrency(totals.materials)} />
        <SummaryStat
          label="Gross margin"
          value={formatCurrency(totals.margin)}
          valueClassName={
            totals.margin >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-destructive"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost &amp; margin</CardTitle>
          <CardDescription>
            Full per-order breakdown across materials, labour and customer price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Furniture</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Materials</TableHead>
                  <TableHead className="text-right">Labour</TableHead>
                  <TableHead className="text-right">Total cost</TableHead>
                  <TableHead className="text-right">Customer price</TableHead>
                  <TableHead className="text-right">Gross margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const c = getOrderCosting(order)
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.furnitureType}</TableCell>
                      <TableCell>
                        <StatusBadge order={order} />
                      </TableCell>
                      {c.hasStages ? (
                        <>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(c.materialsCost)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatCurrency(c.labourCost)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(c.totalCost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(c.customerPrice)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-semibold",
                              c.grossMargin >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive",
                            )}
                          >
                            {formatCurrency(c.grossMargin)}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(c.customerPrice)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                        </>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xl font-semibold text-foreground", valueClassName)}>
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
