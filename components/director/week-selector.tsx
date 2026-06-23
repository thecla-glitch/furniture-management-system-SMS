"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { WeekKey } from "@/lib/weekly"

export function WeekSelector({
  week,
  onWeekChange,
}: {
  week: WeekKey
  onWeekChange: (week: WeekKey) => void
}) {
  return (
    <ToggleGroup
      variant="outline"
      value={[week]}
      onValueChange={(values: string[]) => {
        // Keep exactly one selection — ignore attempts to deselect.
        const next = values.find((v) => v !== week) as WeekKey | undefined
        if (next) onWeekChange(next)
      }}
    >
      <ToggleGroupItem value="this">This week</ToggleGroupItem>
      <ToggleGroupItem value="last">Last week</ToggleGroupItem>
    </ToggleGroup>
  )
}
