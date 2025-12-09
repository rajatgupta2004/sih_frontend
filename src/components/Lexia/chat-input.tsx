"use client";

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  documentsReady: boolean;
}

export function ChatInput({ onSend, isLoading, documentsReady }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !isLoading && documentsReady) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const isDisabled = isLoading || !documentsReady;

  return (
    <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto p-4">
        <div className="relative">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder={documentsReady ? "Ask about your documents..." : "Upload documents to start"}
              rows={1}
              disabled={isDisabled}
              className="w-full bg-transparent border-none outline-none resize-none text-white/90 placeholder-white/40 px-4 py-3 pr-12 min-h-[50px] max-h-32 text-sm"
            />
            <button
              onClick={handleSubmit}
              disabled={isDisabled || !message.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-4 h-4 text-white/70" />
            </button>
          </div>
        </div>
        {!documentsReady && (
          <p className="text-white/40 text-xs mt-2 text-center">
            Upload a document to start chatting
          </p>
        )}
      </div>
    </div>
  );
}




// "use client";

// import { useState, useRef, KeyboardEvent } from "react";
// import { Send, Upload } from "lucide-react";

// interface ChatInputProps {
//   onSend: (message: string) => void;
//   onUpload: (file: File, category: string) => void;
//   isLoading: boolean;
//   documentsReady: boolean;
// }

// export function ChatInput({
//   onSend,
//   onUpload,
//   isLoading,
//   documentsReady,
// }: ChatInputProps) {
//   const [message, setMessage] = useState("");
//   const [category, setCategory] = useState("pdf");

//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleSubmit = () => {
//     if (message.trim() && !isLoading && documentsReady) {
//       onSend(message);
//       setMessage("");
//       if (textareaRef.current) {
//         textareaRef.current.style.height = "auto";
//       }
//     }
//   };

//   const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey) {
//       e.preventDefault();
//       handleSubmit();
//     }
//   };

//   const handleInput = () => {
//     if (textareaRef.current) {
//       textareaRef.current.style.height = "auto";
//       textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
//     }
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       onUpload(file, category);
//       e.target.value = "";
//     }
//   };

//   const isDisabled = isLoading;

//   return (
//     <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl">
//       <div className="max-w-4xl mx-auto p-4 space-y-3">

//         {/* Upload Section */}
//         <div className="flex flex-wrap gap-2 items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">

//           <div className="flex gap-2 items-center">
//             <select
//               value={category}
//               onChange={(e) => setCategory(e.target.value)}
//               className="bg-black/40 border border-white/20 text-white/80 px-3 py-1.5 rounded-md text-sm outline-none"
//             >
//               <option value="pdf">PDF</option>
//               <option value="doc">DOC / DOCX</option>
//               <option value="image">Image</option>
//               <option value="audio">Audio</option>
//             </select>

//             <input
//               ref={fileInputRef}
//               type="file"
//               hidden
//               onChange={handleFileChange}
//               accept={
//                 category === "pdf"
//                   ? "application/pdf"
//                   : category === "doc"
//                   ? ".doc,.docx"
//                   : category === "image"
//                   ? "image/*"
//                   : "audio/*"
//               }
//             />

//             <button
//               onClick={() => fileInputRef.current?.click()}
//               className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition"
//             >
//               <Upload className="w-4 h-4" />
//               Upload
//             </button>
//           </div>

//           <span className="text-xs text-white/40">
//             {documentsReady ? "Documents ready ✅" : "No document uploaded ❌"}
//           </span>

//         </div>

//         {/* Chat Section */}
//         <div className="relative">
//           <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
//             <textarea
//               ref={textareaRef}
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               onKeyDown={handleKeyDown}
//               onInput={handleInput}
//               placeholder={
//                 documentsReady
//                   ? "Ask about your documents..."
//                   : "Upload documents to start"
//               }
//               rows={1}
//               disabled={!documentsReady || isDisabled}
//               className="w-full bg-transparent border-none outline-none resize-none 
//               text-white/90 placeholder-white/40 px-4 py-3 pr-12 
//               min-h-[50px] max-h-32 text-sm"
//             />

//             <button
//               onClick={handleSubmit}
//               disabled={!documentsReady || isDisabled || !message.trim()}
//               className="absolute right-2 bottom-2 p-2 rounded-md 
//               bg-white/10 border border-white/20 hover:bg-white/20 
//               disabled:opacity-50 disabled:cursor-not-allowed transition"
//             >
//               <Send className="w-4 h-4 text-white/70" />
//             </button>
//           </div>
//         </div>

//         {!documentsReady && (
//           <p className="text-white/40 text-xs text-center">
//             Upload a document to start chatting
//           </p>
//         )}

//       </div>
//     </div>
//   );
// }
