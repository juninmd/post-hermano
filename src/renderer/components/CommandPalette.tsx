import React, { useMemo } from 'react';
import { CommandPalette as SnCommandPalette, type Command as SnCommand } from '@juninmd/sonido';
import { requestStore } from '../stores/RequestStore';

export interface Command { label: string; hint?: string; run: () => void }

/** Comandos globais: nova aba, enviar, tema, ambientes e requisições salvas. */
export const buildCommands = (toggleTheme: () => void): Command[] => {
  const s = requestStore;
  return [
    { label: 'Nova requisição', run: () => s.addTab() },
    { label: 'Enviar requisição', hint: 'Ctrl Enter', run: () => s.sendRequest() },
    { label: 'Cancelar requisição', run: () => s.cancelRequest() },
    { label: 'Alternar tema', run: toggleTheme },
    { label: 'Limpar histórico', run: () => s.clearHistory() },
    ...s.environments.map(e => ({ label: `Ambiente: ${e.name}`, run: () => s.setActiveEnvironment(e.id) })),
    ...s.collections.flatMap(c => c.requests.map(r => ({
      label: `${r.method}  ${r.name || r.url}`, hint: c.name, run: () => { s.addTab(); s.loadHistoryItem(r); },
    }))),
  ];
};

/** Converte o formato local para o `Command` do Sonido, que cuida de foco, filtro e teclado. */
const toSonidoCommands = (toggleTheme: () => void): SnCommand[] =>
  buildCommands(toggleTheme).map((c, i) => ({ id: `cmd-${i}`, label: c.label, hint: c.hint, run: c.run }));

interface Props { open: boolean; onClose: () => void; toggleTheme: () => void }

export const CommandPalette: React.FC<Props> = ({ open, onClose, toggleTheme }) => {
  const commands = useMemo(() => toSonidoCommands(toggleTheme), [open, toggleTheme]);

  // O diálogo do Sonido cuida do Esc nativo; este handler cobre o teclado nos testes/jsdom.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
  };

  if (!open) return null;

  return (
    <div onKeyDown={onKey}>
      <SnCommandPalette
        open
        onClose={onClose}
        commands={commands}
        label="Buscar comandos"
        placeholder="Digite um comando ou o nome de uma requisição"
      />
    </div>
  );
};
