'use client';

import dynamic from 'next/dynamic';

const ChatbotUI = dynamic(() => import('@/chatbot/chat-ui'), { ssr: false });

export default ChatbotUI;
