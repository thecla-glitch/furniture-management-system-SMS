"use client"

import { CheckCircle2, Clock, Hammer, Lock } from "lucide-react"
import { toast } from "sonner"

import type { Order, StageStatus, Technician } from "@/lib/mock-data"
import { useOrders } from "@/components/front-desk/orders-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { RequestMaterialDialog } from "@/components/head-technician/request-material-dialog"

interface AssignedStage {
  order: Order
  stageIndex: number
  name: string
  status: StageStatus
}

const STATUS_ORDER: Record<StageStatus, number> = {
  Active: 0,
  Pending: 1,
  Done: 2,
}

export function MyStages({ technician }: { technician: Technician }) {
  const { orders, completeStage } = useOrders()

  // Collect every stage led by this technician.
  const assigned: AssignedStage[] = []
  for (const order of orders) {
    order.stages.forEach((stage, stageIndex) => {
      if (stage.headTechId === technician.id) {
        assigned.push({
          order,
          stageIndex,
          name: stage.name,
          status: stage.status,
        })
      }
    })
  }
  assigned.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  function handleDone(stage: AssignedStage) {
    completeStage(stage.order.id, stage.stageIndex)
    toast.success("Stage complete — next technician notified.", {
      description: `${stage.name} on ${stage.order.id} marked done.`,
    })
  }

  if (assigned.length === 0) {
    return (
      <Empty className="mt-8">
        <EmptyHeader>
          <EmptyTitle>No stages assigned</EmptyTitle>
          <EmptyDescription>
            You have no production stages assigned yet. The Operations Manager
            will assign work to you here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {assigned.map((stage) => (
        <StageCard
          key={`${stage.order.id}-${stage.stageIndex}`}
          stage={stage}
          technician={technician}
          onDone={() => handleDone(stage)}
        />
      ))}
    </div>
  )
}

function StageCard({
  stage,
  technician,
  onDone,
}: {
  stage: AssignedStage
  technician: Technician
  onDone: () => void
}) {
  const { order, name, status } = stage
  const isActive = status === "Active"
  const isPending = status === "Pending"
  const isDone = status === "Done"

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden",
        isActive && "border-primary ring-1 ring-primary/30",
        isPending && "opacity-70",
        isDone && "bg-muted/40"
      )}
    >
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {order.id} · {order.customerName}
          </span>
          <StageStatusBadge status={status} />
        </div>
        <CardTitle className="text-base leading-snug">
          {order.furnitureType}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{order.size}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2">
          <Hammer className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">{name}</span>
        </div>

        {isPending && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" />
            Waiting for previous stage.
          </p>
        )}

        {isActive && (
          <>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm text-muted-foreground">Your rate</span>
              <span className="text-base font-semibold tabular-nums">
                ${technician.rate.toLocaleString()}
              </span>
            </div>
            <Button className="h-12 w-full text-base" onClick={onDone}>
              <CheckCircle2 data-icon="inline-start" />
              Mark done
            </Button>
            <RequestMaterialDialog order={order} technician={technician} />
          </>
        )}

        {isDone && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            Completed
            {stage.order.stages[stage.stageIndex].completedAt
              ? ` on ${formatDate(
                  stage.order.stages[stage.stageIndex].completedAt!
                )}`
              : ""}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function StageStatusBadge({ status }: { status: StageStatus }) {
  if (status === "Active") {
    return (
      <Badge className="gap-1 border-transparent bg-primary text-primary-foreground">
        <Hammer className="size-3" />
        In progress
      </Badge>
    )
  }
  if (status === "Done") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="size-3" />
        Done
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="size-3" />
      Pending
    </Badge>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}
