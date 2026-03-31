import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import {
  addSubscriber,
  getSubscribers,
  removeSubscriber,
} from "./services/firebaseService";

const FCM_TOKEN_KEY = "mr_fcm_token";

export async function subscribeToNotifications(): Promise<void> {
  try {
    if (!messaging) {
      console.warn("Firebase Messaging not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission denied.");
      return;
    }

    const token = await getToken(messaging);
    if (!token) {
      console.warn("No FCM token received.");
      return;
    }

    localStorage.setItem(FCM_TOKEN_KEY, token);
    await addSubscriber(token);
  } catch (err) {
    console.error("subscribeToNotifications error:", err);
  }
}

export async function unsubscribeFromNotifications(): Promise<void> {
  try {
    const token = localStorage.getItem(FCM_TOKEN_KEY);
    if (token) {
      await removeSubscriber(token);
      localStorage.removeItem(FCM_TOKEN_KEY);
    }
  } catch (err) {
    console.error("unsubscribeFromNotifications error:", err);
  }
}

export async function sendLiveNotification(serverKey: string): Promise<void> {
  if (!serverKey) return;
  try {
    const tokens = await getSubscribers();
    if (tokens.length === 0) return;

    // Send in batches of 500 (FCM limit)
    const batchSize = 500;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      try {
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            Authorization: `key=${serverKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notification: {
              title: "Soham is Live! 🔴",
              body: "Join the live session now on Musical Rhythms!",
              icon: "/assets/uploads/unnamed-019d39d0-d234-7035-b935-2f8115eca61d-1.png",
            },
            registration_ids: batch,
          }),
        });
      } catch (batchErr) {
        console.error("FCM batch send error:", batchErr);
      }
    }
  } catch (err) {
    console.error("sendLiveNotification error:", err);
  }
}
