"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { getBranchById } from "@/lib/mock-data"
import { useBranch } from "@/components/shop/branch-store"
import { useShowroom } from "@/components/shop/showroom-store"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NewTransferDialog() {
  const { branches } = useBranch()
  const { sets, initiateTransfer } = useShowroom()
  const [open, setOpen] = useState(false)
  const [setId, setSetId] = useState("")
  const [toBranchId, setToBranchId] = useState("")

  // Only available sets can be moved; show their current branch for clarity.
  const movableSets = useMemo(
    () => sets.filter((s) => s.status === "Available"),
    [sets]
  )

  const selectedSet = movableSets.find((s) => s.id === setId)

  useEffect(() => {
    if (open) {
      setSetId("")
      setToBranchId("")
    }
  }, [open])

  // Can't transfer a set to the branch it already lives at.
  const destinationBranches = useMemo(
    () => branches.filter((b) => b.id !== selectedSet?.branchId),
    [branches, selectedSet?.branchId]
  )

  const canSubmit = setId.length > 0 && toBranchId.length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !selectedSet) return

    initiateTransfer({
      setId,
      toBranchId,
      requestedBy: "Director",
    })

    const dest = getBranchById(toBranchId)
    toast.success("Transfer completed", {
      description: `${selectedSet.name} moved to ${
        dest?.name ?? "destination branch"
      }.`,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" />
            New transfer
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New transfer</DialogTitle>
          <DialogDescription>
            Move an available set between branches directly. This is approved
            and completed in one step.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="transfer-set">Set</FieldLabel>
            <Select
              value={setId}
              onValueChange={(v) => setSetId(v ?? "")}
            >
              <SelectTrigger id="transfer-set">
                <SelectValue placeholder="Choose a set to move" />
              </SelectTrigger>
              <SelectContent>
                {movableSets.map((s) => {
                  const branch = getBranchById(s.branchId)
                  return (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.id}
                      {branch ? ` (${branch.name})` : ""}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="transfer-dest">Destination branch</FieldLabel>
            <Select
              value={toBranchId}
              onValueChange={(v) => setToBranchId(v ?? "")}
              disabled={!selectedSet}
            >
              <SelectTrigger id="transfer-dest">
                <SelectValue placeholder="Choose destination" />
              </SelectTrigger>
              <SelectContent>
                {destinationBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    Branch {b.code} — {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              {selectedSet
                ? `Currently at ${
                    getBranchById(selectedSet.branchId)?.name ?? "its branch"
                  }.`
                : "Pick a set first."}
            </FieldDescription>
          </Field>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              Transfer & approve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
