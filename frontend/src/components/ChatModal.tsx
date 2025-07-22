import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ChatInterface from "./ChatInterface"

interface ChatModalProps {
  children: React.ReactNode
}

const ChatModal = ({ children }: ChatModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Chat with Doctor</DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-full overflow-y-auto">
          <ChatInterface />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ChatModal 