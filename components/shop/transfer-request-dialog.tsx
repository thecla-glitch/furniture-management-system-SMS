"use client"

import { useEffect, useState } from "react"
import { ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"

import { getBranchById, type ShowroomSet } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"

export function TransferRequestDialog({ set }: { set: ShowroomSet }) {
  const { activeBranch } = useBranch()
  const { requestTransfer } = useShowroom()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")

  const fromBranch = getBranchById(set.branchId)

  useEffect(() => {
    if (open) setReason("")
  }, [open])

  const canSubmit = reason.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    requestTransfer({
      setId: set.id,
      toBranchId: activeBranch.id,
      requestedBy: activeBranch.name,
      reason,
    })

    toast.success("Transfer request sent to Director", {
      description: `${set.name} (${set.id}) requested from ${
        fromBranch?.name ?? "another branch"
      }.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <ArrowLeftRight data-icon="inline-start" />
            Request transfer
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request transfer — {set.id}</DialogTitle>
          <DialogDescription>
            Ask the Director to move {set.name} from{" "}
            {fromBranch ? `Branch ${fromBranch.code} — ${fromBranch.name}` : "its branch"}{" "}
            to Branch {activeBranch.code} — {activeBranch.name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="transfer-reason">Reason</FieldLabel>
            <Textarea
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer at our branch wants this exact set."
              rows={3}
            />
            <FieldDescription>
              The Director reviews and approves the move. No stock moves yet.
            </FieldDescription>
          </Field>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Send request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
