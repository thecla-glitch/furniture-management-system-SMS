"use client"

import { useState } from "react"
import { CircleDollarSign, PlayCircle, Boxes, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/components/front-desk/orders-store"
import { getTechnicianById, type Order, type StageStatus } from "@/lib/mock-data"

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US")}`
}

const STAGE_DOT: Record<StageStatus, string> = {
  Pending: "bg-muted-foreground/40",
  Active: "bg-primary",
  Done: "bg-green-500",
}

// ---------- Planned order card (price + start) ------------------------------

function PlannedOrderCard({ order }: { order: Order }) {
  const { priceStages, startWork } = useOrders()
  const [wages, setWages] = useState<string[]>(() =>
    order.stages.map((s) => (s.wage ? String(s.wage) : ""))
  )

  const parsed = wages.map((w) => Number.parseFloat(w) || 0)
  const allPriced = parsed.length > 0 && parsed.every((w) => w > 0)
  const totalLabour = parsed.reduce((sum, w) => sum + w, 0)

  function handleStart() {
    if (!allPriced) return
    priceStages(order.id, parsed)
    startWork(order.id)
    const firstTech = getTechnicianById(order.stages[0].headTechId)
    toast.success("Start Work pushed", {
      description: `${firstTech?.name ?? "The first technician"} notified by SMS. The task is now pending in their portal.`,
    })
  }

  function handleSaveWages() {
    priceStages(order.id, parsed)
    toast.success("Wages saved", {
      description: `Labour budget for ${order.id} updated to ${formatCurrency(totalLabour)}.`,
    })
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="font-mono text-xs text-muted-foreground">
              {order.id}
            </span>
            {order.furnitureType}
          </CardTitle>
          <Badge
            variant="outline"
            className="border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
          >
            Awaiting start
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {order.customerName} · {order.size}
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {order.stages.map((stage, index) => {
            const tech = getTechnicianById(stage.headTechId)
            return (
              <div
                key={`${order.id}-${index}`}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-40 flex-1">
                  <p className="text-sm font-medium leading-tight">
                    {stage.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tech?.name ?? "Unassigned"}
                    {stage.materials.length > 0 && (
                      <span className="ml-1">
                        · {stage.materials.length} material
                        {stage.materials.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Wage</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={wages[index]}
                      onChange={(e) =>
                        setWages((prev) =>
                          prev.map((w, i) => (i === index ? e.target.value : w))
                        )
                      }
                      placeholder="0"
                      aria-label={`Wage for ${stage.name}`}
                      className="h-9 w-28 pl-6 tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <span className="flex items-center gap-1.5 text-sm">
            <CircleDollarSign className="size-4 text-primary" />
            Total labour:{" "}
            <strong className="tabular-nums">
              {formatCurrency(totalLabour)}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveWages}>
              Save wages
            </Button>
            <Button size="sm" onClick={handleStart} disabled={!allPriced}>
              <PlayCircle data-icon="inline-start" />
              Start Work
            </Button>
          </div>
        </div>
        {!allPriced && (
          <p className="text-xs text-muted-foreground">
            Enter a bargained wage for every stage to enable Start Work.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- In-production card (read-only) ----------------------------------

function ProductionOrderCard({ order }: { order: Order }) {
  const totalLabour = order.stages.reduce((sum, s) => sum + (s.wage ?? 0), 0)
  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="font-mono text-xs text-muted-foreground">
              {order.id}
            </span>
            {order.furnitureType}
          </CardTitle>
          <Badge
            variant="outline"
            className="border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
          >
            In production
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {order.customerName} · Labour {formatCurrency(totalLabour)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-1.5">
          {order.stages.map((stage, index) => {
            const tech = getTechnicianById(stage.headTechId)
            return (
              <div key={`${order.id}-${index}`} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs",
                    stage.status === "Active" && "border-primary/40 bg-primary/5"
                  )}
                >
                  <span className={cn("size-2 rounded-full", STAGE_DOT[stage.status])} />
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-muted-foreground">{tech?.name}</span>
                  {stage.wage ? (
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(stage.wage)}
                    </span>
                  ) : null}
                </span>
                {index < order.stages.length - 1 && (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- Main ------------------------------------------------------------

type AssignTab = "planned" | "production"

export function AssignmentsManager() {
  const { orders } = useOrders()
  const [tab, setTab] = useState<AssignTab>("planned")

  const planned = orders.filter((o) => o.status === "Planned")
  const inProduction = orders.filter(
    (o) => o.status === "In Workshop" && o.stages.length > 0
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Boxes className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Assignments &amp; wage pricing
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Revisit saved production plans, enter the wages you bargained with
            each technician, then push Start Work to send the job to the first
            technician&apos;s portal.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AssignTab)}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="planned" className="gap-1.5">
            Awaiting start
            {planned.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {planned.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="production" className="gap-1.5">
            In production
            {inProduction.length > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {inProduction.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "planned" &&
        (planned.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No plans awaiting start</EmptyTitle>
              <EmptyDescription>
                Save a production plan from the Ops queue, then price its stages
                here before starting work.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {planned.map((order) => (
              <PlannedOrderCard key={order.id} order={order} />
            ))}
          </div>
        ))}

      {tab === "production" &&
        (inProduction.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nothing in production</EmptyTitle>
              <EmptyDescription>
                Orders you have started work on will appear here so you can track
                their stages and labour.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            {inProduction.map((order) => (
              <ProductionOrderCard key={order.id} order={order} />
            ))}
          </div>
        ))}
    </div>
  )
}
