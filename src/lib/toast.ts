import { writable } from 'svelte/store';

export type ToastKind = 'success' | 'info' | 'warning';
export type Toast = { id: string; kind: ToastKind; text: string };

function uuid() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

const _toasts = writable<Toast[]>([]);

export const toasts = {
  subscribe: _toasts.subscribe
};

export function showToast(text: string, kind: ToastKind = 'success', ms = 1600) {
  const t: Toast = { id: uuid(), kind, text };
  _toasts.update(arr => [...arr, t]);
  setTimeout(() => {
    _toasts.update(arr => arr.filter(x => x.id !== t.id));
  }, ms);
}
