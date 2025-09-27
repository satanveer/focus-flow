import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import type { Folder, Note, ID } from '../../domain/models';

interface NotesContextValue {
  folders: Folder[];
  notes: Note[];
  createFolder(name: string, parentId: ID | null): Folder;
  renameFolder(id: ID, name: string): void;
  deleteFolder(id: ID): boolean; // returns false if not empty
  createNote(title: string, folderId: ID | null, body?: string, taskId?: ID): Note;
  updateNote(id: ID, patch: Partial<Pick<Note,'title'|'body'|'folderId'|'taskId'>>): void;
  deleteNote(id: ID): void;
  moveNote(id: ID, folderId: ID | null): void;
  getFolderChildren(parentId: ID | null): Folder[];
  getNotesInFolder(folderId: ID | null): Note[];
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

const LS_KEY = 'ff.notes.v1';

interface PersistShape { folders: Folder[]; notes: Note[]; }

function nowISO(){ return new Date().toISOString(); }
function uuid(){ return Math.random().toString(36).slice(2,10); }

export const NotesProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // load
  useEffect(()=> {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if(raw){
        const parsed: PersistShape = JSON.parse(raw);
        setFolders(parsed.folders||[]);
        setNotes(parsed.notes||[]);
      }
    } catch {}
  }, []);

  // persist
  useEffect(()=> {
    const data: PersistShape = {folders, notes};
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
  }, [folders, notes]);

  const createFolder = useCallback((name: string, parentId: ID | null): Folder => {
    const f: Folder = { id: uuid(), name: name.trim()||'Untitled', parentId, createdAt: nowISO() };
    setFolders(prev => [...prev, f]);
    return f;
  }, []);

  const renameFolder = useCallback((id: ID, name: string) => {
    setFolders(prev => prev.map(f => f.id===id? {...f, name: name.trim()||f.name}: f));
  }, []);

  const deleteFolder = useCallback((id: ID): boolean => {
    const hasChildren = folders.some(f=> f.parentId===id) || notes.some(n=> n.folderId===id);
    if(hasChildren) return false;
    setFolders(prev => prev.filter(f=> f.id!==id));
    return true;
  }, [folders, notes]);

  const createNote = useCallback((title: string, folderId: ID | null, body = '', taskId?: ID): Note => {
    const n: Note = { id: uuid(), title: title.trim()||'Untitled', body, folderId, taskId, createdAt: nowISO(), updatedAt: nowISO() };
    setNotes(prev => [...prev, n]);
    return n;
  }, []);

  const updateNote = useCallback((id: ID, patch: Partial<Pick<Note,'title'|'body'|'folderId'|'taskId'>>) => {
    setNotes(prev => prev.map(n => n.id===id? {...n, ...patch, updatedAt: nowISO() }: n));
  }, []);

  const deleteNote = useCallback((id: ID) => {
    setNotes(prev => prev.filter(n => n.id!==id));
  }, []);

  const moveNote = useCallback((id: ID, folderId: ID | null) => {
    setNotes(prev => prev.map(n => n.id===id? {...n, folderId, updatedAt: nowISO() }: n));
  }, []);

  const getFolderChildren = useCallback((parentId: ID | null) => folders.filter(f=> f.parentId===parentId), [folders]);
  const getNotesInFolder = useCallback((folderId: ID | null) => notes.filter(n=> n.folderId===folderId), [notes]);

  const value: NotesContextValue = {
    folders, notes,
    createFolder, renameFolder, deleteFolder,
    createNote, updateNote, deleteNote, moveNote,
    getFolderChildren, getNotesInFolder,
  };
  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export function useNotes(){
  const ctx = useContext(NotesContext);
  if(!ctx) throw new Error('useNotes must be inside NotesProvider');
  return ctx;
}
