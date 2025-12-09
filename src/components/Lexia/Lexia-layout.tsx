"use client";

import { useState, useEffect } from 'react';
import type { Document, Message } from '../../lib/types';
import { DocumentPane } from '@/components/Lexia/document-pane';
import { ChatPane } from '@/components/Lexia/chat-pane';

export default function DocuChatLayout() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');


  type ServerDoc = { doc_id: string; title: string };
  type DocumentsResponse = { ok: boolean; files: ServerDoc[] };

  type UiDoc = {
    id?: string;
    name: string;
    status?: 'ready' | 'uploading' | 'error';
    progress?: number;
    content?: string;
  };
  useEffect(() => {
  let cancelled = false;
  const fetchExistingDocuments = async () => {
    try {
      // const response = {count:2, files:["rajat.pdf", "gupta.pdf"]};
      const response = await fetch('http://172.20.10.4:8000/documents');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: DocumentsResponse = await response.json();
      // const data: any = response;

      // console.log(data);
      const docs = Array.isArray(data?.files) ? data.files : [];

      const existingDocs: any = data.files.map((fl:any)=>{
        return {name:fl};
      });
      // const existingDocs: UiDoc[] = docs.map(d => ({
      //   id: d.doc_id,                 // use stable backend id
      //   name: d.title || d.doc_id,    // fallback if title missing
      //   status: 'ready',
      //   progress: 100,
      //   content: '',
      // }));

      if (!cancelled) {
        // If you want to preserve any in-flight uploads, merge by id:
        setDocuments(prev => {
          // const byId = new Map(prev.map(p => [p.id, p]));
          // for (const doc of existingDocs) byId.set(doc.id, { ...(byId.get(doc.id) ?? doc), ...doc });
          // return Array.from(byId.values());
          return existingDocs;
        });
      }
    } catch (error) {
      console.error('Error fetching existing documents:', error);
    }
  };

  fetchExistingDocuments();
  return () => { cancelled = true; };
}, [setDocuments]);


  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  type Document = {
  id?: string;
  name: string;
  content?: string;
  status?: 'uploading' | 'ingesting' | 'ready' | 'error';
  progress?: number;
};

const fileExists = (name: string) => {
  return documents.some(doc => doc.name.toLowerCase() === name.toLowerCase());
};


