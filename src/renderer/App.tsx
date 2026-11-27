import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Card, ToastProvider, Tooltip } from '@juninmd/sonido';
import { GlobalStyle } from './styles/GlobalStyle';
import { CommandPalette } from './components/CommandPalette';
import { requestStore } from './stores/RequestStore';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';
import TabList from './components/TabList';
import { ResizeHandle } from './components/ResizeHandle';


const AppContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  padding: 10px;
  gap: 0;
`;

const ThemeTip = styled(Tooltip)`
  position: fixed; right: 18px; bottom: 16px; z-index: 20;
`;

const ThemeBtn = styled(Button)`
  width: 36px; height: 36px; min-height: 36px; padding: 0;
  border: 1px solid var(--line); background: var(--surface2); color: var(--fg);
  &:hover { transform: rotate(20deg) scale(1.08); border-color: var(--accent); }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #0f1115;
  min-width: 0; /* Prevent flex overflow */
`;

const SidebarWrapper = styled.div<{ width: number }>`
  width: ${props => props.width}px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  animation: rise .5s both;

  > .sn-card {
    height: 100%;
    gap: 0;
    border-radius: 16px;
    overflow: hidden;
  }
  > .sn-card > * {
    flex: 1;
    min-height: 0;
  }
`;

const EditorWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const ResponseWrapper = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 50px;
`;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [responseHeight, setResponseHeight] = useState(300);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const toggleTheme = React.useCallback(() => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.dataset.theme = saved;
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      else if (e.key === 'Enter') { e.preventDefault(); requestStore.sendRequest(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isResizing = useRef(false);
  const sidebarWidthRef = useRef(sidebarWidth);
  const responseHeightRef = useRef(responseHeight);

  // Load saved layout
  useEffect(() => {
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        const w = parseInt(savedWidth);
        setSidebarWidth(w);
        sidebarWidthRef.current = w;
      }
      const savedHeight = localStorage.getItem('responseHeight');
      if (savedHeight) {
        const h = parseInt(savedHeight);
        setResponseHeight(h);
        responseHeightRef.current = h;
      }
  }, []);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    responseHeightRef.current = responseHeight;
  }, [responseHeight]);

  const startResizeSidebar = (e: React.MouseEvent) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidthRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(600, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
      sidebarWidthRef.current = newWidth;
    };

    const onMouseUp = () => {
      isResizing.current = false;
      localStorage.setItem('sidebarWidth', sidebarWidthRef.current.toString());
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startResizeResponse = (e: React.MouseEvent) => {
    isResizing.current = true;
    const startY = e.clientY;
    const startHeight = responseHeightRef.current;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Dragging down decreases height (since it's at bottom)? No, handle is top of response.
      // Dragging down -> y increases -> height decreases.
      // Dragging up -> y decreases -> height increases.
      const diff = startY - moveEvent.clientY;
      const newHeight = Math.max(100, Math.min(800, startHeight + diff));
      setResponseHeight(newHeight);
      responseHeightRef.current = newHeight;
    };

    const onMouseUp = () => {
      isResizing.current = false;
      localStorage.setItem('responseHeight', responseHeightRef.current.toString());
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <ToastProvider>
      <GlobalStyle />
      <AppContainer>
        <SidebarWrapper width={sidebarWidth}>
             <Card surface="glass" padding="none" className="sidebar-panel"><Sidebar /></Card>
        </SidebarWrapper>

        <ResizeHandle direction="horizontal" onMouseDown={startResizeSidebar} />

        <MainContent>
            <TabList />
            <EditorWrapper>
                <RequestEditor />
            </EditorWrapper>

            <ResizeHandle direction="vertical" onMouseDown={startResizeResponse} />

            <ResponseWrapper height={responseHeight}>
                <ResponseViewer />
            </ResponseWrapper>
        </MainContent>
      </AppContainer>
      <ThemeTip content="Alternar tema" side="top">
        <ThemeBtn variant="secondary" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
          <span style={{ fontSize: 18 }}>◐</span>
        </ThemeBtn>
      </ThemeTip>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} toggleTheme={toggleTheme} />
    </ToastProvider>
  );
}

export default App;
