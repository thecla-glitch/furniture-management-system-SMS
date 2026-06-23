"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

import type { Technician } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PinLogin } from "@/components/head-technician/pin-login"
import { MyStages } from "@/components/head-technician/my-stages"
import { WeeklySummary } from "@/components/head-technician/weekly-summary"

type TechTab = "stages" | "week"

export function HeadTechnicianPortal() {
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [tab, setTab] = useState<TechTab>("stages")

  // Phone-first: keep everything in a narrow centred column.
  if (!technician) {
    return (
      <div className="mx-auto w-full max-w-md">
        <PinLogin onLogin={setTechnician} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="leading-tight">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-lg font-semibold tracking-tight">
            {technician.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {technician.specialty}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTechnician(null)
            setTab("stages")
          }}
        >
          <LogOut data-icon="inline-start" />
          Sign out
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TechTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stages">My stages</TabsTrigger>
          <TabsTrigger value="week">This week</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "stages" && <MyStages technician={technician} />}
      {tab === "week" && <WeeklySummary technician={technician} />}
    </div>
  )
}
