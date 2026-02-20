import { getMessaging, onMessage, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyByzEcxRmKn3AVeby5fCZTCQ1kHW3hJLoc",
  authDomain: "petsetgo-28dd4.firebaseapp.com",
  projectId: "petsetgo-28dd4",
  storageBucket: "petsetgo-28dd4.appspot.com",
  messagingSenderId: "433782501904",
  appId: "1:433782501904:web:e77a44780f25dbefbf9095",
  measurementId: "G-1XE6D3HKK6",
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
export const fetchToken = (setTokenFound, setFcmToken) => {
  return getToken(messaging, {
    vapidKey:
      "BKAD7SdrBmp9TIgQShG-k9T7NwxN9RRJNON3-wc_-4iqBpssKlkSDLtqeWt4exrDPUykX5RcrClIOYhewQtzJ_o",
  })
    .then((currentToken) => {
      if (currentToken) {
        // Send the token to your server and update the UI if necessary
        setTokenFound(true);
        setFcmToken(currentToken);
      } else {
        // Show permission request UI
        console.log(
          "No registration token available. Request permission to generate one."
        );
        setTokenFound(false);
        setFcmToken("");
      }
    })
    .catch((err) => {
      console.log("An error occurred while retrieving token. ", err);
      // ...
    });
};

export const onMessageListner = () => {
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received. ", payload);
      // ...
    });
  });
};
