"use client"

import { Lock } from "lucide-react"

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
import { getPayroll, getWeekRange, type WeekKey } from "@/lib/weekly"

export function PayrollView({
  week,
  onWeekChange,
}: {
  week: WeekKey
  onWeekChange: (week: WeekKey) => void
}) {
  const { orders } = useOrders()
  const range = getWeekRange(week)
  const { rows, total } = getPayroll(orders, range)

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Weekly payroll</CardTitle>
          <CardDescription>
            Payout per head technician for stages completed during {range.label}.
          </CardDescription>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="size-3.5" />
            Director-only view — not visible to other roles.
          </p>
        </div>
        <WeekSelector week={week} onWeekChange={onWeekChange} />
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No completed stages</EmptyTitle>
              <EmptyDescription>
                No technicians completed any stages during {range.label}.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead className="text-right">Stages completed</TableHead>
                  <TableHead className="text-right">Rate / stage</TableHead>
                  <TableHead className="text-right">Payout due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.technician.id}>
                    <TableCell className="font-medium">
                      {row.technician.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.technician.specialty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stagesCompleted}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatCurrency(row.rate)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatCurrency(row.payout)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-medium">
                    Total payout
                  </TableCell>
                  <TableCell className="text-right text-base font-bold tabular-nums">
                    {formatCurrency(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
