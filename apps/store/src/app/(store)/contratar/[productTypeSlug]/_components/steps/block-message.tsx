export function BlockMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-5">
      <p className="text-sm font-medium text-destructive">{message}</p>
      <a href="/" className="mt-3 inline-block text-sm font-semibold text-primary">Ver outros produtos →</a>
    </div>
  )
}
