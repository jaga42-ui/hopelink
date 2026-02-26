import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD4B7cjaeF2IfdYTBO9O_EdWpZW-yRL8Ic",
  authDomain: "hopelink-57e20.firebaseapp.com",
  projectId: "hopelink-57e20",
  storageBucket: "hopelink-57e20.firebasestorage.app",
  messagingSenderId: "304854115504",
  appId: "1:304854115504:web:a670a1824eaa359f4b8775",
  measurementId: "G-9D0THCJLHP"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      
      // 👉 THE FIX: Force the browser to register your background worker manually
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });

      // 👉 Hand the registered worker directly to Firebase
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BDCZCEH2kk3zEgnxGe9KGUjFuleKJMCmLyDP-zqBxJPGyn5hoCRdGoYWbL8qgiWQ3YV6wh1v94UVus5jFjVTlgU',
        serviceWorkerRegistration: registration 
      });

      if (currentToken) {
        console.log("🔥 Token Generated Successfully linked to Background Worker");
        return currentToken;
      }
    } else {
      console.log("Notification permission not granted.");
    }
    return null;
  } catch (error) {
    console.error('An error occurred while retrieving token: ', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });