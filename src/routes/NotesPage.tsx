import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotes } from '../features/notes/NotesContext';
import { useTasksContext } from '../features/tasks/TasksContext';

const FolderIcon: React.FC<{open?: boolean}> = ({open}) => <span style={{marginRight:4}}>{open? '📂':'📁'}</span>;

export default function NotesPage(){
  const { folders, notes, createFolder, renameFolder, deleteFolder, createNote, updateNote, deleteNote, moveNote, getFolderChildren, getNotesInFolder } = useNotes();
  const { tasks } = useTasksContext();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [filterTaskId, setFilterTaskId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [panelWidths, setPanelWidths] = useState<[number, number]>([260, 340]); // folder, list
  const dragRef = useRef<{idx:number; startX:number; startWidths:[number, number]} | null>(null);
  const [searchParams] = useSearchParams();
  const noteParam = searchParams.get('note');
  useEffect(()=> { if(noteParam && notes.some(n=> n.id===noteParam)) setActiveNoteId(noteParam); }, [noteParam, notes]);

  const notesInFolder = getNotesInFolder(activeFolder)
    .filter(n => !filterTaskId || n.taskId === filterTaskId)
    .filter(n => !search || (n.title + ' ' + n.body).toLowerCase().includes(search.toLowerCase()));

  // Helper: extract latest reflection status lines from note body
  function extractReflections(body: string){
    // Lines we create look like: "🟢 Great focus — Sep 27 2025 16:13"
    return body.split(/\n+/).filter(l => /^([🟢🟡🔴])\s.+—\s/.test(l)).slice(-3);
  }
  function extractAllReflections(body: string){
    return body.split(/\n+/).filter(l => /^([🟢🟡🔴])\s.+—\s/.test(l));
  }
  const activeNote = notes.find(n=> n.id===activeNoteId) || null;

  function toggleFolder(id: string){
    setExpanded(prev => { const n = new Set(prev); n.has(id)? n.delete(id): n.add(id); return n; });
  }

  function handleCreateFolder(parentId: string | null){
    const name = prompt('Folder name?');
    if(!name) return;
    createFolder(name, parentId);
  }

  function handleRenameFolder(id: string){
    const f = folders.find(f=> f.id===id); if(!f) return;
    const name = prompt('Rename folder', f.name); if(!name) return;
    renameFolder(id, name);
  }

  function handleDeleteFolder(id: string){
    const ok = confirm('Delete folder? Must be empty.');
    if(!ok) return;
    const success = deleteFolder(id);
    if(!success) alert('Folder not empty. Move or delete its contents first.');
  }

  function handleCreateNote(){
    const title = prompt('Note title?') || 'Untitled';
    const n = createNote(title, activeFolder, '');
    setActiveNoteId(n.id);
  }

  function handleTaskLink(noteId: string, taskId: string){
    updateNote(noteId, { taskId: taskId || undefined });
  }

  function FolderNode({id, depth}:{id:string; depth:number}){
    const folder = folders.find(f=> f.id===id)!;
    const children = getFolderChildren(id);
    const childNotes = getNotesInFolder(id);
    const isOpen = expanded.has(id);
    const totalNotes = childNotes.length + children.reduce((a,c)=> a + getNotesInFolder(c.id).length,0);
    return (
      <div style={{marginLeft: depth*6}}>
        <div className="ff-row" style={{alignItems:'center', gap:4, justifyContent:'space-between'}}>
          <button aria-expanded={isOpen} onClick={()=> toggleFolder(id)} className="btn subtle" style={{fontSize:'.55rem', flex:1, justifyContent:'flex-start'}}><FolderIcon open={isOpen}/> {folder.name} <span style={{marginLeft:'auto', fontSize:'.45rem', background:'var(--surface)', border:'1px solid var(--border)', padding:'0 .35rem', borderRadius:999}}>{totalNotes}</span></button>
          <div className="ff-row" style={{gap:2}}>
            <button className="btn outline" style={{fontSize:'.5rem'}} onClick={()=> handleCreateFolder(id)} aria-label="Add subfolder">＋</button>
            <button className="btn outline" style={{fontSize:'.5rem'}} onClick={()=> handleRenameFolder(id)} aria-label="Rename folder">✎</button>
            <button className="btn outline" style={{fontSize:'.5rem'}} onClick={()=> handleDeleteFolder(id)} aria-label="Delete folder">🗑</button>
          </div>
        </div>
        {isOpen && (
          <div className="ff-stack" style={{marginTop:4, gap:4}}>
            {children.map(ch => <FolderNode key={ch.id} id={ch.id} depth={depth+1} />)}
            {childNotes.map(n => (
              <button key={n.id} onClick={()=> {setActiveNoteId(n.id); setActiveFolder(id);} } className={`btn subtle ${n.id===activeNoteId? 'primary':''}`} style={{fontSize:'.5rem', justifyContent:'flex-start'}}>
                📝 {n.title || 'Untitled'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const rootFolders = useMemo(()=> getFolderChildren(null), [folders, getFolderChildren]);

  // Drag resizing for panels
  function startDrag(e: React.MouseEvent, idx:number){
  dragRef.current = {idx, startX: e.clientX, startWidths: [...panelWidths] as [number,number]};
    window.addEventListener('mousemove', onDrag as any);
    window.addEventListener('mouseup', endDrag as any);
  }
  function onDrag(e: MouseEvent){
    if(!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    const [fw, lw] = dragRef.current.startWidths;
    if(dragRef.current.idx===0){
      const next = Math.min(420, Math.max(180, fw + delta));
      setPanelWidths([next, lw]);
    } else {
      const next = Math.min(500, Math.max(260, lw + delta));
      setPanelWidths([fw, next]);
    }
  }
  function endDrag(){
    window.removeEventListener('mousemove', onDrag as any);
    window.removeEventListener('mouseup', endDrag as any);
  dragRef.current = null;
  }

  return (
    <div className="ff-row" style={{alignItems:'stretch', gap:0, position:'relative', height:'calc(100dvh - 130px)'}} aria-label="Notes workspace">
      {/* Folders Panel */}
      <aside style={{width:panelWidths[0], minWidth:180, maxWidth:420, display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)', background:'var(--surface)', backdropFilter:'blur(6px)'}} aria-label="Folders panel">
        <div style={{padding:'.6rem .75rem', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)'}}>
          <h2 style={{fontSize:'.65rem', letterSpacing:'.15em', textTransform:'uppercase', margin:0}}>Folders</h2>
          <button className="btn primary" style={{fontSize:'.55rem'}} onClick={()=> handleCreateFolder(null)}>＋</button>
        </div>
        <div style={{padding:'.5rem .6rem', borderBottom:'1px solid var(--border)'}}>
          <input placeholder="Search..." value={search} onChange={e=> setSearch(e.target.value)} aria-label="Search notes" style={{width:'100%', fontSize:'.55rem', padding:'.4rem .55rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--bg-alt)'}} />
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'.5rem .4rem 1rem'}} className="ff-stack" aria-label="Folder tree">
          {rootFolders.map(f => <FolderNode key={f.id} id={f.id} depth={0} />)}
          <div className="ff-stack" style={{gap:4, marginTop:8}}>
            <h3 style={{fontSize:'.55rem', margin:'4px 0', textTransform:'uppercase', letterSpacing:'.08em', color:'var(--text-muted)'}}>Root Notes</h3>
            {getNotesInFolder(null).filter(n=> !search || (n.title+' '+n.body).toLowerCase().includes(search.toLowerCase())).map(n => (
              <button key={n.id} onClick={()=> {setActiveNoteId(n.id); setActiveFolder(null);} } className={`btn subtle ${n.id===activeNoteId? 'primary':''}`} style={{fontSize:'.5rem', justifyContent:'flex-start'}}>
                📝 {n.title||'Untitled'}
              </button>
            ))}
          </div>
        </div>
      </aside>
      <div onMouseDown={e=> startDrag(e,0)} style={{cursor:'col-resize', width:4, background:'linear-gradient(to right, transparent, var(--border), transparent)'}} aria-hidden="true" />
      {/* Notes List Panel */}
      <section style={{width:panelWidths[1], minWidth:260, maxWidth:500, display:'flex', flexDirection:'column', borderRight:'1px solid var(--border)', background:'var(--surface-elev)'}} aria-label="Notes list">
        <div style={{padding:'.6rem .75rem', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <h2 style={{fontSize:'.65rem', letterSpacing:'.15em', textTransform:'uppercase', margin:0}}>Notes</h2>
            <select value={filterTaskId} onChange={e=> setFilterTaskId(e.target.value)} style={{fontSize:'.55rem'}} aria-label="Filter notes by task">
              <option value="">All tasks</option>
              {tasks.map(t=> <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <button className="btn primary" style={{fontSize:'.55rem'}} onClick={handleCreateNote}>New</button>
        </div>
        <div style={{flex:1, overflowY:'auto'}}>
          {notesInFolder.length===0 && <div style={{padding:'.75rem', fontSize:'.55rem', color:'var(--text-muted)'}}>No notes match.</div>}
          <ul style={{listStyle:'none', margin:0, padding:'.5rem', display:'flex', flexDirection:'column', gap:6}}>
            {notesInFolder.map(n => {
              const refl = extractReflections(n.body);
              return (
                <li key={n.id}>
                  <button onClick={()=> setActiveNoteId(n.id)} className={`btn subtle ${n.id===activeNoteId? 'primary':''}`} style={{width:'100%', textAlign:'left', display:'flex', flexDirection:'column', alignItems:'stretch', gap:4, padding:'.55rem .65rem'}}>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      <span style={{fontSize:'.75rem'}}>{n.taskId? '🔗':'📝'}</span>
                      <span style={{fontWeight:600, fontSize:'.6rem', letterSpacing:'.03em', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.title||'Untitled'}</span>
                      {refl.length>0 && <span style={{fontSize:'.45rem', background:'var(--accent)', color:'var(--accent-foreground)', padding:'.15rem .4rem', borderRadius:999}}>{refl.length}</span>}
                    </div>
                    {refl.length>0 && (
                      <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                        {refl.slice().reverse().map((line,i)=> {
                          const emoji = line.trim().charAt(0);
                          const color = emoji==='🟢' ? 'var(--success)' : emoji==='🟡' ? 'var(--warning)' : 'var(--danger)';
                          return <span key={i} style={{fontSize:'.45rem', background:color, color:'#000', padding:'.15rem .3rem', borderRadius:4, fontWeight:600}}>{emoji}</span>;
                        })}
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      <div onMouseDown={e=> startDrag(e,1)} style={{cursor:'col-resize', width:4, background:'linear-gradient(to right, transparent, var(--border), transparent)'}} aria-hidden="true" />
      {/* Editor Panel */}
      <section style={{flex:1, display:'flex', flexDirection:'column'}} aria-label="Editor panel">
        {!activeNote && <div style={{padding:'2rem 1.5rem', fontSize:'.7rem', color:'var(--text-muted)'}}>Select or create a note to begin.</div>}
        {activeNote && (
          <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
            <div style={{padding:'.75rem .9rem', borderBottom:'1px solid var(--border)', display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', background:'var(--surface-elev)', backdropFilter:'blur(4px)'}}>
              <input value={activeNote.title} onChange={e=> updateNote(activeNote.id, {title:e.target.value})} style={{fontSize:'.85rem', fontWeight:600, flex:'1 1 auto', minWidth:180}} aria-label="Note title" />
              <select value={activeNote.taskId||''} onChange={e=> handleTaskLink(activeNote.id, e.target.value)} aria-label="Link note to task" style={{fontSize:'.55rem'}}>
                <option value="">(No task)</option>
                {tasks.map(t=> <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <select value={activeNote.folderId||''} onChange={e=> moveNote(activeNote.id, e.target.value||null)} aria-label="Move note to folder" style={{fontSize:'.55rem'}}>
                <option value="">(Root)</option>
                {folders.map(f=> <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button className="btn danger" style={{fontSize:'.55rem'}} onClick={()=> { if(confirm('Delete note?')) { deleteNote(activeNote.id); setActiveNoteId(null);} }}>Delete</button>
            </div>
            {/* Reflection history */}
            {(() => {
              const all = extractAllReflections(activeNote.body);
              if(all.length===0) return null;
              return (
                <div style={{padding:'.65rem .9rem', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:4, background:'var(--surface)'}}>
                  <div style={{fontSize:'.55rem', letterSpacing:'.08em', textTransform:'uppercase', color:'var(--text-muted)', fontWeight:600}}>Reflection History</div>
                  <div style={{display:'flex', flexDirection:'column', gap:4, maxHeight:140, overflowY:'auto'}}>
                    {all.slice(-30).reverse().map((line,i)=> {
                      const emoji = line.trim().charAt(0);
                      const color = emoji==='🟢' ? 'var(--success)' : emoji==='🟡' ? 'var(--warning)' : 'var(--danger)';
                      return (
                        <div key={i} style={{display:'flex', alignItems:'center', gap:8, background:'var(--bg-alt)', border:'1px solid var(--border)', padding:'.35rem .55rem', borderRadius:6, fontSize:'.55rem'}}>
                          <span style={{fontSize:'.75rem'}}>{emoji}</span>
                          <span style={{flex:1}}>{line.replace(/^([🟢🟡🔴])\s*/, '')}</span>
                          <span style={{width:6, height:6, borderRadius:999, background:color}} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div style={{flex:1, display:'flex'}}>
              <textarea value={activeNote.body} onChange={e=> updateNote(activeNote.id, {body:e.target.value})} aria-label="Note body" style={{flex:1, padding:'1rem .9rem', border:'none', outline:'none', background:'var(--bg)', fontSize:'.7rem', fontFamily:'inherit', lineHeight:1.5, resize:'none'}} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}