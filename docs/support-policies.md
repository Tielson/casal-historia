# Políticas de atendimento — Entre Nós

## Correções gratuitas

Inclui, uma vez por pedido, quando for falha nossa:

- Página ilegível / asset corrompido
- Texto com erro de tipografia óbvio gerado pelo sistema
- Link de acesso não funciona (reenvio pelo admin)
- PDF incompleto (reprocessar produção, limite no admin)

Não inclui: reescrever a história porque o cliente mudou de ideia após aprovação da prévia (exceto erro factual inventado pelo sistema).

## Falha de semelhança

Se as ilustrações não se parecem razoavelmente com as fotos enviadas:

1. Verificar se as fotos tinham rosto visível / luz mínima (orientação do upload).
2. Oferecer **até 1 regeneração operacional** pós-pagamento se a prévia aprovada já mostrava o problema e passou despercebido — registrar nota no pedido.
3. Se o cliente aprovou uma prévia claramente dissimilar, preferir crédito parcial ou reembolso (abaixo) em vez de loops infinitos.

## Reembolsos

Elegível:

- Pagou e não recebeu o PDF em prazo razoável após falha de produção esgotada
- Conteúdo inventou fatos graves não presentes nas respostas (casamento/filhos/viagens)
- Cobrança duplicada

Não elegível:

- “Não gostei do estilo” após prévia aprovada conscientemente
- Erro do cliente ao enviar fotos erradas, se a prévia já mostrava o resultado

Processo: marcar nota no admin → reembolso no Stripe Dashboard → status `refunded` (manual nesta fase) → revogar gift link se necessário.

## Operação (admin)

- Buscar pedido, ver status pagamento/produção e etapa falha
- Reprocessar com limite
- Reenviar e-mail de acesso
- Notas de atendimento
