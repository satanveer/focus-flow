import React from 'react';

/** Utility component to visually hide content while keeping it accessible to screen readers. */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    position:'absolute',
    width:1,
    height:1,
    padding:0,
    margin:-1,
    overflow:'hidden',
    clip:'rect(0 0 0 0)',
    whiteSpace:'nowrap',
    border:0
  }}>{children}</span>
);

export default VisuallyHidden;