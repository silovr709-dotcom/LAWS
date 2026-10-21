import type { LegalDocument } from '../data/documents';

/**
 * Собирает чистый редактируемый текст процессуального документа
 * без служебных подписей сайта — для копирования в редактор и проверки черновика.
 */
export function formatDocumentText(document: LegalDocument): string {
  const parts: string[] = [];

  if (document.header.length > 0) {
    parts.push(document.header.join('\n'));
  }

  const titleBlock = [document.heading, document.subheading].filter(Boolean).join('\n');
  if (titleBlock) {
    parts.push(titleBlock);
  }

  for (const block of document.blocks) {
    if ('h' in block) {
      parts.push(block.h.toUpperCase());
    } else if ('p' in block) {
      parts.push(block.p);
    } else if ('ul' in block) {
      parts.push(block.ul.map((item, idx) => `${idx + 1}. ${item}`).join('\n'));
    } else if ('note' in block) {
      parts.push(`[Примечание: ${block.note}]`);
    }
  }

  if (document.appendix.length > 0) {
    parts.push(
      `Приложение:\n${document.appendix.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`,
    );
  }

  parts.push(`${document.closing}    «____» ____________ 20____ г.`);

  return parts.join('\n\n');
}
