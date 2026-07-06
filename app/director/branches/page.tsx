import { BranchesView } from "@/components/director/branches-view"

export const metadata = {
  title: "Branches — Director Portal",
  description: "Per-branch stock, orders and performance across all showroom locations.",
}

export default function BranchesPage() {
  return <BranchesView />
}
