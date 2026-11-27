import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Button, Kbd, Select as SnSelect, Tabs, TextField, Tooltip } from '@juninmd/sonido';
import { requestStore } from '../stores/RequestStore';
import { CodeSnippetModal } from './CodeSnippetModal';

const methodColor = (m: string) => `var(--${m === 'OPTIONS' || m === 'HEAD' ? 'mute' : m.toLowerCase()})`;

type EditorTab = 'params' | 'headers' | 'body' | 'auth' | 'prerequest' | 'tests';

const editorTabs = (params: number, headers: number): { key: EditorTab; label: string; badge?: number }[] => [
  { key: 'params', label: 'Params', badge: params },
  { key: 'auth', label: 'Auth' },
  { key: 'headers', label: 'Headers', badge: headers },
  { key: 'body', label: 'Body' },
  { key: 'prerequest', label: 'Pre-req' },
  { key: 'tests', label: 'Tests' },
];

const EditorContainer = styled.div`
  padding: 15px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RequestBar = styled.div`
  display: flex;
  gap: 0;
  align-items: stretch;
`;

const MethodBox = styled.div`
  width: 110px;
  flex: none;

  .sn-field { width: 100%; height: 100%; }
  .sn-field__control {
    height: 100%;
    min-height: 36px;
    border-radius: 10px 0 0 10px;
    border-right: none;
    font-weight: 700;
  }
`;

const UrlField = styled(TextField)`
  flex: 1;
  min-width: 0;

  .sn-field { height: 100%; }
  .sn-field__control {
    min-height: 36px;
    border-radius: 0;
  }
`;

const SendBtn = styled(Button)`
  flex: none;
  min-height: 36px;
  border-radius: 0 10px 10px 0;
  padding: 0 24px;
`;

const SendTip = styled(Tooltip)`
  display: flex;
  flex: none;

  .sn-tooltip__bubble { white-space: nowrap; }
`;

const SaveBtn = styled(Button)`
  flex: none;
  margin-left: 8px;
  min-height: 36px;
`;

const CodeButton = styled(Button)`
  flex: none;
  margin-left: 8px;
  min-height: 36px;
  font-family: 'JetBrains Mono', Consolas, monospace;
`;

const TabsWrap = styled.div`
  margin-top: 10px;
  border-bottom: 1px solid var(--line);

  .sn-tabs { gap: 4px; border-bottom: 0; }
  .sn-tab { min-height: 34px; padding: 0 8px; font-size: 13px; }
`;

const TabContent = styled.div`
  padding-top: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 150px;
`;

const HeadersGrid = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid var(--line);
    border-radius: 4px;
`;

const HeaderRow = styled.div<{ $label?: boolean }>`
    display: flex;
    border-bottom: 1px solid var(--line);
    background-color: ${props => props.$label ? 'var(--surface3)' : 'transparent'};
    font-weight: ${props => props.$label ? 'bold' : 'normal'};
    font-size: ${props => props.$label ? '12px' : 'inherit'};

    &:last-child {
        border-bottom: none;
    }

    > .sn-field {
        flex: 1;
        min-width: 0;
    }
    > .sn-field .sn-field__control {
        background: transparent;
        border: 0;
        border-right: 1px solid var(--line);
        border-radius: 0;
        min-height: 32px;
    }
    > .sn-field .sn-field__control:focus {
        background-color: var(--surface3);
        box-shadow: none;
    }
`;

const ColLabel = styled.span`
    flex: 1;
    padding: 8px;
    border-right: 1px solid var(--line);
`;

const ColAction = styled.span`
    width: 30px;
`;

const RemoveBtn = styled(Button)`
    width: 30px;
    min-height: 30px;
    padding: 0;
    background: none;
    border: none;
    color: var(--mute);
    box-shadow: none;

    &:hover {
        color: var(--err);
        background: var(--surface3);
        transform: none;
    }
`;

const BodyEditor = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 10px;
`;

const BodyOptions = styled.div`
    font-size: 12px;
    color: var(--mute);
`;

const CodeField = styled(TextField)`
    flex: 1;
    min-height: 0;

    .sn-field { height: 100%; }
    .sn-field__box { height: 100%; }
    .sn-field__control {
        height: 100%;
        resize: none;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        padding: 10px;
    }
`;

const AuthRow = styled.div`
    display: flex;
    gap: 10px;
    align-items: center;

    > .sn-field { flex: 1; min-width: 0; }
`;

const ParamsEditor = styled.div`
  /* Reuse HeadersGrid styles if needed, or add specific overrides */
