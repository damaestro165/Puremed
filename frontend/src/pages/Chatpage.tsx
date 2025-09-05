import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Sheet, SheetContent} from "../components/ui/sheet"
import { Send, Paperclip, Check, CheckCheck, Loader2, Plus, MessageSquare, Trash2, Menu, Smile, Search, MoreHorizontal, Edit3, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  _id?: string
  text: string
  sender: 'user' | 'doctor'
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  attachment?: {
    type: 'image' | 'file'
    url: string
    name: string
    size?: number
  }
}

interface Chat {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount?: number
  lastMessage?: Message
  messages?: Message[]
}

const ChatPage = () => {
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Replace with your backend URL

   const API_BASE_URL = import.meta.env.VITE_BACKEND_URL+ '/api'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Cleanup preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token')
  }

  // API helper function
  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = getAuthToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }, [API_BASE_URL])

  const loadChatMessages = useCallback(async (chatId: string) => {
    try {
      const response = await apiCall(`/chats/${chatId}`)
      setCurrentChat(response.chat)
      setMessages(response.chat.messages || [])
      setSidebarOpen(false)
    } catch (error) {
      console.error('Error loading chat messages:', error)
    }
  }, [apiCall])

  // Load all user's chats
  const loadChats = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiCall('/chats')
      setChats(response.chats || [])
      
      if (!currentChat && response.chats?.length > 0) {
        loadChatMessages(response.chats[0].id)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentChat, loadChatMessages, apiCall])

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.text.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Create a new chat
  const createNewChat = async (initialMessage?: string) => {
    try {
      const response = await apiCall('/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Medical Consultation',
          initialMessage
        })
      })

      setCurrentChat(response.chat)
      setMessages(response.chat.messages || [])
      setSidebarOpen(false)
      loadChats()
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  // Edit chat title
  const editChatTitle = async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return
    
    try {
      await apiCall(`/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle.trim() })
      })

      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      ))
      
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, title: newTitle.trim() } : null)
      }
      
      setEditingChatId(null)
      setEditingTitle('')
    } catch (error) {
      console.error('Error editing chat title:', error)
    }
  }

  // Delete chat function
  const deleteChat = async (chatId: string) => {
    try {
      setDeletingChatId(chatId)
      await apiCall(`/chats/${chatId}`, {
        method: 'DELETE'
      })

      setChats(prev => prev.filter(chat => chat.id !== chatId))
      
      if (currentChat?.id === chatId) {
        setCurrentChat(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    } finally {
      setDeletingChatId(null)
    }
  }

  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return
    if (!currentChat) {
      await createNewChat(newMessage)
      setNewMessage('')
      return
    }

    setIsSending(true)
    const messageText = newMessage
    setNewMessage('')

    try {
      const formData = new FormData()
      formData.append('text', messageText)
      if (selectedFile) {
        formData.append('attachment', selectedFile)
      }

      const response = await apiCall(`/chats/${currentChat.id}/messages`, {
        method: 'POST',
        body: formData
      })

      const newMessages = [response.userMessage]
      if (response.doctorMessage) {
        newMessages.push(response.doctorMessage)
      }

      setMessages(prev => [...prev, ...newMessages])
      
      setChats(prev => prev.map(chat => 
        chat.id === currentChat.id 
          ? { ...chat, updatedAt: new Date(), lastMessage: response.doctorMessage || response.userMessage }
          : chat
      ))

      // Clear file after successful send
      setSelectedFile(null)
      setFilePreview(null)
      if (filePreview) URL.revokeObjectURL(filePreview)

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        text: "Sorry, there was an error sending your message. Please try again.",
        sender: 'doctor',
        timestamp: new Date(),
        status: 'read'
      }])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size and type (matching backend)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large (max 10MB)')
      return
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      alert('Only images (JPEG/JPG/PNG) and documents (PDF/DOC/DOCX) are allowed')
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file)
      setFilePreview(previewUrl)
    } else {
      setFilePreview(null) // No preview for non-images
    }
  }

  const MessageStatus = ({ status }: { status?: Message['status'] }) => {
    if (!status || status === 'sending') return <Loader2 className="h-3 w-3 animate-spin text-blue-300" />
    if (status === 'sent') return <Check className="h-3 w-3 text-blue-300" />
    if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-blue-300" />
    return <CheckCheck className="h-3 w-3 text-blue-400" />
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const messageDate = new Date(date)
    const isToday = today.toDateString() === messageDate.toDateString()
    const isYesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString() === messageDate.toDateString()
    
    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Sidebar Content Component
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-[#3182CE] to-blue-600">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && <h1 className="text-lg font-bold text-white">Medical Chats</h1>}
          </div>
        </div>

        {/* Search Bar */}
        {!sidebarCollapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 bg-white/90 border-white/20 text-gray-700 placeholder:text-gray-500 focus:bg-white focus:border-white/50"
            />
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <Button 
          onClick={() => createNewChat()}
          className={`w-full bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5AA0] hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 ${
            sidebarCollapsed ? 'px-2' : ''
          }`}
        >
          <Plus className="h-4 w-4 mr-2" />
          {!sidebarCollapsed && "New Consultation"}
        </Button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length === 0 ? (
          !sidebarCollapsed && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <MessageSquare className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? 'No matching chats' : 'No consultations yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Start your first consultation with Dr. Sarah to get personalized medical advice'}
              </p>
            </div>
          )
        ) : (
          <div className="space-y-2 p-2">
            {filteredChats.map((chat, index) => (
              <div
                key={chat.id}
                className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                  currentChat?.id === chat.id 
                    ? 'bg-gradient-to-r from-[#3182CE] to-blue-600 text-white shadow-xl scale-[1.02]' 
                    : 'hover:bg-white hover:shadow-lg bg-gray-50/50'
                } ${sidebarCollapsed ? 'p-2' : ''}`}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div 
                  onClick={() => loadChatMessages(chat.id)}
                  className="flex-1 min-w-0"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {!sidebarCollapsed && (editingChatId === chat.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => editChatTitle(chat.id, editingTitle)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              editChatTitle(chat.id, editingTitle)
                            } else if (e.key === 'Escape') {
                              setEditingChatId(null)
                              setEditingTitle('')
                            }
                          }}
                          className="text-sm font-medium bg-white/20 border-white/30 text-white placeholder:text-white/70"
                          autoFocus
                        />
                      ) : (
                        <h3 className="font-semibold text-sm truncate pr-2 group-hover:text-gray-800">
                          {chat.title}
                        </h3>
                      ))}
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          currentChat?.id === chat.id 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!sidebarCollapsed && chat.lastMessage && (
                    <div className={`text-xs truncate mb-2 ${
                      currentChat?.id === chat.id ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      <span className="font-medium">
                        {chat.lastMessage.sender === 'user' ? '👤 You: ' : '🩺 Dr. Sarah: '}
                      </span>
                      {chat.lastMessage.text}
                    </div>
                  )}

                  {!sidebarCollapsed && (
                    <div className={`flex items-center justify-between text-xs ${
                      currentChat?.id === chat.id ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      <span>{chat.messageCount || 0} messages</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          currentChat?.id === chat.id ? 'bg-green-300' : 'bg-green-500'
                        }`} />
                        <span className="text-xs">Active</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!sidebarCollapsed && (
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 bg-blue-500 rounded-2xl group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingChatId(chat.id)
                        setEditingTitle(chat.title)
                      }}
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 ${
                        currentChat?.id === chat.id 
                          ? 'hover:bg-white/20 text-white' 
                          : 'hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChat(chat.id)
                      }}
                      variant="ghost"
                      size="sm"
                      disabled={deletingChatId === chat.id}
                      className={`h-7 w-7 p-0 ${
                        currentChat?.id === chat.id 
                          ? 'hover:bg-red-500/20 text-white' 
                          : 'hover:bg-red-600 hover:text-red-600'
                      }`}
                    >
                      {deletingChatId === chat.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-[#3182CE] to-blue-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800">Loading your consultations...</h3>
            <p className="text-sm text-gray-500 mt-2">Preparing your secure medical chat space</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      } border-r border-gray-200/50`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar using Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChat ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setSidebarOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="lg:hidden hover:bg-gray-100"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  
                  {/* Desktop Sidebar Toggle */}
                  <Button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    variant="ghost"
                    size="sm"
                    className="hidden lg:flex hover:bg-gray-100"
                  >
                    {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  </Button>
                  
                  <div className="min-w-0">
                    <h2 className="font-bold text-xl text-gray-800 truncate mb-1">{currentChat.title}</h2>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Started {formatDate(currentChat.createdAt)} • Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-2 rounded-full">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src="/doctor-avatar.png" />
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs">DR</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-green-700">Dr. Sarah</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50/50 to-white custom-scrollbar">
              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex items-start gap-4 max-w-4xl mx-auto animate-fade-in ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10 ring-2 ring-white shadow-lg">
                      <AvatarImage src={message.sender === 'doctor' ? "/doctor-avatar.png" : "/user-avatar.png"} />
                      <AvatarFallback className={`text-sm font-semibold ${
                        message.sender === 'doctor' 
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700' 
                          : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
                      }`}>
                        {message.sender === 'doctor' ? 'DR' : 'YOU'}
                      </AvatarFallback>
                    </Avatar>
                    {message.sender === 'doctor' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div className={`max-w-[80%] sm:max-w-[70%] ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className="mb-1">
                      <span className={`text-xs font-medium ${
                        message.sender === 'user' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {message.sender === 'user' ? 'You' : 'Dr. Sarah'}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">{formatTime(message.timestamp)}</span>
                    </div>
                    
                    <div
                      className={`inline-block rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-[#3182CE] to-blue-600 text-white rounded-tr-md'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-md'
                      }`}
                    >
                      {message.attachment && (
                        <div className="mb-3">
                          {message.attachment.type === 'image' ? (
                            <div className="relative overflow-hidden rounded-xl">
                              <img 
                                src={`${API_BASE_URL.replace('/api', '')}${message.attachment.url}`}
                                alt="attachment" 
                                className="max-w-full h-auto max-h-64 object-cover transition-transform duration-300 hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className={`flex items-center gap-3 p-3 rounded-xl ${
                              message.sender === 'user' 
                                ? 'bg-white/20 backdrop-blur-sm' 
                                : 'bg-gray-50'
                            }`}>
                              <Paperclip className="h-5 w-5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium block truncate">{message.attachment.name}</span>
                                <span className="text-xs opacity-70">
                                  {message.attachment.size ? `${(message.attachment.size / 1024).toFixed(1)} KB` : 'File'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {message.text && (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.text}
                        </p>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-2 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.sender === 'user' && (
                        <MessageStatus status={message.status} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(isTyping || isSending) && (
                <div className="flex items-start gap-4 max-w-4xl mx-auto animate-fade-in">
                  <Avatar className="w-10 h-10 ring-2 ring-white shadow-lg">
                    <AvatarImage src="/doctor-avatar.png" />
                    <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 text-sm font-semibold">DR</AvatarFallback>
                  </Avatar>
                  <div className="bg-white rounded-2xl rounded-tl-md p-4 border border-gray-100 shadow-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 bg-green-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="border-t border-gray-200/50 p-6 bg-white/80 backdrop-blur-xl">
              <div className="flex gap-4 max-w-4xl mx-auto">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-xl"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message here..."
                    className="pr-12 border-gray-300 focus:border-[#3182CE] focus:ring-2 focus:ring-[#3182CE]/20 rounded-xl bg-white/70 backdrop-blur-sm placeholder:text-gray-500 text-gray-800"
                    disabled={isSending}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5AA0] hover:to-blue-700 text-white px-6 shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl disabled:opacity-50 disabled:transform-none"
                  disabled={(!newMessage.trim() && !selectedFile) || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* File Preview */}
              {selectedFile && (
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between max-w-4xl mx-auto">
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-gray-500" />
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      setFilePreview(null)
                      if (filePreview) URL.revokeObjectURL(filePreview)
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="flex gap-2 mt-4 max-w-4xl mx-auto">
                <Button
                  onClick={() => setNewMessage("I'm experiencing pain in my chest")}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/70 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-gray-300 rounded-full px-3 py-1"
                >
                  Chest pain
                </Button>
                <Button
                  onClick={() => setNewMessage("I have a headache that won't go away")}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/70 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-gray-300 rounded-full px-3 py-1"
                >
                  Headache
                </Button>
                <Button
                  onClick={() => setNewMessage("I'm feeling dizzy and nauseous")}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/70 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-gray-300 rounded-full px-3 py-1"
                >
                  Dizziness
                </Button>
                <Button
                  onClick={() => setNewMessage("I need medication advice")}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-white/70 backdrop-blur-sm hover:bg-white border-gray-200 hover:border-gray-300 rounded-full px-3 py-1"
                >
                  Medication
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
            </div>
            
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="ghost"
              className="lg:hidden absolute top-4 left-4 z-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Desktop Sidebar Toggle for Empty State */}
            <Button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              variant="ghost"
              className="hidden lg:flex absolute top-4 left-4 z-10"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-[#3182CE] via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform hover:rotate-3 transition-transform duration-300">
                <MessageSquare className="h-16 w-16 text-white" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text ">
                Welcome to AI Medical Consultation
              </h2>
              <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
                Connect with Dr. Sarah, your AI medical assistant. Get instant advice, symptom analysis, and health guidance 24/7.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl">
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Instant Consultation</h3>
                  <p className="text-sm text-gray-600">Get immediate responses to your health questions</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">24/7 Available</h3>
                  <p className="text-sm text-gray-600">Access medical advice anytime, anywhere</p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-gray-200/50">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <Paperclip className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Share Files</h3>
                  <p className="text-sm text-gray-600">Upload images and documents for analysis</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={() => createNewChat()}
                  className="bg-gradient-to-r from-[#3182CE] to-blue-600 hover:from-[#2C5AA0] hover:to-blue-700 text-white px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-base font-semibold rounded-2xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start Your First Consultation
                </Button>
                
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  By continuing, you acknowledge that this is an AI assistant and not a replacement for professional medical care.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    
    </div>
  )
}

export default ChatPage