# CLAUDE.md — Ghi chú cho AI

## Stack

- React 18 + TypeScript + Vite
- Redux Toolkit (slice + createAsyncThunk)
- MUI v9 (`@mui/material`)
- Axios (instance tại `src/utils/api.ts`)
- React Router v7

---

## Lỗi đã gặp — KHÔNG lặp lại

### 1. MUI v9: Typography không nhận direct style props

❌ Sai:
```tsx
<Typography fontWeight={700} color="text.secondary" display="block">
```
✅ Đúng — dùng `sx`:
```tsx
<Typography sx={{ fontWeight: 700, color: 'text.secondary', display: 'block' }}>
```

### 2. MUI v9: TextField dùng `slotProps` thay `InputProps` / `inputProps`

❌ Sai:
```tsx
<TextField InputProps={{ startAdornment: ... }} />
<TextField InputLabelProps={{ shrink: true }} />
<TextField inputProps={{ min: 1 }} />
```
✅ Đúng:
```tsx
<TextField slotProps={{ input: { startAdornment: ... } }} />
<TextField slotProps={{ inputLabel: { shrink: true } }} />
<TextField slotProps={{ htmlInput: { min: 1 } }} />
```

### 3. MUI v9: Grid item không dùng `item` + `xs/sm/md` props nữa

❌ Sai:
```tsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>
```
✅ Đúng — dùng Box flex thay thế:
```tsx
<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
  <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33.33% - 11px)' } }}>
```

### 4. MUI Icons: kiểm tra tên file icon trước khi import

❌ Sai (file không tồn tại):
```tsx
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
```
✅ Đúng:
```tsx
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DoNotDisturbAltOutlinedIcon from '@mui/icons-material/DoNotDisturbAltOutlined';
```
> **Quy tắc:** Suffix icon trong MUI là `Outlined`, `Rounded`, `Sharp`, `TwoTone` — KHÔNG phải `Outline` (không có 'd'). Tra cứu tại https://mui.com/material-ui/material-icons/ trước khi dùng.

### 5. Field name phải khớp BE DTO — hỏi trước khi đặt tên

Khi tạo payload gửi lên BE, field name phải khớp **chính xác** với DTO của BE.

Ví dụ lỗi đã gặp:
- FE gửi `toUserId` → BE DTO khai báo `toUser` → bị `forbidNonWhitelisted` chặn
- FE gửi `toGroupId` → BE DTO khai báo `toGroup` → tương tự

> **Quy tắc:** Trước khi viết service/payload, hỏi hoặc xác nhận tên field từ BE DTO.

### 6. Dùng đúng API endpoint — không tự chọn endpoint có ADMIN guard

Ví dụ lỗi đã gặp: dùng `GET /users` (cần ADMIN) để search user trong form assign → lẽ ra dùng `GET /users/assignable` (public hơn).

> **Quy tắc:** Luôn hỏi BE endpoint nào phù hợp với từng use case, đặc biệt khi liên quan đến phân quyền.

### 7. React StrictMode gây double useEffect — đã fix ở `api.ts`

StrictMode dev gọi `useEffect` 2 lần → mọi GET request bị gọi 2 lần.

**Đã xử lý:** `src/utils/api.ts` có GET deduplication — cả 2 call chia sẻ cùng 1 promise, chỉ 1 HTTP request thực sự được gửi. **Không cần sửa thêm ở component.**

> **Không bỏ `<StrictMode>`** — nó bắt bug impure render, đặc biệt quan trọng cho dự án lớn.

### 8. Sau khi update profile phải sync lại `auth.user` trong Redux

Khi user cập nhật ảnh/tên ở ProfilePage, nếu chỉ gọi API mà không dispatch lại Redux thì Header vẫn hiển thị thông tin cũ.

✅ Đúng — dispatch `updateAuthUser` sau khi API thành công:
```tsx
const updated = await userService.updateProfile(payload);
dispatch(updateAuthUser({ name: updated.name, imgAvatar: updated.imgAvatar }));
```
> `updateAuthUser` action đã có trong `authSlice`, cũng tự động sync vào `localStorage`.

### 9. `User` type trong `auth.types.ts` phải có `imgAvatar`

BE trả về `imgAvatar` nhưng type chỉ khai báo `avatar` → Header không dùng được field đúng.

> Khi BE thêm field mới vào user object, phải cập nhật `src/types/auth.types.ts` tương ứng.

---

## Quy tắc chung

- **Service calls**: Luôn dùng instance `api` từ `src/utils/api.ts`, không dùng `axios` trực tiếp
- **Toast**: `showToast(message, 'success' | 'danger' | 'warning' | 'info')` từ `useToastify()`
- **Redux pattern**: `createAsyncThunk` + `rejectWithValue` + check `result.type.endsWith('/rejected')`
- **User search trong form assign**: Dùng `userService.getAssignable(search)` → `GET /users/assignable`
- **Routing**: Routes khai báo trong `src/routes/AppRouter.tsx`, constants trong `src/utils/constants.ts`
