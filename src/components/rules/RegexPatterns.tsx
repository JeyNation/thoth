import React, { useImperativeHandle, forwardRef } from 'react';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Paper,
  Stack,
  Typography,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
  Box,
} from '@mui/material';

import { RegexPatternsProps } from '../../types/rulesComponents';
import { IconButton } from '../ui/Button/IconButton';
import { TextButton } from '../ui/Button/TextButton';
import { TextInput } from '../ui/Input/TextInput';

export interface RegexPatternsRef {
  applyPendingChanges: () => void;
  getPendingChanges: () => {
    pendingPattern?: string | { regex: string; label?: string };
    pendingPatternEdit?: { index: number; pattern: string | { regex: string; label?: string } };
  };
}

export const RegexPatterns = forwardRef<RegexPatternsRef, RegexPatternsProps>(
  function RegexPatternsComp(props, ref) {
    const { patterns, onAdd, onUpdate, onDelete, onDragStart, onDragOver, onDrop, isDragged } =
      props;
    const [inputValue, setInputValue] = React.useState('');
    const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
    const [presets, setPresets] = React.useState<
      Array<{ name: string; regex: string; flags?: string }>
    >([]);
    const [open, setOpen] = React.useState(false);
    const [highlighted, setHighlighted] = React.useState(0);

    const formatPresetName = React.useCallback((name?: string): string => {
      if (!name) return '';
      // Work on a copy
      let s = name;
      // Title-case words while keeping small words lowercase unless first
      const smallWords = new Set(['and', 'or', 'of', 'the', 'in', 'for']);
      s = s.replace(/(^|[\s(/-])(\w+)/g, (m, sep, word, offset) => {
        const w = word.toLowerCase();
        if (offset > 0 && smallWords.has(w)) return sep + w; // keep small words lowercase
        // Preserve v followed by digits as lowercase (e.g., v4)
        if (/^v\d+$/.test(w)) return sep + w;
        return sep + w.charAt(0).toUpperCase() + w.slice(1);
      });
      // Uppercase known acronyms and tokens
      const replacements: Array<[RegExp, string]> = [
        [/\burl\b/gi, 'URL'],
        [/\bhttp\/https\b/gi, 'HTTP/HTTPS'],
        [/\biso\b/gi, 'ISO'],
        [/\buuid\b/gi, 'UUID'],
        [/\bus\b/gi, 'US'],
        [/\bzip\b/gi, 'ZIP'],
        // Date/time tokens inside or outside parentheses
        [/\byyyy\b/gi, 'YYYY'],
        [/\bmm\b/gi, 'MM'],
        [/\bdd\b/gi, 'DD'],
        [/\bhh\b/gi, 'HH'],
        [/\bss\b/gi, 'SS'],
      ];
      for (const [re, val] of replacements) s = s.replace(re, val);
      return s;
    }, []);

    React.useEffect(() => {
      let active = true;
      (async () => {
        try {
          const res = await fetch('/data/regex_presets.json');
          if (!res.ok) return;
          const data = await res.json();
          if (active && Array.isArray(data)) setPresets(data);
        } catch {}
      })();
      return () => {
        active = false;
      };
    }, []);

    const filtered = React.useMemo(() => {
      const q = inputValue.trim().toLowerCase();
      if (!q) return presets;
      return presets.filter(
        p => p.name.toLowerCase().includes(q) || p.regex.toLowerCase().includes(q),
      );
    }, [inputValue, presets]);

    useImperativeHandle(
      ref,
      () => ({
        applyPendingChanges: () => {
          const pendingPattern = inputValue.trim();
          if (!pendingPattern) return;
          if (editingIndex !== null) {
            onUpdate(editingIndex, pendingPattern);
            setEditingIndex(null);
          } else {
            onAdd(pendingPattern);
          }
          setInputValue('');
          setOpen(false);
        },
        getPendingChanges: () => {
          type Pending = {
            pendingPattern?: string | { regex: string; label?: string };
            pendingPatternEdit?: {
              index: number;
              pattern: string | { regex: string; label?: string };
            };
          };
          const val = inputValue.trim();
          if (!val) return {} as Pending;
          if (editingIndex !== null) {
            return { pendingPatternEdit: { index: editingIndex, pattern: val } } as Pending;
          }
          return { pendingPattern: val } as Pending;
        },
      }),
      [inputValue, editingIndex, onAdd, onUpdate],
    );

    const handleSubmit = () => {
      const val = inputValue.trim();
      if (!val) return;
      if (editingIndex !== null) {
        onUpdate(editingIndex, val);
        setEditingIndex(null);
      } else {
        onAdd(val);
      }
      setInputValue('');
      setOpen(false);
    };

    const addPreset = (idx: number) => {
      if (idx < 0 || idx >= filtered.length) return;
      const chosen = filtered[idx];
      if (editingIndex !== null) {
        onUpdate(editingIndex, { regex: chosen.regex, label: chosen.name });
        setEditingIndex(null);
      } else {
        onAdd({ regex: chosen.regex, label: chosen.name });
      }
      setInputValue('');
      setOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlighted(0);
        } else {
          setHighlighted(h => Math.min(h + 1, Math.max(0, filtered.length - 1)));
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (open) {
          setHighlighted(h => Math.max(h - 1, 0));
        }
      } else if (e.key === 'Enter') {
        if (open && filtered.length > 0) {
          e.preventDefault();
          addPreset(highlighted);
        } else if (inputValue.trim()) {
          e.preventDefault();
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue('');
        setOpen(false);
        setHighlighted(0);
        setEditingIndex(null);
      }
    };

    return (
      <Stack spacing={1}>
        {patterns.map((pattern, patternIndex) => (
          <Paper
            key={patternIndex}
            variant="outlined"
            draggable
            onDragStart={() => onDragStart(patternIndex)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(patternIndex)}
            sx={{
              p: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              opacity: isDragged(patternIndex) ? 0.5 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'grab' }} />

            <Box
              sx={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 1 }}
              onClick={() => {
                setEditingIndex(patternIndex);
                setInputValue(pattern.regex);
                setOpen(false);
              }}
            >
              <Chip
                label={`Priority ${pattern.priority}`}
                size="small"
                color="secondary"
                variant="outlined"
                sx={{
                  minWidth: 80,
                  '.MuiChip-label': {
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  },
                }}
              />
              {pattern.label && (
                <Chip
                  label={formatPresetName(pattern.label)}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{
                    maxWidth: 180,
                    '.MuiChip-label': {
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    },
                  }}
                  title={formatPresetName(pattern.label)}
                />
              )}
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  flex: 1,
                }}
                title={pattern.regex}
              >
                {pattern.regex}
              </Typography>
            </Box>
            <IconButton
              ariaLabel="Delete pattern"
              onClick={() => onDelete(patternIndex)}
              color="error"
            >
              <DeleteOutlineIcon />
            </IconButton>
          </Paper>
        ))}

        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Box>
            <Stack direction="row" spacing={1}>
              <TextInput
                label="Regex Pattern (search presets or type your own)"
                fullWidth
                value={inputValue}
                onChange={val => {
                  setInputValue(typeof val === 'string' ? val : val.target.value);
                  setOpen(true);
                  setHighlighted(0);
                }}
                onKeyDown={handleKeyDown}
              />
              {editingIndex !== null ? (
                <>
                  <TextButton size="medium" onClick={handleSubmit}>
                    Update
                  </TextButton>
                  <TextButton
                    size="medium"
                    onClick={() => {
                      setEditingIndex(null);
                      setInputValue('');
                      setOpen(false);
                    }}
                  >
                    Cancel
                  </TextButton>
                </>
              ) : (
                <TextButton size="medium" onClick={handleSubmit}>
                  Add
                </TextButton>
              )}
            </Stack>
            {open && filtered.length > 0 && (
              <Paper elevation={3} sx={{ mt: 0.5, maxHeight: 260, overflowY: 'auto' }}>
                <List dense disablePadding>
                  {filtered.map((p, idx) => (
                    <ListItemButton
                      key={`${p.name}-${idx}`}
                      selected={idx === highlighted}
                      onMouseEnter={() => setHighlighted(idx)}
                      onClick={() => addPreset(idx)}
                    >
                      <ListItemText
                        primary={formatPresetName(p.name)}
                        secondary={p.regex}
                        secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>
        </ClickAwayListener>
      </Stack>
    );
  },
);
