'use client'

import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react'
import { useRef } from 'react'
import type { MouseEvent } from 'react'
import { Button } from '@/components/ui/button'

interface WysiwygEditorProps {
  id?: string
  name: string
  defaultValue?: string
  placeholder?: string
}

export function WysiwygEditor({
  id,
  name,
  defaultValue = '',
  placeholder,
}: WysiwygEditorProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  const handleInput = () => {
    if (contentEditableRef.current && hiddenInputRef.current) {
      hiddenInputRef.current.value = contentEditableRef.current.innerHTML
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    handleInput()
    if (contentEditableRef.current) {
      contentEditableRef.current.focus()
    }
  }

  return (
    <div className="flex flex-col border border-input rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow">
      <div className="flex flex-wrap items-center gap-1 border-b border-input bg-muted/50 p-1">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            execCommand('bold')
          }}
          className="h-8 w-8 p-0"
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            execCommand('italic')
          }}
          className="h-8 w-8 p-0"
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            execCommand('underline')
          }}
          className="h-8 w-8 p-0"
          title="Sublinhado"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            execCommand('insertUnorderedList')
          }}
          className="h-8 w-8 p-0"
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={(e: MouseEvent) => {
            e.preventDefault()
            execCommand('insertOrderedList')
          }}
          className="h-8 w-8 p-0"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* biome-ignore lint/a11y/useFocusableInteractive: WYSIWYG requires native contentEditable div */}
      {/* biome-ignore lint/a11y/useSemanticElements: WYSIWYG requires div */}
      <div
        id={id}
        ref={contentEditableRef}
        role="textbox"
        aria-multiline="true"
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Needed for rendering HTML content in WYSIWYG
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        className="min-h-[120px] w-full bg-background px-3 py-2 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground prose prose-sm max-w-none focus-visible:ring-0"
        data-placeholder={placeholder}
      />

      {/* Hidden input to pass value in form submission */}
      <input
        type="hidden"
        ref={hiddenInputRef}
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  )
}
