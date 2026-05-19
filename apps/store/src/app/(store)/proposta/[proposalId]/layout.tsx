export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface text-surface-foreground">
      {children}
    </div>
  )
}
