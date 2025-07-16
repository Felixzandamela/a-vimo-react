import React, {useState,useEffect, useRef} from "react";
import {useNavigate,useLocation,Link} from "react-router-dom";
import {chackeVal,MinLoder,PasswordViewer,getCurrentTime,getColor,idGenerator,authErros, Toast} from "../Utils";
import {texts, quotes} from "../texts/Texts";
import {signUp,dbUsers,dbReviews,dbChats,dbNotifications,dbImages} from "./FirebaseConfig";

export const Reference = ({language}) => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  useEffect(()=>{
    if(id){localStorage.setItem('upline', id);}
  }, [id]);
  return <SignUp language={language}/>;
};

export const SignUp =({language})=>{
  const upline = localStorage.getItem("upline");
  const navigate = useNavigate();
  const [curQuote, setcurQuote] = useState(quotes[Math.floor(Math.random()* quotes.length)]);
  const [states, setStates] = useState({loading: false, viewPassword: false});
  const [datas,setDatas]=useState({name:"", email:"",password:"", location:""});
  const [error,setError]=useState({name:null,email:null,password:null, error:{text:null, stack:null}});
  
  useEffect(()=>{
    async function getClientLocation(){
      let url = "https://ipinfo.io/json?token=b133d2b54b26e4";
      try{
        const res = await fetch(url), data = await res.json();
        setDatas(prevData=>({...prevData, location:[data.city, data.country]}))
      }catch(error){console.log(error)}
    } 
    getClientLocation();
  },[]);
  
  const handleChange = (event)=>{
    const field = event.target.name, value = event.target.value;
    setDatas(prevData=>({...prevData,[field]:value}));
  } // em cada input em digitação atualiza o valor no state
  
  const handleSubmit = (e)=>{
    e.preventDefault();
    const errors = new Array();
    if(!datas.name || datas.name.length <= 2 ){setError(prevError=>({...prevError,name:texts.invalidFullName[language]}));errors.push(1);}
    if(!datas.email.match(/^[a-zA-Z][a-zA-Z0-9\-\_\.]+@[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}$/)){setError(prevError=>({...prevError,email:texts.invalidEmail[language]}));errors.push(1);}
    if(!datas.password){setError(prevError=>({...prevError,password:texts.invalidPassword[language]}));errors.push(1);}
    if(errors.length <= 0){setStates(prevState=>({...prevState,loading:true}));
       handleSignUp();
    }
  }
  
  async function handleSignUp(){
    try{
      const res = await signUp(datas.email,datas.password);
      const response = await res;
      const user = {
        id:response.uid,
        balance: upline? 150 : 0,
        name: datas.name,
        avatar:"",
        email: datas.email,
        isAdmin: false,
        upline: upline ? upline : "",
        isBanned:false,
        phoneNumber:"",
        online:"",
        location:datas.location,
        date:getCurrentTime().fullDate
      }
      const review =  {
        owner:response.uid,
        stars:0,
        makePublic:false,
        revised:false,
        date:getCurrentTime().fullDate,
        text:""
      }
      const notification ={
        id:response.uid,
        data:""
      }
      dbUsers.child(response.uid).set(user).then(()=>{
        dbReviews.child(response.uid).set(review).then(()=>{
          dbNotifications.child(response.uid).set(notification).catch((error)=>{
            setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
          });
          dbImages.child(response.uid).set({id:response.uid,src:""}).catch((error)=>{
            setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
          });
          dbChats.child(response.uid).set({
            id:response.uid,
            owner:response.uid,
            participants:{
              [response.uid]:{
                typing:false,
                blocked:false,
                datas:"",
              }
            },
            chatColor:getColor(),
            data:""
          }).then(()=>{
            const newNotification = {
              type:"financialBonus",
              id:idGenerator(22),
              owner:response.uid,
              link:`/cabinet/dashboard`,
              seen:false,
              date:getCurrentTime().fullDate
            }
            if(upline){
              dbNotifications.child(newNotification.owner).child('data').transaction((currentNotifications) => {
                if(currentNotifications){
                  const recentNotifications = currentNotifications.slice(-29);
                  recentNotifications.push(newNotification);
                  return recentNotifications;
                }else{
                  return[newNotification];
                }
              }).then(()=>{
                localStorage.setItem("upline","");
                sendEmailVerification(response);
              }).catch((error)=>{setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));});
            }else{sendEmailVerification(response);} 
          }).catch((error)=>{
            setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
          });
        }).catch((error)=>{
          setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
        });
      }).catch((error)=>{
        setError(prevError=>({...prevError,error:{text:error.message,stack:"error"}}));
      });
    }catch(error){
      for(let i = 0; i < authErros.length; i++){
        if(error.code === authErros[i].name){
          let errorMessage = texts[authErros[i].target][language]; // exemplo: texts.invalidPassword.ptPT retona "Senha inválido!"
          let stack = authErros[i].stack;
          setError(prevError=>({...prevError,error:{text:errorMessage,stack:stack}}));
          setStates(prevState=>({...prevState,loading:false}));
        }
      }
    }
  }
  const sendEmailVerification = (currentUser)=>{
    currentUser.sendEmailVerification().then(()=>{
      navigateTo("success","email-verification","successfuly registered");
    });
  }

  const navigateTo = (stack,reason,error)=>{
    setStates(prevState=>({...prevState,loading:false}));
    console.log(error);
    navigate(`/message?type=${stack}&field=register&reason=${reason ? reason : ""}`,{replace:true});
  }
  
  const handleClearError = (event)=>{
    const field = event.target.name; setError(prevError=>({...prevError,[field]:null}));
  } // limpar os erros renderizados pelos inputs vazios ou inválidos
  
  return(
     <section className="sec_forms flex_c_c">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
       <div className="form_header flex_c_c">
           {curQuote && <div className="form_quote_box">
            <p> <i className="bi bi-quote"></i> {curQuote.quote[language]}</p>
            <h3>{curQuote.owner}</h3>
          </div>}
       </div>
      <form onSubmit={handleSubmit} className="form flex_c_c">
        <div className="form_wrap">
          <div className="form_head flex_c_c">
            <Link to="/">
              <div className="logo a flex_c_c br60">
                <img height="45px" width="45px" src="https://i.imgur.com/3znKRGu.png" alt="Logo"/>
              </div>
            </Link>
            <h1 className="formTitle">{texts.welcome[language]}</h1>
            <p className="form_subtitle">{texts.byRegistering[language]} <Link to="/terms-of-conditions" className="a">{texts.termsOfConditionTitle[language]}</Link> {texts.and[language]} <Link to="/privacy-policy" className="a">{texts.privacyPolicyTitle[language]}</Link></p>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.name} className={chackeVal(datas.name, "input")} id="name" name="name" type="text" readOnly={states.loading}/>
               <label htmlFor="name">{texts.fullName[language]}</label>
               </div>
            <div className="label_error"> {error && error.name}</div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.email} className={chackeVal(datas.email, "input")} id="email" name="email" type="email" readOnly={states.loading}/>
               <label htmlFor="email">Email</label>
            </div>
            <div className="label_error">{error.email}</div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.password} className={chackeVal(datas.password, "input")} id="password" name="password" type={!states.viewPassword && "password" || "text"} readOnly={states.loading}/>
               <label htmlFor="password">{texts.passwordLabel[language]}</label>
               <PasswordViewer toggle={states.viewPassword} onToggle={()=> setStates(prevState=>({...prevState,viewPassword: !states.viewPassword}))}/>
               </div>
            <div className="label_error"> {error && error.password}</div>
          </div>
          <div className="input_card">
            <button disabled={states.loading} className="btns main_btns">{states.loading && <MinLoder/> || texts.signUpTitle[language]}</button>
          </div>
          <div className="bottom_link">{texts.iHaveAccount[language]} <Link to="/login" className="a">{texts.loginTitle[language]} {texts.now[language]}</Link></div>
        </div>
      </form>
    </section>
  );
};