'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Quais tipos de crédito posso contratar?',
    a: 'Temos diferentes tipos de crédito, tanto para pessoas físicas quanto jurídicas, incluindo crédito pessoal, empréstimos com garantia, financiamentos e crédito para negócios.',
  },
  {
    q: 'Preciso comprovar renda ou ter bom score?',
    a: 'Depende da modalidade. Existem opções mais flexíveis, mas cada instituição faz sua própria análise. A simulação é o primeiro passo para entender suas possibilidades.',
  },
  {
    q: 'Como é a segurança da minha informação?',
    a: 'Trabalhamos com os melhores sistemas de proteção e todos os nossos parceiros são regulamentados pelo Banco Central.',
  },
  {
    q: 'Quanto tempo leva para o dinheiro cair na minha conta?',
    a: 'Dependendo da modalidade de crédito escolhida, temos algumas opções que o crédito cai em poucas horas.',
  },
  {
    q: 'Quais documentos são necessários para solicitar o crédito?',
    a: 'Depende da modalidade escolhida, mas geralmente você precisará de documento de identidade (RG ou CNH), CPF e comprovante de residência. Para crédito empresarial, serão necessários documentos da empresa também.',
  },
  {
    q: 'O que acontece após a simulação do crédito?',
    a: 'Você receberá as melhores ofertas disponíveis para o seu perfil. Caso queira seguir com a contratação, basta enviar a documentação necessária e aguardar a análise para a aprovação final.',
  },
  {
    q: 'Tenho que pagar alguma taxa antecipada para liberar o crédito?',
    a: 'Não! Trabalhamos apenas com instituições sérias e regulamentadas. Se alguém solicitar um pagamento antecipado para liberar o crédito, desconfie e nos avise imediatamente.',
  },
  {
    q: 'Posso antecipar parcelas ou quitar meu crédito antes do prazo?',
    a: 'Sim! A maioria das modalidades permite a quitação antecipada, muitas vezes com desconto nos juros. Consulte as condições específicas da sua oferta.',
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-8">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/28 bg-primary/4 px-3.5 py-2 text-xs font-medium uppercase tracking-[.22em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Dúvidas
        </span>

        <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-foreground max-sm:text-4xl">
          Perguntas{' '}
          <em className="font-serif text-6xl italic font-normal text-primary">
            frequentes
          </em>
        </h2>

        <Accordion type="single" collapsible className="mt-10 flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={faq.q}
              value={`faq-${i}`}
              className="rounded-xl border border-foreground/8 px-6 data-[state=open]:border-primary/20 data-[state=open]:bg-primary/4"
            >
              <AccordionTrigger className="flex items-center gap-4 py-5 text-left text-sm font-semibold text-foreground hover:no-underline">
                <span className="shrink-0 font-serif text-xl italic text-primary">
                  {i + 1}.
                </span>
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-foreground/65">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
