# ACC SEO UI/UX & System Style Guide (STYLE.md)

Tài liệu này quy định tất cả các tiêu chuẩn thiết kế giao diện (UI), trải nghiệm người dùng (UX), khoảng cách, cỡ chữ, và cơ chế quản lý dữ liệu đệm (caching) của dự án **ACC SEO**. Mọi nhà phát triển và các AI coding assistant cần tuân thủ nghiêm ngặt các quy tắc dưới đây.

---

## 0. Công nghệ cốt lõi (Core Tech Stack Rules)
- **UI Library**: Bắt buộc sử dụng **Material-UI (MUI v5/v6)**. Tuyệt đối KHÔNG sử dụng Tailwind CSS hoặc thư viện UI khác trừ khi có chỉ định riêng biệt từ User.
- **Icon Library**: Sử dụng duy nhất `@mui/icons-material`. KHÔNG import từ `lucide-react`, `react-icons` hay bất kỳ thư viện icon nào khác để đảm bảo tính đồng nhất của dự án.
- **Styling Method**: Tất cả các tùy biến bố cục, căn chỉnh, màu sắc bắt buộc phải được viết thông qua thuộc tính `sx={{ ... }}` của các Component thuộc hệ sinh thái MUI. Hạn chế tối đa inline styles (`style={{ ... }}`) hoặc CSS thuần ngoài tệp tin cấu hình.
- **TypeScript Strict Mode**: Mọi biến, tham số hàm (function parameters), dữ liệu trả về từ API, và Props của Component bắt buộc phải được định nghĩa Type hoặc Interface rõ ràng. Tuyệt đối **KHÔNG** sử dụng kiểu dữ liệu `any`.
- **Path Aliases Import**: Tất cả các lệnh `import` từ thư mục khác bắt buộc phải sử dụng ký tự đại diện `@/` để trỏ từ thư mục `src`. Tuyệt đối không dùng đường dẫn tương đối sâu (`../../../../`).
  - *Ví dụ đúng*: `import { DomainTable } from '@/features/domains/components';`
  - *Ví dụ sai*: `import { DomainTable } from '../../../components/DomainTable';`

---

## 1. Nút bấm & Điều khiển (Buttons & Controls)

### Quy chuẩn hình dáng (Shapes & Border Radius)
- **Nút bấm tiêu chuẩn (Pill Buttons)**: Bo tròn hoàn toàn dạng viên thuốc (`borderRadius: '100px'` hoặc `borderRadius: 25`).
  - *Chiều cao chuẩn*: `40px` cho hành động chính/bảng điều khiển; `36px` cho phân trang và tác vụ nhỏ.
- **Nút tròn biểu tượng (Circular Icon Buttons)**: Tròn tuyệt đối (`borderRadius: '50%'`, kích thước `32px` hoặc `40px`). Áp dụng cho nút Chọn/Hủy giỏ hàng, nút Hướng dẫn sử dụng (FAB).
- **Thẻ lựa chọn (Toggle Chips / Segmented Tabs)**: Bo dạng viên thuốc (`borderRadius: '100px'` hoặc `borderRadius: 25`).

### Phân cấp nút bấm (Hierarchies)
- **Filled Button (Hành động chính)**:
  - Nền màu chủ đạo hệ thống (`bgcolor: 'primary.main'` - tương ứng màu Green Emerald `#00b894` được thiết lập trong `theme.ts`), chữ trắng.
  - Hover: Tự động đổi màu nền sang `bgcolor: 'primary.dark'` (Primary Dark), phóng to `1.02` nhẹ kèm hiệu ứng chuyển tiếp mượt mà (`transition: 'all 0.2s'`).
  - *Luật bắt buộc*: Nếu hệ thống Theme của dự án đã cấu hình màu `#00b894` làm màu chủ đạo, bắt buộc sử dụng token hệ thống `bgcolor: 'primary.main'` và `bgcolor: 'primary.dark'` khi viết thuộc tính `sx`. Chỉ sử dụng mã HEX nếu component nằm ngoài cấu hình theme.
- **Tonal / Outlined Button (Hành động phụ / Tiện ích)**:
  - Viền mỏng `1px solid`, màu viền và màu chữ đồng bộ với `theme.palette.divider` hoặc `primary.main`.
  - Nền hover: `action.hover` (màu trắng mờ/slate mờ tương ứng chế độ tối/sáng).
- **Danger Button (Hành động nguy hiểm / Xóa)**:
  - Bắt buộc dùng hệ màu lỗi của MUI: Nền `bgcolor: 'error.main'`, chữ trắng.
  - Hover: Chuyển sang `bgcolor: 'error.dark'`, phóng to `1.02` nhẹ kèm hiệu ứng chuyển tiếp mượt mà (`transition: 'all 0.2s'`).

---

## 2. Khoảng cách & Bố cục lưới (Spacing & Layout Grid)

### Hệ số khoảng cách cơ bản (MUI Grid - 8px base)
Dự án áp dụng hệ số nhân 8px của MUI (`p: 1` = 8px, `p: 2` = 16px...) cho tất cả lề trong (padding) và lề ngoài (margin):
- **p: 1 (8px)**: Khoảng cách giữa các chip, biểu tượng hoặc khoảng cách lề rất hẹp.
- **p: 2 (16px)**: Khoảng cách đệm bên trong các ô bảng (Table Cell), Toolbar tìm kiếm, các nút phân trang.
- **p: 3 (24px)**: Khoảng cách đệm chuẩn cho các khối lớn (Paper, Thẻ danh sách, Ô nhập thông số).
- **p: 4 (32px)**: Khoảng cách đệm cho Modal Dialog lớn hoặc màn hình chào mừng (Welcome screens).

### Bố cục Lưới & Căn lề
- **Lưới tổng thể của trang**: Sử dụng CSS Grid qua thuộc tính `sx` cho độ rộng linh hoạt:
  ```typescript
  sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 3 }}
  ```
- **Lưới hiển thị 3 cột trên Desktop**:
  ```typescript
  sx={{
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
    gap: 3.5
  }}
  ```
