export type SelectionModel = { selectedIds: string[] };

export function createSelectionModel(): SelectionModel {
  return { selectedIds: [] };
}

export function addToSelection(model: SelectionModel, id: string) {
  if (!model.selectedIds.includes(id)) model.selectedIds.push(id);
}

export function removeFromSelection(model: SelectionModel, id: string) {
  model.selectedIds = model.selectedIds.filter(i => i !== id);
}
