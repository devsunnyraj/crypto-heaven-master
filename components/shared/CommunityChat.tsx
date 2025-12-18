"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { sendMessage, likeMessage, deleteMessage } from "@/lib/actions/message.actions";
import { usePathname, useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing";
import { isBase64Image } from "@/lib/utils";

interface Message {
  _id: string;
  text?: string;
  image?: string;
  author: {
    id: string;
    name: string;
    image: string;
  };
  likes?: string[];
  replyTo?: {
    _id: string;
    text?: string;
    author: {
      name: string;
      id: string;
    };
  };
  createdAt: string;
}

interface Props {
  communityId: string;
  currentUserId: string;
  initialMessages: Message[];
}

export default function CommunityChat({ communityId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { startUpload } = useUploadThing("media");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setContextMenu(null);
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isSending) return;

    setIsSending(true);
    const messageText = newMessage;
    setNewMessage("");
    
    let imageUrl = "";

    try {
      if (selectedImage) {
        const imgRes = await startUpload([selectedImage]);
        if (imgRes && imgRes[0].fileUrl) {
          imageUrl = imgRes[0].fileUrl;
        }
        setSelectedImage(null);
        setImagePreview("");
      }

      await sendMessage(
        messageText, 
        currentUserId, 
        communityId, 
        pathname,
        imageUrl || undefined,
        replyingTo?._id
      );
      setReplyingTo(null);
      router.refresh();
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const handleLike = async (messageId: string) => {
    try {
      await likeMessage(messageId, currentUserId, pathname);
      router.refresh();
    } catch (error) {
      console.error("Error liking message:", error);
    }
    setContextMenu(null);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
    setContextMenu(null);
  };

  const handleDelete = async (messageId: string) => {
    const message = messages.find(m => m._id === messageId);
    if (!message || message.author.id !== currentUserId) {
      return;
    }
    
    try {
      await deleteMessage(messageId, pathname);
      router.refresh();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
    setContextMenu(null);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString();
  };

  let lastDate = "";

  return (
    <div className='flex flex-col h-[calc(100vh-280px)] rounded-lg' style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar'>
        {messages.length === 0 ? (
          <div className='flex items-center justify-center h-full'>
            <p className='text-light-3 text-center'>
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const messageDate = formatDate(message.createdAt);
            const showDate = messageDate !== lastDate;
            lastDate = messageDate;
            const isCurrentUser = message.author.id === currentUserId;

            return (
              <div key={message._id}>
                {showDate && (
                  <div className='flex justify-center my-4'>
                    <span className='text-light-3 text-xs px-3 py-1 rounded-full' style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                      {messageDate}
                    </span>
                  </div>
                )}
                <div className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isCurrentUser && (
                    <div className='flex-shrink-0'>
                      <Image
                        src={message.author.image}
                        alt={message.author.name}
                        width={40}
                        height={40}
                        className='rounded-full object-cover'
                        style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
                      />
                    </div>
                  )}
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {!isCurrentUser && (
                      <span className='text-xs text-light-3 mb-1'>
                        {message.author.name}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 cursor-pointer ${
                        isCurrentUser
                          ? 'text-white rounded-br-sm'
                          : 'text-light-1 rounded-bl-sm'
                      }`}
                      style={{ background: isCurrentUser ? '#7c3aed' : 'rgba(0, 0, 0, 0.6)' }}
                      onContextMenu={(e) => handleContextMenu(e, message._id)}
                    >
                      {message.replyTo && (
                        <div className='mb-2 pb-2 border-b border-white border-opacity-20 flex gap-2'>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 flex-shrink-0 mt-0.5">
                            <polyline points="9 14 4 9 9 4"></polyline>
                            <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
                          </svg>
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs opacity-70'>
                              {message.replyTo.author.id === currentUserId ? 'You' : message.replyTo.author.name}
                            </p>
                            <p className='text-xs opacity-60 truncate'>
                              {message.replyTo.text}
                            </p>
                          </div>
                        </div>
                      )}
                      {message.image && (
                        <Image
                          src={message.image}
                          alt='message image'
                          width={300}
                          height={300}
                          className='rounded-lg mb-2 max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity'
                          onClick={() => setLightboxImage(message.image!)}
                          style={{ border: 'none', outline: 'none', boxShadow: 'none', borderWidth: 0, borderStyle: 'none' }}
                        />
                      )}
                      {message.text && (
                        <p className='text-sm break-words whitespace-pre-wrap'>{message.text}</p>
                      )}
                      {message.likes && message.likes.length > 0 && (
                        <div className='flex items-center gap-1 mt-1'>
                          <span className='text-xs'>❤️</span>
                          <span className='text-xs opacity-70'>{message.likes.length}</span>
                        </div>
                      )}
                    </div>
                    <span className='text-xs text-light-4 mt-1'>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className='fixed z-50 bg-dark-3 rounded-lg shadow-lg py-2 min-w-[120px]'
          style={{ 
            top: contextMenu.y, 
            left: contextMenu.x,
            background: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <button
            onClick={() => handleLike(contextMenu.messageId)}
            className='w-full px-4 py-2 text-left text-light-1 hover:bg-purple-600 hover:bg-opacity-50 transition-colors flex items-center gap-2'
          >
            <span>❤️</span> Like
          </button>
          <button
            onClick={() => {
              const msg = messages.find(m => m._id === contextMenu.messageId);
              if (msg) handleReply(msg);
            }}
            className='w-full px-4 py-2 text-left text-light-1 hover:bg-purple-600 hover:bg-opacity-50 transition-colors flex items-center gap-2'
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
            Reply
          </button>
          {messages.find(m => m._id === contextMenu.messageId)?.author.id === currentUserId && (
            <button
              onClick={() => handleDelete(contextMenu.messageId)}
              className='w-full px-4 py-2 text-left text-red-400 hover:bg-red-600 hover:bg-opacity-50 transition-colors flex items-center gap-2'
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className='p-2' style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {replyingTo && (
          <div className='mb-2 p-2 rounded-lg flex items-center justify-between' style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className='flex gap-2 items-start flex-1 min-w-0'>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-light-3 flex-shrink-0 mt-1">
                <polyline points="9 14 4 9 9 4"></polyline>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
              </svg>
              <div className='flex-1 min-w-0'>
                <p className='text-xs text-light-3'>Replying to {replyingTo.author.id === currentUserId ? 'You' : replyingTo.author.name}</p>
                <p className='text-sm text-light-2 truncate'>{replyingTo.text}</p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => setReplyingTo(null)}
              className='text-light-3 hover:text-light-1'
            >
              ✕
            </button>
          </div>
        )}
        {imagePreview && (
          <div className='mb-2 relative inline-block'>
            <Image
              src={imagePreview}
              alt='preview'
              width={100}
              height={100}
              className='rounded-lg object-cover'
              style={{ border: 'none', outline: 'none', boxShadow: 'none', borderWidth: 0, borderStyle: 'none' }}
            />
            <button
              type='button'
              onClick={() => {
                setSelectedImage(null);
                setImagePreview("");
              }}
              className='absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center'
            >
              ✕
            </button>
          </div>
        )}
        <div className='flex gap-3 items-center'>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept='image/*'
            className='hidden'
          />
          <div className='relative' ref={attachmentMenuRef}>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachmentMenu(!showAttachmentMenu);
              }}
              className='text-light-3 hover:text-purple-400 transition-colors'
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            {showAttachmentMenu && (
              <div 
                className='absolute bottom-full left-0 mb-2 rounded-full shadow-2xl px-3 py-2 flex gap-2 animate-slideUpFade'
                style={{ 
                  background: 'rgba(168, 85, 247, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                    setShowAttachmentMenu(false);
                  }}
                  className='p-2.5 text-white hover:bg-white hover:bg-opacity-20 transition-all rounded-full'
                  title='Image'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className='p-2.5 text-white hover:bg-white hover:bg-opacity-20 transition-all rounded-full'
                  title='Video'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className='p-2.5 text-white hover:bg-white hover:bg-opacity-20 transition-all rounded-full'
                  title='GIF'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                    <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                    <line x1="6" y1="6" x2="6.01" y2="6"></line>
                    <line x1="6" y1="18" x2="6.01" y2="18"></line>
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className='p-2.5 text-white hover:bg-white hover:bg-opacity-20 transition-all rounded-full'
                  title='File'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className='p-2.5 text-white hover:bg-white hover:bg-opacity-20 transition-all rounded-full'
                  title='Location'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </button>
              </div>
            )}
          </div>
          <input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Type a message...'
            className='flex-1 rounded-full px-6 py-3 text-light-1 focus:outline-none transition-colors'
            style={{ 
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            disabled={isSending}
          />
          <button
            type='submit'
            disabled={(!newMessage.trim() && !selectedImage) || isSending}
            className='bg-purple-600 hover:bg-purple-700 disabled:bg-dark-4 disabled:cursor-not-allowed text-white rounded-full px-6 py-3 font-semibold transition-colors'
            style={{ background: (newMessage.trim() || selectedImage) && !isSending ? '#7c3aed' : undefined }}
          >
            {isSending ? (
              <svg className='animate-spin h-5 w-5' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className='fixed inset-0 z-50 flex items-center justify-center p-4'
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors'
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <Image
            src={lightboxImage}
            alt='Full size image'
            width={1200}
            height={1200}
            className='max-w-full max-h-full object-contain rounded-lg'
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
