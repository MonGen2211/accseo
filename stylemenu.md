# ACC SEO Sidebar Navigation Drawer Style Guide (stylemenu.md)

Tài liệu này quy chuẩn hóa thiết kế của thanh điều hướng bên trái (Sidebar Navigation Drawer) của hệ thống **ACC SEO** theo hướng chuyên nghiệp nhất, áp dụng triệt để nguyên lý thiết kế **Google Material Design 3 (M3)** kết hợp với phong cách tối giản của các bảng điều khiển doanh nghiệp hiện đại.

---

## 1. Phân Tích Hiện Trạng & Định Hướng Nâng Cấp

Dựa trên thiết kế hiện tại (ảnh chụp màn hình):
*   **Điểm tốt**: Bố cục rõ ràng, chia nhóm danh mục tốt (Overview, Keywords, Services, Developers), có chế độ thu gọn (collapsed), màu sắc đồng bộ với tông thương hiệu Emerald `#00b894`.
*   **Điểm cần tối ưu (Để chuyên nghiệp hơn)**:
    1.  **Dáng nút Active**: Đang sử dụng hình chữ nhật bo góc nhẹ (`borderRadius: 2` ~ 8px). Để chuẩn M3, nút được kích hoạt phải có hình dáng bo tròn hoàn toàn dạng viên thuốc (**Pill shape**) hoặc bo tròn sâu hơn (`borderRadius: '100px'` hoặc `'24px'`).
    2.  **Đường kẻ phân cách (Dividers)**: Nét đứt (dashed style) tạo cảm giác hơi "rời rạc" và tăng nhiễu thị giác (visual noise). Nên chuyển sang nét liền mỏng (solid 1px) với màu sắc mờ thích ứng theo theme.
    3.  **Tiêu đề nhóm (Section Headers)**: Khoảng cách đệm và cỡ chữ cần căn chỉnh tỉ lệ vàng để tạo độ tương phản tốt với các mục điều hướng.
    4.  **Hiệu ứng Hover & Focus (Micro-interactions)**: Cần thêm các chuyển động mượt mà (smooth transitions, trượt nhẹ lề trái) để tăng trải nghiệm xúc giác khi rê chuột.
    5.  **Thanh cuộn (Scrollbar)**: Cần tinh chỉnh để thanh cuộn siêu mảnh và ẩn đi khi không tương tác, tạo cảm giác liền mạch.

---

## 2. Quy Chuẩn Giao Diện Chi Tiết (Visual Specifications)

### 2.1. Kích Thước & Trạng Thái Co Giãn (Sizing & Grid Layout)
*   **Chiều rộng mở rộng (Expanded Width)**: Cố định ở mức `260px` để đảm bảo hiển thị trọn vẹn nhãn văn bản tiếng Việt dài mà không bị tràn hay xuống dòng.
*   **Chiều rộng thu gọn (Collapsed Width)**: Cố định ở mức `76px` để tối ưu hóa không gian làm việc.
*   **Chiều cao mỗi mục (Item Height)**: `46px` cho trạng thái mở rộng và `46px` cho trạng thái thu gọn (thiết kế cân đối cho màn hình compact zoom 0.8).
*   **Độ bo góc các mục điều hướng (Border Radius)**:
    *   Trạng thái Active (Đang chọn): Bo tròn viên thuốc tuyệt đối (`borderRadius: '100px'`).
    *   Trạng thái Hover (Rê chuột): Bo tròn viên thuốc tuyệt đối (`borderRadius: '100px'`).

### 2.2. Màu Sắc & Trạng Thái Trực Quan (Colors & State Layer)

| Trạng thái điều hướng | Màu nền (Background) | Màu Chữ (Text) | Màu Icon (Icon Color) | Hiệu ứng đặc biệt |
| :--- | :--- | :--- | :--- | :--- |
| **Active (Đang chọn)** | Light: `rgba(0, 184, 148, 0.06)`<br>Dark: `rgba(0, 184, 148, 0.09)` | `primary.main`<br>(Emerald `#00b894`) | `primary.main`<br>(Emerald `#00b894`) | Thêm viền mỏng biên trái hoặc hiệu ứng bóng nhẹ nếu cần nổi bật |
| **Hover (Rê chuột)** | Light: `rgba(0, 0, 0, 0.03)`<br>Dark: `rgba(255, 255, 255, 0.03)` | `text.primary` | `text.primary` | Dịch chuyển nhẹ lề trái `transform: 'translateX(4px)'` |
| **Default (Mặc định)** | `transparent` | `text.secondary` | `text.secondary` | - |

*   *Lưu ý*: Mọi mã màu nền của trạng thái Active bắt buộc phải dùng trị số trong suốt mờ (`rgba`) thích ứng theo nền sáng hoặc tối để tránh hiện tượng tương phản gắt làm nhức mắt.

### 2.3. Đường Kẻ Phân Cách & Đầu Trang (Dividers & Header)
*   **Đường kẻ phân cách (Dividers)**: Viền solid mảnh `1px`, sử dụng màu hệ thống `divider` để tự động chuyển sáng/tối. Loại bỏ hoàn toàn đường viền nét đứt (dashed/dotted).
*   **Logo & Brand Name Section**:
    *   Logo bọc trong một Box phẳng với `borderRadius: '12px'` hoặc `10px`.
    *   Văn bản thương hiệu "ACC SEO" sử dụng font chữ `h6` hoặc tương đương, độ đậm `800` (Extra Bold), màu sắc `text.primary`.
    *   Nút đóng/mở sidebar sử dụng biểu tượng Chevron, bo góc tròn nhẹ, viền mảnh để hòa hợp với bố cục.

