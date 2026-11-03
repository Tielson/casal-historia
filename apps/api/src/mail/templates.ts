export interface MailBrand {
  appName: string;
  companyName: string;
}

const INK = '#1a1214';
const PAPER = '#fff8f2';
const CHAMPAGNE = '#f6d7a8';
const MIST = '#fff4f2';
const DIM = '#8d6d74';

export const LOGO_CID = 'logo@entrenos';
export const COVER_CID = 'cover@entrenos';

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shell(input: {
  brand: MailBrand;
  preheader: string;
  heading: string;
  paragraphs: string[];
  rows?: { label: string; value: string }[];
  actions?: { href: string; label: string }[];
  hasCover: boolean;
  hasLogo: boolean;
}) {
  const preheader = `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(input.preheader)}</div>`;
  const logo = input.hasLogo
    ? `<img src="cid:${LOGO_CID}" width="36" height="36" alt="" style="display:block;border:0;outline:none;text-decoration:none;" />`
    : '';
  const wordmark = `<span style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1;color:${CHAMPAGNE};">${esc(input.brand.appName)}</span>`;
  const cover = input.hasCover
    ? `<tr><td align="center" style="padding:8px 32px 28px;">
        <img src="cid:${COVER_CID}" alt="Capa do livro" width="420" style="display:block;width:100%;max-width:420px;height:auto;border:0;border-radius:16px;outline:none;text-decoration:none;" />
      </td></tr>`
    : '';
  const paragraphs = input.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:${INK};">${esc(paragraph)}</p>`,
    )
    .join('');
  const rows = (input.rows ?? [])
    .map(
      (row) => `<tr>
        <td style="padding:8px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${DIM};">${esc(row.label)}</td>
        <td align="right" style="padding:8px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">${esc(row.value)}</td>
      </tr>`,
    )
    .join('');
  const receipt = rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-top:1px solid #eadfd6;">${rows}</table>`
    : '';
  const actions = (input.actions ?? [])
    .map(
      (action) => `<tr><td align="left" style="padding:0 0 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td bgcolor="${CHAMPAGNE}" style="border-radius:8px;">
            <a href="${esc(action.href)}" style="display:inline-block;padding:12px 22px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;color:${INK};text-decoration:none;">${esc(action.label)}</a>
          </td>
        </tr></table>
      </td></tr>`,
    )
    .join('');
  const actionTable = actions
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;">${actions}</table>`
    : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${INK};">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
        <tr><td style="padding:8px 8px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;">${logo}</td>
            <td>${wordmark}</td>
          </tr></table>
        </td></tr>
        ${cover}
        <tr><td style="background:${PAPER};border-radius:18px;padding:32px;">
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:500;color:${INK};">${esc(input.heading)}</h1>
          ${paragraphs}
          ${receipt}
          ${actionTable}
        </td></tr>
        <tr><td style="padding:22px 8px 8px;font-family:Georgia,'Times New Roman',serif;font-size:13px;line-height:1.5;color:${MIST};">
          ${esc(input.brand.appName)} · ${esc(input.brand.companyName)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function paymentReceiptHtml(input: {
  brand: MailBrand;
  names: string;
  amount: string;
  paidAt: string;
  orderId: string;
  hasCover: boolean;
  hasLogo: boolean;
}) {
  return shell({
    brand: input.brand,
    preheader: `Pagamento confirmado. O livro de ${input.names} chega em alguns minutos.`,
    heading: 'Pagamento confirmado',
    paragraphs: [
      `Recebemos o pagamento do livro de ${input.names}.`,
      'A confecção leva alguns minutos. O livro chega neste e-mail assim que ficar pronto.',
    ],
    rows: [
      { label: 'Valor', value: input.amount },
      { label: 'Data', value: input.paidAt },
      { label: 'Pedido', value: input.orderId },
    ],
    hasCover: input.hasCover,
    hasLogo: input.hasLogo,
  });
}

export function paymentReceiptText(input: {
  brand: MailBrand;
  names: string;
  amount: string;
  paidAt: string;
  orderId: string;
}) {
  return [
    input.brand.appName,
    '',
    `Pagamento confirmado. Recebemos o pagamento do livro de ${input.names}.`,
    'A confecção leva alguns minutos. O livro chega neste e-mail assim que ficar pronto.',
    '',
    `Valor: ${input.amount}`,
    `Data: ${input.paidAt}`,
    `Pedido: ${input.orderId}`,
    '',
    `${input.brand.appName} · ${input.brand.companyName}`,
  ].join('\n');
}

export function bookReadyHtml(input: {
  brand: MailBrand;
  names: string;
  manageUrl: string;
  giftUrl: string;
  hasCover: boolean;
  hasLogo: boolean;
}) {
  return shell({
    brand: input.brand,
    preheader: `O livro de ${input.names} está pronto.`,
    heading: 'Seu livro está pronto',
    paragraphs: [`A confecção terminou. O livro de ${input.names} já pode ser aberto.`],
    actions: [
      { href: input.manageUrl, label: 'Abrir nosso livro' },
      { href: input.giftUrl, label: 'Link de presente' },
    ],
    hasCover: input.hasCover,
    hasLogo: input.hasLogo,
  });
}

export function bookReadyText(input: {
  brand: MailBrand;
  names: string;
  manageUrl: string;
  giftUrl: string;
}) {
  return [
    input.brand.appName,
    '',
    `A confecção terminou. O livro de ${input.names} está pronto.`,
    '',
    `Abrir nosso livro: ${input.manageUrl}`,
    `Link de presente: ${input.giftUrl}`,
    '',
    `${input.brand.appName} · ${input.brand.companyName}`,
  ].join('\n');
}
