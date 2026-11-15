'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const ChatbotUI = dynamic(() => import('@/chatbot/chat-ui'), { ssr: false });

export default function LazyChatbot() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const open = () => setLoaded(true);
    window.addEventListener('open-edrms-chatbot', open);
    return () => window.removeEventListener('open-edrms-chatbot', open);
  }, []);
  return loaded ? <ChatbotUI initialOpen /> : null;
}