`;

export const RequestEditor = observer(() => {
  const {
      method, setMethod,
      url, setUrl,
      headers, setHeaders,
      queryParams, setQueryParams,
      body, setBody,
      bodyType, setBodyType,
      bodyFormData, setBodyFormData,
      bodyUrlEncoded, setBodyUrlEncoded,
      auth, setAuth,
      preRequestScript, setPreRequestScript,
      testScript, setTestScript,
      sendRequest, loading, cancelRequest,
      collections, saveRequestToCollection
  } = requestStore;

  const [activeTab, setActiveTab] = useState<EditorTab>('params');
  const [showCodeModal, setShowCodeModal] = useState(false);

  const handleSave = () => {
    if (collections.length === 0) {
      alert('Create a collection first!');
      return;
    }

    const name = prompt('Enter request name:');
    if (!name) return;

    let collectionId = collections[0].id;
    if (collections.length > 1) {
        const collectionNames = collections.map((c, i) => `${i}: ${c.name}`).join('\n');
        const indexStr = prompt(`Select Collection Index:\n${collectionNames}`, "0");
        if (indexStr === null) return;
        const index = parseInt(indexStr);
        if (!isNaN(index) && collections[index]) {
            collectionId = collections[index].id;
        } else {
             return;
        }
    }

    saveRequestToCollection(collectionId, name);
    alert('Saved!');
  };

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = headers.map(h => ({ ...h }));
    newHeaders[index][field] = value;

    if (index === newHeaders.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }

    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
  }

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = queryParams.map(p => ({ ...p }));
    newParams[index][field] = value;

    if (index === newParams.length - 1 && (newParams[index].key || newParams[index].value)) {
      newParams.push({ key: '', value: '' });
    }

    setQueryParams(newParams);
  };

  const removeParam = (index: number) => {
    const newParams = queryParams.filter((_, i) => i !== index);
    setQueryParams(newParams);
  }

  const handleFormDataChange = (index: number, field: 'key' | 'value' | 'type' | 'src', value: string) => {
    // Use requestStore.bodyFormData to ensure we have the latest state if called multiple times in one event
    const newData = requestStore.bodyFormData.map(i => ({ ...i }));
    (newData[index] as any)[field] = value;

    if (index === newData.length - 1 && (newData[index].key || newData[index].value || newData[index].src)) {
      newData.push({ key: '', value: '', type: 'text' });
    }

    setBodyFormData(newData);
  };

  const removeFormData = (index: number) => {
    setBodyFormData(bodyFormData.filter((_, i) => i !== index));
  };

  const handleUrlEncodedChange = (index: number, field: 'key' | 'value', value: string) => {
    const newData = bodyUrlEncoded.map(i => ({ ...i }));
    (newData[index] as any)[field] = value;

    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '' });
    }

    setBodyUrlEncoded(newData);
  };

  const removeUrlEncoded = (index: number) => {
    setBodyUrlEncoded(bodyUrlEncoded.filter((_, i) => i !== index));
  };

  const paramsCount = queryParams.filter(p => p.key).length;
  const headersCount = headers.filter(h => h.key).length;

  return (
    <EditorContainer>
      <RequestBar>
        <MethodBox>
          <SnSelect
            label="Method"
            hideLabel
            compact
            value={method}
            options={methods.map(m => ({ value: m, label: m }))}
            onChange={setMethod}
            style={{ color: methodColor(method) }}
          />
        </MethodBox>
        <UrlField
          label="Request URL"
          hideLabel
          type="text"
          placeholder="Enter request URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') sendRequest();
          }}
        />
        <SendTip content={<>Enviar requisição <Kbd>Ctrl</Kbd> <Kbd>Enter</Kbd></>}>
          <SendBtn
            variant={loading ? 'danger' : 'primary'}
            onClick={() => (loading ? cancelRequest() : sendRequest())}
          >
            {loading ? 'Cancel' : 'Send'}
          </SendBtn>
        </SendTip>
        <SaveBtn appearance="outline" onClick={handleSave}>Save</SaveBtn>
        <CodeButton appearance="outline" onClick={() => setShowCodeModal(true)} title="Generate Code">{'</>'}</CodeButton>
      </RequestBar>

      <TabsWrap>
        <Tabs
          label="Seções da requisição"
          items={editorTabs(paramsCount, headersCount)}
          value={activeTab}
          onChange={setActiveTab}
        />
      </TabsWrap>

      <TabContent>
        {activeTab === 'params' && (
            <ParamsEditor>
                <HeadersGrid>
                    <HeaderRow $label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel style={{ width: 100, flex: 'none' }}>Type</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {queryParams.map((param, index) => (
                    <HeaderRow key={index}>
                        <TextField
                          label="Parameter key"
                          hideLabel
                          compact
                          placeholder="Key"
                          value={param.key}
                          onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        />
                        <TextField
                          label="Parameter value"
                          hideLabel
                          compact
                          placeholder="Value"
                          value={param.value}
                          onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        />
                        <ColAction>
                        {queryParams.length > 1 && index !== queryParams.length - 1 && (
                            <RemoveBtn variant="ghost" size="xs" aria-label="Remove parameter" onClick={() => removeParam(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
            </ParamsEditor>
        )}

        {activeTab === 'auth' && (
          <BodyEditor>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AuthRow>
                <label style={{ width: 80 }}>Type:</label>
                <SnSelect
                  label="Auth type"
                  hideLabel
                  compact
                  value={auth.type}
                  options={[
                    { value: 'none', label: 'No Auth' },
                    { value: 'basic', label: 'Basic Auth' },
                    { value: 'bearer', label: 'Bearer Token' },
                    { value: 'apikey', label: 'API Key' },
                  ]}
                  onChange={(value) => setAuth({ ...auth, type: value as any })}
                />
              </AuthRow>

              {auth.type === 'basic' && (
                <>
                  <AuthRow>
                    <label style={{ width: 80 }}>Username:</label>
                    <TextField
                      label="Username"
                      hideLabel
                      compact
                      type="text"
                      value={auth.username || ''}
                      onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                      placeholder="Username"
                    />
                  </AuthRow>
                  <AuthRow>
                    <label style={{ width: 80 }}>Password:</label>
                    <TextField
                      label="Password"
                      hideLabel
                      compact
                      type="password"
                      value={auth.password || ''}
                      onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                      placeholder="Password"
                    />
                  </AuthRow>
                </>
              )}

              {auth.type === 'bearer' && (
                 <AuthRow>
                   <label style={{ width: 80 }}>Token:</label>
                   <TextField
                     label="Bearer token"
                     hideLabel
                     compact
                     type="text"
                     value={auth.token || ''}
                     onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                     placeholder="Bearer Token"
                   />
                 </AuthRow>
              )}

              {auth.type === 'apikey' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   <AuthRow>
                     <label style={{ width: 80 }}>Key:</label>
                     <TextField
                       label="API key name"
                       hideLabel
                       compact
                       type="text"
                       value={auth.apiKey?.key || ''}
                       onChange={(e) => setAuth({ ...auth, apiKey: { key: e.target.value, value: auth.apiKey?.value || '', addTo: auth.apiKey?.addTo || 'header' } })}
                       placeholder="Key"
                     />
                   </AuthRow>
                   <AuthRow>
                     <label style={{ width: 80 }}>Value:</label>
                     <TextField
                       label="API key value"
                       hideLabel
                       compact
                       type="text"
                       value={auth.apiKey?.value || ''}
                       onChange={(e) => setAuth({ ...auth, apiKey: { key: auth.apiKey?.key || '', value: e.target.value, addTo: auth.apiKey?.addTo || 'header' } })}
                       placeholder="Value"
                     />
                   </AuthRow>
                   <AuthRow>
                     <label style={{ width: 80 }}>Add To:</label>
                     <SnSelect
                       label="Add to"
                       hideLabel
                       compact
                       value={auth.apiKey?.addTo || 'header'}
                       options={[
                         { value: 'header', label: 'Header' },
                         { value: 'query', label: 'Query Params' },
                       ]}
                       onChange={(value) => setAuth({ ...auth, apiKey: { key: auth.apiKey?.key || '', value: auth.apiKey?.value || '', addTo: value as any } })}
                     />
                   </AuthRow>
                 </div>
              )}
            </div>
            <div style={{ padding: 10, color: 'var(--mute)', fontSize: 12 }}>
              Authorization header/params will be automatically generated.
            </div>
          </BodyEditor>
        )}

        {activeTab === 'headers' && (
          <HeadersGrid>
            <HeaderRow $label>
                <ColLabel>Key</ColLabel>
                <ColLabel>Value</ColLabel>
                <ColAction></ColAction>
            </HeaderRow>
            {headers.map((header, index) => (
              <HeaderRow key={index}>
                <TextField
                  label="Header key"
                  hideLabel
                  compact
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <TextField
                  label="Header value"
                  hideLabel
                  compact
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
                <ColAction>
                {headers.length > 1 && index !== headers.length - 1 && (
                     <RemoveBtn variant="ghost" size="xs" aria-label="Remove header" onClick={() => removeHeader(index)}>✕</RemoveBtn>
                )}
                </ColAction>
              </HeaderRow>
            ))}
          </HeadersGrid>
        )}

        {activeTab === 'body' && (
           <BodyEditor>
             <BodyOptions>
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'text'}
                        onChange={() => setBodyType('text')}
                    /> Raw (Text)
                 </label>
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'json'}
                        onChange={() => setBodyType('json')}
                    /> JSON
                 </label>
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'form-data'}
                        onChange={() => setBodyType('form-data')}
                    /> Form Data
                 </label>
                 <label style={{ cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'x-www-form-urlencoded'}
                        onChange={() => setBodyType('x-www-form-urlencoded')}
                    /> x-www-form-urlencoded
                 </label>
             </BodyOptions>

             {(bodyType === 'text' || bodyType === 'json') && (
                 <CodeField
                    label="Request body"
                    hideLabel
                    multiline
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={bodyType === 'json' ? "Request Body (JSON)" : "Request Body (Text)"}
                  />
             )}

             {bodyType === 'form-data' && (
                <HeadersGrid>
                    <HeaderRow $label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {bodyFormData.map((item, index) => (
                    <HeaderRow key={index}>
                        <TextField
                            label="Field key"
                            hideLabel
                            compact
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => handleFormDataChange(index, 'key', e.target.value)}
                        />
                        <div style={{ width: 100, borderRight: '1px solid var(--line)', display: 'flex' }}>
                            <SnSelect
                              label="Field type"
                              hideLabel
                              compact
                              value={item.type || 'text'}
                              options={[
                                { value: 'text', label: 'Text' },
                                { value: 'file', label: 'File' },
                              ]}
                              onChange={(value) => handleFormDataChange(index, 'type', value)}
                            />
                        </div>
                        {item.type === 'file' ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', borderRight: '1px solid var(--line)', overflow: 'hidden' }}>
                                <input
                                    type="file"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const path = window.pingAPI ? window.pingAPI.getFilePath(file) : file.name;
                                            handleFormDataChange(index, 'src', path);
                                            handleFormDataChange(index, 'value', file.name);
                                        }
                                    }}
                                    style={{ color: 'var(--fg)', padding: '8px', width: '100%' }}
                                />
                            </div>
                        ) : (
                            <TextField
                                label="Field value"
                                hideLabel
                                compact
                                placeholder="Value"
                                value={item.value}
                                onChange={(e) => handleFormDataChange(index, 'value', e.target.value)}
                            />
                        )}
                         <ColAction>
                        {bodyFormData.length > 1 && index !== bodyFormData.length - 1 && (
                            <RemoveBtn variant="ghost" size="xs" aria-label="Remove field" onClick={() => removeFormData(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
             )}

             {bodyType === 'x-www-form-urlencoded' && (
                <HeadersGrid>
                    <HeaderRow $label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {bodyUrlEncoded.map((item, index) => (
                    <HeaderRow key={index}>
                        <TextField
                            label="Field key"
                            hideLabel
                            compact
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => handleUrlEncodedChange(index, 'key', e.target.value)}
                        />
                        <TextField
                            label="Field value"
                            hideLabel
                            compact
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleUrlEncodedChange(index, 'value', e.target.value)}
                        />
                         <ColAction>
                        {bodyUrlEncoded.length > 1 && index !== bodyUrlEncoded.length - 1 && (
                            <RemoveBtn variant="ghost" size="xs" aria-label="Remove field" onClick={() => removeUrlEncoded(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
             )}
           </BodyEditor>
        )}

        {activeTab === 'prerequest' && (
           <BodyEditor>
             <BodyOptions>Pre-request Script (Javascript)</BodyOptions>
             <CodeField
                label="Pre-request script"
                hideLabel
                multiline
                value={preRequestScript}
                onChange={(e) => setPreRequestScript(e.target.value)}
                placeholder="// Write your pre-request script here"
              />
           </BodyEditor>
        )}

        {activeTab === 'tests' && (
           <BodyEditor>
             <BodyOptions>Tests (Javascript)</BodyOptions>
             <CodeField
                label="Test script"
                hideLabel
                multiline
                value={testScript}
                onChange={(e) => setTestScript(e.target.value)}
                placeholder={'// Write your tests here\n// pm.test("Status code is 200", function () {\n//     pm.response.to.have.status(200);\n// });'}
              />
           </BodyEditor>
        )}
      </TabContent>
      {showCodeModal && <CodeSnippetModal onClose={() => setShowCodeModal(false)} />}
    </EditorContainer>
  );
});

export default RequestEditor;
