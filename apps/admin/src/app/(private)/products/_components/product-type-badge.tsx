import { Badge } from '@/components/ui/badge'

export function ProductTypeBadge({ name }: { name: string }) {
  return <Badge variant="secondary">{name}</Badge>
}
