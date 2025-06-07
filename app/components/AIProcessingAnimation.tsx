import { useEffect, useState } from 'react'

const dataElements = [
  'experience',
  'skills',
  'education',
  'projects',
  'achievements',
  'certifications',
  'technologies',
  'languages',
  'frameworks',
  'databases',
  'tools',
  'methodologies',
  'leadership',
  'collaboration',
  'communication',
  'problem-solving',
  'analytics',
  'design',
  'development',
  'testing',
  'deployment',
  'optimization',
  'innovation',
]

interface DataItem {
  id: string
  text: string
}

interface DataColumn {
  id: number
  items: DataItem[]
  speed: number
  offset: number
}

export function AIProcessingAnimation() {
  const [columns, setColumns] = useState<DataColumn[]>([])

  useEffect(() => {
    const generateColumns = () => {
      const newColumns: DataColumn[] = []
      for (let i = 0; i < 8; i++) {
        newColumns.push({
          id: i,
          items: Array.from({ length: 12 }, (_, idx) => ({
            id: `${i}-${idx}-${Date.now()}`,
            text: dataElements[Math.floor(Math.random() * dataElements.length)],
          })),
          speed: 2 + Math.random() * 3,
          offset: Math.random() * 100,
        })
      }
      setColumns(newColumns)
    }

    generateColumns()
    const interval = setInterval(generateColumns, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-80 h-96 mx-auto overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            linear-gradient(45deg, 
              rgba(59, 130, 246, 0.8) 0%, 
              rgba(147, 51, 234, 0.8) 25%, 
              rgba(236, 72, 153, 0.8) 50%, 
              rgba(59, 130, 246, 0.8) 75%, 
              rgba(147, 51, 234, 0.8) 100%
            )
          `,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 4s ease-in-out infinite',
        }}
      />

      {/* Matrix columns */}
      <div className="absolute inset-0 flex justify-between items-start p-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col space-y-2 opacity-80"
            style={{
              animation: `matrixFlow ${column.speed}s linear infinite`,
              animationDelay: `${column.offset}s`,
            }}
          >
            {column.items.map((item) => (
              <div
                key={item.id}
                className="text-xs font-mono text-green-300 whitespace-nowrap"
                style={{
                  textShadow: '0 0 8px rgba(34, 197, 94, 0.8)',
                  opacity: Math.random() * 0.5 + 0.5,
                  animation: 'textGlow 2s ease-in-out infinite alternate',
                }}
              >
                {item.text}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Center processing indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full border-4 border-transparent"
            style={{
              background:
                'linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
              animation: 'spin 3s linear infinite',
            }}
          />
          <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
            <div className="text-sm font-semibold text-white">AI</div>
          </div>
        </div>
      </div>

      {/* Scanning line effect */}
      <div
        className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-400 to-transparent opacity-80"
        style={{
          animation: 'scanLine 2s ease-in-out infinite',
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes matrixFlow {
          0% { transform: translateY(-120px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(400px); opacity: 0; }
        }
        
        @keyframes textGlow {
          0% { text-shadow: 0 0 8px rgba(34, 197, 94, 0.8); }
          100% { text-shadow: 0 0 20px rgba(34, 197, 94, 1), 0 0 30px rgba(34, 197, 94, 0.8); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>

      {/* Status text */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="text-white text-sm font-medium opacity-90">Analyzing Resume Data...</div>
        <div className="text-cyan-300 text-xs mt-1 opacity-70">
          Extracting • Structuring • Optimizing
        </div>
      </div>
    </div>
  )
}
