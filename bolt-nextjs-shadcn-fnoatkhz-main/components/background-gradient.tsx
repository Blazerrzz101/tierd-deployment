"use client"

export function BackgroundGradient() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Primary gradient spot */}
      <div 
        className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(255, 69, 0, 0.15) 0%, transparent 70%)",
          filter: "blur(80px)"
        }}
      />
      
      {/* Secondary gradient spot */}
      <div 
        className="absolute right-1/4 bottom-1/4 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle at center, rgba(255, 69, 0, 0.1) 0%, transparent 70%)",
          filter: "blur(80px)"
        }}
      />
      
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  )
}