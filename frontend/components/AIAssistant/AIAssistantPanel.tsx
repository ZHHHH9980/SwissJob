'use client'

import { useState, useRef, useEffect } from 'react'
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import CloseIcon from '@mui/icons-material/Close'
import SendIcon from '@mui/icons-material/Send'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useAssistantChat, type Message } from './useAssistantChat'

function ActionCard({ name, result }: { name: string; result: Record<string, unknown> }) {
  const labels: Record<string, string> = {
    schedule_interview: 'Interview Scheduled',
    add_company: 'Company Added',
    add_skill: 'Skill Added',
    navigate_to: 'Navigating...',
    list_companies: 'Companies Loaded',
    list_skills: 'Skills Loaded',
    get_upcoming_interviews: 'Interviews Loaded',
    get_company: 'Company Loaded',
  }
  if (name === 'navigate_to') return null
  return (
    <Chip
      size="small"
      label={labels[name] || name}
      color={result.error ? 'error' : 'success'}
      variant="outlined"
      sx={{ my: 0.5 }}
    />
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      <Paper
        elevation={0}
        sx={{
          px: 2, py: 1.5, maxWidth: '85%', borderRadius: 2,
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'white' : 'text.primary',
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content || '...'}
        </Typography>
        {msg.actions?.map((a, i) => (
          <ActionCard key={i} name={a.name} result={a.result} />
        ))}
      </Paper>
    </Box>
  )
}

export default function AIAssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { messages, sendMessage, isStreaming, clearMessages, stopStreaming } = useAssistantChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420, maxWidth: '100vw' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>SwissJob AI</Typography>
          <Box>
            <IconButton size="small" onClick={clearMessages} title="Clear chat">
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', px: 2, py: 2 }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>Hi! I can help you with:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {['Show my companies', 'Schedule an interview', 'My upcoming interviews', 'Go to calendar'].map(s => (
                  <Chip key={s} label={s} variant="outlined" size="small" onClick={() => { setInput(s); }} sx={{ cursor: 'pointer' }} />
                ))}
              </Box>
            </Box>
          )}
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5 }}>
              <CircularProgress size={20} />
            </Box>
          )}
        </Box>

        {/* Input */}
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 1 }}>
          <TextField
            fullWidth size="small" placeholder="Ask anything..."
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown} multiline maxRows={3}
            disabled={isStreaming}
          />
          <IconButton color="primary" onClick={isStreaming ? stopStreaming : handleSend} disabled={!input.trim() && !isStreaming}>
            {isStreaming ? <CloseIcon /> : <SendIcon />}
          </IconButton>
        </Box>
      </Box>
    </Drawer>
  )
}
