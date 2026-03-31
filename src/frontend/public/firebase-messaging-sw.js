importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDohco0U6giebeC-c7xc3zWRsMLbKKviNY",
  authDomain: "musical-rhythms-3ebf8.firebaseapp.com",
  projectId: "musical-rhythms-3ebf8",
  storageBucket: "musical-rhythms-3ebf8.firebasestorage.app",
  messagingSenderId: "126385050007",
  appId: "1:126385050007:web:7fc40c93274515054cf4d2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'Musical Rhythms';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/assets/uploads/unnamed-019d39d0-d234-7035-b935-2f8115eca61d-1.png',
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
