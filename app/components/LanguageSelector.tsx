'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LanguageSelector() {
  const pathname = usePathname()
  const currentLocale = pathname.split('/')[1]

  return (
    <div className="fixed top-4 right-4 flex gap-2">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Link 
          href="/es" 
          className={`text-2xl ${currentLocale === 'es' ? 'opacity-100' : 'opacity-50'}`}
          title="Español"
        >
          🇪🇸
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Link 
          href="/en" 
          className={`text-2xl ${currentLocale === 'en' ? 'opacity-100' : 'opacity-50'}`}
          title="English"
        >
          🇺🇸
        </Link>
      </motion.div>
    </div>
  )
} 