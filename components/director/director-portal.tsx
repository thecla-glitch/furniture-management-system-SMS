"use client"

import { useState } from "react"
import { ShieldCheck } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOrders } from "@/components/front-desk/orders-store"
import { ApprovalQueue } from "@/components/director/approval-queue"
import { CostBreakdown } from "@/components/director/cost-breakdown"
import { PayrollView } from "@/components/director/payroll-view"
import { WeeklyReportView } from "@/components/director/weekly-report-view"
import type { WeekKey } from "@/lib/weekly"

type DirectorTab = "queue" | "costs" | "payroll" | "report"

export function DirectorPortal() {
  const { orders } = useOrders()
  const [tab, setTab] = useState<DirectorTab>("queue")
  // Shared week selection across the payroll and weekly report views.
  const [week, setWeek] = useState<WeekKey>("this")

  const pendingCount = orders.filter(
    (o) => o.status === "Pending Approval",
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <ShieldCheck className="size-5" />
        </span>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-balance">
            Director Portal
          </h1>
          <p className="max-w-2xl text-pretty text-muted-foreground">
            Approve customer pricing on new orders and review full cost and
            margin across the workshop.
          </p>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as DirectorTab)}
        className="gap-6"
      >
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="queue" className="gap-1.5">
            Approval queue
            {pendingCount > 0 && (
              <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-medium tabular-nums">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="costs">Cost &amp; margin</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="report">Weekly report</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "queue" && <ApprovalQueue />}
      {tab === "costs" && <CostBreakdown />}
      {tab === "payroll" && (
        <PayrollView week={week} onWeekChange={setWeek} />
      )}
      {tab === "report" && (
        <WeeklyReportView week={week} onWeekChange={setWeek} />
      )}
    </div>
  )
}
