"use client"

import { useState } from "react"
import { Armchair, Delete, Hammer } from "lucide-react"

import type { Technician } from "@/lib/mock-data"
import { useTechnicians } from "@/components/operations/technicians-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"

const PIN_LENGTH = 4

export function PinLogin({
  onLogin,
}: {
  onLogin: (technician: Technician) => void
}) {
  const { technicians } = useTechnicians()
  const [techId, setTechId] = useState("")
  const [pin, setPin] = useState("")
  const [error, setError] = useState<string | null>(null)

  const techItems = Object.fromEntries(
    technicians.map((t) => [t.id, t.name])
  )

  function pressDigit(digit: string) {
    setError(null)
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev
      const next = prev + digit
      if (next.length === PIN_LENGTH) {
        // Validate on the final digit.
        attempt(next)
      }
      return next
    })
  }

  function backspace() {
    setError(null)
    setPin((prev) => prev.slice(0, -1))
  }

  function attempt(candidate: string) {
    const tech = technicians.find((t) => t.id === techId)
    if (!tech) {
      setError("Select your name first.")
      setPin("")
      return
    }
    if (candidate === tech.pin) {
      onLogin(tech)
    } else {
      setError("Incorrect PIN. Try again.")
      setTimeout(() => setPin(""), 250)
    }
  }

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Hammer className="size-6" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">
          Head Technician sign in
        </h1>
        <p className="text-sm text-muted-foreground text-balance">
          Select your name and enter your 4-digit PIN to view your stages.
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="tech-select">Your name</FieldLabel>
        <Select
          items={techItems}
          value={techId}
          onValueChange={(v) => {
            setTechId(v as string)
            setPin("")
            setError(null)
          }}
        >
          <SelectTrigger id="tech-select" className="h-12 w-full text-base">
            <SelectValue placeholder="Choose technician" />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* PIN dots */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3" aria-label="PIN entry">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-4 rounded-full border-2 transition-colors",
                i < pin.length
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/40 bg-transparent"
              )}
            />
          ))}
        </div>
        <p
          className={cn(
            "min-h-5 text-sm",
            error ? "text-destructive" : "text-muted-foreground"
          )}
          role={error ? "alert" : undefined}
        >
          {error ?? "\u00A0"}
        </p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <Button
            key={k}
            type="button"
            variant="outline"
            className="h-16 text-2xl font-medium"
            onClick={() => pressDigit(k)}
            disabled={!techId}
          >
            {k}
          </Button>
        ))}
        <span aria-hidden />
        <Button
          type="button"
          variant="outline"
          className="h-16 text-2xl font-medium"
          onClick={() => pressDigit("0")}
          disabled={!techId}
        >
          0
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-16"
          onClick={backspace}
          disabled={pin.length === 0}
          aria-label="Delete last digit"
        >
          <Delete className="size-6" />
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Armchair className="size-3.5" />
        Furniture Management — workshop floor access
      </p>
    </div>
  )
}
