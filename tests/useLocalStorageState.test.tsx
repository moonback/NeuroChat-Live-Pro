import { act, renderHook, waitFor } from '@testing-library/react';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initialise avec la valeur par défaut si la clé est absente', async () => {
    const { result } = renderHook(() => useLocalStorageState('k', 123));
    expect(result.current[0]).toBe(123);

    await waitFor(() => {
      expect(window.localStorage.getItem('k')).toBe('123');
    });
  });

  it('lit la valeur depuis localStorage si elle est valide', () => {
    window.localStorage.setItem('k', JSON.stringify('abc'));
    const { result } = renderHook(() => useLocalStorageState('k', 'default'));
    expect(result.current[0]).toBe('abc');
  });

  it('retombe sur la valeur par défaut si la validation échoue', () => {
    window.localStorage.setItem('k', JSON.stringify('abc'));
    const { result } = renderHook(() =>
      useLocalStorageState('k', 42, { validate: (v): v is number => typeof v === 'number' }),
    );
    expect(result.current[0]).toBe(42);
  });

  it('appelle onError si le parsing échoue et utilise la valeur par défaut', () => {
    const onError = vi.fn();
    window.localStorage.setItem('k', '{bad json');

    const { result } = renderHook(() => useLocalStorageState('k', { ok: true }, { onError }));
    expect(result.current[0]).toEqual({ ok: true });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('écrit dans localStorage quand la valeur change', async () => {
    const { result } = renderHook(() => useLocalStorageState('k', 1));
    const [, setValue] = result.current;

    act(() => setValue(999));

    await waitFor(() => {
      expect(window.localStorage.getItem('k')).toBe('999');
    });
  });

  it('supporte serialize/deserialize custom (ex: boolean)', async () => {
    window.localStorage.setItem('b', 'true');
    const { result } = renderHook(() =>
      useLocalStorageState<boolean>('b', false, {
        deserialize: (raw) => raw === 'true',
        serialize: (v) => (v ? 'true' : 'false'),
      }),
    );

    expect(result.current[0]).toBe(true);

    act(() => result.current[1](false));
    await waitFor(() => {
      expect(window.localStorage.getItem('b')).toBe('false');
    });
  });
});


