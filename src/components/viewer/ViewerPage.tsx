import { Box } from '@mui/material';
import React from 'react';
import type { CSSProperties } from 'react';

import {
  VIEWER_SVG_HOST_SX,
  VIEWER_SVG_TRANSFORM_SX,
} from '../../styles/viewerStyles';
import type { BoundingBox } from '../../types/mapping';

interface ViewerPageProps {
    pageContent: string;
    pageIndex: number;
    pageWidth: number;
    pageHeight: number;
    scale: number;
    isDragging: boolean;
    showOverlays: boolean;
    pageBoxes: BoundingBox[];
    focusedInputLinkedBoxIds: Set<string>;
    selectionRectStyle?: CSSProperties;
    isFirstPage: boolean;
    isLastLoadedPage: boolean;
    svgRef?: React.RefObject<HTMLDivElement>;
    getBoundingBoxStyle: (boundingBox: BoundingBox) => CSSProperties;
    onFieldDragStart: (e: React.DragEvent, boundingBox: BoundingBox) => void;
    onFieldSelection: (fieldId: string, event: React.MouseEvent) => void;
}

export const ViewerPage: React.FC<ViewerPageProps> = ({
    pageContent,
    pageIndex,
    pageWidth,
    pageHeight,
    scale,
    isDragging,
    showOverlays,
    pageBoxes,
    focusedInputLinkedBoxIds,
    selectionRectStyle,
    isFirstPage,
    isLastLoadedPage,
    svgRef,
    getBoundingBoxStyle,
    onFieldDragStart,
    onFieldSelection
}) => {
    return (
        <Box key={pageIndex} data-page-index={pageIndex}>
            <Box 
                ref={isFirstPage ? svgRef : undefined}
                data-svg-container
                sx={{
                    ...VIEWER_SVG_HOST_SX(pageWidth * scale, pageHeight * scale),
                }}
            >
                <Box sx={VIEWER_SVG_TRANSFORM_SX(pageWidth || 'auto', pageHeight || 'auto', scale, isDragging)}>
                    <div dangerouslySetInnerHTML={{ __html: pageContent }} />
                    {showOverlays && pageBoxes.map((boundingBox) => {
                        const style = getBoundingBoxStyle(boundingBox);
                        const isFocusedLinked = !!(boundingBox.id && focusedInputLinkedBoxIds.has(boundingBox.id));
                        return (
                            <Box
                                key={boundingBox.fieldId}
                                data-field-id={boundingBox.fieldId}
                                data-box-id={boundingBox.id}
                                data-focused-linked={isFocusedLinked ? 'true' : undefined}
                                draggable
                                onDragStart={(e) => onFieldDragStart(e, boundingBox)}
                                title={boundingBox.fieldText}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                }}
                                onClick={(e) => onFieldSelection(boundingBox.fieldId, e)}
                                style={style}
                            />
                        );
                    })}
                    {selectionRectStyle && <Box style={selectionRectStyle} />}
                </Box>
            </Box>
            {!isLastLoadedPage && (
                <Box sx={{ 
                    width: '100%', 
                    height: '1px', 
                    backgroundColor: 'divider',
                    my: 2
                }} />
            )}
        </Box>
    );
};
