"use client"

import { useState } from "react"
import { Factory } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/components/front-desk/orders-store"
import { useMaterialRequests } from "@/components/operations/material-requests-store"
import { PipelineBoard } from "@/components/operations/pipeline-board"
import { OpsQueue } from "@/components/operations/ops-queue"
import { MaterialRequestInbox } from "@/components/operations/material-request-inbox"
import { TechnicianRoster } from "@/components/operations/technician-roster"

type OpsTab = "pipeline" | "queue" | "requests" | "technicians"

export function OperationsPortal() {
  const { orders } = useOrders()
  const { pendingCount } = useMaterialRequests()
  const [tab, setTab] = useState<OpsTab>("pipeline")

  const queueCount = orders.filter(
    (o) => o.status === "In Workshop" && o.stages.length === 0
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Factory className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Operations Manager Portal
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Plan production for confirmed orders, assign head technicians and
            materials, and manage the technician roster.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as OpsTab)}
        className="gap-6"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5">
            Ops queue
            {queueCount > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {queueCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            Material requests
            {pendingCount > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "pipeline" && <PipelineBoard />}
      {tab === "queue" && <OpsQueue />}
      {tab === "requests" && <MaterialRequestInbox />}
      {tab === "technicians" && <TechnicianRoster />}
    </div>
  )
}