- **Bảng dữ liệu (Tables)**:
  - Độ rộng nhỏ nhất của bảng (`minWidth`) luôn phải được định nghĩa để tránh vỡ giao diện trên màn hình nhỏ.
  - Thanh cuộn ngang của bảng được thiết kế mảnh (`height: 8`), góc bo tròn `4px` và màu sắc đồng bộ với chế độ tối (`divider`).
  - *Luật bắt buộc*: Tất cả các component `<Table>` bắt buộc phải được bọc trong `<TableContainer component={Paper} sx={{ overflowX: 'auto', width: '100%' }}>` để kích hoạt thanh cuộn ngang responsive tự động trên thiết bị di động.
- **Ưu tiên sử dụng Stack**: Đối với các bố cục tuyến tính đơn giản (hàng ngang hoặc cột dọc có khoảng cách đều nhau), bắt buộc sử dụng component `<Stack>` của MUI phối hợp với thuộc tính `spacing`. Không lạm dụng `<Box sx={{ display: 'flex', gap: ... }}>` một cách thủ công.
  - *Ví dụ đúng*: `<Stack direction="row" spacing={2} alignItems="center">`

---

## 3. Quy chuẩn cỡ chữ & Phân cấp kiểu chữ (Typography)

Sử dụng phông chữ duy nhất là **"Inter"** (kèm fallback `system-ui`).

| Kiểu chữ (MUI Variant) | Cỡ chữ (Size) | Độ đậm (Weight) | Màu sắc (Color) | Mục đích sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Metric Large** (Custom) | `2.5rem` (40px) | `900` (Black) | `text.primary` | Số liệu thống kê tổng quan (Dashboard metrics) |
| **h1** | `2.0rem` (32px) | `800` (Extra Bold)| `text.primary` | Tiêu đề trang lớn chính |
| **h6** | `1.0rem` (16px) | `800` (Extra Bold)| `text.primary` | Tiêu đề khối, tiêu đề thẻ danh sách |
| **body1** (Tiêu chuẩn) | `1.0rem` (16px) | `500` (Medium) | `text.primary` | Văn bản chính, dữ liệu trong bảng |
| **body2** (Nhỏ) | `0.875rem` (14px)| `600` / `700` | `text.secondary` | Thẻ mô tả, nhãn phụ, thông tin chi tiết phụ |
| **caption** (Chú thích) | `0.75rem` (12px) | `500` / `600` | `text.secondary` | Số lượng đề xuất, ngày thực hiện, nhãn thời gian |

- **Đường dẫn liên kết (Links)**: Sử dụng component `<Link>` của MUI, luôn bỏ gạch chân (`underline="none"`), chữ màu xanh thương hiệu (`#1976d2` hoặc `#00b894`), độ đậm chữ `500`.
- **Xử lý tràn văn bản (Text Overflow)**: Đối với các dữ liệu có độ dài không cố định như Tên miền (Domains), Từ khóa (Keywords), Thẻ mô tả (Meta Description) khi hiển thị trong Bảng hoặc Card:
  - Bắt buộc phải tích hợp thuộc tính `noWrap` của MUI `<Typography noWrap>`.
  - Hoặc cấu hình giới hạn dòng bằng dòng lệnh: `sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}` nếu muốn hiển thị tối đa 2 dòng.

---

## 4. Quy chuẩn Form & Ô nhập liệu (Forms & Inputs Validation)
- **TextField**: Luôn sử dụng biến thể `variant="outlined"` và thuộc tính `fullWidth`.
- **Trạng thái lỗi (Validation Error)**: Khi dữ liệu nhập vào không hợp lệ hoặc thiếu, trường nhập liệu phải kích hoạt thuộc tính `error={true}` và hiển thị thông báo lỗi trực quan chi tiết qua `helperText`.
- **Nút gửi (Submit)**: Trong quá trình Form đang chạy kiểm tra dữ liệu hoặc đang gửi API, nút Submit phải chuyển sang trạng thái `disabled={isSubmitting}` để tránh người dùng thao tác click lặp lại nhiều lần.
- **Quy chuẩn xử lý logic quyền ADMIN**: Tại các cụm chức năng giới hạn quyền (Sửa/Xóa tên miền), bắt buộc bọc component hoặc kiểm tra điều kiện bằng hook `useRole(['ADMIN'])` nội bộ của hệ thống (Ví dụ: `const isAdmin = useRole(['ADMIN']);` và cấu hình `disabled={!isAdmin}` hoặc `if (!isAdmin) return null;`).
- **Cơ chế bắt lỗi đồng bộ (Async Handling)**: Mọi thao tác submit form, gọi API (Xóa, Sửa, Check Meta) bắt buộc phải được bọc trong khối `try/catch`. Trong khối `catch`, tuyệt đối không chỉ viết mỗi `console.error()`, bắt buộc phải gọi Toast thông báo lỗi trực quan cho người dùng (Ví dụ: `showToast(error.message || 'Có lỗi xảy ra!', 'danger')` hoặc `toast.error(error.message || 'Có lỗi xảy ra!')`).
- **Form Management Library**: Bắt buộc sử dụng **React Hook Form** để quản lý trạng thái của Form. Mọi quy tắc kiểm tra dữ liệu (Validation) phải được cấu hình tập trung bằng **Zod / Yup schema** bọc qua `hookform/resolvers`. Tuyệt đối không tự viết logic validate thủ công bằng `useState`.
- **Nút gửi & Hiệu ứng tải (Loading Button)**: Thay vì sử dụng `<Button disabled={isSubmitting}>`, bắt buộc sử dụng component `<LoadingButton loading={isSubmitting} variant="contained">` từ thư viện `@mui/lab` để tự động hiển thị vòng xoay loading đồng bộ trên nút bấm.

---

## 5. Quy định lưu trữ & Bộ nhớ đệm (Caching & States)

