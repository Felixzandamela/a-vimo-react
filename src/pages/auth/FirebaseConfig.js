import React,{useEffect, useState} from 'react';
import {useNavigate} from "react-router-dom";
import { initializeApp } from "https://www.gstatic.com/firebasejs/4.3.1/firebase.js"
import {getCurrentTime,getYearlyChartdatas,formatDate,ThisWeek,Percentage} from "../Utils";
const firebaseConfig = {
  apiKey: "AIzaSyAQmGE66ACzypXy-bzT6bXtEJ-IHf8ANMg",
  authDomain: "bettimers.firebaseapp.com",
  databaseURL: "https://bettimers-default-rtdb.firebaseio.com",
  projectId: "bettimers",
  storageBucket: "bettimers.appspot.com",
  messagingSenderId: "926730575178",
  appId: "1:926730575178:web:280198eab648a1432675b3",
  measurementId: "G-E0ZL9RFHH1"
};

const app = firebase.initializeApp(firebaseConfig);

const auth = firebase.auth(app);
export const dbUsers = firebase.database().ref('/datas/users/');
export const dbReviews = firebase.database().ref('/datas/reviews/');
export const dbPackages = firebase.database().ref('/datas/packages');
export const dbGateways = firebase.database().ref('/datas/gateways');
export const dbPaymentMethods = firebase.database().ref('/datas/payment_methods');
export const dbDeposits = firebase.database().ref('/datas/deposits');
export const dbWithdrawals = firebase.database().ref('/datas/withdrawals');
export const dbCommissions = firebase.database().ref('/datas/commissions');
export const dbChats = firebase.database().ref('/datas/chats');
export const dbNotifications = firebase.database().ref('/datas/notifications');
export const dbImages = firebase.database().ref('/datas/images');

export function useAuth(){
  const navigate = useNavigate();
  const [newUser,setNewUser] = useState(null);
  useEffect(() =>{
    const isAuthticated = auth.onAuthStateChanged (user => {
      setNewUser(user);
      let a = user ? user.uid : "";
      localStorage.setItem("isAuthenticated", a);
      if(user && !user.emailVerified){
        user.sendEmailVerification().then(()=>{
          navigate(`/message?type=error&field=register&reason=email-verification`,{replace:true});
        });
      }
    });
    return isAuthticated;
  }, []);
  return newUser;
}

export function signUp(email, password){
  return auth.createUserWithEmailAndPassword(email, password);
}
export function signIn(email,password){
  return auth.signInWithEmailAndPassword(email,password);
}
export function sendRequestResetEmail(email){
  return auth.sendPasswordResetEmail(email);
}
export function updatePassword(password){
  //var user = useAuth();
  var user = auth().currentUser
  return user.updatePassword(password);
}
export function signOut(){
  return auth.signOut();
}

export const currentUser = (a)=>{
  const current = useAuth();
  const [userDatas, setUserDatas] = useState(null);
  const hendleUser = (snapChat)=>{
    const user = snapChat.val();
    if(a){
      dbImages.child(user.id).on("value",(snapImg)=>{
        if(snapImg.exists()){
          user.avatar = snapImg.val().src;
          setUserDatas(user);
        }else{setUserDatas(user);}
      });
    }else{setUserDatas(user);}
  }
  useEffect(()=>{
    if(current){
     dbUsers.child(current.uid).on('value', hendleUser);
    }
    return()=>{
      if(current){
        dbUsers.child(current.uid).off('value', hendleUser)
      }
    }
  },[current]);
  return userDatas;
}