 
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCnpwlk-uB9tIROSsAgk5Dj041ffDQbOqk',
  authDomain: 'accnoti-5d6bb.firebaseapp.com',
  projectId: 'accnoti-5d6bb',
  storageBucket: 'accnoti-5d6bb.firebasestorage.app',
  messagingSenderId: '858338645436',
  appId: '1:858338645436:web:1c2c82d376d67ff4d207b9',
  measurementId: 'G-XZ3CC6S1RN',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;

  self.registration.showNotification(title, {
    body: body || '',
    icon: '/favicon.svg',
  });
});
