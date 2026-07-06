import { OperationsPortal } from "@/components/operations/operations-portal"

export default function OperationsPage() {
  // Technicians, material requests, stock and orders providers are all mounted
  // globally in the AppShell so state stays in sync across every role.
  return <OperationsPortal />
}
