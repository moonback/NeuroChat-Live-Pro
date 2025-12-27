export type ConversationRole = 'user' | 'assistant' | 'system';

export interface ConversationMeta {
  id: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  title: string;
  personalityId?: string;
  voiceName?: string;
  summary?: string;
}

export interface ConversationTurn {
  id: string;
  conversationId: string;
  role: ConversationRole;
  text: string;
  createdAt: string; // ISO
  source?: 'speech' | 'model';
  isFinal?: boolean;
}

export interface UserProfile {
  id: 'default';
  displayName?: string;
  timezone?: string; // ex: Europe/Paris
  preferencesText?: string; // texte libre
  updatedAt: string; // ISO
}

const DB_NAME = 'neurochat_pro_db';
const DB_VERSION = 1;

const STORE_CONVERSATIONS = 'conversations';
const STORE_TURNS = 'turns';
const STORE_PROFILE = 'profile';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_CONVERSATIONS)) {
        const store = db.createObjectStore(STORE_CONVERSATIONS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_TURNS)) {
        const store = db.createObjectStore(STORE_TURNS, { keyPath: 'id' });
        store.createIndex('conversationId', 'conversationId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_PROFILE)) {
        db.createObjectStore(STORE_PROFILE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withTx<T>(storeNames: string | string[], mode: IDBTransactionMode, fn: (tx: IDBTransaction) => Promise<T>) {
  const db = await openDb();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    fn(tx)
      .then((result) => resolve(result))
      .catch((err) => reject(err));
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function createConversation(meta: Partial<ConversationMeta> = {}) {
  const id = meta.id ?? createId('conv');
  const createdAt = meta.createdAt ?? nowIso();
  const updatedAt = meta.updatedAt ?? createdAt;
  const conversation: ConversationMeta = {
    id,
    createdAt,
    updatedAt,
    title: meta.title ?? 'Nouvelle conversation',
    personalityId: meta.personalityId,
    voiceName: meta.voiceName,
    summary: meta.summary,
  };

  await withTx(STORE_CONVERSATIONS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_CONVERSATIONS);
    await reqToPromise(store.put(conversation));
    return true;
  });

  return conversation;
}

export async function upsertConversation(meta: ConversationMeta) {
  await withTx(STORE_CONVERSATIONS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_CONVERSATIONS);
    await reqToPromise(store.put(meta));
    return true;
  });
}

export async function updateConversation(id: string, patch: Partial<ConversationMeta>) {
  return await withTx(STORE_CONVERSATIONS, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_CONVERSATIONS);
    const existing = (await reqToPromise(store.get(id))) as ConversationMeta | undefined;
    if (!existing) return undefined;
    const updated: ConversationMeta = {
      ...existing,
      ...patch,
      updatedAt: nowIso(),
    };
    await reqToPromise(store.put(updated));
    return updated;
  });
}

export async function listConversations(limit = 50): Promise<ConversationMeta[]> {
  return await withTx(STORE_CONVERSATIONS, 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_CONVERSATIONS);
    const all = (await reqToPromise(store.getAll())) as ConversationMeta[];
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(0, limit);
  });
}

export async function addTurn(turn: Omit<ConversationTurn, 'id' | 'createdAt'> & Partial<Pick<ConversationTurn, 'id' | 'createdAt'>>) {
  const createdAt = turn.createdAt ?? nowIso();
  const id = turn.id ?? createId('turn');
  const t: ConversationTurn = {
    id,
    conversationId: turn.conversationId,
    role: turn.role,
    text: turn.text,
    createdAt,
    source: turn.source,
    isFinal: turn.isFinal ?? true,
  };

  await withTx([STORE_TURNS, STORE_CONVERSATIONS], 'readwrite', async (tx) => {
    const turnsStore = tx.objectStore(STORE_TURNS);
    await reqToPromise(turnsStore.put(t));

    // bump updatedAt
    const convStore = tx.objectStore(STORE_CONVERSATIONS);
    const conv = (await reqToPromise(convStore.get(t.conversationId))) as ConversationMeta | undefined;
    if (conv) {
      await reqToPromise(convStore.put({ ...conv, updatedAt: nowIso() }));
    }
    return true;
  });

  return t;
}

export async function getTurns(conversationId: string): Promise<ConversationTurn[]> {
  return await withTx(STORE_TURNS, 'readonly', async (tx) => {
    const store = tx.objectStore(STORE_TURNS);
    const idx = store.index('conversationId');
    const turns = (await reqToPromise(idx.getAll(conversationId))) as ConversationTurn[];
    turns.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return turns;
  });
}

export async function getConversation(conversationId: string) {
  const [meta, turns] = await Promise.all([
    withTx(STORE_CONVERSATIONS, 'readonly', async (tx) => {
      const store = tx.objectStore(STORE_CONVERSATIONS);
      return (await reqToPromise(store.get(conversationId))) as ConversationMeta | undefined;
    }),
    getTurns(conversationId),
  ]);

  if (!meta) return undefined;
  return { meta, turns };
}

export async function deleteConversation(conversationId: string) {
  await withTx([STORE_CONVERSATIONS, STORE_TURNS], 'readwrite', async (tx) => {
    const convStore = tx.objectStore(STORE_CONVERSATIONS);
    const turnsStore = tx.objectStore(STORE_TURNS);

    await reqToPromise(convStore.delete(conversationId));

    // cascade delete turns
    const idx = turnsStore.index('conversationId');
    const turns = (await reqToPromise(idx.getAll(conversationId))) as ConversationTurn[];
    for (const t of turns) {
      await reqToPromise(turnsStore.delete(t.id));
    }

    return true;
  });
}

export async function getUserProfile(): Promise<UserProfile> {
  return await withTx(STORE_PROFILE, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_PROFILE);
    const existing = (await reqToPromise(store.get('default'))) as UserProfile | undefined;
    if (existing) return existing;
    const profile: UserProfile = { id: 'default', updatedAt: nowIso() };
    await reqToPromise(store.put(profile));
    return profile;
  });
}

export async function upsertUserProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  return await withTx(STORE_PROFILE, 'readwrite', async (tx) => {
    const store = tx.objectStore(STORE_PROFILE);
    const existing = (await reqToPromise(store.get('default'))) as UserProfile | undefined;
    const next: UserProfile = {
      id: 'default',
      displayName: patch.displayName ?? existing?.displayName,
      timezone: patch.timezone ?? existing?.timezone,
      preferencesText: patch.preferencesText ?? existing?.preferencesText,
      updatedAt: nowIso(),
    };
    await reqToPromise(store.put(next));
    return next;
  });
}

export function conversationToMarkdown(meta: ConversationMeta, turns: ConversationTurn[]) {
  const lines: string[] = [];
  lines.push(`# ${meta.title || 'Conversation'}`);
  lines.push('');
  lines.push(`- **ID**: \`${meta.id}\``);
  lines.push(`- **Créée**: ${meta.createdAt}`);
  if (meta.summary) lines.push(`- **Résumé**: ${meta.summary}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  for (const t of turns) {
    const who = t.role === 'user' ? 'Utilisateur' : t.role === 'assistant' ? 'Assistant' : 'Système';
    lines.push(`## ${who} — ${new Date(t.createdAt).toLocaleString('fr-FR')}`);
    lines.push('');
    lines.push(t.text);
    lines.push('');
  }
  return lines.join('\n');
}


