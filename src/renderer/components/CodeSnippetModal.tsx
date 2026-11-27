import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Dialog, Tabs, TextField } from '@juninmd/sonido';
import { requestStore } from '../stores/RequestStore';
import { generateCurl, generateFetch, RequestData } from '../utils/codeGenerator';
import { observer } from 'mobx-react-lite';
import { base64Utf8 } from '../utils/base64';

const SnippetDialog = styled(Dialog)`
  width: 620px;

  & .sn-dialog__panel {
    height: 440px;
    grid-template-rows: auto 1fr auto;
  }
  & .sn-dialog__body {
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  & .snippet-tabs {
    flex: none;
  }
  & .snippet-code {
    flex: 1;
    min-height: 0;
    margin-top: 10px;
  }
  & .snippet-code .sn-field__box,
  & .snippet-code .sn-field__control {
    height: 100%;
  }
  & .snippet-code .sn-field__control {
    resize: none;
    background: var(--bg);
    border: none;
    border-radius: 0;
    font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    font-size: 12px;
  }
`;

type SnippetTab = 'curl' | 'fetch';

const snippetTabs: { key: SnippetTab; label: string }[] = [
  { key: 'curl', label: 'cURL' },
  { key: 'fetch', label: 'Fetch' },
];

interface Props {
  onClose: () => void;
}

export const CodeSnippetModal = observer(({ onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<SnippetTab>('curl');
  const [code, setCode] = useState('');

  useEffect(() => {
      const { method, url, headers, bodyType, body, bodyFormData, bodyUrlEncoded, queryParams, auth } = requestStore;

      let finalHeaders = [...headers.filter(h => h.key)];
      let finalUrl = url;

      if (auth.type === 'basic') {
          const token = base64Utf8(`${auth.username || ''}:${auth.password || ''}`);
          finalHeaders.push({ key: 'Authorization', value: `Basic ${token}` });
      } else if (auth.type === 'bearer') {
          finalHeaders.push({ key: 'Authorization', value: `Bearer ${auth.token || ''}` });
      } else if (auth.type === 'apikey' && auth.apiKey) {
          if (auth.apiKey.addTo === 'header') {
              finalHeaders.push({ key: auth.apiKey.key, value: auth.apiKey.value });
          } else if (auth.apiKey.addTo === 'query') {
              const separator = finalUrl.includes('?') ? '&' : '?';
              finalUrl = `${finalUrl}${separator}${auth.apiKey.key}=${encodeURIComponent(auth.apiKey.value)}`;
          }
      }

      const reqData: RequestData = {
          method,
          url: finalUrl,
          headers: finalHeaders,
          bodyType,
          body,
          bodyFormData,
          bodyUrlEncoded,
          queryParams
      };

      if (activeTab === 'curl') {
          setCode(generateCurl(reqData));
      } else {
          setCode(generateFetch(reqData));
      }
  }, [activeTab, requestStore.method, requestStore.url, requestStore.headers, requestStore.body, requestStore.auth, requestStore.bodyType, requestStore.bodyFormData, requestStore.bodyUrlEncoded, requestStore.queryParams]);

  const handleCopy = () => {
      navigator.clipboard.writeText(code);
      alert('Copied to clipboard!');
  };

  return (
    <SnippetDialog
      open
      onClose={onClose}
      title="Generate Code"
      footer={<Button variant="primary" onClick={handleCopy}>Copy</Button>}
    >
      <Tabs
        className="snippet-tabs"
        label="Linguagem do snippet"
        variant="pill"
        items={snippetTabs}
        value={activeTab}
        onChange={setActiveTab}
      />
      <TextField
        className="snippet-code"
        label="Generated code"
        hideLabel
        multiline
        readOnly
        value={code}
      />
    </SnippetDialog>
  );
});