const handleFileUpload = async (file: File) => {
  if (fileExists(file.name)) {
    console.warn("Duplicate file skipped:", file.name);
    return;
  }

  const id = crypto.randomUUID();
  const newDoc: Document = {
    id,
    name: file.name,
    content: '',
    status: 'uploading',
    progress: 0,
  };
  setDocuments(prev => [...prev, newDoc]);

  const formData = new FormData();
  formData.append('file', file);

  let progressInterval: number | undefined;

  try {
    // Simulated progress while uploading
    progressInterval = window.setInterval(() => {
      setDocuments(prev =>
        prev.map(d =>
          d.id === id ? { ...d, progress: Math.min(d?.progress??0 + 10, 90) } : d
        )
      );
    }, 200);
    // --- /upload ---
    const uploadRes = await fetch('http://172.20.10.4:8000/ingest', {
      method: 'POST',
      body: formData,
    });

    let uploadJson: any = null;
    try {
      uploadJson = await uploadRes.json();
    } catch {
      /* no-op */
    }

    if (!uploadRes.ok) {
      const detail = uploadJson?.fileName || uploadJson?.message || `HTTP ${uploadRes.status}`;
      throw new Error(`Upload failed: ${detail}`);
    }

    const serverFilename: string = uploadJson?.filename ?? file.name;

    // Move to ingesting
    if (progressInterval) window.clearInterval(progressInterval);
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'ingesting', progress: 95, name: serverFilename } : d))
    );

    // --- /ingest ---
    const ingestRes = await fetch('http://172.20.10.4:8000/ingest', { method: 'POST' });

    let ingestJson: any = null;
    try {
      ingestJson = await ingestRes.json();
    } catch {
      /* no-op */
    }

    if (!ingestRes.ok) {
      const detail = ingestJson?.detail || ingestJson?.error || `HTTP ${ingestRes.status}`;
      throw new Error(`Ingest failed: ${detail}`);
    }

    const ingested: string[] = Array.isArray(ingestJson?.ingested_files) ? ingestJson.ingested_files : [];
    // Determine this file’s ingest result
    const thisEntry = ingested.find(n => n.startsWith(serverFilename));
    const failed = thisEntry?.includes('(FAILED:');

    if (failed || !thisEntry) {
      // Mark error for this file
      setDocuments(prev =>
        prev.map(d => (d.id === id ? { ...d, status: 'error', progress: 0 } : d))
      );
      return;
    }

    // Success -> mark ready
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, content: '', status: 'ready', progress: 100 } : d))
    );

    }  catch (err) {
    console.error('Error uploading or ingesting:', err);
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'error', progress: 0 } : d))
    );
  } finally {
    if (progressInterval) window.clearInterval(progressInterval);
  }
};
const handleAudioFileUpload = async (file: File) => {
  // 🛑 Prevent duplicates
  if (fileExists(file.name)) {
    console.warn("Duplicate audio file skipped:", file.name);
    return;
  }
  const id = crypto.randomUUID();
  const newDoc: Document = {
    id,
    name: file.name,
    content: '',
    status: 'uploading',
    progress: 0,
  };
  setDocuments(prev => [...prev, newDoc]);

  const formData = new FormData();
  formData.append('file', file);

  let progressInterval: number | undefined;

  try {
    // Simulated progress while uploading
    progressInterval = window.setInterval(() => {
      setDocuments(prev =>
        prev.map(d =>
          d.id === id ? { ...d, progress: Math.min(d?.progress??0 + 10, 90) } : d
        )
      );
    }, 200);

    // --- /upload ---
    const uploadRes = await fetch('http://172.20.10.4:8000/ingest/audio', {
      method: 'POST',
      body: formData,
    });

    let uploadJson: any = null;

    try {
      uploadJson = await uploadRes.json();
    } catch {
      /* no-op */
    }

    if (!uploadRes.ok) {
      const detail = uploadJson?.fileName || uploadJson?.message || `HTTP ${uploadRes.status}`;
      throw new Error(`Upload failed: ${detail}`);
    }

    const serverFilename: string = uploadJson?.filename ?? file.name;

    // Move to ingesting
    if (progressInterval) window.clearInterval(progressInterval);
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'ingesting', progress: 95, name: serverFilename } : d))
    );

  //   // --- /ingest ---
  //   const ingestRes = await fetch('http://172.20.10.4:8000/ingest', { method: 'POST' });

  //   let ingestJson: any = null;
  //   try {
  //     ingestJson = await ingestRes.json();
  //   } catch {
  //     /* no-op */
  //   }

  //   if (!ingestRes.ok) {
  //     const detail = ingestJson?.detail || ingestJson?.error || `HTTP ${ingestRes.status}`;
  //     throw new Error(`Ingest failed: ${detail}`);
  //   }

  //   const ingested: string[] = Array.isArray(ingestJson?.ingested_files) ? ingestJson.ingested_files : [];
  //   // Determine this file’s ingest result
  //   const thisEntry = ingested.find(n => n.startsWith(serverFilename));
  //   const failed = thisEntry?.includes('(FAILED:');

  //   if (failed || !thisEntry) {
  //     // Mark error for this file
  //     setDocuments(prev =>
  //       prev.map(d => (d.id === id ? { ...d, status: 'error', progress: 0 } : d))
  //     );
  //     return;
  //   }

  //   // Success -> mark ready
  //   setDocuments(prev =>
  //     prev.map(d => (d.id === id ? { ...d, content: '', status: 'ready', progress: 100 } : d))
  //   );

    }  catch (err) {
    console.error('Error uploading or ingesting:', err);
    setDocuments(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'error', progress: 0 } : d))
    );
  } finally {
    if (progressInterval) window.clearInterval(progressInterval);
  }
};



