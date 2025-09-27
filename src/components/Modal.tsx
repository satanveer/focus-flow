import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<ModalProps> = ({ open, title, description, onClose, children, actions, width = 380 }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="modal-root" style={{position:'fixed', inset:0, zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem'}}>
      <div onClick={onClose} style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)'}} />
      <div ref={ref} style={{position:'relative', width:'100%', maxWidth:width, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'var(--shadow-md)', padding:'1rem 1.1rem 1.1rem', display:'flex', flexDirection:'column', gap:'0.85rem'}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:'0.75rem'}}>
          <div style={{flex:1}}>
            {title && <h2 style={{margin:0, fontSize:'.9rem', fontWeight:600}}>{title}</h2>}
            {description && <p style={{margin:'0.35rem 0 0', fontSize:'.65rem', lineHeight:1.4, color:'var(--text-muted)'}}>{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="btn subtle" style={{fontSize:'.65rem', padding:'.35rem .55rem'}}>
            ✕
          </button>
        </div>
        {children && <div style={{fontSize:'.65rem', lineHeight:1.5}}>{children}</div>}
        {actions && <div style={{display:'flex', justifyContent:'flex-end', gap:'.5rem'}}>{actions}</div>}
      </div>
    </div>
  );
};
