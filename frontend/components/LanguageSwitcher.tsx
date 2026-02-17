'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { locales, localeNames } from '@/i18n'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import LanguageIcon from '@mui/icons-material/Language'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'

export default function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentLocale, setCurrentLocale] = useState('en')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (locale: string) => {
    setCurrentLocale(locale)
    localStorage.setItem('locale', locale)
    handleClose()
    router.refresh()
  }

  return (
    <div>
      <Button
        onClick={handleClick}
        startIcon={<LanguageIcon />}
        endIcon={<KeyboardArrowDownIcon />}
        sx={{
          color: 'text.secondary',
          textTransform: 'none',
          fontSize: '0.875rem',
          fontWeight: 500,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {localeNames[currentLocale]}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        {locales.map((locale) => (
          <MenuItem
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            selected={currentLocale === locale}
          >
            {localeNames[locale]}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}
