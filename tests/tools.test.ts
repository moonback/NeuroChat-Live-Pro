import { buildToolsConfig, createFunctionResponse, executeFunction } from '../utils/tools';

describe('utils/tools', () => {
  it('buildToolsConfig inclut functionDeclarations si Function Calling activé', () => {
    const tools = buildToolsConfig(true, false);
    expect(Array.isArray(tools)).toBe(true);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toHaveProperty('functionDeclarations');
    expect(Array.isArray(tools[0].functionDeclarations)).toBe(true);
  });

  it('buildToolsConfig inclut googleSearch si activé', () => {
    const tools = buildToolsConfig(false, true);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toEqual({ googleSearch: {} });
  });

  it('buildToolsConfig inclut les deux si activés', () => {
    const tools = buildToolsConfig(true, true);
    expect(tools).toHaveLength(2);
    expect(tools[0]).toHaveProperty('functionDeclarations');
    expect(tools[1]).toEqual({ googleSearch: {} });
  });

  it('createFunctionResponse mappe correctement id/name/response', () => {
    const out = createFunctionResponse(
      { id: 'abc', name: 'do_something', args: { x: 1 } },
      { ok: true },
    );
    expect(out).toEqual({ id: 'abc', name: 'do_something', response: { ok: true } });
  });

  it('executeFunction retourne une erreur pour une fonction inconnue', async () => {
    const res = await executeFunction({ id: '1', name: 'unknown_fn', args: {} });
    expect(res).toHaveProperty('result', 'error');
    expect(res).toHaveProperty('message');
    expect(String(res.message)).toContain('unknown_fn');
  });
});


