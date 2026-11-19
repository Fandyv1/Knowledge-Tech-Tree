import { createContext, useContext } from 'react';

export interface HighlightState {
  hoveredId: string | null;
  selectedId: string | null;
  /** 悬停节点自身 + 全部祖先 */
  highlightSet: Set<string>;
}

const EMPTY: HighlightState = {
  hoveredId: null,
  selectedId: null,
  highlightSet: new Set(),
};

export const HighlightContext = createContext<HighlightState>(EMPTY);

export const useHighlight = (): HighlightState => useContext(HighlightContext);
