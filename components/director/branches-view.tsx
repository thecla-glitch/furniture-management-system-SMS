"use client"

import { useState } from "react"
import { Download, Loader2, MapPin, ShoppingBag, Hammer, Package } from "lucide-react"
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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
import { Badge } from "@/components/ui/badge"
import { useOrders } from "@/components/front-desk/orders-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { formatCurrency, getOrderCosting } from "@/lib/costing"
import { downloadPDF } from "@/lib/pdf-export"
import { branches, technicians } from "@/lib/mock-data"

const PIE_COLORS = [
  "#4F7BEF", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
]

// All distinct branch names that appear in orders (originating) or showroom items.
// We combine the formal showroom branches with the originating branch names on orders.
const WORKSHOP_BRANCHES = ["Central Workshop", "Lekki Showroom", "Abuja Branch", "Ikeja Showroom"]

export function BranchesView() {
  const { orders } = useOrders()
  const { items, sales } = useShowroom()
  const [selected, setSelected] = useState<string | "all">("all")
  const [exporting, setExporting] = useState(false)

  // Showroom branches from mock-data
  const showroomBranches = branches

  // Per showroom-branch metrics
  const branchStats = showroomBranches.map((b) => {
    const branchItems = items.filter((i) => i.branchId === b.id)
    const branchSales = sales.filter((s) => s.branchId === b.id)
    const available = branchItems.filter((i) => i.status === "Available").length
    const sold = branchItems.filter((i) => i.status === "Sold").length
    const salesRevenue = branchSales.reduce((s, sale) => s + sale.total, 0)
    return {
      branch: b,
      available,
      sold,
      totalItems: branchItems.length,
      salesRevenue,
      salesCount: branchSales.length,
    }
  })

  // Per originating-branch order metrics
  const orderBranchMap: Record<string, { orders: number; revenue: number; inWorkshop: number; completed: number }> = {}
  for (const o of orders) {
    const key = o.originatingBranch ?? "Unknown"
    if (!orderBranchMap[key]) orderBranchMap[key] = { orders: 0, revenue: 0, inWorkshop: 0, completed: 0 }
    orderBranchMap[key].orders += 1
    orderBranchMap[key].revenue += o.quotedPrice
    if (o.status === "In Workshop" || o.status === "Awaiting Return") orderBranchMap[key].inWorkshop += 1
    if (o.status === "Collected") orderBranchMap[key].completed += 1
  }

  // Chart: orders by branch
  const ordersByBranch = Object.entries(orderBranchMap).map(([name, v]) => ({
    name,
    Orders: v.orders,
    Revenue: v.revenue,
  }))

  // Chart: showroom stock distribution
  const stockByBranch = branchStats.map((b) => ({
    name: b.branch.name,
    Available: b.available,
    Sold: b.sold,
  }))

  // Chart: showroom revenue by branch pie
  const revenueByBranchPie = branchStats
    .filter((b) => b.salesRevenue > 0)
    .map((b) => ({ name: b.branch.name, value: b.salesRevenue }))

  // Filter orders for selected branch drill-down
  const filteredOrders = selected === "all"
    ? orders
    : orders.filter((o) => o.originatingBranch === selected || o.originatingBranch?.includes(selected))

  async function handleExport() {
    setExporting(true)
    try {
      await downloadPDF(
        `branches-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        "Branches Report",
        `All branches overview · ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}`,
        [
          {
            title: "Showroom stock overview",
            stats: branchStats.flatMap((b) => [
              { label: `${b.branch.name} — available`, value: String(b.available) },
              { label: `${b.branch.name} — sales revenue`, value: formatCurrency(b.salesRevenue) },
            ]),
          },
          {
            title: "Stock distribution by branch",
            elementId: "branches-stock-chart",
          },
          {
            title: "Orders by originating branch",
            elementId: "branches-orders-chart",
          },
          {
            title: "All orders",
            table: {
              headers: ["Order", "Customer", "Furniture", "Branch", "Status", "Revenue"],
              rows: orders.map((o) => [
                o.id,
                o.customerName,
                o.furnitureType,
                o.originatingBranch ?? "—",
                o.status,
                formatCurrency(o.quotedPrice),
              ]),
            },
          },
        ]
      )
      toast.success("Branches report downloaded.")
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">Branches</h2>
          <p className="text-sm text-muted-foreground">
            Performance, stock and order activity across all showroom branches.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={exporting}
          className="gap-1.5 self-start"
        >
          {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Download PDF
        </Button>
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branchStats.map((b, i) => {
          const orderStats = orderBranchMap[b.branch.name] ?? { orders: 0, revenue: 0, inWorkshop: 0, completed: 0 }
          return (
            <Card
              key={b.branch.id}
              className={cn(
                "cursor-pointer transition-shadow hover:shadow-md",
                selected === b.branch.name && "ring-2 ring-primary"
              )}
              onClick={() => setSelected(selected === b.branch.name ? "all" : b.branch.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-8 items-center justify-center rounded-lg text-white text-sm font-bold"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    >
                      {b.branch.code}
                    </span>
                    <CardTitle className="text-base">{b.branch.name}</CardTitle>
                  </div>
                  <MapPin className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <MetricItem icon={Package} label="Available stock" value={String(b.available)} />
                <MetricItem icon={ShoppingBag} label="Items sold" value={String(b.sold)} />
                <MetricItem icon={Hammer} label="Orders" value={String(orderStats.orders)} />
                <MetricItem
                  icon={ShoppingBag}
                  label="Sales revenue"
                  value={formatCurrency(b.salesRevenue)}
                  highlight
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Showroom stock distribution</CardTitle>
            <CardDescription>Available vs sold per branch</CardDescription>
          </CardHeader>
          <CardContent id="branches-stock-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockByBranch} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="Available" fill={PIE_COLORS[0]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Sold" fill={PIE_COLORS[1]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {revenueByBranchPie.length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Showroom revenue by branch</CardTitle>
              <CardDescription>Revenue share per showroom location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={revenueByBranchPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {revenueByBranchPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Orders by originating branch</CardTitle>
              <CardDescription>Number of orders raised per branch</CardDescription>
            </CardHeader>
            <CardContent id="branches-orders-chart">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ordersByBranch} margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v, name) => name === "Revenue" ? formatCurrency(Number(v)) : v} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="Orders" fill={PIE_COLORS[2]} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Orders drill-down table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>
                {selected === "all" ? "All orders" : `Orders — ${selected}`}
              </CardTitle>
              <CardDescription>
                {selected === "all"
                  ? "Click a branch card above to filter by location."
                  : `Showing ${filteredOrders.length} order${filteredOrders.length === 1 ? "" : "s"} from ${selected}.`}
              </CardDescription>
            </div>
            {selected !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setSelected("all")}>
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Furniture</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o) => {
                  const c = getOrderCosting(o)
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.id}</TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>{o.furnitureType}</TableCell>
                      <TableCell className="text-muted-foreground">{o.originatingBranch ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(o.quotedPrice)}</TableCell>
                      <TableCell className={cn(
                        "text-right tabular-nums font-medium",
                        c.hasStages
                          ? c.grossMargin >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
                          : "text-muted-foreground"
                      )}>
                        {c.hasStages ? formatCurrency(c.grossMargin) : "—"}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No orders for this branch.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Technicians by branch */}
      <Card>
        <CardHeader>
          <CardTitle>Technical staff</CardTitle>
          <CardDescription>Head technicians and their specialties across the workshop.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead className="text-right">Stage rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground">{t.specialty}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(t.rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" />
        <span className="text-xs">{label}</span>
      </div>
      <span className={cn("text-sm font-semibold", highlight && "text-primary")}>
        {value}
      </span>
    </div>
  )
}
