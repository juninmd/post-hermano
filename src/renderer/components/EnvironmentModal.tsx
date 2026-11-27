import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Checkbox, Dialog, TextField } from '@juninmd/sonido';
import { Environment, Variable } from '../stores/RequestStore';

const EnvDialog = styled(Dialog)`
  width: 620px;

  & .sn-dialog__panel {
    height: 520px;
    grid-template-rows: auto 1fr auto;
  }
  & .sn-dialog__body {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

const Variables = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const VariableRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;

  .sn-field { flex: 1; min-width: 0; }
  /* O rótulo continua no nome acessível, mas a linha fica compacta. */
  .sn-check__text { display: none; }
`;

interface Props {
  environment: Environment;
  onSave: (id: string, name: string, variables: Variable[]) => void;
  onClose: () => void;
}

export const EnvironmentModal: React.FC<Props> = ({ environment, onSave, onClose }) => {
  const [name, setName] = useState(environment.name);
  const [variables, setVariables] = useState<Variable[]>([]);

  useEffect(() => {
    // Deep copy variables
    setVariables(environment.variables.map(v => ({ ...v })));
  }, [environment]);

  const handleVariableChange = (index: number, field: keyof Variable, value: any) => {
    const newVars = [...variables];
    (newVars[index] as any)[field] = value;

    if (index === newVars.length - 1 && (newVars[index].key || newVars[index].value)) {
      newVars.push({ key: '', value: '', enabled: true });
    }

    setVariables(newVars);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <EnvDialog
      open
      onClose={onClose}
      title="Edit Environment"
      footer={(
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(environment.id, name, variables)}>Save</Button>
        </>
      )}
    >
      <TextField
        label="Environment name"
        hideLabel
        value={name}
        placeholder="Environment name"
        onChange={e => setName(e.target.value)}
      />

      <div>
        <label style={{ display: 'block', marginBottom: 6, color: 'var(--mute)' }}>Variables</label>
        <Variables>
          {variables.map((v, i) => (
            <VariableRow key={i}>
              <Checkbox
                label={`Enable ${v.key || 'variable'}`}
                checked={v.enabled}
                onChange={checked => handleVariableChange(i, 'enabled', checked)}
              />
              <TextField
                label="Variable"
                hideLabel
                compact
                placeholder="Variable"
                value={v.key}
                onChange={e => handleVariableChange(i, 'key', e.target.value)}
              />
              <TextField
                label="Value"
                hideLabel
                compact
                placeholder="Value"
                value={v.value}
                onChange={e => handleVariableChange(i, 'value', e.target.value)}
              />
              {variables.length > 1 && i !== variables.length - 1 && (
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label="Remove variable"
                  onClick={() => removeVariable(i)}
                >
                  🗑️
                </Button>
              )}
            </VariableRow>
          ))}
        </Variables>
      </div>
    </EnvDialog>
  );
};
