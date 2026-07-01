"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Hammer,
  LogOut,
  Wallet,
} from "lucide-react"

import type { Technician } from "@/lib/mock-data"
import { useOrders } from "@/components/front-desk/orders-store"
import { usePaySettlement } from "@/components/head-technician/pay-settlement-store"
import { getWeekRange } from "@/lib/weekly"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PinLogin } from "@/components/head-technician/pin-login"
import { TechTasksScreen } from "@/components/head-technician/tech-tasks-screen"
import { TechDoneScreen } from "@/components/head-technician/tech-done-screen"
import { TechFinancialsScreen } from "@/components/head-technician/tech-financials-screen"

type TechTab = "tasks" | "done" | "financials"

export function HeadTechnicianPortal() {
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [tab, setTab] = useState<TechTab>("tasks")

  if (!technician) {
    return (
      <div className="mx-auto w-full max-w-md">
        <PinLogin onLogin={setTechnician} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <TechHeader
        technician={technician}
        onSignOut={() => {
          setTechnician(null)
          setTab("tasks")
        }}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TechTab)}
        className="gap-0"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="gap-1.5">
            <TaskTabLabel technician={technician} />
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1.5">
            <DoneTabLabel technician={technician} />
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-1.5">
            <FinancialsTabLabel technician={technician} />
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "tasks" && <TechTasksScreen technician={technician} />}
      {tab === "done" && <TechDoneScreen technician={technician} />}
      {tab === "financials" && <TechFinancialsScreen technician={technician} />}
    </div>
  )
}

// ---------- Header ----------------------------------------------------------

function TechHeader({
  technician,
  onSignOut,
}: {
  technician: Technician
  onSignOut: () => void
}) {
  const { orders } = useOrders()
  const { batches } = usePaySettlement()
  const range = getWeekRange("this")

  // This week's earnings (own data only).
  const weekEarnings = useMemo(() => {
    let count = 0
    for (const order of orders) {
      for (const stage of order.stages) {
        if (
          stage.headTechId === technician.id &&
          stage.status === "Done" &&
          stage.completedAt
        ) {
          const t = new Date(stage.completedAt).getTime()
          if (t >= range.start.getTime() && t <= range.end.getTime()) count++
        }
      }
    }
    return count * technician.rate
  }, [orders, technician, range])

  // Unsettled batches (own data only).
  const unsettledTotal = useMemo(
    () =>
      batches
        .filter((b) => b.technicianId === technician.id && !b.settledAt)
        .reduce((s, b) => s + b.total, 0),
    [batches, technician.id]
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-lg font-semibold tracking-tight">{technician.name}</p>
          <p className="text-sm text-muted-foreground">{technician.specialty}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onSignOut}>
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </div>

      {/* Quick stats strip */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
          <Wallet className="size-4 text-blue-500" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-0.5">This week</p>
            <p className="text-base font-semibold tabular-nums leading-none text-blue-600 dark:text-blue-400">
              ${weekEarnings.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
          <BadgeCheck className={cn("size-4", unsettledTotal > 0 ? "text-blue-500" : "text-green-500")} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none mb-0.5">Awaiting collection</p>
            <p className={cn(
              "text-base font-semibold tabular-nums leading-none",
              unsettledTotal > 0 ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"
            )}>
              ${unsettledTotal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Tab labels with live badges -------------------------------------

function TaskTabLabel({ technician }: { technician: Technician }) {
  const { orders } = useOrders()

  const { active, pending } = useMemo(() => {
    let active = 0
    let pending = 0
    for (const order of orders) {
      for (const stage of order.stages) {
        if (stage.headTechId !== technician.id) continue
        if (stage.status === "Active") active++
        else if (stage.status === "Pending") pending++
      }
    }
    // Also count awaiting-return orders as active work.
    for (const order of orders) {
      if (order.status !== "Awaiting Return") continue
      const last = order.stages[order.stages.length - 1]
      if (last?.headTechId === technician.id) active++
    }
    return { active, pending }
  }, [orders, technician.id])

  const total = active + pending

  return (
    <span className="flex items-center gap-1.5">
      <Hammer className="size-3.5" />
      Tasks
      {total > 0 && (
        <span className={cn(
          "rounded-full px-1.5 py-0 text-[11px] font-medium tabular-nums leading-5",
          active > 0
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
        )}>
          {total}
        </span>
      )}
    </span>
  )
}

function DoneTabLabel({ technician }: { technician: Technician }) {
  const { orders } = useOrders()

  const count = useMemo(() => {
    let n = 0
    for (const order of orders) {
      for (const stage of order.stages) {
        if (stage.headTechId === technician.id && stage.status === "Done") n++
      }
    }
    return n
  }, [orders, technician.id])

  return (
    <span className="flex items-center gap-1.5">
      <CheckCircle2 className="size-3.5" />
      Done
      {count > 0 && (
        <span className="rounded-full bg-green-100 px-1.5 py-0 text-[11px] font-medium tabular-nums leading-5 text-green-700 dark:bg-green-900/50 dark:text-green-300">
          {count}
        </span>
      )}
    </span>
  )
}

function FinancialsTabLabel({ technician }: { technician: Technician }) {
  const { batches } = usePaySettlement()

  const unsettled = useMemo(
    () => batches.filter((b) => b.technicianId === technician.id && !b.settledAt).length,
    [batches, technician.id]
  )

  return (
    <span className="flex items-center gap-1.5">
      <Wallet className="size-3.5" />
      Financials
      {unsettled > 0 && (
        <span className="rounded-full bg-blue-100 px-1.5 py-0 text-[11px] font-medium tabular-nums leading-5 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
          {unsettled}
        </span>
      )}
    </span>
  )
}

// ---------- Badge helpers (kept for consistency across the file) ------------

function _StatusBadge({ label, color }: { label: string; color: "blue" | "yellow" | "green" }) {
  const map = {
    blue: "bg-blue-600 text-white",
    yellow: "bg-yellow-400 text-yellow-900",
    green: "bg-green-600 text-white",
  }
  return (
    <Badge className={cn("border-transparent", map[color])}>
      {label}
    </Badge>
  )
}
