'use client'

import { useState } from 'react'
import Fab from '@mui/material/Fab'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import AIAssistantPanel from './AIAssistantPanel'

export default function AIAssistantFab() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Fab
        color="primary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1200,
        }}
        aria-label="Open AI Assistant"
      >
        <SmartToyIcon />
      </Fab>
      <AIAssistantPanel open={open} onClose={() => setOpen(false)} />
    </>
  )
}
