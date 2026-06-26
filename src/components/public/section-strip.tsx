/**
 * SectionStrip - wraps a section and renders a centered semi-transparent
 * frosted strip behind the content. The strip is exactly as wide as
 * max-w-7xl + a small margin, with sharp vertical edges. Between sections
 * the strip is absent so the background photo shows through clearly.
 */
export function SectionStrip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* The frosted strip - centered, sharp edges, stops at section boundary */}
      <div
        className="absolute inset-y-0 left-1/2 pointer-events-none"
        style={{
          transform: 'translateX(-50%)',
          width: 'min(calc(100% - 1rem), calc(80rem + 3rem))',
          backgroundColor: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />
      {/* Content sits above the strip */}
      <div className="relative">
        {children}
      </div>
    </div>
  )
}
