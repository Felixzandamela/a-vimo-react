import React,{useEffect,useState} from "react";
import {useNavigate} from "react-router-dom";
import {currentUser,useAuth,dbNotifications} from '../auth/FirebaseConfig';
import {MinLoder,formatDate,EmptyCard,Loader} from "../Utils";
import {texts} from "../texts/Texts";

const Notifications = ({language}) =>{
  const isAuth = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [notSeen,setNotSeen] = useState(null);
  useEffect(()=>{
    const handleNotifications =  snapChat => {
      const notSeenArray = [];
      const notificationsArray = [];
      if(snapChat.exists()){
        snapChat.forEach((snapVal)=>{
          const notification = snapVal.val();
          if(!notification.seen){
            notSeenArray.push(notification);
          }
          notificationsArray.push(notification);
          if(snapChat.numChildren() === notificationsArray.length){
            setNotifications(notificationsArray);
            setNotSeen(notSeenArray);
          }
        });
      }
    };
    const handleChange = snapChat =>{
      setNotSeen(null);
      setNotifications(null);
      if(isAuth){
        dbNotifications.child(isAuth.uid).child("data").on("value", handleNotifications);
      }
    }
    if(isAuth){
      dbNotifications.child(isAuth.uid).child("data").on("value", handleNotifications);
      dbNotifications.child(isAuth.uid).child("data").on("child_changed", handleChange);
    }
    return ()=>{
      dbNotifications.off("value", handleNotifications);
      dbNotifications.off("child_changed", handleNotifications);
    }
  },[isAuth]);
  
  const handleClick = (element,index)=>{
    if(!element.seen){
      dbNotifications.child(isAuth.uid).child("data").child(index).update({seen: true}).then(()=>{
        setOpen(!open);
        navigate(element.link, {replace:true});
      }).catch((error)=>{console.log(error);});
    }else{
      setOpen(!open);
      navigate(element.link, {replace:true});
    }
  }
  return(
    <div>
      <div onClick={()=>setOpen(!open)} className="btn_circle m5-l-r flex_c_c br60">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/></svg>
        {notSeen && notSeen.length > 0 && <div className="float_counter br4-a flex_c_c">{notSeen.length}</div>}
      </div>
      <div style={{display: !open? "none" : "inline"}} className="a_notifications a_conatiner">
        <div className="a_notifications_header flex_s_c">
          <div onClick={()=>setOpen(!open)} className="flex_c_c btn_circle"> 
            <svg fill="currentColor" opacity="1.0" baseProfile="full" width="26" height="26" viewBox="0 0 24.00 24.00"><path d="M20 11v2H7.99l5.505 5.505-1.414 1.414L4.16 12l7.92-7.92 1.414 1.415L7.99 11H20z"/></svg>
          </div>
          <h4>{texts.notifications[language]}</h4>
        </div>
        <div className="a_notifications_roller">
          
          {notifications && notifications.length > 0 ? (
          <div>{notifications.map((element, index) =>(
          <div key={index} onClick={()=>handleClick(element,index)} className={`${element.seen && "seen"} a_card_notification flex_s`}>
            <div className="a_notification_avatar flex_c_c br60">
              <img height="35px" width="35px" src="https://i.imgur.com/3znKRGu.png" alt="Logo" />
            </div>
            <div>
              <p>{texts[element.type][language]}</p>
              <div className="notifications_time">
                {formatDate(element.date, language).timeAgo}
              </div>
            </div>
          </div>
          ))}
          </div>) : <EmptyCard language={language}/>}
          
        </div>
      </div>
    </div>
  );
};
export default Notifications;