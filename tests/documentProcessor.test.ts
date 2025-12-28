import { formatDocumentForContext } from '../utils/documentProcessor';
import type { ProcessedDocument } from '../utils/documentProcessor';

describe('documentProcessor.formatDocumentForContext', () => {
  it('retourne une chaîne vide si aucun document', () => {
    expect(formatDocumentForContext([])).toBe('');
  });

  it('formate correctement le contexte avec métadonnées et contenu', () => {
    const docs: ProcessedDocument[] = [
      {
        id: '1',
        name: 'specs.md',
        type: 'text/markdown',
        size: 1234,
        content: '# Titre',
        uploadedAt: new Date('2025-01-01T00:00:00Z'),
      },
      {
        id: '2',
        name: 'notes.txt',
        type: 'text/plain',
        size: 42,
        content: 'Hello',
        uploadedAt: new Date('2025-01-02T00:00:00Z'),
      },
    ];

    const ctx = formatDocumentForContext(docs);
    expect(ctx).toContain('=== DOCUMENTS FOURNIS PAR L\'UTILISATEUR ===');
    expect(ctx).toContain('Document 1: specs.md');
    expect(ctx).toContain('# Titre');
    expect(ctx).toContain('Document 2: notes.txt');
    expect(ctx).toContain('Hello');
    expect(ctx).toContain('=== FIN DES DOCUMENTS ===');
  });
});


