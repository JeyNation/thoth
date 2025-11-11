import React, { useRef, useImperativeHandle, forwardRef } from 'react';

import { Stack } from '@mui/material';

import { RuleEditorProps, RuleSection } from '@/features/rules/components/Rules';
import { FieldRule } from '@/types/rulesComponents';
import { AnchorRule } from '@/types/extractionRules';
import { EmptyDataIndicator } from '@/components/atoms';
import { BASIC_INFO_FIELDS } from '@/config/formFields';

const RuleEditor: React.FC<RuleEditorProps> = ({}) => {
  return (
    <>
      {BASIC_INFO_FIELDS.map(field => {
        const extractionFieldId = field.id;
        return <div key={extractionFieldId}>{field.label}</div>;
      })}
    </>
  );
};

export default RuleEditor;
export { RuleEditor };
