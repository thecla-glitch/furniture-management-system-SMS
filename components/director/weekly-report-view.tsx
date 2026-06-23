"use client"

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Weekly cost report
          </h2>
          <p className="text-sm text-muted-foreground">
            Summary for {range.label} · {report.completedOrders} order
            {report.completedOrders === 1 ? "" : "s"} completed.
          </p>
        </div>
        <WeekSelector week={week} onWeekChange={onWeekChange} />
      </div>

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
