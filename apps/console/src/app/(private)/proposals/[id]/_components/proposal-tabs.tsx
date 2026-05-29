// apps/console/src/app/(private)/proposals/[id]/_components/proposal-tabs.tsx
'use client'

import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProposalDetail } from '@/app/(private)/proposals/queries'
import { getRequiredDocs } from '@/app/(private)/proposals/required-documents'
import { ClientDataTab } from './client-data-tab'
import { CommentsTab } from './comments-tab'
import { DocumentsTab } from './documents-tab'

type Tab = 'cliente' | 'documentos' | 'comentarios'

interface ProposalTabsProps {
  proposal: ProposalDetail
}

export function ProposalTabs({ proposal }: ProposalTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cliente')

  const uploaded = Array.isArray(proposal.proposal_documents)
    ? proposal.proposal_documents
    : proposal.proposal_documents ? [proposal.proposal_documents] : []

  const required = getRequiredDocs(proposal.product_type_slug)
  const pendingCount = required.filter(
    (r) => !uploaded.some((d) => d.document_type === r.type),
  ).length

  const comments = Array.isArray(proposal.proposal_comments)
    ? proposal.proposal_comments
    : proposal.proposal_comments ? [proposal.proposal_comments] : []

  const tabs: { id: Tab; label: string; badge?: { value: string; warn?: boolean } }[] = [
    { id: 'cliente', label: 'Dados do Cliente' },
    {
      id: 'documentos',
      label: 'Documentos',
      badge: pendingCount > 0
        ? { value: `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`, warn: true }
        : undefined,
    },
    {
      id: 'comentarios',
      label: 'Comentários',
      badge: comments.length > 0 ? { value: String(comments.length) } : undefined,
    },
  ]

  return (
    <Card className="overflow-hidden">
      {/* Tab list */}
      <div className="flex border-b border-border px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className={cn(
                'rounded-full px-1.5 py-px text-xs font-semibold',
                tab.badge.warn
                  ? 'bg-warning/15 text-warning'
                  : 'bg-muted text-muted-foreground',
              )}>
                {tab.badge.value}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'cliente'     && <ClientDataTab proposal={proposal} />}
        {activeTab === 'documentos'  && <DocumentsTab proposal={proposal} />}
        {activeTab === 'comentarios' && <CommentsTab proposal={proposal} />}
      </div>
    </Card>
  )
}
