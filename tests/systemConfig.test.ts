import { buildSystemInstruction } from '../systemConfig';

describe('systemConfig.buildSystemInstruction', () => {
  it('combine les règles de base + personnalité', () => {
    const out = buildSystemInstruction('PERSONNALITÉ_X');
    expect(out).toContain('FUNDAMENTAL SYSTEM RULES');
    expect(out).toContain('PERSONNALITÉ_X');
  });

  it('ajoute le contexte documents si fourni', () => {
    const out = buildSystemInstruction('PERSONNALITÉ_X', 'DOCS_CTX');
    expect(out).toContain('PERSONNALITÉ_X');
    expect(out).toContain('DOCS_CTX');
  });
});