---

## 3. Mã Nguồn Hiện Thực Hóa Gợi Ý (MUI/React Code Snippet)

Dưới đây là cấu hình mã nguồn thuộc tính `sx` cho các phần tử menu trong tệp tin `DashboardPage.tsx` để đạt được giao diện chuyên nghiệp chuẩn M3:

### 3.1. Thân Sidebar (Paper Container)
```typescript
sx={{
  width: { xs: '100%', md: sidebarWidth },
  flexShrink: 0,
  pt: 2,
  pl: 2,
  pr: sidebarCollapsed ? 2 : 2, // Đảm bảo đối xứng hoàn hảo hai bên
  pb: 2,
  borderRadius: 0,
  border: 'none',
  borderRight: '1px solid',
  borderColor: 'divider',
  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  position: { xs: 'static', md: 'fixed' },
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 1100,
  overflow: 'hidden',
  boxShadow: 'none',
  transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
}}
```

### 3.2. Tiêu Đề Nhóm (Category Section Header)
```typescript
{!sidebarCollapsed && (
  <Typography 
    variant="caption" 
    sx={{ 
      fontWeight: 700, 
      fontSize: '0.68rem', 
      color: 'text.disabled', 
      letterSpacing: '1.2px', 
      px: 2, // Thụt lề bằng với padding của nút bấm điều hướng
      mt: 1.5,
      mb: 0.5,
      textTransform: 'uppercase'
    }}
  >
    {category.title}
  </Typography>
)}
```

### 3.3. Phần Tử Menu Điều Hướng (Navigation List Item Box)
```typescript
<Box
  key={tab.id}
  onClick={() => handleTabChange(tab.id)}
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
    gap: sidebarCollapsed ? 0 : 2,
    py: 1.2,
    px: sidebarCollapsed ? 0 : 2,
    width: sidebarCollapsed ? 46 : 'auto',
    height: 46,
    mx: sidebarCollapsed ? 'auto' : 0,
    borderRadius: '100px', // Đổi từ 2 (8px) sang '100px' để tạo M3 Pill shape
    cursor: 'pointer',
    color: isActive ? 'primary.main' : 'text.secondary',
    bgcolor: isActive 
      ? (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.09)' : 'rgba(0, 184, 148, 0.06)'
      : 'transparent',
    border: 'none', // Bỏ viền ngoài để menu trông phẳng và sạch sẽ hơn
    position: 'relative',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.9rem',
    
    // Hiệu ứng thanh chỉ báo đứng (Vertical Indicator Stripe) ở lề trái cho mục đang chọn
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 8,
      width: 4,
      height: isActive ? 16 : 0,
      borderRadius: '2px',
      bgcolor: 'primary.main',
      transition: 'height 0.2s ease-in-out',
    },
    
    '&:hover': {
      color: isActive ? 'primary.main' : 'text.primary',
      bgcolor: isActive 
        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 184, 148, 0.12)' : 'rgba(0, 184, 148, 0.08)'
        : 'action.hover',
      // Dịch chuyển nhẹ sang phải khi hover (chỉ áp dụng khi không thu gọn và không active)
      transform: (!isActive && !sidebarCollapsed) ? 'translateX(4px)' : 'none',
      '& .MuiSvgIcon-root': {
        color: isActive ? 'primary.main' : 'text.primary',
        transform: 'scale(1.05)',
      }
    },
    '&:active': {
      transform: 'scale(0.97)'
    },
    '& .MuiSvgIcon-root': {
      fontSize: 20,
      color: isActive ? 'primary.main' : 'text.secondary',
      transition: 'all 0.2s ease-in-out',
      ml: sidebarCollapsed ? 0 : 0.5, // Căn giữa icon khi thu gọn
    }
  }}
>
  {tab.icon}
  {!sidebarCollapsed && (
    <Typography sx={{ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' }}>
      {tab.label}
    </Typography>
  )}
</Box>
```

---

## 4. Tinh Chỉnh Nâng Cao Cho Trải Nghiệm Tối Ưu (UX Enhancements)

1.  **Chế độ cuộn tinh tế (Scroll Area)**:
    Khu vực danh sách menu bắt buộc phải có thuộc tính `overflowY: 'auto'`. Thanh cuộn cần được ẩn đi mặc định và chỉ hiển thị siêu mảnh (`3px` đến `4px` chiều rộng) khi người dùng di chuột vào vùng menu để loại bỏ cảm giác nặng nề.
2.  **Tooltip cho chế độ Thu Gọn (Tooltip on Collapse)**:
    Khi thanh Sidebar ở trạng thái thu gọn (`sidebarCollapsed === true`), bắt buộc phải bọc toàn bộ nút điều hướng trong component `<Tooltip title={tab.label} placement="right" arrow>` để đảm bảo người dùng vẫn biết chính xác chức năng của từng biểu tượng.
3.  **Hành động chuyển đổi trạng thái (Transitions)**:
    Hiệu ứng đóng/mở sidebar cần sử dụng hàm chuyển tiếp `cubic-bezier(0.4, 0, 0.2, 1)` với thời gian `0.2s` để tạo cảm giác phản hồi nhanh nhạy, mượt mà thay vì giật cục bộ.
