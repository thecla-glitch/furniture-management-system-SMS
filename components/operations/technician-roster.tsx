"use client"

import { useState } from "react"
import { Lock, Plus, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTechnicians } from "@/components/operations/technicians-store"

export function TechnicianRoster() {
  const { technicians, addTechnician, removeTechnician, setActive } =
    useTechnicians()

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [pin, setPin] = useState("")
  const [rate, setRate] = useState("")

  const pinValid = /^\d{4}$/.test(pin)
  const rateValid = Number.parseFloat(rate) > 0
  const canSubmit = name.trim().length > 0 && pinValid && rateValid

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    addTechnician({
      name: name.trim(),
      specialty: specialty.trim(),
      pin,
      rate: Number.parseFloat(rate),
    })
    toast.success("Technician added", {
      description: `${name.trim()} can now be assigned to production stages.`,
    })
    setName("")
    setSpecialty("")
    setPin("")
    setRate("")
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-muted-foreground" />
            Add head technician
          </CardTitle>
          <CardDescription>
            Set a 4-digit login PIN and the agreed rate per stage. The rate is
            stored securely and hidden from this roster once saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="tech-name">Name</FieldLabel>
                  <Input
                    id="tech-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Joy Adeleke"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="tech-specialty">Specialty</FieldLabel>
                  <Input
                    id="tech-specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Carving"
                  />
                </Field>
              </Field>

              <Field orientation="responsive">
                <Field data-invalid={pin.length > 0 && !pinValid}>
                  <FieldLabel htmlFor="tech-pin">4-digit PIN</FieldLabel>
                  <Input
                    id="tech-pin"
                    inputMode="numeric"
                    maxLength={4}
                    aria-invalid={pin.length > 0 && !pinValid}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="0000"
                  />
                </Field>
                <Field data-invalid={rate.length > 0 && !rateValid}>
                  <FieldLabel htmlFor="tech-rate">Rate per stage</FieldLabel>
                  <Input
                    id="tech-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    aria-invalid={rate.length > 0 && !rateValid}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              </Field>

              <Field orientation="horizontal">
                <FieldDescription className="flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  The rate is write-only — you will not be able to view it again.
                </FieldDescription>
                <Button type="submit" disabled={!canSubmit}>
                  <Plus data-icon="inline-start" />
                  Add technician
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technician</TableHead>
              <TableHead>PIN</TableHead>
              <TableHead>Rate / stage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {technicians.map((tech) => (
              <TableRow key={tech.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{tech.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tech.specialty}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {tech.pin}
                </TableCell>
                <TableCell>
                  <span
                    className="font-mono tracking-widest text-muted-foreground"
                    aria-label="Rate hidden"
                    title="Rates are hidden from the Operations Manager"
                  >
                    •••
                  </span>
                </TableCell>
                <TableCell>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={tech.active}
                      onCheckedChange={(checked) =>
                        setActive(tech.id, checked === true)
                      }
                    />
                    <Badge
                      variant={tech.active ? "secondary" : "outline"}
                      className="font-medium"
                    >
                      {tech.active ? "Active" : "Inactive"}
                    </Badge>
                  </label>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeTechnician(tech.id)
                      toast.success("Technician removed", {
                        description: `${tech.name} was removed from the roster.`,
                      })
                    }}
                  >
                    <Trash2 data-icon="inline-start" />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" />
        Privacy rule: the Operations Manager can set a technician&apos;s rate
        when adding them, but cannot view rates afterwards. Only the Director
        sees agreed rates and payroll.
      </p>
    </div>
  )
}
