import React, { useState } from 'react'

interface TextWithEllipseProps {
  text: string
  lineNumber?: number
  allowToggleText?: boolean
  style?: React.CSSProperties
  className?: string
}

export const TextWithEllipse: React.FC<TextWithEllipseProps> = ({
  text,
  lineNumber = 1,
  allowToggleText = false,
  style,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (!allowToggleText) return
    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }

  const clampStyle: React.CSSProperties = isExpanded ? {} : {
    display: '-webkit-box',
    WebkitLineClamp: lineNumber,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div
      onClick={handleClick}
      className={className}
      style={{
        whiteSpace: 'pre-line',
        cursor: allowToggleText ? 'pointer' : 'default',
        ...clampStyle,
        ...style,
      }}
    >
      {text}
    </div>
  )
}
