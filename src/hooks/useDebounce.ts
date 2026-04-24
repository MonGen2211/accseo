import { useState, useEffect } from 'react';

/**
 * Custom hook giúp trì hoãn (debounce) việc cập nhật giá trị
 * Sử dụng chủ yếu cho khung tìm kiếm để tránh gọi filter/API liên tục
 * @param value Giá trị cần debounce (VD: search text)
 * @param delay Thời gian trễ (milliseconds)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
