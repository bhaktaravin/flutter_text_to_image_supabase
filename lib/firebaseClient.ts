import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBnssJLf-RZBao4Wgsto42PNUbS14hi524",
  authDomain: "imagetotext-31ce6.firebaseapp.com",
  projectId: "imagetotext-31ce6",
  storageBucket: "imagetotext-31ce6.appspot.com",
  messagingSenderId: "951577023551",
  appId: "1:951577023551:web:3c60b7c10e79d1ad91948a",
  measurementId: "G-5G25NSYE4V"
};

export const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
