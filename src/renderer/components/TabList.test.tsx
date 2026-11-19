import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabList } from './TabList';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('TabList', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.activeTabId = null;
        });
        vi.restoreAllMocks();
    });

    it('should render tabs', () => {
        runInAction(() => {
            requestStore.addTab(); // Adds one tab
        });
        render(<TabList />);
        expect(screen.getByText('New Request')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('should render correct method color', () => {
        runInAction(() => {
            requestStore.addTab();
            requestStore.setMethod('GET');
        });
        render(<TabList />);
        expect(screen.getByTitle('New Request')).toBeInTheDocument();
    });

    it('should show URL path in label if available', () => {
         runInAction(() => {
            requestStore.addTab();
            requestStore.setUrl('http://example.com/api/users?id=1');
        });
        render(<TabList />);
        expect(screen.getByText('users')).toBeInTheDocument();
    });

    it('should fallback to url if no path', () => {
         runInAction(() => {
            requestStore.addTab();
            requestStore.setUrl('http://example.com');
        });
        render(<TabList />);
        expect(screen.getByText('example.com')).toBeInTheDocument();
    });

     it('should use tab name if not New Request', () => {
         runInAction(() => {
            requestStore.addTab();
            requestStore.tabs[0].name = 'My Request';
            requestStore.setUrl('http://example.com');
        });
        render(<TabList />);
        expect(screen.getByText('My Request')).toBeInTheDocument();
    });

    it('should switch tabs', () => {
        runInAction(() => {
            requestStore.addTab();
            requestStore.addTab();
        });
        const id1 = requestStore.tabs[0].id;
        const id2 = requestStore.tabs[1].id;

        render(<TabList />);
        const tabs = screen.getAllByTitle('New Request');
        fireEvent.click(tabs[0]);
        expect(requestStore.activeTabId).toBe(id1);

        fireEvent.click(tabs[1]);
        expect(requestStore.activeTabId).toBe(id2);
    });

    it('should close tab', () => {
        runInAction(() => {
            requestStore.addTab();
            requestStore.addTab();
        });
        expect(requestStore.tabs).toHaveLength(2);

        render(<TabList />);
        const closeButtons = screen.getAllByText('×');
        fireEvent.click(closeButtons[0]);

        expect(requestStore.tabs).toHaveLength(1);
    });

    it('should add new tab', () => {
        render(<TabList />);
        const addBtn = screen.getByText('+');
        fireEvent.click(addBtn);
        expect(requestStore.tabs).toHaveLength(1);
    });

    it('should duplicate tab', () => {
        runInAction(() => {
            requestStore.addTab();
            requestStore.setUrl('http://duplicate.me');
        });
        render(<TabList />);
        const dupBtn = screen.getByTitle('Duplicate Tab');
        fireEvent.click(dupBtn);

        expect(requestStore.tabs).toHaveLength(2);
        expect(requestStore.tabs[1].url).toBe('http://duplicate.me');
    });

    it('should render method colors for different methods', () => {
         runInAction(() => {
            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'UNKNOWN'];
            // Clear tabs first
            requestStore.tabs = [];

            // Create dummy tabs
            // We need to bypass addTab to set IDs and methods manually if we want clean state
            // But addTab + setMethod is easier
             methods.forEach(m => {
                requestStore.addTab();
                requestStore.setMethod(m);
            });
        });
        render(<TabList />);
        expect(screen.getAllByTitle('New Request').length).toBe(6);
    });

    describe('keyboard and screen reader support', () => {
        const twoTabs = () => {
            runInAction(() => {
                requestStore.addTab();
                requestStore.addTab();
            });
            render(<TabList />);
            return screen.getAllByRole('tab');
        };

        it('exposes tabs with the selected state and a single tab stop', () => {
            const tabs = twoTabs();
            const [first, second] = [requestStore.tabs[0].id, requestStore.tabs[1].id];
            fireEvent.click(tabs[0]);
            expect(requestStore.activeTabId).toBe(first);
            expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
            expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
            expect(tabs[0]).toHaveAttribute('tabindex', '0');
            expect(tabs[1]).toHaveAttribute('tabindex', '-1');
            expect(second).not.toBe(first);
        });

        it('activates a tab with Enter and Space', () => {
            const tabs = twoTabs();
            fireEvent.keyDown(tabs[1], { key: 'Enter' });
            expect(requestStore.activeTabId).toBe(requestStore.tabs[1].id);
            fireEvent.keyDown(tabs[0], { key: ' ' });
            expect(requestStore.activeTabId).toBe(requestStore.tabs[0].id);
        });

        it('moves between tabs with the arrow keys, wrapping around', () => {
            const tabs = twoTabs();
            fireEvent.click(tabs[0]);
            fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
            expect(requestStore.activeTabId).toBe(requestStore.tabs[1].id);
            expect(document.activeElement).toBe(tabs[1]);
            fireEvent.keyDown(tabs[1], { key: 'ArrowRight' });
            expect(requestStore.activeTabId).toBe(requestStore.tabs[0].id);
        });

        it('closes, duplicates and adds through real, named buttons', () => {
            twoTabs();
            expect(screen.getAllByRole('button', { name: 'Close tab' })).toHaveLength(2);
            expect(screen.getAllByRole('button', { name: 'Duplicate tab' })).toHaveLength(2);
            fireEvent.click(screen.getByRole('button', { name: 'New request' }));
            expect(requestStore.tabs).toHaveLength(3);
        });
    });
});
