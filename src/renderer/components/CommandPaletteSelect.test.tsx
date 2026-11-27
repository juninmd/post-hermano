import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

describe('CommandPalette', () => {
  it('filters commands and closes on Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} toggleTheme={() => {}} />);
    fireEvent.change(screen.getByLabelText('Buscar comandos'), { target: { value: 'tema' } });
    expect(screen.getByText('Alternar tema')).toBeInTheDocument();
    expect(screen.queryByText('Nova requisição')).not.toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText('Buscar comandos'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('runs the selected command on Enter', () => {
    const toggle = vi.fn();
    render(<CommandPalette open onClose={() => {}} toggleTheme={toggle} />);
    fireEvent.change(screen.getByLabelText('Buscar comandos'), { target: { value: 'tema' } });
    fireEvent.keyDown(screen.getByLabelText('Buscar comandos'), { key: 'Enter' });
    expect(toggle).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CommandPalette open={false} onClose={() => {}} toggleTheme={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

// O Select customizado foi substituído pelo Select nativo do Sonido em RequestEditor.
