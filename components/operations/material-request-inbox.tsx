"use client"

import { Check, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMaterialRequests } from "@/components/operations/material-requests-store"
import type { MaterialRequestStatus } from "@/lib/mock-data"

const STATUS_STYLES: Record<MaterialRequestStatus, string> = {
  Pending:
    "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Approved:
    "border-green-300 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200",
  Rejected: "border-border bg-muted text-muted-foreground",
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function MaterialRequestInbox() {
  const { requests, setStatus } = useMaterialRequests()

  if (requests.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No material requests</EmptyTitle>
          <EmptyDescription>
            Additional-material requests raised by head technicians will appear
            here for review.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const pending = requests.filter((r) => r.status === "Pending").length

  function handleApprove(id: string, material: string, qty: number, unit: string) {
    setStatus(id, "Approved")
    toast.success("Request approved", {
      description: `Authorised issuance of ${qty} ${unit} of ${material} sent to the Stock Keeper.`,
    })
  }

  function handleReject(id: string) {
    setStatus(id, "Rejected")
    toast("Request rejected", {
      description: "The technician will be notified the request was declined.",
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {pending} pending request{pending === 1 ? "" : "s"} awaiting your review.
        Approving sends an authorised issuance to the Stock Keeper.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Material</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {req.orderId}
                </TableCell>
                <TableCell className="font-medium">
                  {req.technicianName}
                </TableCell>
                <TableCell>{req.materialName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {req.quantity} {req.unit}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(req.requestedAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", STATUS_STYLES[req.status])}
                  >
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {req.status === "Pending" ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleApprove(
                            req.id,
                            req.materialName,
                            req.quantity,
                            req.unit
                          )
                        }
                      >
                        <Check data-icon="inline-start" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(req.id)}
                      >
                        <X data-icon="inline-start" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Resolved
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
