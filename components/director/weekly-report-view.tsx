"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useOrders } from "@/components/front-desk/orders-store"
import { WeekSelector } from "@/components/director/week-selector"
import { formatCurrency } from "@/lib/costing"
import { getWeeklyReport, getWeekRange, type WeekKey } from "@/lib/weekly"
import { downloadPDF } from "@/lib/pdf-export"

const PIE_COLORS = ["#4F7BEF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"]

export function WeeklyReportView({
  week,
  onWeekChange,
}: {
  week: WeekKey
  onWeekChange: (week: WeekKey) => void
}) {
  const { orders } = useOrders()
  const range = getWeekRange(week)
  const report = getWeeklyReport(orders, range)
  const netMargin = report.totalRevenue - report.totalLabour - report.materialsTotalCost
  const [exporting, setExporting] = useState(false)

  // Pie chart data — materials by cost
  const materialsPieData = report.materials.map((m) => ({
    name: m.name,
    value: m.cost,
  }))

  // Cost breakdown pie: materials vs labour vs margin
  const costSplitData = [
    { name: "Materials", value: report.materialsTotalCost },
    { name: "Labour", value: report.totalLabour },
    ...(netMargin > 0 ? [{ name: "Net margin", value: netMargin }] : []),
  ].filter((d) => d.value > 0)

  async function handleExport() {
    setExporting(true)
    try {
      await downloadPDF(
        `weekly-report-${range.label.replace(/[^a-z0-9]/gi, "-")}.pdf`,
        "Weekly Cost Report",
        `${range.label} · ${report.completedOrders} orders completed`,
        [
          {
            title: "Summary",
            stats: [
              { label: "Revenue (completed orders)", value: formatCurrency(report.totalRevenue) },
              { label: "Labour due", value: formatCurrency(report.totalLabour) },
              { label: "Materials consumed", value: formatCurrency(report.materialsTotalCost) },
              { label: "Net margin", value: formatCurrency(netMargin) },
            ],
          },
          {
            title: "Cost breakdown",
            elementId: "report-cost-chart",
          },
          {
            title: "Materials by cost",
            elementId: "report-materials-chart",
          },
          {
            title: "Materials consumed by type",
            table: {
              headers: ["Material", "Total quantity", "Cost"],
              rows: report.materials.map((m) => [
                m.name,
                `${m.quantity} ${m.unit}`,
                formatCurrency(m.cost),
              ]),
              footerRow: ["Total materials", "", formatCurrency(report.materialsTotalCost)],
            },
          },
        ]
      )
      toast.success("Report downloaded.")
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Weekly cost report
          </h2>
          <p className="text-sm text-muted-foreground">
            Summary for {range.label} &middot; {report.completedOrders} order
            {report.completedOrders === 1 ? "" : "s"} completed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WeekSelector week={week} onWeekChange={onWeekChange} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5"
          >
            {exporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (completed orders)" value={formatCurrency(report.totalRevenue)} />
        <StatCard label="Labour due" value={formatCurrency(report.totalLabour)} />
        <StatCard label="Materials consumed" value={formatCurrency(report.materialsTotalCost)} />
        <StatCard
          label="Net margin"
          value={formatCurrency(netMargin)}
          valueClassName={
            netMargin >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-destructive"
          }
        />
      </div>

      {/* Charts row */}
      {(costSplitData.length > 0 || materialsPieData.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {costSplitData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cost breakdown</CardTitle>
                <CardDescription>Revenue split by materials, labour and margin</CardDescription>
              </CardHeader>
              <CardContent id="report-cost-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={costSplitData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {costSplitData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {materialsPieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Materials by cost</CardTitle>
                <CardDescription>Proportion of total material spend per type</CardDescription>
              </CardHeader>
              <CardContent id="report-materials-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={materialsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {materialsPieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Materials table */}
      <Card>
        <CardHeader>
          <CardTitle>Materials consumed by type</CardTitle>
          <CardDescription>
            Materials drawn for stages completed during {range.label}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.materials.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No materials consumed</EmptyTitle>
                <EmptyDescription>
                  No stages were completed during {range.label}.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Total quantity</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.materials.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {m.quantity} {m.unit}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(m.cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-medium">
                      Total materials
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums">
                      {formatCurrency(report.materialsTotalCost)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
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
        <span className="text-xs text-muted-foreground text-pretty">{label}</span>
        <span className={cn("text-xl font-semibold text-foreground", valueClassName)}>
          {value}
        </span>
      </CardContent>
    </Card>
  )
}
