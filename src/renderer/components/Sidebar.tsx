import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Badge, Button, EmptyState, Tabs, type BadgeTone } from '@juninmd/sonido';
import { requestStore, Environment } from '../stores/RequestStore';
import { EnvironmentModal } from './EnvironmentModal';

type Section = 'history' | 'collections' | 'environments';

const sectionTabs: { key: Section; label: string }[] = [
  { key: 'history', label: 'History' },
  { key: 'collections', label: 'Collections' },
  { key: 'environments', label: 'Envs' },
];

const SidebarContainer = styled.div`
  width: 250px;
  min-width: 200px;
  background-color: var(--surface);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 0 6px;
  border-bottom: 1px solid var(--line);
  display: flex;

  .sn-tabs {
    width: 100%;
    gap: 0;
  }
  .sn-tab {
    flex: 1;
    justify-content: center;
    min-height: 38px;
    padding: 0 8px;
    border-radius: 0;
  }
`;

const HeaderActions = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    color: var(--mute);
  }
`;

const ActionBtn = styled(Button)`
  min-height: 28px;
  height: 28px;
  padding: 0 6px;
  font-size: 16px;
  background: none;
  border: none;
  opacity: 0.6;
  color: inherit;
  box-shadow: none;

  &:hover {
    opacity: 1;
    background: var(--surface3);
    transform: none;
  }
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ItemContainer = styled.div`
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid transparent;
  font-size: 13px;

  &:hover {
    background-color: var(--surface3);
  }

  &.active {
    background-color: var(--surface3);
    border-left: 3px solid var(--accent);
    padding-left: 12px;
  }
`;

const methodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case 'get': return 'var(--ok)';
    case 'post': return 'var(--warn)';
    case 'put': return 'var(--accent)';
    case 'delete': return 'var(--err)';
    case 'patch': return 'var(--patch)';
    default: return 'var(--fg)';
  }
};

const methodTone = (method: string): BadgeTone => {
  switch (method.toLowerCase()) {
    case 'get': return 'success';
    case 'post': return 'warning';
    case 'put': return 'accent';
    case 'delete': return 'danger';
    case 'patch': return 'violet';
    default: return 'neutral';
  }
};

const MethodBadge = ({ method }: { method: string }) => (
  <Badge
    appearance="soft"
    tone={methodTone(method)}
    style={{ minWidth: 42, justifyContent: 'center', color: methodColor(method), fontSize: 10 }}
  >
    {method}
  </Badge>
);

const TextTruncate = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--fg);
  flex: 1;
`;

const CollectionItem = styled.div`
  padding: 5px 0;
`;

const CollectionHeader = styled.div`
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 13px;
  background-color: var(--surface2);
  color: var(--fg);

  &:hover {
    background-color: var(--surface3);
  }
`;

const RequestInCollection = styled(ItemContainer)`
  padding-left: 25px;
  border-left: 3px solid transparent;

  &:hover {
    border-left-color: var(--accent);
  }
