'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageSquare, Clock, Mail, Bold, Italic, Image as ImageIcon, Send } from 'lucide-react';
import Header from '@/components/Header';

export default function ChatSupport() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden items-center px-4 py-4 border-b border-[#1a1a1a]">
        <button onClick={() => router.back()} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-gray-400 hover:text-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#161616] flex items-center justify-center mr-3">
          <MessageSquare className="w-5 h-5 text-[#0052FF]" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Customer Support</h1>
          <span className="text-xs text-[#0052FF] font-medium">Online</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Contact Details Card */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4 mb-6">
          <h2 className="text-[#0052FF] font-semibold text-sm mb-3">Contact Details</h2>
          <div className="flex flex-col gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>admin@coinbase.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>12 PM - 12 AM</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <MessageSquare className="w-12 h-12 text-[#1a1a1a] mb-4" />
          <p className="text-gray-400 font-medium mb-1">No messages yet</p>
          <p className="text-xs text-[#0052FF]/70">Send a message and our team will reply shortly</p>
        </div>
      </main>

      {/* Message Input */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-3">
          <button className="w-8 h-8 rounded bg-[#161616] border border-[#222] flex items-center justify-center hover:bg-[#222] text-gray-400">
            <Bold className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 rounded bg-[#161616] border border-[#222] flex items-center justify-center hover:bg-[#222] text-gray-400">
            <Italic className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-[#161616] border border-[#222] flex-shrink-0 flex items-center justify-center hover:bg-[#222] text-gray-400">
            <ImageIcon className="w-5 h-5" />
          </button>
          <input 
            type="text"
            placeholder="Type a message... (*bold* _italic_)"
            className="flex-1 bg-[#161616] border border-[#222] rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0052FF]"
          />
          <button className="w-10 h-10 rounded-full bg-[#0052FF] flex-shrink-0 flex items-center justify-center hover:bg-[#3385ff] text-white">
            <Send className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
