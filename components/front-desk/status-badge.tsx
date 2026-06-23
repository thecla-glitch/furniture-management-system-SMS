import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderStatus } from "@/lib/mock-data"

const STATUS_STYLES: Record<OrderStatus, string> = {
  "Pending Approval":
    "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  "In Workshop":
    "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  "Ready for Collection":
    "border-green-300 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  Collected:
    "border-border bg-muted text-muted-foreground",
}

export function workshopStage(order: Order): string | null {
  if (order.status !== "In Workshop") return null
  const total = order.stages.length
  if (total === 0) return "Awaiting plan"
  const done = order.stages.filter((s) => s.status === "Done").length
  const current = Math.min(done + 1, total)
  return `Stage ${current} of ${total}`
}

export function StatusBadge({ order }: { order: Order }) {
  const stage = workshopStage(order)

  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge
        variant="outline"
        className={cn("font-medium", STATUS_STYLES[order.status])}
      >
        {order.status}
      </Badge>
      {stage && (
        <span className="text-xs text-muted-foreground">{stage}</span>
      )}
    </span>
  )
}
