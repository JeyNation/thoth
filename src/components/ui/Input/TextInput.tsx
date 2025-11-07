import React from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';

export type TextInputProps = TextFieldProps & {};

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  props,
  ref,
) {
  return <TextField inputRef={ref} {...props} />;
});

export default TextInput;
