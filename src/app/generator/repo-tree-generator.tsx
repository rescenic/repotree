'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { saveAs } from 'file-saver'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Download, Github, Copy, Check, CircleX, Maximize, Search } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import InteractiveTreeView from '@/components/interactive-tree-view'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { validateUrl, fetchProjectStructure, generateStructure, buildStructureString } from '@/lib/repo-tree-utils'

interface ValidationError {
  message: string
  isError: boolean
}

type DirectoryMap = Map<string, DirectoryMap | { type: "file" }>

export default function GitHubProjectStructure() {
  const [repoUrl, setRepoUrl] = useState('')
  const [structureMap, setStructureMap] = useState<DirectoryMap>(new Map())
  const [loading, setLoading] = useState(false)
  const [validation, setValidation] = useState<ValidationError>({ message: '', isError: false })
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [viewMode, setViewMode] = useState<'ascii' | 'interactive'>('ascii')
  const [searchTerm, setSearchTerm] = useState('')
  const [downloadFormat, setDownloadFormat] = useState<'md' | 'txt' | 'json' | 'html'>('md')
  const inputRef = useRef<HTMLInputElement>(null)

  // Save URL immediately when changed
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setRepoUrl(url)
    localStorage.setItem('lastRepoUrl', url)

    if (!url) {
      setValidation({ message: 'GitHub URL is required', isError: true })
    } else if (!validateUrl(url)) {
      setValidation({ message: 'Enter a valid GitHub URL', isError: true })
    } else {
      setValidation({ message: '', isError: false })
    }
  }

  // Validate URL and fetch structure
  const handleFetchStructure = useCallback(async (url: string = repoUrl) => {
    if (!url) {
      setValidation({ message: 'GitHub URL is required', isError: true })
      return
    }

    if (!validateUrl(url)) {
      setValidation({ message: 'Enter a valid GitHub URL', isError: true })
      return
    }

    setLoading(true)
    try {
      const tree = await fetchProjectStructure(url)
      const map = generateStructure(tree)
      setStructureMap(map)
      setValidation({ message: '', isError: false })
      localStorage.setItem('lastRepoUrl', url)
    } catch (err) {
      console.error(err)
      setValidation({ message: 'Failed to fetch repository structure', isError: true })
    }
    setLoading(false)
  }, [repoUrl])

  // Only restore the URL from localStorage, don't fetch the structure
  useEffect(() => {
    const savedUrl = localStorage.getItem('lastRepoUrl')
    if (savedUrl) {
      setRepoUrl(savedUrl)
    }
  }, [])

  // Copy the generated structure to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(filteredStructure).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Clear the input field and structure map
  const handleClearInput = () => {
    setRepoUrl('')
    localStorage.removeItem('lastRepoUrl')
    setStructureMap(new Map())
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Toggle expand/collapse the ASCII tree
  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  // Download the generated structure in selected format
  const handleDownload = () => {
    let content: string
    let mimeType: string
    let fileName: string

    switch (downloadFormat) {
      case 'md':
        content = `# Directory Structure\n\n\`\`\`\n${filteredStructure}\`\`\``
        mimeType = 'text/markdown;charset=utf-8'
        fileName = 'README.md'
        break
      case 'txt':
        content = filteredStructure
        mimeType = 'text/plain;charset=utf-8'
        fileName = 'directory-structure.txt'
        break
      case 'json':
        content = JSON.stringify(Array.from(filteredStructureMap), null, 2)
        mimeType = 'application/json;charset=utf-8'
        fileName = 'directory-structure.json'
        break
      case 'html':
        content = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Repository Structure</title>
            <style>
              body { font-family: monospace; white-space: pre; }
            </style>
          </head>
          <body>${filteredStructure}</body>
          </html>
        `
        mimeType = 'text/html;charset=utf-8'
        fileName = 'directory-structure.html'
        break
    }

    saveAs(new Blob([content], { type: mimeType }), fileName)
  }

  // Filter the structure based on search term
  const filterStructure = (map: DirectoryMap, term: string): DirectoryMap => {
    const filteredMap: DirectoryMap = new Map()
    
    for (const [key, value] of map.entries()) {
      if (value && typeof value === 'object' && 'type' in value && value.type === 'file') {
        if (key.toLowerCase().includes(term.toLowerCase())) {
          filteredMap.set(key, value)
        }
      } else if (value instanceof Map) {
        const filteredSubMap = filterStructure(value, term)
        if (filteredSubMap.size > 0 || key.toLowerCase().includes(term.toLowerCase())) {
          filteredMap.set(key, filteredSubMap)
        }
      }
    }
    
    return filteredMap
  }

  const filteredStructureMap = filterStructure(structureMap, searchTerm)
  const filteredStructure = buildStructureString(filteredStructureMap)

  // Messages for no structure generated and no search results
  const noStructureMessage = `No structure generated yet. Enter a GitHub URL and click Generate.`
  const noResultsMessage = (searchTerm: string) => `No files or folders found matching "${searchTerm}".\n\nTips:\n- Check the spelling\n- Try searching for partial names\n- Include file extensions (.js, .ts, .json)`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full max-w-4xl mx-auto p-2 md:p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 shadow-xl" id="generator">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-semibold text-black dark:text-white flex items-center justify-center gap-2">
            Generate ASCII<span className="text-blue-600">Tree</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="relative flex-grow">
                <Input
                  placeholder="Enter GitHub repository URL"
                  value={repoUrl}
                  onChange={handleUrlChange}
                  className={`p-3 pr-10 text-base sm:text-lg text-black dark:text-white ${validation.isError ? 'border-red-500' : ''}`}
                  ref={inputRef}
                />
                {repoUrl && (
                  <button
                    onClick={handleClearInput}
                    className="absolute inset-y-0 right-0 flex items-center justify-center p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                    aria-label="Clear input"
                  >
                    <CircleX size={16} strokeWidth={2} />
                  </button>
                )}
              </div>
              <Button
                onClick={() => handleFetchStructure()}
                disabled={loading || validation.isError}
                className="w-full sm:w-auto flex items-center justify-center py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white text-base sm:text-lg transition-colors duration-300"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Github className="h-5 w-5" />
                )}
                Generate
              </Button>
            </div>

            <AnimatePresence>
              {validation.isError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-500 text-sm mt-2"
                >
                  {validation.message}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:justify-between mb-4">
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setViewMode('ascii')}
                      className={`${viewMode === 'ascii' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                      ASCII
                    </Button>
                    <Button
                      onClick={() => setViewMode('interactive')}
                      className={`${viewMode === 'interactive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
                    >
                      Interactive
                    </Button>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Input
                      type="text"
                      placeholder="Search files/folders"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-full"
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                </div>
                <div className="relative">
                  {viewMode === 'ascii' ? (
                    <SyntaxHighlighter
                      language="plaintext"
                      style={atomDark}
                      className={`rounded-lg overflow-x-auto mt-6 ${expanded ? 'max-h-[none]' : 'max-h-96'} overflow-y-auto min-h-[200px]`}
                    >
                      {filteredStructure
                        ? filteredStructure
                        : searchTerm
                        ? noResultsMessage(searchTerm)
                        : noStructureMessage}
                    </SyntaxHighlighter>
                  ) : (
                    filteredStructureMap.size > 0 ? (
                      <InteractiveTreeView structure={filteredStructureMap} />
                    ) : (
                      <SyntaxHighlighter
                        language="plaintext"
                        style={atomDark}
                        className="rounded-lg overflow-x-auto mt-6 max-h-96 overflow-y-auto min-h-[200px]"
                      >
                        {searchTerm ? noResultsMessage(searchTerm) : noStructureMessage}
                      </SyntaxHighlighter>
                    )
                  )}
                  <div className="absolute top-2 right-2 md:right-6 flex items-center gap-2">
                    {copied ? (
                      <Button
                        className="p-2 text-green-500 dark:text-green-400"
                        aria-label="Copied"
                      >
                        <Check size={16} />
                      </Button>
                    ) : (
                      <Button
                        onClick={copyToClipboard}
                        className="p-2 text-white dark:text-gray-400 dark:hover:text-gray-900 bg-transparent border-none"
                        aria-label="Copy to clipboard"
                        title="Copy to clipboard"
                      >
                        <Copy size={20} />
                      </Button>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 md:right-6">
                    <Button
                      onClick={toggleExpand}
                      className="p-2 text-white dark:text-gray-400 dark:hover:text-gray-900 bg-transparent border-none"
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                      title={expanded ? "Collapse" : "Expand"}
                    >
                      <Maximize size={20} />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <Select onValueChange={(value: 'md' | 'txt' | 'json' | 'html') => setDownloadFormat(value)} aria-label="Download Format">
                    <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800 text-black dark:text-white" aria-label="Select download format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="md">.md</SelectItem>
                      <SelectItem value="txt">.txt</SelectItem>
                      <SelectItem value="json">.json</SelectItem>
                      <SelectItem value="html">.html</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white" aria-label="Download file">
                    <Download aria-hidden="true" /> Download
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}