"use client"

import { useMemo } from "react"
import {
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  PackageCheck,
  RotateCcw,
  TrendingDown,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
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
import { useStock } from "@/components/stock-keeper/stock-store"

// --------------------------------------------------------------------------
// KPI card
// --------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  alert,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  alert?: boolean
}) {
  return (
    <Card className={alert ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon
          className={`size-4 shrink-0 ${alert ? "text-destructive" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        <p
          className={`text-2xl font-bold tabular-nums ${alert ? "text-destructive" : ""}`}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        )}
      </CardContent>
    </Card>
  )
}

// --------------------------------------------------------------------------
// Main component
// --------------------------------------------------------------------------

export function StockOverview() {
  const { items, orderIssuances, additionalIssuances, records, reorders } =
    useStock()

  const totalValue = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0),
    [items]
  )

  const lowStockItems = useMemo(
    () => items.filter((i) => i.quantity <= i.reorderLevel),
    [items]
  )

  const pendingOrderIssuances = useMemo(
    () => orderIssuances.filter((i) => i.status === "Pending"),
    [orderIssuances]
  )

  const pendingAdditional = useMemo(
    () => additionalIssuances.filter((i) => i.status === "Pending"),
    [additionalIssuances]
  )

  const openReorders = useMemo(
    () => reorders.filter((r) => r.status !== "Received"),
    [reorders]
  )

  return (
    <div className="flex flex-col gap-8">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Materials tracked"
          value={items.length}
          sub={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} total value`}
          icon={Boxes}
        />
        <KpiCard
          label="Low stock"
          value={lowStockItems.length}
          sub={
            lowStockItems.length > 0
              ? "At or below threshold"
              : "All levels healthy"
          }
          icon={TrendingDown}
          alert={lowStockItems.length > 0}
        />
        <KpiCard
          label="Pending issuances"
          value={pendingOrderIssuances.length + pendingAdditional.length}
          sub={`${pendingOrderIssuances.length} orders · ${pendingAdditional.length} additional`}
          icon={ClipboardCheck}
          alert={pendingOrderIssuances.length + pendingAdditional.length > 0}
        />
        <KpiCard
          label="Open reorders"
          value={openReorders.length}
          sub={`${openReorders.filter((r) => r.status === "Raised").length} raised · ${openReorders.filter((r) => r.status === "Ordered").length} ordered`}
          icon={RotateCcw}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low-stock materials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-destructive" />
              Low-stock materials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockItems.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                All materials are above their reorder threshold.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">On hand</TableHead>
                    <TableHead className="text-right">Threshold</TableHead>
                    <TableHead className="text-right">Deficit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-destructive">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {item.reorderLevel} {item.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.reorderLevel - item.quantity} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent issuance records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageCheck className="size-4 text-primary" />
              Recent issuances
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {records.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted-foreground">
                No materials have been issued yet. Completed issuances will
                appear here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Lines</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, 8).map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs text-muted-foreground">
                            {rec.ref}
                          </span>
                          <span className="text-sm">{rec.detail}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rec.kind === "Additional" ? "outline" : "secondary"
                          }
                          className={
                            rec.kind === "Additional"
                              ? "border-primary/50 text-xs"
                              : "text-xs"
                          }
                        >
                          {rec.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {rec.lines.length}{" "}
                        {rec.lines.length === 1 ? "material" : "materials"}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {rec.date}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock by category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdown items={items} />
        </CardContent>
      </Card>
    </div>
  )
}

// --------------------------------------------------------------------------
// Category breakdown — horizontal bar chart (pure CSS, no chart lib needed)
// --------------------------------------------------------------------------

function CategoryBreakdown({
  items,
}: {
  items: ReturnType<typeof useStock>["items"]
}) {
  const rows = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {}
    for (const item of items) {
      if (!map[item.category]) map[item.category] = { count: 0, value: 0 }
      map[item.category].count++
      map[item.category].value += item.quantity * item.unitCost
    }
    return Object.entries(map)
      .map(([cat, data]) => ({ cat, ...data }))
      .sort((a, b) => b.value - a.value)
  }, [items])

  const maxValue = Math.max(...rows.map((r) => r.value), 1)

  return (
    <div className="flex flex-col gap-3">
      {rows.map(({ cat, count, value }) => (
        <div key={cat} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{cat}</span>
            <span className="tabular-nums text-muted-foreground">
              {count} {count === 1 ? "item" : "items"} ·{" "}
              <span className="font-medium text-foreground">
                ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
