// apps/console/src/app/(private)/proposals/[id]/_components/comments-tab.tsx
import { Lock, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { ProposalDetail } from '../../queries'

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-chart-1/20 text-chart-1',
    'bg-chart-2/20 text-chart-2',
    'bg-chart-3/20 text-chart-3',
    'bg-chart-4/20 text-chart-4',
    'bg-chart-5/20 text-chart-5',
  ]
  let h = 0
  for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

type Comment = NonNullable<ProposalDetail['proposal_comments']>[number]

interface CommentsTabProps {
  proposal: ProposalDetail
}

export function CommentsTab({ proposal }: CommentsTabProps) {
  const comments: Comment[] = Array.isArray(proposal.proposal_comments)
    ? proposal.proposal_comments
    : proposal.proposal_comments ? [proposal.proposal_comments] : []

  return (
    <div className="space-y-4">
      {/* Aviso somente leitura */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="size-3.5 shrink-0" />
        Comentários adicionados pelo time operacional via Admin. Somente visualização.
      </div>

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
          <MessageSquare className="size-8 opacity-30" />
          <p className="text-sm">Nenhum comentário registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-muted/40 px-4 py-3"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className={`text-xs font-bold ${avatarColor(comment.author_name)}`}>
                      {getInitials(comment.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{comment.author_name}</p>
                    <p className="text-xs text-muted-foreground">Operacional · Vello Finance</p>
                  </div>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {format(new Date(comment.created_at), "d MMM · HH:mm", { locale: ptBR })}
                </time>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