`;

export const Sidebar = observer(() => {
  const {
    history,
    loadHistoryItem,
    clearHistory,
    collections,
    createCollection,
    deleteCollection,
    deleteRequestFromCollection,
    renameCollection,
    renameRequestInCollection,
    environments,
    createEnvironment,
    deleteEnvironment,
    updateEnvironment,
    activeEnvironmentId,
    setActiveEnvironment,
    importCollections,
    exportCollections,
    importEnvironments,
    exportEnvironments
  } = requestStore;

  const [activeTab, setActiveTab] = useState<'history' | 'collections' | 'environments'>('history');
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const collectionFileInput = useRef<HTMLInputElement>(null);
  const envFileInput = useRef<HTMLInputElement>(null);

  const handleCreateCollection = () => {
    const name = prompt("Enter collection name:");
    if (name) {
      createCollection(name);
    }
  };

  const handleCreateEnvironment = () => {
      const name = prompt("Enter environment name:");
      if (name) {
          createEnvironment(name);
      }
  }

  const handleImportCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = importCollections(ev.target.result as string);
              if (success) alert('Collections imported successfully!');
              else alert('Failed to import collections. Invalid format?');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportCollections = () => {
      const data = exportCollections();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportEnvironment = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = importEnvironments(ev.target.result as string);
               if (success) alert('Environments imported successfully!');
               else alert('Failed to import environments. Invalid format?');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportEnvironments = () => {
      const data = exportEnvironments();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `environments_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Tabs
          label="Seções da barra lateral"
          variant="underline"
          items={sectionTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </SidebarHeader>

      {activeTab === 'history' && (
        <>
          <HeaderActions>
            <h3>Recent</h3>
            <ActionBtn onClick={() => {
              if (confirm('Clear all history?')) clearHistory();
            }} title="Clear History">🗑️</ActionBtn>
          </HeaderActions>
          <ListContainer>
            {history.length === 0 ? (
              <EmptyState title="No history yet" />
            ) : (
              history.map((item) => (
                <ItemContainer
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                >
                  <MethodBadge method={item.method} />
                  <TextTruncate title={item.url}>{item.url}</TextTruncate>
                </ItemContainer>
              ))
            )}
          </ListContainer>
        </>
      )}

      {activeTab === 'collections' && (
        <>
           <HeaderActions>
            <h3>Saved</h3>
            <div style={{ display: 'flex', gap: 5 }}>
                <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    ref={collectionFileInput}
                    onChange={handleImportCollection}
                />
                <ActionBtn onClick={() => collectionFileInput.current?.click()} title="Import Collections">📥</ActionBtn>
                <ActionBtn onClick={handleExportCollections} title="Export Collections">📤</ActionBtn>
                <ActionBtn onClick={handleCreateCollection} title="New Collection">➕</ActionBtn>
            </div>
          </HeaderActions>
          <ListContainer>
             {collections.length === 0 ? (
               <EmptyState title="No collections. Create one!" />
             ) : (
               collections.map(col => (
                 <CollectionItem key={col.id}>
                   <CollectionHeader>
                      <span>{col.name} ({col.requests.length})</span>
                      <div>
                        <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt("Rename collection:", col.name);
                            if(newName) renameCollection(col.id, newName);
                        }} title="Rename Collection">✏️</ActionBtn>
                        <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            if(confirm(`Delete collection ${col.name}?`)) deleteCollection(col.id);
                        }} title="Delete Collection">🗑️</ActionBtn>
                      </div>
                   </CollectionHeader>
                   {col.requests.map(req => (
                      <RequestInCollection
                        key={req.id}
                        onClick={() => loadHistoryItem(req)}
                      >
                         <MethodBadge method={req.method} />
                         <TextTruncate title={req.name || req.url}>{req.name || req.url}</TextTruncate>
                         <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt("Rename request:", req.name || 'New Request');
                            if(newName) renameRequestInCollection(col.id, req.id, newName);
                         }} style={{ fontSize: '12px', opacity: 0.4, marginRight: 5 }} title="Rename Request">✏️</ActionBtn>
                         <ActionBtn onClick={(e) => {
                           e.stopPropagation();
                           deleteRequestFromCollection(col.id, req.id);
                         }} style={{ fontSize: '12px', opacity: 0.4 }} title="Delete Request">✕</ActionBtn>
                      </RequestInCollection>
                   ))}
                 </CollectionItem>
               ))
             )}
          </ListContainer>
        </>
      )}

      {activeTab === 'environments' && (
          <>
            <HeaderActions>
                <h3>Environments</h3>
                <div style={{ display: 'flex', gap: 5 }}>
                    <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        ref={envFileInput}
                        onChange={handleImportEnvironment}
                    />
                    <ActionBtn onClick={() => envFileInput.current?.click()} title="Import Environments">📥</ActionBtn>
                    <ActionBtn onClick={handleExportEnvironments} title="Export Environments">📤</ActionBtn>
                    <ActionBtn onClick={handleCreateEnvironment} title="New Environment">➕</ActionBtn>
                </div>
            </HeaderActions>
            <ListContainer>
                {environments.length === 0 ? (
                    <EmptyState title="No environments created." />
                ) : (
                    environments.map(env => (
                        <ItemContainer
                            key={env.id}
                            className={activeEnvironmentId === env.id ? 'active' : ''}
                            onClick={() => setActiveEnvironment(env.id === activeEnvironmentId ? null : env.id)}
                        >
                            <span style={{ flex: 1 }}>{env.name}</span>
                            <ActionBtn onClick={(e) => {
                                e.stopPropagation();
                                setEditingEnv(env);
                            }} title="Edit">✏️</ActionBtn>
                            <ActionBtn onClick={(e) => {
                                e.stopPropagation();
                                if(confirm(`Delete environment ${env.name}?`)) deleteEnvironment(env.id);
                            }} title="Delete">🗑️</ActionBtn>
                        </ItemContainer>
                    ))
                )}
            </ListContainer>
          </>
      )}

      {editingEnv && (
          <EnvironmentModal
            environment={editingEnv}
            onClose={() => setEditingEnv(null)}
            onSave={(id, name, vars) => {
                updateEnvironment(id, name, vars);
                setEditingEnv(null);
            }}
          />
      )}
    </SidebarContainer>
  );
});

export default Sidebar;