### Lưu trữ lâu dài (Indefinite Cache - LocalStorage)
- **Cấu hình giao diện (`themeMode`)**: Lưu trữ giá trị `'light'` hoặc `'dark'` để duy trì giao diện người dùng lựa chọn giữa các phiên làm việc.
- **Xác thực phiên làm việc (`user`)**: Lưu trữ thông tin hồ sơ người dùng đăng nhập (`user` JSON string) kèm token xác thực. Xóa ngay khi người dùng chọn Đăng xuất.
- **Thông báo hệ thống (`notifications`)**: Lưu trữ danh sách tối đa `50` thông báo gần nhất để tránh tải lại từ API mỗi khi người dùng mở panel.
- **Lịch sử tác vụ URL Scraper (`url_scraper_history`)**: Lưu trữ danh sách URL đã cào gần nhất để người dùng dễ dàng xem lại.

### Lưu trữ tạm thời (In-Memory Cache - Redux & SWR)
- **Danh sách tên miền (`domains`)**: Quản lý tập trung qua Redux Toolkit (`domainSlice`).
- **Thống kê API và tác vụ (`usageStats`)**: Sử dụng bộ đệm SWR kết hợp API fetching.
  - *Deduplication Interval (Tránh spam API)*: Đặt ở mức `2000ms`.
  - *Revalidate on Focus*: Đặt thành `false` để tránh việc cứ chuyển tab trình duyệt hoặc quay lại cửa sổ là gửi API tải lại toàn bộ.
- **Hủy bộ đệm khi chuyển đổi tính năng**: Khi unmount một tab tính năng (như tắt bảng EXIF hay đổi tab gợi ý), các bộ lọc tạm thời và dữ liệu xem trước phải được xóa sạch (gọi action clear tương ứng) để giải phóng bộ nhớ RAM của trình duyệt.

---

## 6. Trạng thái phản hồi & Hiệu ứng tải (Feedback & Loaders)

Không bao giờ được để màn hình trống hoặc không có phản hồi khi hệ thống đang xử lý:

- **Bộ xương tải dữ liệu (Skeletons)**:
  - Khi tải danh sách/thẻ: Sử dụng component `<Skeleton variant="rounded" />` với bo góc tương tự hình dáng thẻ thật (ví dụ: `borderRadius: 3` hoặc `borderRadius: 4`).
  - Chiều cao skeleton khớp với chiều cao trung bình của nội dung sẽ hiển thị.
- **Vòng xoay tải nhanh (Circular Progress)**:
  - Sử dụng kích thước nhỏ `size={16}` lồng ngay trong icon thao tác (ví dụ: Icon check meta, Icon xóa) để thông báo riêng lẻ dòng đó đang xử lý.
- **Màn hình trống (Empty States)**:
  - Khi danh sách trống: Sử dụng thẻ `<Box>` có viền nét đứt (`border: '1px dashed'`, `borderColor: 'divider'`, `borderRadius: 4`), nội dung chữ in nghiêng màu `text.secondary`.
- **Thông báo nổi (Toasts)**:
  - Sử dụng Toastify hoặc Snackbar với ba màu chuẩn hóa: Xanh lá (Success), Vàng cam (Warning), Đỏ (Error/Danger).
- **Trạng thái lỗi tải dữ liệu (Error States)**:
  - Khi API trả về lỗi và không thể tải khối dữ liệu (bảng, dashboard), không sử dụng màn hình trống. Phải hiển thị một thẻ `<Box>` có màu nền `error.lighter` (hoặc nền đỏ mờ ở dark mode), viền mỏng kèm icon `ErrorOutline` (hoặc `ErrorOutlined`) và một nút bấm "Thử lại" (Retry Button) để kích hoạt hàm `mutate()` của SWR hoặc gọi lại API.

---

## 7. Quy tắc chống giao diện AI hóa (Anti-AI UI Patterns)

Để đảm bảo sản phẩm cuối cùng mang phong cách chuyên nghiệp của một hệ thống doanh nghiệp (Enterprise System) thay vì các giao diện concept mang tính trình diễn do AI tự vẽ, bắt buộc tuân thủ 5 quy tắc "chống AI hóa" sau đây:

### 1. Diệt tận gốc Gradient sến (Ban Neon Gradients)
- **Mô tả**: AI thường tự động thêm các dải màu chuyển sắc sặc sỡ (như tím pha hồng, xanh neon) vào các nút bấm, đường viền hoặc thanh điều hướng.
- **Luật thiết kế**: Tuyệt đối **KHÔNG** sử dụng `linear-gradient` hoặc `radial-gradient` cho màu nền (background), đường viền (border) hay văn bản (text), trừ khi có yêu cầu rõ ràng từ User. Tất cả các khối phải sử dụng màu phẳng (Solid Colors) nằm trong bảng màu hệ thống (`primary.main`, `background.paper`, `text.primary`).
- **Ví dụ cấm**: `background: 'linear-gradient(45deg, #fe6b8b, #ff8e53)'`.

### 2. Ép phẳng giao diện, cấm bóng đổ lố lăng (Flat Over Floating)
- **Mô tả**: Giao diện do AI thiết kế thường lạm dụng đổ bóng rất đậm, lan rộng và phát sáng (glow) để tạo cảm giác các khối đang "bay".
- **Luật thiết kế**: Hạn chế tối đa việc sử dụng thuộc tính `boxShadow` tùy biến dạng chuỗi pixel dài. Hãy sử dụng hệ thống thiết kế phẳng (Flat Design) hoặc sử dụng các mức độ nổi mặc định của MUI thông qua component `<Paper>` với thuộc tính `elevation={0}` (phẳng hoàn toàn có viền) hoặc `elevation={1}` (đổ bóng rất nhẹ). Đường phân tách giữa các khối phải sử dụng đường viền mảnh `1px` (`border: '1px solid', borderColor: 'divider'`).
- **Ví dụ cấm**: `boxShadow: '0 10px 30px rgba(0,184,148,0.3)'` hoặc `boxShadow: '0 0 15px #00b894'`.

