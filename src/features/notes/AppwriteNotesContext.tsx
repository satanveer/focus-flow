import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { useAuth } from '../../contexts/AuthContext';
import type { Folder, Note, ID } from '../../domain/models';
import { Query } from 'appwrite';

interface NotesContextValue {
  folders: Folder[];
  notes: Note[];
  loading: boolean;
  createFolder(name: string, parentId: ID | null): Promise<Folder>;
  renameFolder(id: ID, name: string): Promise<void>;
  deleteFolder(id: ID): Promise<boolean>; // returns false if not empty
  createNote(title: string, folderId: ID | null, body?: string, taskId?: ID): Promise<Note>;
  updateNote(id: ID, patch: Partial<Pick<Note,'title'|'body'|'folderId'|'taskId'>>): Promise<void>;
  deleteNote(id: ID): Promise<void>;
  moveNote(id: ID, folderId: ID | null): Promise<void>;
  getFolderChildren(parentId: ID | null): Folder[];
  getNotesInFolder(folderId: ID | null): Note[];
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const notesCollectionId = import.meta.env.VITE_APPWRITE_NOTES_COLLECTION_ID;
const foldersCollectionId = import.meta.env.VITE_APPWRITE_FOLDERS_COLLECTION_ID;

export const AppwriteNotesProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Appwrite
  useEffect(() => {
    if (!user) {
      setFolders([]);
      setNotes([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load folders
        const foldersResponse = await databases.listDocuments(
          databaseId,
          foldersCollectionId,
          [Query.equal('userId', user.$id)]
        );
        
        const loadedFolders: Folder[] = foldersResponse.documents.map(doc => ({
          id: doc.$id,
          name: doc.name,
          parentId: doc.parentId || null,
          createdAt: doc.$createdAt,
        }));
        
        // Load notes
        const notesResponse = await databases.listDocuments(
          databaseId,
          notesCollectionId,
          [Query.equal('userId', user.$id), Query.limit(1000)]
        );
        
        const loadedNotes: Note[] = notesResponse.documents.map(doc => ({
          id: doc.$id,
          title: doc.title,
          body: doc.body || '',
          folderId: doc.folderId || null,
          taskId: doc.taskId || null,
          createdAt: doc.$createdAt,
          updatedAt: doc.$updatedAt,
        }));
        
        setFolders(loadedFolders);
        setNotes(loadedNotes);
      } catch (error) {
        console.error('Failed to load notes and folders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const createFolder = useCallback(async (name: string, parentId: ID | null): Promise<Folder> => {
    if (!user) throw new Error('User not authenticated');

    const folderData = {
      name: name.trim() || 'Untitled',
      parentId: parentId || null,
      userId: user.$id,
    };

    const doc = await databases.createDocument(
      databaseId,
      foldersCollectionId,
      'unique()',
      folderData
    );

    const folder: Folder = {
      id: doc.$id,
      name: doc.name,
      parentId: doc.parentId || null,
      createdAt: doc.$createdAt,
    };

    setFolders(prev => [...prev, folder]);
    return folder;
  }, [user]);

  const renameFolder = useCallback(async (id: ID, name: string) => {
    if (!user) throw new Error('User not authenticated');

    await databases.updateDocument(
      databaseId,
      foldersCollectionId,
      id,
      { name: name.trim() }
    );

    setFolders(prev => prev.map(f => f.id === id ? {...f, name: name.trim()} : f));
  }, [user]);

  const deleteFolder = useCallback(async (id: ID): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');

    // Check if folder has children or notes
    const hasChildren = folders.some(f => f.parentId === id) || notes.some(n => n.folderId === id);
    if (hasChildren) return false;

    await databases.deleteDocument(databaseId, foldersCollectionId, id);
    setFolders(prev => prev.filter(f => f.id !== id));
    return true;
  }, [user, folders, notes]);

  const createNote = useCallback(async (title: string, folderId: ID | null, body = '', taskId?: ID): Promise<Note> => {
    if (!user) throw new Error('User not authenticated');

    const noteData = {
      title: title.trim() || 'Untitled',
      body: body,
      folderId: folderId || null,
      taskId: taskId || null,
      userId: user.$id,
    };

    const doc = await databases.createDocument(
      databaseId,
      notesCollectionId,
      'unique()',
      noteData
    );

    const note: Note = {
      id: doc.$id,
      title: doc.title,
      body: doc.body || '',
      folderId: doc.folderId || null,
      taskId: doc.taskId || null,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    };

    setNotes(prev => [...prev, note]);
    return note;
  }, [user]);

  const updateNote = useCallback(async (id: ID, patch: Partial<Pick<Note,'title'|'body'|'folderId'|'taskId'>>) => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (patch.title !== undefined) updateData.title = patch.title;
    if (patch.body !== undefined) updateData.body = patch.body;
    if (patch.folderId !== undefined) updateData.folderId = patch.folderId || null;
    if (patch.taskId !== undefined) updateData.taskId = patch.taskId || null;

    await databases.updateDocument(
      databaseId,
      notesCollectionId,
      id,
      updateData
    );

    setNotes(prev => prev.map(n => n.id === id ? {...n, ...patch, updatedAt: new Date().toISOString()} : n));
  }, [user]);

  const deleteNote = useCallback(async (id: ID) => {
    if (!user) throw new Error('User not authenticated');

    await databases.deleteDocument(databaseId, notesCollectionId, id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }, [user]);

  const moveNote = useCallback(async (id: ID, folderId: ID | null) => {
    if (!user) throw new Error('User not authenticated');

    await databases.updateDocument(
      databaseId,
      notesCollectionId,
      id,
      { folderId: folderId || null }
    );

    setNotes(prev => prev.map(n => n.id === id ? {...n, folderId, updatedAt: new Date().toISOString()} : n));
  }, [user]);

  const getFolderChildren = useCallback((parentId: ID | null) => 
    folders.filter(f => f.parentId === parentId), [folders]);
  
  const getNotesInFolder = useCallback((folderId: ID | null) => 
    notes.filter(n => n.folderId === folderId), [notes]);

  const value: NotesContextValue = {
    folders,
    notes,
    loading,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    moveNote,
    getFolderChildren,
    getNotesInFolder,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export function useAppwriteNotes(){
  const ctx = useContext(NotesContext);
  if(!ctx) throw new Error('useAppwriteNotes must be inside AppwriteNotesProvider');
  return ctx;
}
