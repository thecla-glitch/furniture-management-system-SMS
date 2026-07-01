"use client"

import { CheckCircle2, CalendarDays } from "lucide-react"

import type { Order, Technician } from "@/lib/mock-data"
import { useOrders } from "@/components/front-desk/orders-store"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

interface CompletedStage {
  order: Order
  stageName: string
  completedAt: string // ISO date
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** ISO date → "Jun 22 – Jun 28, 2026" style week label (Mon–Sun). */
function weekLabel(iso: string): string {
  const d = new Date(iso)
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(mon.getDate() + diff)
  const sun = new Date(mon)
  sun.setDate(sun.getDate() + 6)
  const f = (x: Date) =>
    x.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${f(mon)} – ${f(sun)}, ${sun.getFullYear()}`
}

export function TechDoneScreen({ technician }: { technician: Technician }) {
  const { orders } = useOrders()

  const completed: CompletedStage[] = []
  for (const order of orders) {
    for (const stage of order.stages) {
      if (stage.headTechId === technician.id && stage.status === "Done" && stage.completedAt) {
        completed.push({ order, stageName: stage.name, completedAt: stage.completedAt })
      }
    }
  }

  // Newest first.
  completed.sort((a, b) => b.completedAt.localeCompare(a.completedAt))

  if (completed.length === 0) {
    return (
      <Empty className="mt-8">
        <EmptyHeader>
          <EmptyTitle>No completed stages yet</EmptyTitle>
          <EmptyDescription>
            Stages you finish will appear here, grouped by week.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // Group by week label.
  const groups = new Map<string, CompletedStage[]>()
  for (const stage of completed) {
    const key = weekLabel(stage.completedAt)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(stage)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completed.length} stage{completed.length !== 1 ? "s" : ""} completed in total
        </p>
      </div>

      {[...groups.entries()].map(([week, stages]) => (
        <section key={week}>
          <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {week}
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">
              {stages.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {stages.map((stage, i) => (
              <DoneCard key={`${stage.order.id}-${stage.stageName}-${i}`} stage={stage} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DoneCard({ stage }: { stage: CompletedStage }) {
  return (
    <Card className="gap-0 overflow-hidden border-l-4 border-l-green-500 bg-green-50/40 dark:bg-green-950/20">
      <CardHeader className="gap-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {stage.order.id}
          </span>
          <Badge className="gap-1 border-transparent bg-green-600 text-white dark:bg-green-500">
            <CheckCircle2 className="size-3" />
            Done
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug">
          {stage.order.furnitureType}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 rounded-md bg-green-100/60 dark:bg-green-900/30 px-3 py-1.5">
            <CheckCircle2 className="size-3.5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">
              {stage.stageName}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {fmt(stage.completedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
