import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, Outlet, useParams} from "react-router-dom";
import {texts} from "../texts/Texts";
import {dbUsers, useAuth, currentUser} from '../auth/FirebaseConfig';
import {Avatar, MinLoder,Copy,formatDate, Toast, Exclamation, PasswordViewer,chackeVal,authErros} from "../Utils";

const UpdatesUserModal = ({language}) =>{
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const searchParams = new URLSearchParams(window.location.search);
  const field = searchParams.get('field');
  const datas = currentUser(false);
  
  if(!datas){return null;}else{
    if(!/^(name|password|phoneNumber)$/.test(field)){
      return null;
      navigate("/undefined", {replace:true});
    }
  }
  if(field == "name" || field == "phoneNumber") return <UpdateModal language={language} user={datas} field={field}/>
  if(field == "password") return <UpdatePasswordModal language={language}/>
}

const UpdateModal = ({language, user, field}) =>{
  const navigate = useNavigate();
  const [loading,setLoading]= useState(false);
  const [datas,setDatas]=useState({[field]:user[field]});
  const [error,setError]=useState({[field]:null,error:{text:null,stack:null}});
  
  const handleChange =(event)=>{
    const fields = event.target.name;
    const val = event.target.value;
    setDatas(prevData=>({...prevData,[fields]:val}));
  } // em cada input em digitação atualiza o valor no state
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = new Array();
    if(field === "phoneNumber"){
      if(!datas[field].match(/\d{9}$/)){
        setError(prevError=>({...prevError,[field]:texts.invalidPhoneNumber[language]}));errors.push(1);}
        if(errors.length <= 0){setLoading(true);handleSaveName();}
    }
    if(field === "name"){
      if(!datas[field] || datas[field].length <= 2 ){
        setError(prevError=>({...prevError,[field]:texts.invalidFullName[language]}));errors.push(1);}
      if(errors.length <= 0){setLoading(true);handleSaveName();}
    }
  } // verificação de formulário
  
  const handleSaveName =  ()=>{
    dbUsers.child(user.id).update({[field]:datas[field]}).then(()=>{
      setLoading(false);
      navigate(-1,{replace:true});
    }).catch((error)=>{
      console.log(error);
      setError(prevError=>({...prevError,error:{text:error,stack:"error"}}));
    });
  }
  
  const handleClearError = (event)=>{
    const fields = event.target.name;
    setError(prevError=>({...prevError,[fields]: null}));
  } // limpar os erros renderizados pelos inputs vazios ou inválidos
  
  const formTexts ={
    name:{
      title:texts.editName[language],
      label:texts.fullName[language],
      type:"text"
    },
    phoneNumber:{
      title:texts.editPhoneNumber[language],
      label:texts.phoneNumber[language],
      type:"tel"
    }
  }
  if(!datas) return null
  return(
    <div className="popUp flex_c_c">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <h4>{formTexts[field].title}</h4>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1, {replace:true})} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="modal_body">
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input autoFocus={true} onChange={handleChange} onFocus={handleClearError} value={datas[field]} className={chackeVal(datas[field], "input")} id={field} name={field} type={formTexts[field].type} readOnly={loading}/>
               <label htmlFor={field}>{formTexts[field].label}</label>
               </div>
            <div className="label_error"> {error && error[field]}</div>
          </div>
          <div className="input_card">
            <button disabled={loading} className="btns main_btns">{loading && <MinLoder/> || texts.save[language]}</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}

const UpdatePasswordModal = ({language}) =>{
  const navigate = useNavigate();
  const isAuth = useAuth();
  const [states, setStates] = useState({loading: false, viewPassword: false});
  const [datas,setDatas]=useState({password:"", repeatPassword:""});
  const [error,setError]=useState({password:null, repeatPassword: null, error:{text:null,stack:null}});
 
  const handleChange =(event)=>{
    const field = event.target.name;
    const value = event.target.value;
    setDatas(prevData=>({...prevData,[field]:value}));
  } // em cada input em digitação atualiza o valor no state
  
  const handleSubmit = (e) => {
    e.preventDefault(); 
    const errors = new Array();
    if(!datas.password){setError(prevError=>({...prevError,password:texts.invalidPassword[language]})); errors.push(1);}
    if(datas.repeatPassword !== datas.password){setError(prevError=>({...prevError,repeatPassword:texts.passwordDontMatch[language]})); errors.push(1);}
    if(errors.length <= 0){
      setStates(prevState=>({...prevState,loading:true})); setError(prevError=>({...prevError,password:null, repeatPassword:null}));
      handleChangePassword();}
  } // verificação de formulário
  
  const handleChangePassword =  ()=>{
    const password = datas.password;
    isAuth.updatePassword(password).then(()=>{
      setStates(prevState=>({...prevState,loading:false}));
      setError(prevError=>({...prevError,error:{text:texts.successfulPasswordChenged[language],stack:"success"}}));
      navigate(-1,{replace:true});
    }).catch((error)=>{
      for(let i = 0; i < authErros.length; i++){
        if(error.code === authErros[i].name){
          let errorMessage = texts[authErros[i].target][language]; // exemplo: texts.invalidPassword.ptPT retona "Senha inválido!"
          let stack = authErros[i].stack;
          setError(prevError=>({...prevError,error:{text:errorMessage,stack:stack}}));
          setStates(prevState=>({...prevState,loading:false}));
        }else{console.log(error);}
      }
    });
  }
  
  const handleClearError = (event)=>{
    const field = event.target.name;
    setError(prevError=>({...prevError,[field]: null}));
  } // limpar os erros renderizados pelos inputs vazios ou inválidos
  
  return(
    <div className="popUp flex_c_c">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <h4>{texts.resetPasswordTitle[language]}</h4>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1, {replace:true})} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="modal_body">
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.password} className={chackeVal(datas.password, "input")} id="password" name="password" type={!states.viewPassword && "password" || "text"} readOnly={states.loading}/>
               <label htmlFor="password">{texts.passwordLabel[language]}</label>
               </div>
            <div className="label_error"> {error && error.password}</div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.repeatPassword} className={chackeVal(datas.repeatPassword, "input")} id="repeatPassword" name="repeatPassword" type={!states.viewPassword && "password" || "text"} readOnly={states.loading}/>
               <label htmlFor="password">{texts.repeatPasswordLabel[language]}</label>
               <PasswordViewer toggle={states.viewPassword} onToggle={()=> setStates(prevState=>({...prevState,viewPassword: !states.viewPassword}))}/>
               </div>
            <div className="label_error"> {error && error.repeatPassword}</div>
          </div>
          <div className="input_card">
            <button disabled={states.loading} className="btns main_btns">{states.loading && <MinLoder/> || texts.save[language]}</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}
export default UpdatesUserModal;