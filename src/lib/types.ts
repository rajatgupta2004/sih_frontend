// export interface Message {
//   id: string;
//   role: 'user' | 'assistant';
//   content: string;
// }


export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    file_name: string;
    score: number;
  }[];
}

export interface Document {
  id: string;
  name: string;
  content: string;
  status: 'uploading' | 'ingesting' | 'ready' | 'error';
  progress: number;
}
