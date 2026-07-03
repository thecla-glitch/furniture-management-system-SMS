"use client"

import { useEffect, useRef } from "react"
import { useOrders } from "@/components/front-desk/orders-store"
import { useSms } from "@/components/messaging/sms-store"
import { findTemplate, resolveTemplate, varsFromOrder } from "@/lib/sms-templates"
import type { Order, OrderStatus } from "@/lib/mock-data"

/**
 * Watches order state changes and fires automatic SMS messages.
 *
 * Trigger map:
 *   order_created      → addOrder (any status)
 *   order_approved     → status Pending Approval → In Workshop
 *   stage_started      → status In Workshop, first stage Active (from Planned → In Workshop)
 *   stage_advanced     → a stage flips to Active and it's not the first one
 *   ready_collection   → status becomes Ready for Collection
 *   order_collected    → status becomes Collected
 *
 * This hook is mounted once in AppShellContent so it is always active.
 */
export function useOrderSmsSync() {
  const { orders } = useOrders()
  const { templates, config, sendSms } = useSms()

  // Keep a snapshot of the previous order map so we can diff on each render.
  const prevRef = useRef<Map<string, Order>>(new Map())

  useEffect(() => {
    if (!config.autoSendEnabled) return

    const prev = prevRef.current
    const next = new Map(orders.map((o) => [o.id, o]))

    for (const [id, curr] of next) {
      const old = prev.get(id)

      // --- NEW ORDER ---
      if (!old) {
        const tpl = findTemplate(templates, "order_created")
        if (tpl) {
          const body = resolveTemplate(tpl.body, varsFromOrder(curr))
          sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "order_created", orderId: id })
        }
        continue
      }

      // --- ORDER APPROVED (Pending Approval → In Workshop) ---
      if (old.status === "Pending Approval" && curr.status === "In Workshop") {
        const tpl = findTemplate(templates, "order_approved")
        if (tpl) {
          const body = resolveTemplate(tpl.body, varsFromOrder(curr))
          sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "order_approved", orderId: id })
        }
      }

      // --- WORK STARTED (Planned → In Workshop, first stage Active) ---
      if (old.status === "Planned" && curr.status === "In Workshop") {
        const tpl = findTemplate(templates, "stage_started")
        if (tpl) {
          const firstStage = curr.stages[0]
          const body = resolveTemplate(tpl.body, {
            ...varsFromOrder(curr),
            stageName: firstStage?.name,
          })
          sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "stage_started", orderId: id })
        }
        continue
      }

      // --- STAGE ADVANCED (a stage beyond index 0 becomes Active) ---
      if (curr.status === "In Workshop" && old.status === "In Workshop") {
        const newActiveIdx = curr.stages.findIndex((s) => s.status === "Active")
        const oldActiveIdx = old.stages.findIndex((s) => s.status === "Active")
        if (newActiveIdx > 0 && newActiveIdx !== oldActiveIdx) {
          const tpl = findTemplate(templates, "stage_advanced")
          if (tpl) {
            const activeStage = curr.stages[newActiveIdx]
            const body = resolveTemplate(tpl.body, {
              ...varsFromOrder(curr),
              stageName: activeStage?.name,
            })
            sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "stage_advanced", orderId: id })
          }
        }
      }

      // --- READY FOR COLLECTION ---
      if (old.status !== "Ready for Collection" && curr.status === "Ready for Collection") {
        const tpl = findTemplate(templates, "ready_collection")
        if (tpl) {
          const body = resolveTemplate(tpl.body, varsFromOrder(curr))
          sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "ready_collection", orderId: id })
        }
      }

      // --- COLLECTED ---
      if (old.status !== "Collected" && curr.status === "Collected") {
        const tpl = findTemplate(templates, "order_collected")
        if (tpl) {
          const body = resolveTemplate(tpl.body, varsFromOrder(curr))
          sendSms({ to: curr.contact, recipientName: curr.customerName, body, trigger: "order_collected", orderId: id })
        }
      }
    }

    // Update snapshot.
    prevRef.current = next
  }, [orders, templates, config.autoSendEnabled, sendSms])
}
