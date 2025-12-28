import { act, renderHook } from '@testing-library/react';
import { useStatusManager } from '../hooks/useStatusManager';
import { ConnectionState } from '../types';

describe('useStatusManager', () => {
  it('expose un état initial cohérent', () => {
    const { result } = renderHook(() => useStatusManager());
    expect(result.current.connectionState).toBe(ConnectionState.DISCONNECTED);
    expect(result.current.latency).toBe(0);
    expect(result.current.isTalking).toBe(false);
    expect(result.current.toasts).toEqual([]);
  });

  it('ajoute puis retire un toast', () => {
    const { result } = renderHook(() => useStatusManager());

    act(() => {
      result.current.addToast('success', 'Titre', 'Message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Titre');

    const id = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});


