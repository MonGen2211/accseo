import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'ai_gen_start_time';

/**
 * Tính progress dựa trên thời gian đã trôi qua, mô phỏng cùng đường cong
 * tốc độ như approach cũ (interval 800ms, tốc độ giảm dần).
 *
 * Phase 1: 0→30%  tại 3%/tick   (10 ticks ≈ 8s)
 * Phase 2: 30→60% tại 1.5%/tick (20 ticks ≈ 16s)
 * Phase 3: 60→80% tại 0.8%/tick (25 ticks ≈ 20s)
 * Phase 4: 80→95% tại 0.3%/tick (50 ticks ≈ 40s)
 */
function calculateProgress(elapsedMs: number): number {
	const ticks = elapsedMs / 800;
	let progress = 0;
	let remaining = ticks;

	// Phase 1: 0→30%
	const p1 = Math.min(remaining, 10);
	progress += p1 * 3;
	remaining -= p1;
	if (remaining <= 0) return Math.min(progress, 95);

	// Phase 2: 30→60%
	const p2 = Math.min(remaining, 20);
	progress += p2 * 1.5;
	remaining -= p2;
	if (remaining <= 0) return Math.min(progress, 95);

	// Phase 3: 60→80%
	const p3 = Math.min(remaining, 25);
	progress += p3 * 0.8;
	remaining -= p3;
	if (remaining <= 0) return Math.min(progress, 95);

	// Phase 4: 80→95%
	const p4 = Math.min(remaining, 50);
	progress += p4 * 0.3;

	return Math.min(progress, 95);
}

/**
 * Custom hook quản lý progress bar cho AI generation.
 * Dùng sessionStorage để giữ tiến trình khi chuyển trang (SPA navigation).
 * Progress được tính từ elapsed time thay vì tick count → chính xác khi remount.
 */
export function useAiProgress(loading: boolean): number {
	const [progress, setProgress] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const prevLoadingRef = useRef(loading);

	useEffect(() => {
		const prevLoading = prevLoadingRef.current;
		prevLoadingRef.current = loading;

		// Cleanup previous timers
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		if (!loading) {
			// Transition: loading → not loading → xoá start time
			if (prevLoading) {
				sessionStorage.removeItem(STORAGE_KEY);
			}
			return;
		}

		// Transition: not loading → loading → lưu start time
		if (!prevLoading) {
			if (!sessionStorage.getItem(STORAGE_KEY)) {
				sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
			}
		}

		// Tick function — tính progress từ elapsed time
		const tick = () => {
			const startTime = sessionStorage.getItem(STORAGE_KEY);
			if (startTime) {
				setProgress(calculateProgress(Date.now() - Number(startTime)));
			}
		};

		// Tick gần như ngay lập tức để tránh flash 0% khi remount
		const initialTimeout = setTimeout(tick, 50);
		// Sau đó cập nhật mỗi 800ms
		intervalRef.current = setInterval(tick, 800);

		return () => {
			clearTimeout(initialTimeout);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [loading]);

	// Khi không loading → trả 0 mà không cần gọi setProgress
	return loading ? progress : 0;
}
