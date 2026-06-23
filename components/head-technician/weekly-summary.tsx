"use client"

import { CalendarDays, CheckCircle2, Wallet } from "lucide-react"

import type { Technician } from "@/lib/mock-data"
import { useOrders } from "@/components/front-desk/orders-store"
import { getWeekRange } from "@/lib/weekly"
import { Card, CardContent } from "@/components/ui/card"

export function WeeklySummary({ technician }: { technician: Technician }) {
  const { orders } = useOrders()
  const range = getWeekRange("this")

  // Count this technician's stages completed inside the current week window.
  let stagesCompleted = 0
  for (const order of orders) {
    for (const stage of order.stages) {
      if (
        stage.headTechId === technician.id &&
        stage.status === "Done" &&
        stage.completedAt
      ) {
        const t = new Date(stage.completedAt).getTime()
        if (t >= range.start.getTime() && t <= range.end.getTime()) {
          stagesCompleted += 1
        }
      }
    }
  }
  const earnings = stagesCompleted * technician.rate

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4" />
        {range.label}
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <span className="flex size-12 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <CheckCircle2 className="size-6" />
          </span>
          <div>
            <p className="text-3xl font-semibold tabular-nums leading-none">
              {stagesCompleted}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stagesCompleted === 1 ? "stage" : "stages"} completed this week
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="size-6" />
          </span>
          <div>
            <p className="text-3xl font-semibold tabular-nums leading-none">
              ${earnings.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              earnings due this week
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground text-pretty">
        Based on {stagesCompleted} completed{" "}
        {stagesCompleted === 1 ? "stage" : "stages"} at your agreed rate of $
        {technician.rate.toLocaleString()} per stage. Only your own figures are
        shown.
      </p>
    </div>
  )
}