const handleImageFileUpload = async (file: File) => {
    // 🛑 Prevent duplicates
    if (fileExists(file.name)) {
      console.warn("Duplicate image file skipped:", file.name);
      return;
    }
    const id = crypto.randomUUID();
    const newDoc: Document = {
      id,
      name: file.name,
      content: '',
      status: 'uploading',
      progress: 0,
    };
    setDocuments(prev => [...prev, newDoc]);

    const formData = new FormData();
    formData.append('file', file);

    let progressInterval: number | undefined;

    try {
      // Simulated progress
      progressInterval = window.setInterval(() => {
        setDocuments(prev =>
          prev.map(d =>
            d.id === id ? { ...d, progress: Math.min((d?.progress ?? 0) + 10, 90) } : d
          )
        );
      }, 200);

      // --- HIT THE IMAGE ENDPOINT ---
      const uploadRes = await fetch('http://172.20.10.4:8000/ingest/image', {
        method: 'POST',
        body: formData,
      });

      let uploadJson: any = null;
      try {
        uploadJson = await uploadRes.json();
      } catch { /* no-op */ }

      if (!uploadRes.ok) {
        const detail = uploadJson?.fileName || uploadJson?.message || `HTTP ${uploadRes.status}`;
        throw new Error(`Upload failed: ${detail}`);
      }

      const serverFilename: string = uploadJson?.filename ?? file.name;

      if (progressInterval) window.clearInterval(progressInterval);
      
      // Success -> mark ready
      setDocuments(prev =>
        prev.map(d => (d.id === id ? { ...d, status: 'ready', progress: 100, name: serverFilename } : d))
      );

    } catch (err) {
      console.error('Error uploading image:', err);
      setDocuments(prev =>
        prev.map(d => (d.id === id ? { ...d, status: 'error', progress: 0 } : d))
      );
    } finally {
      if (progressInterval) window.clearInterval(progressInterval);
    }
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSendQuestion = async (question: string) => {
  const messageId = crypto.randomUUID();

  // 1) Add user message
  const userMessage: Message = { id: messageId, content: question, role: 'user' };
  setMessages(prev => [...prev, userMessage]);
  setIsLoading(true);
  try {
    const response = await fetch('http://172.20.10.4:8000/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // You can add k/mode if you expose UI controls; keeping simple here
      body: JSON.stringify({ query:question }),
    });
    // Try to parse JSON even on non-OK for better error messages
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      /* no-op */
    }

    if (!response.ok) {
      const errMsg =
        (data && (data.detail || data.error)) ||
        `Chat request failed (HTTP ${response.status})`;
      throw new Error(errMsg);
    }

    const answer =
      (data && typeof data.answer === 'string' && data.answer.trim()) ||
      'No answer found.';

      const topSources = data.sources?.slice(0, 2);
    // 2) Add assistant message with ONLY the answer text
    const aiMessage: Message = { id: crypto.randomUUID(), content: answer, role: 'assistant' ,  sources: topSources  };
    setMessages(prev => [...prev, aiMessage]);
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    const msg =
      (error && typeof error.message === 'string' && error.message) ||
      "I'm sorry, but I encountered an error processing your request. Please try again.";
    const errorMessage: Message = { id: crypto.randomUUID(), content: msg, role: 'assistant' };
    setMessages(prev => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className={`flex h-screen ${theme === 'dark' 
      ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
      : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
    }`}>
      <DocumentPane 
        documents={documents}
        onFileUpload={handleFileUpload}
        onAudioFileUpload={handleAudioFileUpload}
        onRemoveDocument={handleRemoveDocument}
        onImageFileUpload={handleImageFileUpload}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      <ChatPane 
        messages={messages}
        isLoading={isLoading}
        onSendQuestion={handleSendQuestion}
        documentsReady={true}
      />
    </div>
  );
}