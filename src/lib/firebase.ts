import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import type { MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyCnpwlk-uB9tIROSsAgk5Dj041ffDQbOqk',
  authDomain: 'accnoti-5d6bb.firebaseapp.com',
  projectId: 'accnoti-5d6bb',
  storageBucket: 'accnoti-5d6bb.firebasestorage.app',
  messagingSenderId: '858338645436',
  appId: '1:858338645436:web:1c2c82d376d67ff4d207b9',
  measurementId: 'G-XZ3CC6S1RN',
};

const VAPID_KEY = 'BBbUWSlebhdZecDkBBfS18Ab6Yn0wDkZ7xK_n_TP5UWfIAQusjpDLhAnFIuDkWGE_f1jtjN--G6sToI7P1WIgao';

const app = initializeApp(firebaseConfig);

let messagingInstance: ReturnType<typeof getMessaging> | null = null;

function getMessagingInstance() {
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
}

export async function requestFcmToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Đăng ký service worker trước rồi mới getToken
    const swRegistration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    const messaging = getMessagingInstance();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    return token;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  const messaging = getMessagingInstance();
  return onMessage(messaging, callback);
}
