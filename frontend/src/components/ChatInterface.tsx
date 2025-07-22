import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Send, Paperclip, Check, CheckCheck, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { getMockResponse } from "@/lib/mock-responses"

interface Message {
  id: number
  text: string
  sender: 'user' | 'doctor'
  timestamp: Date
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  attachment?: {
    type: 'image' | 'file'
    url: string
    name: string
  }
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm Dr. Sarah. How can I help you today?",
      sender: 'doctor',
      timestamp: new Date(),
      status: 'read'
    }
  ])
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    }
    
    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    // Update message status after a delay
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' } 
            : msg
        )
      )
    }, 500)

    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' } 
            : msg
        )
      )
    }, 1000)

    // Show typing indicator
    setIsTyping(true)

    // Simulate network delay and get mock response
    setTimeout(() => {
      const response = getMockResponse(newMessage)
      
      setIsTyping(false)
      const doctorMessage: Message = {
        id: messages.length + 2,
        text: response,
        sender: 'doctor',
        timestamp: new Date(),
        status: 'read'
      }
      setMessages(prev => [...prev, doctorMessage])
    }, 2000)
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

    // Simulate file upload
    const userMessage: Message = {
      id: messages.length + 1,
      text: '',
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      attachment: {
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file),
        name: file.name
      }
    }

    setMessages(prev => [...prev, userMessage])
  }

  const MessageStatus = ({ status }: { status?: Message['status'] }) => {
    if (!status || status === 'sending') return <Loader2 className="h-3 w-3 animate-spin" />
    if (status === 'sent') return <Check className="h-3 w-3" />
    if (status === 'delivered') return <CheckCheck className="h-3 w-3" />
    return <CheckCheck className="h-3 w-3 text-blue-500" />
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={message.sender === 'doctor' ? "/doctor-avatar.png" : "/user-avatar.png"} />
              <AvatarFallback>{message.sender === 'doctor' ? 'DR' : 'ME'}</AvatarFallback>
            </Avatar>
            <div
              className={`max-w-[85%] break-words rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-[#3182CE] text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.attachment && (
                <div className="mb-2">
                  {message.attachment.type === 'image' ? (
                    <img 
                      src={message.attachment.url} 
                      alt="attachment" 
                      className="rounded-md max-w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center gap-2 bg-white/10 p-2 rounded">
                      <Paperclip className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{message.attachment.name}</span>
                    </div>
                  )}
                </div>
              )}
              {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
              <div className="flex items-center gap-1 mt-1">
                <p className={`text-xs ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.sender === 'user' && (
                  <MessageStatus status={message.status} />
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src="/doctor-avatar.png" />
              <AvatarFallback>DR</AvatarFallback>
            </Avatar>
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
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
            className="shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            onClick={() => handleSendMessage()}
            className="bg-[#3182CE] text-white px-4 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface 