"use client"

import { ChevronRight, Boxes, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { useOrders } from "@/components/front-desk/orders-store"
import {
  getTechnicianById,
  inventory,
  type OrderStage,
  type StageStatus,
} from "@/lib/mock-data"

const STAGE_STYLES: Record<StageStatus, string> = {
  Pending: "border-border bg-muted text-muted-foreground",
  Active:
    "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Done: "border-green-300 bg-green-100 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
}

const LEGEND: { status: StageStatus; label: string }[] = [
  { status: "Pending", label: "Pending" },
  { status: "Active", label: "Active" },
  { status: "Done", label: "Done" },
]

function StageBlock({ stage }: { stage: OrderStage }) {
  const tech = getTechnicianById(stage.headTechId)
  return (
    <div
      className={cn(
        "flex min-w-40 flex-col gap-0.5 rounded-md border px-3 py-2",
        STAGE_STYLES[stage.status]
      )}
    >
      <span className="text-sm font-medium leading-tight">{stage.name}</span>
      <span className="text-xs opacity-80">{tech?.name ?? "Unassigned"}</span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
        {stage.status}
      </span>
    </div>
  )
}

function StockPanel() {
  return (
    <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Boxes className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Stock on hand</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Read-only reference for estimating remaining capacity.
      </p>
      <ul className="flex flex-col gap-1.5">
        {inventory.map((item) => {
          const low = item.quantity <= item.reorderLevel
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5 text-sm last:border-0 last:pb-0"
            >
              <span className="truncate text-muted-foreground">
                {item.name}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 tabular-nums font-medium",
                  low && "text-destructive"
                )}
              >
                {low && <AlertTriangle className="size-3" />}
                {item.quantity} {item.unit}
              </span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

export function PipelineBoard() {
  const { orders } = useOrders()

  // Orders that are in production with a planned set of stages.
  const inProduction = orders.filter(
    (o) => o.status === "In Workshop" && o.stages.length > 0
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="flex flex-col gap-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Stage status
          </span>
          {LEGEND.map(({ status, label }) => (
            <span key={status} className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "size-3 rounded-sm border",
                  STAGE_STYLES[status]
                )}
              />
              {label}
            </span>
          ))}
        </div>

        {inProduction.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Nothing in production</EmptyTitle>
              <EmptyDescription>
                Orders with assigned stages will appear here so you can track
                their progress across the workshop.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {inProduction.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.id}
                    </span>
                    <span className="font-medium">{order.furnitureType}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {order.stages.map((stage, index) => (
                    <div
                      key={`${order.id}-${stage.name}`}
                      className="flex items-center gap-1.5"
                    >
                      <StageBlock stage={stage} />
                      {index < order.stages.length - 1 && (
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StockPanel />
    </div>
  )
}