### 3. Nói không với Hiệu ứng Kính mờ (No Glassmorphism)
- **Mô tả**: Nền mờ xuyên thấu trông bắt mắt nhưng làm chậm tốc độ hiển thị thiết bị và gây rối mắt khi đọc các bảng dữ liệu phức tạp.
- **Luật thiết kế**: Không sử dụng thuộc tính `backdropFilter: 'blur(...)'` hoặc nền có độ trong suốt cao cho các bảng dữ liệu, các thẻ nội dung chính hoặc thanh Sidebar. Nền các khối phải hiển thị màu đặc rõ ràng (`bgcolor: 'background.paper'` hoặc `bgcolor: 'background.default'`).
  - *Ngoại lệ*: Chỉ cho phép sử dụng hiệu ứng backdrop blur nhẹ trên tệp tin nền mờ của Dialog/Modal khi bật popup để thu hút sự tập trung của người dùng.

### 4. Tăng mật độ hiển thị dữ liệu (High Data Density)
- **Mô tả**: Thiết kế của AI thường rất lãng phí không gian (khoảng cách padding quá rộng, chữ quá to), làm loãng thông tin trên ứng dụng quản trị dữ liệu.
- **Luật thiết kế**: Tối ưu hóa tối đa lượng thông tin hiển thị trên một màn hình:
  - Các ô bảng dữ liệu (Table Cell) phải nhỏ gọn (`padding: '8px 16px'` hoặc thuộc tính `size="small"` của `<Table>`).
  - Sử dụng các ô nhập liệu dạng nhỏ gọn (`size="small"` cho `<TextField>`).
  - Tránh sử dụng các biến thể tiêu đề cỡ lớn như `h1`, `h2` cho các nhãn dữ liệu nhỏ. Nên sử dụng `body2` hoặc `subtitle2` có độ đậm chữ (`fontWeight: 600` hoặc `700`) để phân cấp thông tin rõ ràng.

### 5. Cấm Spam Icon và Emoji trang trí (No Useless Decorations)
- **Mô tả**: AI thường tự ý thêm các icon trang trí lấp lánh (✨, 🚀, 🔥, 💡) hoặc các vòng tròn vô nghĩa vào tiêu đề để giao diện nhìn "vui mắt".
- **Luật thiết kế**: Mọi icon được sử dụng phải phục vụ một chức năng cụ thể (tìm kiếm, xóa, sửa, cấu hình). Tuyệt đối **KHÔNG** thêm emoji trang trí thuần túy hoặc icon không có ý nghĩa chức năng vào tiêu đề khối, tiêu đề trang hay nhãn của nút bấm.
- **Ví dụ cấm**: `Thống kê hoạt động ✨`, `🚀 Đăng ký tên miền`.

---

## 8. Đồng bộ chế độ Sáng/Tối (Dark Mode Compliance)
- **Quy tắc cốt lõi**: Không bao giờ giả định nền luôn màu trắng hoặc chữ luôn màu đen.
- **Sử dụng Semantic Tokens**: Hạn chế tối đa việc hardcode mã màu HEX cho các vùng văn bản hoặc nền lớn. Bắt buộc sử dụng tokens tự động thích ứng của MUI:
  - Màu nền chính: `bgcolor: 'background.default'`
  - Nền của Card/Paper/Khối: `bgcolor: 'background.paper'`
  - Màu chữ chính: `color: 'text.primary'`
  - Màu chữ phụ/chú thích: `color: 'text.secondary'`
  - Đường kẻ phân cách: `borderColor: 'divider'`
- **Xử lý màu tùy biến**: Nếu bắt buộc sử dụng màu tùy biến ngoài Theme cho các trạng thái đặc biệt, phải sử dụng hàm callback để kiểm tra chế độ hiển thị:
  ```typescript
  sx={{
    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#1e293b' : '#f8fafc'
  }}
  ```

---

## 9. Quy chuẩn cấu trúc mã nguồn & Đặt tên (Code Architecture)
- **Tổ chức thư mục**: Mã nguồn Front-End phải được chia theo cấu trúc Feature-based:
  - `/src/components`: Chứa các UI components dùng chung toàn dự án (Button, Input, Table chung).
  - `/src/features/[feature_name]`: Chứa logic riêng của từng tính năng (ví dụ: `features/domains`, `features/keywords`). Trong đó gồm `/components` (giao diện riêng), `/hooks` (logic xử lý), `/services` (gọi API).
- **Quy tắc đặt tên file**:
  - *Tên tệp tin chứa React Component*: Bắt buộc dùng PascalCase (Ví dụ: `DomainTable.tsx`, `AddDomainDialog.tsx`).
  - *Tên tệp tin chứa custom hooks hoặc helper functions*: Bắt buộc dùng camelCase (Ví dụ: `useDomainStats.ts`, `formatUrl.ts`).
- **Phân rã Component**: Mỗi tệp tin Component không nên vượt quá 250 dòng code. Nếu vượt quá, nhà phát triển/AI phải chủ động tách các cụm UI nhỏ (như `TableRow`, `FilterBar`) ra thành các sub-components nằm trong cùng thư mục.
- **Quy chuẩn Export**: Bắt buộc sử dụng **Named Export** (`export const ComponentName = () => {}`) ngay tại đầu dòng định nghĩa. Tuyệt đối **KHÔNG** sử dụng `export default` ở cuối tệp tin để đảm bảo tính nhất quán khi Auto-Import.

---

## 10. Định dạng Dữ liệu & Thời gian (Data Formatting)
- **Hiển thị Thời gian**: Tất cả các mốc thời gian hiển thị trên giao diện (ngày cào, ngày cập nhật dữ liệu) phải được định dạng theo chuẩn: `DD/MM/YYYY` hoặc `DD/MM/YYYY HH:mm` (Sử dụng thư viện `date-fns` hoặc `dayjs`). KHÔNG để hiển thị chuỗi ISO nguyên bản từ API.
- **Hiển thị Số liệu số**:
  - *Số lượng từ khóa/Traffic*: Sử dụng định dạng phân tách phần ngàn bằng dấu phẩy (Ví dụ: `1,250,000`).
  - *Rút gọn số lớn (Dashboard)*: Với các số liệu thống kê tổng quan trên Dashboard, ưu tiên rút gọn thành `K` (Ngàn) hoặc `M` (Triệu) và làm tròn tối đa 1 chữ số thập phân (Ví dụ: `1.2M Keywords`, `45.5K Traffic`).
