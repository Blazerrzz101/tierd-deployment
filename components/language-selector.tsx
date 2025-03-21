"use client"

import { useEffect, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AvailableLanguage, getUserLanguage, setUserLanguage } from '@/utils/language-utils'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
]

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal' | 'icon-only'
  className?: string
}

export function LanguageSelector({ 
  variant = 'default',
  className = ''
}: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState<AvailableLanguage>('en')
  
  // Initialize current language
  useEffect(() => {
    setCurrentLanguage(getUserLanguage())
  }, [])
  
  // Get the language display info
  const getCurrentLanguageInfo = () => {
    return languages.find(lang => lang.code === currentLanguage) || languages[0]
  }
  
  // Handle language change
  const handleLanguageChange = (lang: AvailableLanguage) => {
    setUserLanguage(lang)
    setCurrentLanguage(lang)
    // Reload the page to apply changes
    window.location.reload()
  }
  
  const currentLang = getCurrentLanguageInfo()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={className}
        >
          {variant === 'icon-only' ? (
            <Globe className="h-4 w-4" />
          ) : variant === 'minimal' ? (
            <span>{currentLang.flag}</span>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              <span>{currentLang.flag} {currentLang.name}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code as AvailableLanguage)}
            className="flex items-center justify-between"
          >
            <span>
              {language.flag} {language.name}
            </span>
            {currentLanguage === language.code && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 