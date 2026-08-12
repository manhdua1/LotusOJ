import React, { useEffect, useState } from 'react'

export const Footer: React.FC = () => {
  const [serverTime, setServerTime] = useState<string>('')

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setServerTime(`${d}/${m}/${y} ${hh}:${mm}:${ss} (UTC+7)`)
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className="site-footer">
      <div className="footer-links">
        <a href="#about" onClick={(e) => e.preventDefault()}>LotusOJ © 2026</a>
        {' | '}
        <a href="#rules" onClick={(e) => e.preventDefault()}>Quy chế thi đấu</a>
        {' | '}
        <a href="#privacy" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a>
        {' | '}
        <a href="#support" onClick={(e) => e.preventDefault()}>Phát triển bởi Cộng đồng Lotus</a>
      </div>
      <div className="server-time">
        Thời gian máy chủ: <span>{serverTime || 'Đang tải...'}</span>
      </div>
    </footer>
  )
}