- **Xử lý dữ liệu trống (Null/Undefined Safety)**: Tại các ô hiển thị dữ liệu trong bảng, nếu giá trị trả về từ API là `null`, `undefined` hoặc chuỗi rỗng `""`, bắt buộc phải hiển thị ký tự mặc định là dấu gạch ngang `"-"` hoặc ký tự `"N/A"`. Tuyệt đối không để trống ô dữ liệu gây hiểu lầm cho trải nghiệm người dùng.
  - *Ví dụ*: `{domain.metaTitle || '-'}`

---

## 11. Trang quản lý Tên miền (Domain Management Flow)
Khi người dùng thao tác trong trang Quản lý Tên miền (Domains), các chức năng hoạt động theo luồng chuẩn:

### Luồng tương tác khi bấm vào các thành phần:
1. **Bấm vào Tên miền (Domain Link)**:
   - Điều hướng người dùng tới trang quản lý từ khóa cụ thể của tên miền đó: `/domains/:id/keywords`.
2. **Nút "Kiểm tra Meta" (Check Meta)**:
   - Icon nút chuyển sang trạng thái `<CircularProgress size={16} />`. Gửi yêu cầu kiểm tra thẻ title/description của tên miền.
   - Khi hoàn thành: Cập nhật trường "Thẻ mô tả" trong bảng và hiển thị Toast thông báo thành công.
3. **Nút "Chỉnh sửa" (Edit - Chỉ dành cho ADMIN)**:
   - Mở Form chỉnh sửa phân quyền người quản lý tên miền (Edit Owners Dialog).
   - Tải danh sách người dùng hệ thống (`usersList`) lên tới tối đa 200 tài khoản.
   - Admin chọn nhiều người dùng để gán quyền quản trị tên miền này.
4. **Nút "Xóa" (Delete - Chỉ dành cho ADMIN)**:
   - Mở Dialog xác nhận xóa chuẩn Material Design 3 (`borderRadius: '28px'`).
   - Người dùng bấm xác nhận mới thực hiện gọi API xóa và hiển thị Toast thông báo.
5. **Nút "Thêm Tên Miền"**:
   - Mở Dialog nhập tên miền mới dạng M3. Có kiểm tra định dạng tên miền hợp lệ trước khi gửi lên API.

---

## 12. Quy chuẩn thiết kế phòng thủ & Xử lý trường hợp biên (Defensive UI & Edge Cases)

Để đảm bảo giao diện hệ thống không bao giờ bị vỡ, đè chữ hoặc lệch layout khi dữ liệu thực tế tăng đột biến (Extreme States), toàn bộ mã nguồn phải tuân thủ nghiêm ngặt các quy tắc thiết kế phòng thủ sau:

### 12.1. Tràn số liệu siêu lớn hoặc dữ liệu lỗi (Astronomical Numeric Overflow & Bugged Data)
- **Ngữ cảnh**: Các khối đếm trạng thái, dashboard metrics hoặc các tag hiển thị số lượng dạng hình viên thuốc (như mẫu trong `image_f0c7be.png`). Đây là trường hợp số liệu tăng đột biến vượt ngưỡng hàng triệu, hàng tỷ, hoặc do lỗi vòng lặp dữ liệu của API khiến chuỗi số dài vô tận.
- **Luật thiết kế bắt buộc**:
  - **Giới hạn không gian cứng (Box Constraints)**: Tuyệt đối **KHÔNG** đặt giá trị cố định cho thuộc tính `width` của khối viên thuốc. Phải dùng `minWidth` để giữ dáng khối khi số nhỏ, nhưng bắt buộc phải giới hạn `maxWidth: '100%'` và thêm thuộc tính `overflow: 'hidden'` để cô lập, chặn đứng hoàn toàn việc chữ đâm thủng viền container ra ngoài.
  - **Cơ chế rút gọn đa tầng (Multi-tier Formatting)**:
    - *Ngưỡng thông thường (< 1,000,000,000)*: Rút gọn thành `K` (Ngàn) hoặc `M` (Triệu) theo chuẩn quốc tế.
    - *Ngưỡng cực đoan (>= 1,000,000,000 hoặc số mũ lớn)*: Bắt buộc tự động chuyển số liệu về dạng hiển thị khoa học (Exponential Notation) bằng hàm `.toExponential(2)` (Ví dụ: `1.00e+30`) để giao diện luôn gọn gàng trong mọi tình huống tồi tệ nhất.
  - **Chống tràn chữ ở tầng Typography (Text Clipping)**: Component chữ hiển thị số phải được cấu hình `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, và `textOverflow: 'ellipsis'`. Nếu chuỗi số vẫn vượt quá không gian hiển thị sau khi format, chữ sẽ tự động chuyển thành dấu ba chấm (`...`) thay vì tràn hàng.
  - **Trải nghiệm người dùng (UX Fallback)**: Khối viên thuốc bắt buộc phải được bọc trong component `<Tooltip>` của MUI để hiển thị con số gốc đầy đủ kèm dấu phân tách phần ngàn khi di chuột (hover).
- **Cú pháp mã nguồn mẫu cho AI**:
  ```typescript
  import React from 'react';
  import { Box, Typography, Tooltip } from '@mui/material';

  // Hàm format phòng thủ diện rộng
  export const formatDefensiveNumber = (num: number): string => {
    if (isNaN(num) || num === null || num === undefined) return '-';
    if (num >= 1e12) {
      return num.toExponential(2); // Tránh bug tràn số như case image_f0c7be.png (Ví dụ: 1.00e+30)
    }
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  export const MetricPill: React.FC<{ label: string; value: number }> = ({ label, value }) => {
    return (
      <Tooltip title={typeof value === 'number' ? value.toLocaleString('en-US') : '-'} arrow placement="top">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            borderRadius: '24px',
            py: 1.5,
            px: 2.5,
            minWidth: 100,
            maxWidth: '100%',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden', // Khóa chặt không cho chữ đâm xuyên qua viền
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, textTransform: 'uppercase' }}>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: 'text.primary',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis', // Thêm dấu ... nếu chữ vẫn cố tình tràn
              width: '100%',
              textAlign: 'center'
            }}
          >
            {formatDefensiveNumber(value)}
          </Typography>
        </Box>
      </Tooltip>
    );
  };
  ```

### 12.2. Tràn văn bản quá dài (Text Overflow & Long Strings)
- **Ngữ cảnh**: Các chuỗi dữ liệu có độ dài không thể kiểm soát như Tên miền dài, Đường dẫn URL đầy đủ, Cụm từ khóa SEO (Keywords) hoặc Thẻ mô tả (Meta Description) nằm trong Table Cell hoặc Card.
- **Luật thiết kế**:
  - Không để chữ tự động xuống dòng bừa bãi làm phình chiều cao dòng của bảng.
  - Bắt buộc áp dụng cắt chữ bằng dấu ba chấm (`...`) và phải bọc bằng `<Tooltip>` hoặc thuộc tính `title` để người dùng đọc được nội dung đầy đủ khi hover.
- **Cú pháp code mẫu**:
```typescript
// Cắt chữ trên 1 dòng duy nhất trong Table Cell
<Tooltip title={domain.name}>
  <Typography noWrap sx={{ maxWidth: 200 }}>
    {domain.name}
  </Typography>
