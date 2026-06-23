"use client"

import { useState } from "react"
import { ClipboardList, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
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
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useOrders,
  type StagePlan,
} from "@/components/front-desk/orders-store"
import { useTechnicians } from "@/components/operations/technicians-store"
import { getInventoryById, inventory, type Order } from "@/lib/mock-data"

interface MaterialDraft {
  id: string
  inventoryItemId: string
  quantity: string
}

interface StageDraft {
  id: string
  name: string
  headTechId: string
  materials: MaterialDraft[]
}

let counter = 0
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`

function newStage(): StageDraft {
  return { id: uid("stage"), name: "", headTechId: "", materials: [] }
}

export function AssignStagesDialog({ order }: { order: Order }) {
  const { assignStages } = useOrders()
  const { activeTechnicians } = useTechnicians()
  const [open, setOpen] = useState(false)
  const [stages, setStages] = useState<StageDraft[]>([newStage()])

  // Value/label maps so the Select triggers show names, not raw ids.
  const techItems = Object.fromEntries(
    activeTechnicians.map((t) => [t.id, `${t.name} — ${t.specialty}`])
  )
  const materialItems = Object.fromEntries(
    inventory.map((item) => [item.id, item.name])
  )

  function reset() {
    setStages([newStage()])
  }

  function updateStage(id: string, patch: Partial<StageDraft>) {
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function addMaterial(stageId: string) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? {
              ...s,
              materials: [
                ...s.materials,
                { id: uid("mat"), inventoryItemId: "", quantity: "" },
              ],
            }
          : s
      )
    )
  }

  function updateMaterial(
    stageId: string,
    matId: string,
    patch: Partial<MaterialDraft>
  ) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? {
              ...s,
              materials: s.materials.map((m) =>
                m.id === matId ? { ...m, ...patch } : m
              ),
            }
          : s
      )
    )
  }

  function removeMaterial(stageId: string, matId: string) {
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? { ...s, materials: s.materials.filter((m) => m.id !== matId) }
          : s
      )
    )
  }

  const allStagesValid =
    stages.length > 0 &&
    stages.every((s) => s.name.trim().length > 0 && s.headTechId.length > 0)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allStagesValid) return

    const plans: StagePlan[] = stages.map((s) => ({
      name: s.name.trim(),
      headTechId: s.headTechId,
      materials: s.materials
        .filter((m) => m.inventoryItemId)
        .map((m) => {
          const inv = getInventoryById(m.inventoryItemId)
          return {
            inventoryItemId: m.inventoryItemId,
            name: inv?.name ?? "Unknown",
            quantity: Number.parseFloat(m.quantity) || 0,
            unit: inv?.unit ?? "",
          }
        }),
    }))

    assignStages(order.id, plans)

    const techCount = new Set(stages.map((s) => s.headTechId)).size
    toast.success("Production plan assigned", {
      description: `Materials list sent to the Stock Keeper. ${techCount} technician${techCount === 1 ? "" : "s"} notified by SMS.`,
    })

    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) reset()
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm">
            <ClipboardList data-icon="inline-start" />
            Assign Stages
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Plan production — {order.id}</DialogTitle>
          <DialogDescription>
            {order.furnitureType} for {order.customerName}. Break the build into
            stages, assign a head technician, and estimate the materials each
            stage needs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {stages.map((stage, stageIndex) => (
            <div
              key={stage.id}
              className="flex flex-col gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">
                  Stage {stageIndex + 1}
                  {stageIndex === 0 && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      starts immediately
                    </span>
                  )}
                </span>
                {stages.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setStages((prev) =>
                        prev.filter((s) => s.id !== stage.id)
                      )
                    }
                  >
                    <X data-icon="inline-start" />
                    Remove stage
                  </Button>
                )}
              </div>

              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor={`${stage.id}-name`}>
                    Stage name / description
                  </FieldLabel>
                  <Input
                    id={`${stage.id}-name`}
                    value={stage.name}
                    onChange={(e) =>
                      updateStage(stage.id, { name: e.target.value })
                    }
                    placeholder="e.g. Frame Assembly"
                  />
                </Field>
                <Field>
                  <FieldLabel>Head technician</FieldLabel>
                  <Select
                    items={techItems}
                    value={stage.headTechId}
                    onValueChange={(v) =>
                      updateStage(stage.id, { headTechId: v as string })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {activeTechnicians.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.name} — {tech.specialty}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </Field>

              <Separator />

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Estimated materials
                </span>

                {stage.materials.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No materials added yet.
                  </p>
                )}

                {stage.materials.map((mat) => {
                  const inv = getInventoryById(mat.inventoryItemId)
                  return (
                    <div key={mat.id} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Select
                          items={materialItems}
                          value={mat.inventoryItemId}
                          onValueChange={(v) =>
                            updateMaterial(stage.id, mat.id, {
                              inventoryItemId: v as string,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Material" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {inventory.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={mat.quantity}
                        onChange={(e) =>
                          updateMaterial(stage.id, mat.id, {
                            quantity: e.target.value,
                          })
                        }
                        placeholder="Qty"
                        className="w-20"
                      />
                      <span className="flex h-8 w-16 items-center text-sm text-muted-foreground">
                        {inv?.unit ?? "unit"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove material"
                        onClick={() => removeMaterial(stage.id, mat.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )
                })}

                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addMaterial(stage.id)}
                  >
                    <Plus data-icon="inline-start" />
                    Add material
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStages((prev) => [...prev, newStage()])}
            >
              <Plus data-icon="inline-start" />
              Add another stage
            </Button>
          </div>

          <DialogFooter className="mt-2">
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!allStagesValid}>
              Submit Assignment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
