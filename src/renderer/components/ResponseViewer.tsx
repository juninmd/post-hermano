import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { Badge, Button, EmptyState, Skeleton, Tabs, ToastProvider, useToast, type BadgeTone } from '@juninmd/sonido';
import { requestStore } from '../stores/RequestStore';
import { JsonTree } from './JsonTree';
import { Timeline } from './Timeline';

type ResponseTab = 'body' | 'headers' | 'preview' | 'tests' | 'tree' | 'timeline';

const ViewerContainer = styled.div<{ $empty?: boolean }>`
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    ${props => props.$empty && `
        align-items: center;
        justify-content: center;
    `}
`;

const ResponseMeta = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 13px;
    align-items: center;
`;

const Radar = styled.div`
  position: relative; width: 100px; height: 100px; margin: 0 auto 14px;
  i { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid var(--accent2);
      opacity: 0; animation: ping 2.6s ease-out infinite; }
  i:nth-child(2) { animation-delay: .9s; } i:nth-child(3) { animation-delay: 1.8s; }
  b { position: absolute; inset: 0; margin: auto; width: 20px; height: 20px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent2)); box-shadow: 0 0 28px var(--accent); }
`;

const MetaInfo = styled.div`
    color: var(--mute);
`;

const TabBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--line);
  margin-top: 10px;

  .sn-tabs {
    flex: 1;
    border-bottom: 0;
  }
`;

const TabActions = styled.div`
  display: flex;
  gap: 8px;
  flex: none;
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

const HeaderRow = styled.div`
    display: flex;
    border-bottom: 1px solid var(--line);
    &:last-child {
        border-bottom: none;
    }
`;

const ReadOnlyInput = styled.input`
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    color: var(--fg);
    border-right: 1px solid var(--line);
    outline: none;
    background-color: var(--surface);
`;

const TestResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  padding: 10px;
`;

const TestResultItem = styled.div<{ $passed: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background-color: ${props => props.$passed ? 'rgba(106, 153, 85, 0.2)' : 'rgba(244, 135, 113, 0.2)'};
  border-left: 3px solid ${props => props.$passed ? 'var(--ok)' : 'var(--err)'};
  border-radius: 4px;
`;

const ResponseBody = styled.textarea`
    width: 100%;
    height: 100%;
    flex: 1;
    background-color: var(--bg);
    color: var(--fg);
    border: none;
    padding: 10px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    resize: none;
    outline: none;
`;

const computeFormat = (content: any): string => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return content.toString();
    }
  }
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

// Single-entry cache: re-renders (tab switches, resize) don't re-format large bodies
let lastRaw: any;
let lastFormatted = '';
const formatBody = (content: any): string => {
  if (content !== lastRaw || lastFormatted === '' ) {
    lastFormatted = computeFormat(content);
    lastRaw = content;
  }
  return lastFormatted;
};

const statusColor = (status: number): string => {
  if (status >= 200 && status < 300) return '#4ade80';
  if (status >= 300 && status < 400) return '#fbbf24';
  if (status >= 400 && status < 600) return '#f87171';
  return 'inherit';
};

const statusTone = (status: number): BadgeTone => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'warning';
  if (status >= 400 && status < 600) return 'danger';
  return 'neutral';
};

const responseTabs = (passed: number, total: number): { key: ResponseTab; label: string; badge?: string }[] => [
  { key: 'body', label: 'Body' },
  { key: 'preview', label: 'Preview' },
  { key: 'tree', label: 'Tree' },
  { key: 'headers', label: 'Headers' },
  { key: 'tests', label: 'Test Results', badge: `${passed}/${total}` },
  { key: 'timeline', label: 'Timeline' },
];

const ResponseViewerBody = observer(() => {
  const { response, loading, error, responseMetrics } = requestStore;
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

  if (loading) {
    return (
        <ViewerContainer>
            <Skeleton label="Loading..." rows={4} />
        </ViewerContainer>
    );
  }

  if (error) {
       return (
        <ViewerContainer $empty>
            <EmptyState title={`Error: ${error.message}`} />
        </ViewerContainer>
    );
  }

  if (!response) {
    return (
        <ViewerContainer $empty>
            <EmptyState
                icon={<Radar aria-hidden><i /><i /><i /><b /></Radar>}
                title="Enter URL and click Send to get a response"
            />
        </ViewerContainer>
    );
  }

  const data = response.data;
  const status = response.status;
  const statusText = response.statusText;
  const headers = response.headers;
  const testResults = response.testResults || [];
  const passedCount = testResults.filter((t: any) => t.passed).length;
  const totalTests = testResults.length;

  const handleCopy = () => {
    const text = formatBody(data);
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: 'Resposta copiada', tone: 'success' }))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const handleDownload = () => {
    const text = formatBody(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ViewerContainer>
      <ResponseMeta>
          <div className="status-label">
            Status: <Badge appearance="soft" tone={statusTone(status)} style={{ color: statusColor(status) }}>{status} {statusText}</Badge>
          </div>
          <MetaInfo>Time: {responseMetrics.time}ms</MetaInfo>
          <MetaInfo>Size: {responseMetrics.size}</MetaInfo>
      </ResponseMeta>

      <TabBar>
        <Tabs
          label="Conteúdo da resposta"
          items={responseTabs(passedCount, totalTests)}
          value={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === 'body' && (
            <TabActions>
                <Button appearance="outline" size="sm" onClick={handleCopy} title="Copy to Clipboard">Copy</Button>
                <Button appearance="outline" size="sm" onClick={handleDownload} title="Download Response">Download</Button>
            </TabActions>
        )}
      </TabBar>

      <TabContent>
        {activeTab === 'body' && (
             <ResponseBody
                readOnly
                value={formatBody(data)}
             />
        )}
        {activeTab === 'preview' && (
            <iframe
                title="Response Preview"
                srcDoc={typeof data === 'string' ? data : JSON.stringify(data)}
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                sandbox="allow-scripts"
            />
        )}
        {activeTab === 'tree' && <JsonTree data={data} />}
        {activeTab === 'timeline' && <Timeline timing={response.timing} />}
        {activeTab === 'headers' && (
            <HeadersGrid>
                {Object.entries(headers).map(([key, value]) => (
                        <HeaderRow key={key}>
                        <ReadOnlyInput readOnly value={key} />
                        <ReadOnlyInput readOnly value={String(value)} />
                        </HeaderRow>
                ))}
            </HeadersGrid>
        )}
        {activeTab === 'tests' && (
            <TestResultsList>
                {testResults.length === 0 && <div style={{ color: 'var(--mute)' }}>No tests executed</div>}
                {testResults.map((test: any, index: number) => (
                    <TestResultItem key={index} $passed={test.passed}>
                        <span>{test.name}</span>
                        <Badge appearance="soft" dot tone={test.passed ? 'success' : 'danger'}>
                          {test.passed ? 'PASS' : 'FAIL'}
                        </Badge>
                        {test.message && <span> - {test.message}</span>}
                    </TestResultItem>
                ))}
            </TestResultsList>
        )}
      </TabContent>
    </ViewerContainer>
  );
});

export const ResponseViewer: React.FC = () => (
  <ToastProvider>
    <ResponseViewerBody />
  </ToastProvider>
);

export default ResponseViewer;
