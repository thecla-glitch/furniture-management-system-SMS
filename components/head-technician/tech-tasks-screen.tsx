"use client"

import {
  CheckCircle2,
  Clock,
  Hammer,
  Lock,
  PackageCheck,
} from "lucide-react"
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

// Active first, then Pending.
const STATUS_ORDER: Record<StageStatus, number> = {
  Active: 0,
  Pending: 1,
  Done: 2,
}

export function TechTasksScreen({ technician }: { technician: Technician }) {
  const { orders, completeStage, returnToFrontDesk } = useOrders()

  // Only this technician's non-done stages.
  const assigned: AssignedStage[] = []
  for (const order of orders) {
    order.stages.forEach((stage, stageIndex) => {
      if (stage.headTechId === technician.id && stage.status !== "Done") {
        assigned.push({ order, stageIndex, name: stage.name, status: stage.status })
      }
    })
  }
  assigned.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])

  // Also check if this technician is the last stage owner and the order is
  // Awaiting Return (all stages done, just needs physical handback).
  const awaitingReturn: AssignedStage[] = []
  for (const order of orders) {
    if (order.status !== "Awaiting Return") continue
    const lastStageIdx = order.stages.length - 1
    const lastStage = order.stages[lastStageIdx]
    if (lastStage?.headTechId === technician.id) {
      awaitingReturn.push({
        order,
        stageIndex: lastStageIdx,
        name: lastStage.name,
        status: "Done",
      })
    }
  }

  function handleDone(stage: AssignedStage) {
    completeStage(stage.order.id, stage.stageIndex)
    toast.success("Stage marked done.", {
      description: `${stage.name} on order ${stage.order.id} is complete.`,
    })
  }

  function handleReturn(stage: AssignedStage) {
    returnToFrontDesk(stage.order.id)
    toast.success("Returned to Front Desk.", {
      description: `${stage.order.id} is now ready for the customer.`,
    })
  }

  const hasAnything = assigned.length > 0 || awaitingReturn.length > 0

  if (!hasAnything) {
    return (
      <Empty className="mt-8">
        <EmptyHeader>
          <EmptyTitle>No active tasks</EmptyTitle>
          <EmptyDescription>
            You have no pending or in-progress stages right now. The Operations
            Manager will assign work to you here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Awaiting-Return card — special handback prompt */}
      {awaitingReturn.map((stage) => (
        <ReturnCard
          key={`return-${stage.order.id}`}
          stage={stage}
          onReturn={() => handleReturn(stage)}
        />
      ))}

      {/* Active and Pending work cards */}
      {assigned.map((stage) => (
        <TaskCard
          key={`${stage.order.id}-${stage.stageIndex}`}
          stage={stage}
          technician={technician}
          onDone={() => handleDone(stage)}
        />
      ))}
    </div>
  )
}

// ---------- TaskCard --------------------------------------------------------

function TaskCard({
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

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden border-l-4",
        isActive
          ? "border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/20"
          : "border-l-yellow-400 bg-yellow-50/40 dark:bg-yellow-950/20 opacity-85"
      )}
    >
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {order.id}
          </span>
          <TaskStatusBadge status={status} />
        </div>
        <CardTitle className="text-base leading-snug">
          {order.furnitureType}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{order.size}</p>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Stage name — no price shown */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2",
            isActive
              ? "bg-blue-100/60 dark:bg-blue-900/30"
              : "bg-yellow-100/60 dark:bg-yellow-900/30"
          )}
        >
          <Hammer
            className={cn(
              "size-4",
              isActive ? "text-blue-600 dark:text-blue-400" : "text-yellow-600 dark:text-yellow-400"
            )}
          />
          <span className="text-sm font-medium">{name}</span>
        </div>

        {!isActive && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="size-3.5" />
            Waiting for the previous stage to finish.
          </p>
        )}

        {isActive && (
          <>
            <Button
              className="h-12 w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-base"
              onClick={onDone}
            >
              <CheckCircle2 data-icon="inline-start" />
              Mark done
            </Button>
            <RequestMaterialDialog order={order} technician={technician} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- ReturnCard ------------------------------------------------------

function ReturnCard({
  stage,
  onReturn,
}: {
  stage: AssignedStage
  onReturn: () => void
}) {
  return (
    <Card className="gap-0 overflow-hidden border-l-4 border-l-teal-500 bg-teal-50/40 dark:bg-teal-950/20">
      <CardHeader className="gap-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {stage.order.id}
          </span>
          <Badge className="gap-1 border-transparent bg-teal-600 text-white dark:bg-teal-500">
            <PackageCheck className="size-3" />
            Ready to hand back
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug">
          {stage.order.furnitureType}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{stage.order.size}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-0">
        <p className="text-sm text-teal-800 dark:text-teal-300">
          All stages are complete. Return the finished piece to the Front Desk
          so the customer can be notified.
        </p>
        <Button
          className="h-12 w-full bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-base"
          onClick={onReturn}
        >
          <PackageCheck data-icon="inline-start" />
          Return to Front Desk
        </Button>
      </CardContent>
    </Card>
  )
}

// ---------- Badge -----------------------------------------------------------

function TaskStatusBadge({ status }: { status: StageStatus }) {
  if (status === "Active") {
    return (
      <Badge className="gap-1 border-transparent bg-blue-600 text-white dark:bg-blue-500">
        <Hammer className="size-3" />
        In progress
      </Badge>
    )
  }
  return (
    <Badge className="gap-1 border border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300">
      <Clock className="size-3" />
      Pending
    </Badge>
  )
}
