import React, {useState,useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {MinLoder, Toast} from "../Utils";
import {texts} from "../texts/Texts";
import {useAuth} from "../auth/FirebaseConfig";
const Thanks =({language})=>{
  const isAuth = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(searchParams.entries());
  const {type,field,reason} = params
  const [textToshow, setTextToshow] = useState(null);
  const [loading,setLoading] = useState(false);
  const getTexts = (field,type,reason) => {
    const t = {
      success:{
        register:{
          title: texts.welcome[language],
          parags:[texts.sendConfirmationEmail[language]],
        },
        deposit:{
          title: texts.thankYou[language],
          parags: [texts.orderWasPlaced[language],texts.confirmationProvider[language]]
        },
        withdrawal:{
          title: texts.thankYou[language],
          parags: [texts.orderWasPlaced[language], texts.withdrawalsInQueueWarn[language]]
        }
      },
      error:{
        register:{
          title: texts.verifyYourAccount[language],
          parags:[texts.sendConfirmationEmail[language]],
        },
        deposit:{
          title:texts.sorry[language],
          parags: [texts.requestWasRejected[language], texts.unableToFulfill[language]]
        },
        withdrawal:{
          title:texts.sorry[language],
          parags: [texts.requestWasRejected[language], texts.unableToFulfill[language]]
        }
      }
    }
    return t[type][field]
  }
  
  const handleResendEmailVerification = ()=>{
    setLoading(true);
    isAuth.sendEmailVerification().then(()=>{
      setLoading(false);
    });
  }
  
  useEffect(()=>{
    setTextToshow(getTexts(field,type,reason));
    return ()=>{
      setTextToshow({});
    }
  },[]);
  
  return(
    <div className="popUp flex_c_c">
      <div className="card_popup a_conatiner">
        <div className="modal_body">
          <div className={`card_thanks ${type} flex_c_c`}>
            <div className="icon flex_c_c"> </div>
            <h1>{textToshow && textToshow.title}</h1>
            {textToshow && textToshow.parags.map((elem, index)=>(
              <p key={index}>{elem}</p>
            ))}
            <div className="input_card">
              {reason === "default" || !reason && 
                <button onClick={()=>navigate(-1,{replace:true})} className="b main_btns"> Ok!</button>
              }
              {reason === "contact-support" && 
                <button onClick={()=>navigate("/cabinet/support",{replace:true})} className="b main_btns">{texts.contactSupport[language]}</button>
              }
              {reason === "email-verification" && 
                <div className="flex_c_c">
                  <div className="pdd5-r">
                    <button onClick={()=>handleResendEmailVerification()} className="b main_btns"> {loading && <MinLoder/> || texts.resend[language]}</button>
                  </div>
                  <div style={{color:"var(--main-color)"}} className="pdd5-l">
                    <button style={{width:"80px", color:"currentColor"}} onClick={()=>navigate("/",{replace:true})} className="btns"> {texts.home[language]}</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Thanks;