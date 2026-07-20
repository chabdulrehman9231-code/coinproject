'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare, Clock, Mail, Bold, Italic, Image as ImageIcon, Send } from 'lucide-react';
import Header from '@/components/Header';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatMessage } from '@/lib/utils/formatMessage';

export default function ChatSupport() {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        
        // 2. Fetch existing messages
        supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            if (data) setMessages(data);
            scrollToBottom();
          });
          
        // 2.5 Mark unread messages from admin as read
        supabase
          .from('messages')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .neq('sender_id', user.id)
          .eq('is_read', false)
          .then();

        // 3. Subscribe to real-time changes
        const channel = supabase
          .channel(`messages_${user.id}_${Date.now()}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `user_id=eq.${user.id}`,
          }, (payload) => {
            setMessages((prev) => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
            scrollToBottom();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    });
  }, [supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;

    const msg = newMessage.trim();
    setNewMessage(''); // optimistic clear

    const { data, error } = await supabase.from('messages').insert({
      user_id: userId,
      sender_id: userId, // User sending their own message
      content: msg,
    }).select().single();

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } else if (data) {
      setMessages((prev) => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const insertFormat = (prefix: string, suffix: string) => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    
    const textBefore = newMessage.substring(0, start);
    const textSelected = newMessage.substring(start, end);
    const textAfter = newMessage.substring(end);
    
    if (textSelected) {
      setNewMessage(`${textBefore}${prefix}${textSelected}${suffix}${textAfter}`);
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setNewMessage(`${textBefore}${prefix}${suffix}${textAfter}`);
      setTimeout(() => {
        inputRef.current?.setSelectionRange(start + prefix.length, start + prefix.length);
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat_images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat_images')
        .getPublicUrl(fileName);

      const imgMessage = `![image](${publicUrl})`;
      
      // Optimistic UI
      const optimisticMsg = {
        id: 'temp-img-' + Date.now(),
        user_id: userId,
        sender_id: userId,
        content: imgMessage,
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      // Send image message
      await supabase.from('messages').insert([{
        user_id: userId,
        sender_id: userId,
        content: imgMessage
      }]);

    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden shrink-0 items-center px-4 py-4 border-b border-[#1a1a1a]">
        <button onClick={() => router.back()} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center mr-3">
          <MessageSquare className="w-5 h-5 text-[#BF953F]" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Customer Support</h1>
          <span className="text-xs text-[#BF953F] font-medium">Online</span>
        </div>
      </header>

      {/* Centered Wrapper */}
      <div className="flex-1 flex flex-col w-full max-w-4xl mx-auto overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Contact Details Card */}
          <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6 shrink-0">
            <h2 className="text-[#BF953F] font-semibold text-sm mb-3">Contact Details</h2>
            <div className="flex flex-col gap-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>support@coinflowvip.pro</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>10 AM - 10 PM</span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 mt-10">
                <MessageSquare className="w-12 h-12 text-[#1a1a1a] mb-4" />
                <p className="text-gray-400 font-medium mb-1">No messages yet</p>
                <p className="text-xs text-[#BF953F]/70">Send a message and our team will reply shortly</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender_id === userId;
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[80%] ${isUser ? 'self-end' : 'self-start'}`}>
                    <div 
                      className={`p-3 rounded-2xl text-sm shadow-sm ${
                        isUser 
                        ? 'bg-[#BF953F] text-white rounded-tr-sm' 
                        : 'bg-[#1a1a1a] text-gray-200 border border-[#222] rounded-tl-sm'
                      }`}
                    >
                      {formatMessage(msg.content)}
                    </div>
                    <span className={`text-[10px] text-gray-500 mt-1 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Message Input */}
        <div className="p-4 bg-[#0a0a0a] border-t border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <button 
              onClick={() => insertFormat('*', '*')}
              className="w-8 h-8 rounded bg-[#161616] border border-[#222] flex items-center justify-center hover:bg-[#222] text-gray-400 transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              onClick={() => insertFormat('_', '_')}
              className="w-8 h-8 rounded bg-[#161616] border border-[#222] flex items-center justify-center hover:bg-[#222] text-gray-400 transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`w-10 h-10 rounded-full bg-[#161616] border border-[#222] flex-shrink-0 flex items-center justify-center hover:bg-[#222] text-gray-400 transition-colors ${isUploading ? 'opacity-50' : ''}`}
              title="Upload Image"
            >
              {isUploading ? <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" /> : <ImageIcon className="w-5 h-5" />}
            </button>
            <input 
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (*bold* _italic_)"
              className="flex-1 bg-[#161616] border border-[#222] rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#BF953F]"
            />
            <button 
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full bg-[#BF953F] flex-shrink-0 flex items-center justify-center hover:bg-[#3385ff] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
