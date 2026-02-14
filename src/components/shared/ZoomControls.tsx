'use client';

import { useReactFlow } from '@xyflow/react';
import { useCallback } from 'react';

export default function ZoomControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
  const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
  const handleFitView = useCallback(() => fitView(), [fitView]);

  return (
    <div className="zoom-controls">
      <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
        +
      </button>
      <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
        −
      </button>
      <button className="zoom-btn" onClick={handleFitView} title="Fit View">
        ⊞
      </button>
    </div>
  );
}