</Tooltip>

// Cắt chữ giới hạn tối đa 2 dòng cho Meta Description
<Tooltip title={domain.metaDescription || '-'}>
  <Typography sx={{
    display: '-webkit-box',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  }}>
    {domain.metaDescription || '-'}
  </Typography>
</Tooltip>
```

### 12.3. Tràn số lượng phần tử (Element Multiplication - Chips/Tags Overflow)
- **Ngữ cảnh**: Một tên miền có quá nhiều người quản lý (Owners) hoặc một Từ khóa có quá nhiều thẻ Tag phân loại, nếu render tất cả ra sẽ làm thẻ Card hoặc dòng của Bảng bị kéo dài vô tận xuống phía dưới.
- **Luật thiết kế**:
  - Chỉ hiển thị tối đa 3 phần tử đầu tiên (Chips/Tags).
  - Các phần tử còn lại phải được thu gọn thành một Chip phụ có dạng `+X` (Ví dụ: `+5`, `+12`). Khi bấm hoặc hover vào Chip `+X` này, hệ thống sẽ hiển thị danh sách đầy đủ qua `<Popover>` hoặc `<Tooltip>`.

### 12.4. Tràn chiều cao Dialog/Modal (Vertical Viewport Overflow)
- **Ngữ cảnh**: Các Form nhập liệu dữ liệu lớn (như Form thêm hàng loạt tên miền, Form gán quyền cho danh sách 200 Users) khi hiển thị trên màn hình có độ phân giải thấp hoặc màn hình laptop nhỏ.
- **Luật thiết kế**:
  - Tuyệt đối không để chân của Dialog bị đẩy ra ngoài cạnh dưới của màn hình khiến người dùng không thể bấm được nút "Lưu" hoặc "Hủy".
  - Bắt buộc phải cố định chiều cao tối đa của phần thân Dialog (`DialogContent`) ở mức `maxHeight: '60vh'` hoặc `'70vh'` và bật thuộc tính `overflowY: 'auto'`. Nút bấm hành động (`DialogActions`) và Tiêu đề (`DialogTitle`) phải luôn được ghim cố định (Sticky).

### 12.5. Lỗi tải ảnh và biểu tượng (Image & Favicon Fallback State)
- **Ngữ cảnh**: Các hình ảnh đại diện của người dùng (Avatar) hoặc biểu tượng thu nhỏ của website (Favicon của Tên miền) bị lỗi link, link chết, hoặc API không trả về dữ liệu ảnh.
- **Luật thiết kế**:
  - Không được để lại khoảng trống hoặc biểu tượng lỗi ảnh vỡ của trình duyệt.
  - Bắt buộc phải cấu hình trạng thái hiển thị thay thế (Fallback state):
    - Đối với Avatar User: Dùng component `<Avatar>` của MUI hiển thị ký tự đầu tiên của tên User viết hoa kèm màu nền phẳng ngẫu nhiên theo ID.
    - Đối với Favicon Tên miền: Nếu lỗi tải ảnh, bắt buộc chuyển sang icon mặc định của MUI là `<Language />` (quả địa cầu) hoặc `<Public />`.

### 12.6. Lệch thanh chỉ báo của MUI Tabs do Zoom trình duyệt hoặc CSS Zoom (MUI Tabs Indicator Misalignment under Zoom)
- **Ngữ cảnh**: Khi toàn bộ giao diện quản trị (Dashboard) được áp dụng thuộc tính `zoom: 0.8` (hoặc tỷ lệ zoom khác) để tạo bố cục compact gọn gàng. Dưới tác động của `zoom`, các hàm đo đạc tọa độ JavaScript nội bộ của MUI (sử dụng `offsetLeft` và `offsetWidth`) trả về giá trị không nhất quán với tỷ lệ hiển thị thực tế của trình duyệt. Điều này dẫn đến thanh chỉ báo màu xanh lá bên dưới (Tabs Indicator) bị lệch tọa độ (lệch sang trái/phải hoặc co giãn sai kích thước so với tiêu đề Tab).
- **Luật thiết kế bắt buộc**:
  - Tuyệt đối **KHÔNG** sử dụng thanh chỉ báo mặc định tính toán bằng JavaScript của MUI (`TabIndicatorProps`) cho các màn hình bị tác động bởi CSS Zoom.
  - **Khắc phục triệt để bằng CSS thuần (Pure CSS)**:
    1. Ẩn hoàn toàn thanh chỉ báo mặc định:
       ```typescript
       '& .MuiTabs-indicator': {
         display: 'none'
       }
       ```
    2. Tự vẽ đường viền dưới (border-bottom) trực tiếp trên phần tử Tab đang hoạt động thông qua selector `&.Mui-selected`:
       ```typescript
       '& .MuiTab-root': {
         borderBottom: '2px solid transparent', // Giữ khoảng trống cố định để tránh nhảy giao diện (jitter)
         '&.Mui-selected': {
           color: 'primary.main',
           borderColor: 'primary.main'
         }
       }
       ```
    Cơ chế CSS thuần này đảm bảo thanh chỉ báo luôn luôn khớp khít 100% với chiều rộng và vị trí của Tab được chọn, bất kể màn hình có bị zoom hay co giãn responsive.

---

## 13. Quy chuẩn Thông điệp & Ngôn ngữ Giao diện (User-Facing Copywriting Standards)

Tuyệt đối **KHÔNG** hiển thị các thuật ngữ chuyên ngành kỹ thuật, log hệ thống (Tech Jargon/System Speak) lên màn hình của người dùng cuối. Ngôn ngữ giao diện phải sử dụng tiếng Việt tự nhiên, ngắn gọn, dễ hiểu và tập trung vào hành động của người dùng.

### 13.1. Các từ ngữ BỊ CẤM và Phương án Thay thế (Copywriting Constraints)

| ❌ Từ ngữ BỊ CẤM trên giao diện | 💡 Ý nghĩa kỹ thuật | Phương án BẮT BUỘC sử dụng |
| :--- | :--- | :--- |
| "Backend đang hoạt động...", "Đang gọi API..." | Hệ thống đang xử lý ngầm | **"Đang xử lý..."** hoặc **"Đang tải dữ liệu..."** |
| "Đang gọi request check meta..." | Đang chạy tính năng check meta | **"Đang kiểm tra thẻ Meta..."** |
| "Lỗi kết nối Database", "Query error" | Lỗi không đọc được cơ sở dữ liệu | **"Không thể kết nối đến máy chủ. Vui lòng thử lại!"** |
| "Dữ liệu trả về bị Null / Undefined" | Không có dữ liệu | **"Không tìm thấy dữ liệu."** hoặc **"Danh sách trống."** |
| "Token hết hạn, lỗi 401" | Hết phiên đăng nhập | **"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."** |
| "Exception bộc phát", "Crash hệ thống" | Lỗi code runtime | **"Có lỗi xảy ra từ hệ thống. Vui lòng thử lại sau."** |

### 13.2. Quy tắc viết Thông báo Tiến trình (Loading Messages)
- **Luật**: Thông báo trạng thái đang chạy (Skeletons, Toasts, Loading Button) phải gắn liền với **ngữ cảnh tính năng** mà người dùng đang thao tác, tuyệt đối không dùng từ chung chung mang tính máy móc.
- **Ví dụ cụ thể**:
  - Khi đang cào URL: Hiển thị **"Đang cào dữ liệu URL..."** chứ không ghi "Đang xử lý dữ liệu...".
  - Khi đang lưu form: Hiển thị trên Loading Button là **"Đang lưu..."** chứ không ghi "Đang cập nhật DB...".
  - Khi đang phân tích từ khóa: Hiển thị **"Đang phân tích từ khóa..."** chứ không ghi "Backend đang tính toán...".

### 13.3. Quy tắc viết Thông báo Lỗi (Error Messages)
- **Luật**: Khi xảy ra lỗi (trong khối `catch` của API), thông báo hiển thị qua Toast hoặc Alert phải tuân thủ công thức: **[Chuyện gì đã xảy ra một cách đơn giản] + [Giải pháp cho người dùng]**. Tuyệt đối không quăng mã lỗi thô (Raw Error string từ Axios) lên màn hình.
- **Cú pháp code mẫu cho AI (Khối catch phòng thủ)**:
  ```typescript
  try {
    await apiCheckMeta(domainId);
    toast.success('Kiểm tra thẻ Meta thành công!');
  } catch (error: any) {
    // Trích xuất thông báo thân thiện thay vì ném raw error lên UI
    const friendlyMessage = error.response?.status === 403 
      ? 'Bạn không có quyền thực hiện thao tác này.' 
      : 'Không thể kết nối với công cụ kiểm tra. Vui lòng thử lại sau!';
      
    toast.error(friendlyMessage);
  }
  ```

---

## 14. Chống Spam API trên Ô tìm kiếm và Bộ lọc (Debouncing & Throttling Filters)

- **Ngữ cảnh**: Các ô nhập liệu tìm kiếm Tên miền/Từ khóa, các ô lọc dữ liệu thời gian thực có sự kiện `onChange` kích hoạt gọi API.
- **Luật thiết kế bắt buộc**:
  - Tuyệt đối **KHÔNG** được gọi API hoặc thay đổi state gọi dữ liệu của SWR/Redux trên mỗi hành động gõ phím của người dùng. Việc này sẽ spam hàng trăm request vô nghĩa trong vài giây, gây nghẽn băng thông và sập server.
  - Bắt buộc phải áp dụng cơ chế **Debounce** với độ trễ cố định là **500ms**. Chỉ khi người dùng ngừng gõ phím đủ 500ms, request mới được phép gửi đi.
- **Cú pháp mã nguồn mẫu cho AI**:
  ```typescript
  import React, { useState, useEffect } from 'react';
  import { TextField } from '@mui/material';

  // Custom hook useDebounce chuẩn mã hóa phòng thủ
  export const useDebounce = <T>(value: T, delay: number = 500): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
  };
  ```

---

## 15. Cảnh báo mất dữ liệu khi đóng Form (Unsaved Changes & Dirty Form Protection)

- **Ngữ cảnh**: Người dùng đang nhập liệu dở dang trong các Form lớn (nhập danh sách 100 tên miền, gán quyền quản trị) nằm trên Dialog/Modal, nhưng vô tình click chuột ra vùng trống bên ngoài (Backdrop) hoặc vô tình bấm nút Esc.
- **Luật thiết kế bắt buộc**:
  - Tuyệt đối không được lập tức đóng Dialog làm mất sạch dữ liệu đã nhập của người dùng nếu họ chưa chủ động bấm nút "Hủy".
  - Bắt buộc phải khóa tính năng tự động đóng khi click ra ngoài bằng thuộc tính `disableEscapeKeyDown` và chặn sự kiện `backdropClick` của MUI Dialog nếu Form đang có sự thay đổi dữ liệu (`isDirty` từ React Hook Form).
  - Khuyến khích hiển thị một Dialog phụ xác nhận: "Bạn có chắc chắn muốn hủy không? Dữ liệu đã nhập sẽ bị mất." trước khi đóng hoàn toàn.
- **Cú pháp mã nguồn mẫu cho AI**:
  ```typescript
  import { Dialog } from '@mui/material';
  import { useForm } from 'react-hook-form';

  export const AddDomainDialog = ({ open, handleClose }: { open: boolean, handleClose: () => void }) => {
    const { formState: { isDirty } } = useForm();

    const handleDialogClose = (event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
      // Nếu form đã bị thay đổi dữ liệu (dirty), cấm tuyệt đối việc tự ý đóng form
      if (isDirty && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
        return; 
      }
      handleClose();
    };

    return (
      <Dialog open={open} onClose={handleDialogClose} disableEscapeKeyDown>
        {/* Nội dung form */}
      </Dialog>
    );
  };
  ```

---

## 16. Quy chuẩn Đồng bộ Bộ lọc và Phân trang (Pagination & Filter Sync Logic)

- **Ngữ cảnh**: Người dùng đang ở trang số 10 của Bảng tên miền, sau đó họ gõ vào ô Tìm kiếm một từ khóa mới.
- **Luật thiết kế bắt buộc**:
  - **Reset trang về 1**: Khi có bất kỳ sự thay đổi nào từ Bộ lọc (Lọc trạng thái, Tìm kiếm từ khóa, Đổi khoảng thời gian), hệ thống bắt buộc phải tự động reset State phân trang về lại Trang 1. Nếu giữ nguyên trang 10, API sẽ trả về danh sách rỗng vì dữ liệu sau khi lọc không đủ số lượng để hiển thị đến trang 10, gây hiểu lầm là hệ thống lỗi.
  - **Reset vị trí cuộn chuột (Scroll to Top)**: Khi người dùng bấm chuyển từ trang 1 sang trang 2, hệ thống phải tự động cuộn vùng chứa bảng (TableContainer) về vị trí trên cùng (Top) để người dùng đọc dữ liệu dòng đầu tiên, không giữ nguyên vị trí cuộn ở đáy bảng.

---

## 17. Chấm dứt thảm họa "Dialog chồng Dialog" (Anti-Nested Dialogs)

- **Ngữ cảnh**: Trong Form chỉnh sửa tên miền (đang là 1 Dialog), người dùng bấm nút "Thêm Owner mới", AI thiết kế mở thêm một Dialog thứ hai đè lên trên Dialog thứ nhất.
- **Luật thiết kế bắt buộc**:
  - Nghiêm cấm thiết kế xếp chồng từ 2 tầng Dialog/Modal trở lên trên một màn hình (Gây rối loạn tiêu điểm focus, hỏng hiệu ứng backdrop mờ và tạo trải nghiệm ức chế).
  - **Giải pháp thay thế**: Để xác nhận hoặc nhập liệu tầng 2, bắt buộc phải sử dụng cấu trúc đóng mở động ngay tại chỗ (MUI `<Collapse>`), sử dụng bảng menu nổi (`<Popover>`, `<Menu>`), hoặc chuyển hướng hẳn sang một trang con chuyên biệt.

---

## 18. Giới hạn số lượng Thông báo nổi (Toast Flooding Control)

- **Ngữ cảnh**: Hệ thống gọi API cào dữ liệu hàng loạt, nếu có 20 dòng bị lỗi, API trả về mảng 20 lỗi và AI dùng vòng lặp forEach để ném ra 20 cái Toasts đỏ lòm che kín toàn bộ góc phải màn hình.
- **Luật thiết kế bắt buộc**:
  - Cấu hình giới hạn số lượng Toast hiển thị đồng thời trên màn hình tối đa là 3 thông báo (Sử dụng cấu hình `limit: 3` của Toastify hoặc Snackbar).
  - Nếu lỗi xảy ra hàng loạt từ 1 hành động (ví dụ lỗi validation hàng loạt dòng trong file excel tải lên), bắt buộc gộp chung thành đúng 1 Toast duy nhất với nội dung tổng quát: "Tải lên thất bại: Có 20 dòng dữ liệu không hợp lệ. Vui lòng kiểm tra lại!".

---

## 19. Phân biệt rõ ràng hai trạng thái Trống (Differentiating Empty States)

- **Ngữ cảnh**: Màn hình bảng dữ liệu không có dòng nào hiển thị.
- **Luật thiết kế bắt buộc**:
  - AI bắt buộc phải phân tách và code rõ ràng 2 ngữ cảnh trống khác nhau để định hướng hành động cho người dùng:
    - **Trạng thái trống hệ thống (System Empty)**: Tài khoản mới tinh, hệ thống chưa có một tên miền nào. UI phải hiển thị màn hình trống kèm một nút bấm kích thước lớn kích thích hành động: `[ + Thêm Tên Miền Đầu Tiên Ngay ]`.
    - **Trạng thái trống do bộ lọc (Filter Empty)**: Hệ thống có dữ liệu, nhưng do người dùng gõ tìm kiếm sai hoặc chọn bộ lọc quá sâu nên không có kết quả khớp. UI phải hiển thị thông báo nhẹ nhàng: "Không tìm thấy tên miền phù hợp với bộ lọc" kèm theo một nút bấm nhỏ: `[ Xóa bộ lọc / Tìm lại ]` để đưa họ về trạng thái ban đầu.
