import { useEffect, useRef, useState } from 'react';

type Deserialize<T> = (raw: string) => T;
type Serialize<T> = (value: T) => string;
type Validate<T> = (value: unknown) => value is T;

interface UseLocalStorageStateOptions<T> {
  deserialize?: Deserialize<T>;
  serialize?: Serialize<T>;
  validate?: Validate<T>;
  onError?: (error: unknown) => void;
}

/**
 * State React persisté dans localStorage (avec gestion d'erreurs + validation optionnelle).
 * - Initialise depuis localStorage (si dispo)
 * - Écrit automatiquement au changement
 */
export function useLocalStorageState<T>(
  key: string,
  defaultValue: T | (() => T),
  options: UseLocalStorageStateOptions<T> = {},
) {
  const {
    deserialize = JSON.parse as unknown as Deserialize<T>,
    serialize = JSON.stringify as unknown as Serialize<T>,
    validate,
    onError,
  } = options;

  // On garde les handlers en ref pour éviter de re-déclencher des effets inutilement
  // quand le caller passe des fonctions non-mémoïsées.
  const handlersRef = useRef({ deserialize, serialize, validate, onError });
  handlersRef.current = { deserialize, serialize, validate, onError };

  const getDefault = () => (typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue);

  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return getDefault();
      const parsed = handlersRef.current.deserialize(raw);
      if (handlersRef.current.validate && !handlersRef.current.validate(parsed)) return getDefault();
      return parsed;
    } catch (e) {
      handlersRef.current.onError?.(e);
      return getDefault();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, handlersRef.current.serialize(value));
    } catch (e) {
      handlersRef.current.onError?.(e);
    }
  }, [key, value]);

  return [value, setValue] as const;
}


