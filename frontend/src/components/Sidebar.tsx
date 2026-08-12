import React from 'react'

export const Sidebar: React.FC = () => {
  return (
    <aside className="site-sidebar">
      {/* Attention / Rules Roundbox */}
      <div className="roundbox">
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Chú ý quan trọng
          </span>
        </div>
        <div className="roundbox-body rule-box">
          <p>
            <strong>Lotus Online Judge</strong> là hệ thống luyện tập thuật toán và thi đấu lập trình trực tuyến.
          </p>
          <ul style={{ paddingLeft: '16px', margin: '8px 0' }}>
            <li>Mỗi thí sinh chỉ được sử dụng một tài khoản duy nhất.</li>
            <li>Tất cả các bài nộp được chấm tự động bởi hệ thống máy chấm độc lập.</li>
            <li>Nghiêm cấm chia sẻ mã nguồn trong suốt thời gian kỳ thi diễn ra.</li>
          </ul>
        </div>
      </div>

      {/* Info Roundbox */}
      <div className="roundbox">
        <div className="caption titled">
          <span>
            <span className="caption-arrow">→</span> Thông tin hệ thống
          </span>
        </div>
        <div className="roundbox-body">
          <ul className="sidebar-list">
            <li>
              Hệ thống xếp hạng: <span className="highlight-text">Thang điểm Lotus</span>
            </li>
            <li>
              Ngôn ngữ hỗ trợ: <span className="highlight-text">C++, Java, Python, C#</span>
            </li>
            <li>
              Máy chủ chấm: <span className="highlight-text">Môi trường cách ly an toàn</span>
            </li>
            <li>
              Phiên bản: <span className="highlight-text">v1.0.0 (Bản Tiếng Việt)</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}
