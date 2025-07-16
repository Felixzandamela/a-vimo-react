import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate,useParams,Outlet} from "react-router-dom";
import {texts} from "../texts/Texts";
import {useAuth,dbGateways,dbImages} from '../auth/FirebaseConfig';
import {MinLoder,Loader,formatDate, Toast, chackeVal,idGenerator,useFileName} from "../Utils";
import {ImageCropper} from "../modals/ImageTools";

export const Gateways = ({language}) =>{
  const [datas,setDatas] = useState(null);
  const isMounted = useRef(true);
  
  useEffect(()=>{
    const newDatas = [];
    const handleGateways = snapChat =>{
      if(snapChat.exists()){
        snapChat.forEach((snapChatData)=>{
          const gateway = snapChatData.val();
          dbImages.child(gateway.id).on("value",(snapImg)=>{
           // gateway.avatar = snapImg.val().
            if(snapImg.exists()){
              gateway.avatar = snapImg.val().src
            }
            newDatas.push(gateway);
            if(snapChat.numChildren() === newDatas.length && isMounted.current){
            setDatas(newDatas);
          }
          });
        });
      }else{if(isMounted.current){setDatas([]);}}
    }
    dbGateways.once("value",handleGateways);
    dbGateways.on("child_changed",()=>{
      setDatas(null);
      dbGateways.once("value",handleGateways);
    });
    return()=>{
      dbGateways.off("value", handleGateways);
      dbGateways.off("child_changed", handleGateways);
      setDatas([]);
      isMounted.current = false;
    }
  },[]);
  
  return(
    <section className="a_sec m20">
      <header className="a_sec_header flex_b_c">
        <h1 className="page-title ellipsis">{texts.paymentGateways[language]}</h1>
        <div className="flex_c_c">
          <Link to="/admin/payments-gateways/action?type=set&id=" className="a">
          <div className="a_reload  flex_c_c"> <p className="">{texts.newGateway[language]} </p>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
          </div>
          </Link>
        </div>
        </header>
        
        {!datas && <Loader language={language}/> ||
        <div className="a_gateways flex_wrap">
          {datas && datas.map(item=>(
           <div key={item.id} className="a_gateway_wrap">
              <div className="a_gateway a_conatiner">
                <img src={item.avatar} className="a_gateway_img" alt="gateway"/>
                <h4>{item.name && item.name || texts.notProvidedYet[language]}</h4>
                <p><b>{texts.account[language]}:</b> {item.account && item.account || texts.notProvidedYet[language]}</p>
                <p><b>{texts.accountOwner[language]}:</b> {item.owner && item.owner || texts.notProvidedYet[language]}</p>
                <p><b>{texts.paymentInstantly[language]}:</b> {item.paymentInstantly && texts.yesAndNot[language][0] || texts.yesAndNot[language][1]}</p>
                <p><b>{texts.showToThePublic[language]}:</b> {item.status && texts.yesAndNot[language][0] || texts.yesAndNot[language][1]}</p>
                <Link to={`/admin/payments-gateways/action?type=update&id=${item.id}`} className="a Edit">{texts.edit[language]}</Link>
              </div>
            </div>
          ))}
        </div>
        }
        <Outlet/>
    </section>
  );
}

export const GatewayModal = ({language}) =>{
  const navigate = useNavigate();
  const isMounted = useRef(true);
  const searchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(searchParams.entries());
  const {type,id} = params
  const action = type? type : "set";
  const [states, setStates] = useState({loading: false});
  const [datas,setDatas]=useState({id:idGenerator(),avatar:"", name:"", account:"", owner:"", paymentInstantly:false, status:true});
  const [error,setError]=useState({image:null, name:null, account:null, owner:null, error:{text:null,stack:null}});
  const [fileName, setFileName,clearFileName] = useFileName(null);
  const [images, setImages] = useState({
    id:datas.id,
    src:""
  });
  const datasOuter = {
    "set":{title:texts.newGateway[language]},
    update:{title:texts.updateTitle[language]+" "+texts.fleet[language]}
  }
  
  useEffect(()=>{
    if(id && isMounted.current){
      dbGateways.child(id).on("value", (snapChat)=>{
        if(snapChat.exists() && isMounted.current){
          const gateway = snapChat.val();
          dbImages.child(gateway.id).on("value",(snapImg)=>{
            setImages(snapImg.val());
            setDatas(snapChat.val());
          });
        }
      });
    }
    return () =>{
      isMounted.current = false;
    }
  },[id,action]);
  
  const handleSaveImg = (e)=>{
    setImages(prevImg=>({...prevImg,id:datas.id,src:e}));
    clearFileName();
  };
  
  const handleChange =(event)=>{
    const {name,value} = event.target;
    setDatas(prevData=>({...prevData,[name]:value}));
  } // em cada input em digitação atualiza o valor no state
  
  const handleSubmit = (e) => {
    e.preventDefault(); 
    const errors = new Array();
    if(datas.name.length < 2){
      setError(prevError=>({...prevError,name:`${texts.invalid[language]} ${texts.name[language]}`}));
      errors.push(1);
    }
    if(datas.account.length < 4){
      setError(prevError=>({...prevError,account:`${texts.account[language]} ${texts.invalid[language]}`}));
      errors.push(1);
    }
    if(errors.length <= 0){
      setStates(prevState=>({...prevState,loading:true})); setError(prevError=>({...prevError,password:null, repeatPassword:null}));
      handleSave();
    }
  } // verificação de formulário
  
  const handleSave=()=>{
    dbGateways.child(datas.id)[action](datas).then(()=>{
      dbImages.child(datas.id)[action](images).then(()=>{
        console.log("done");
        setStates(prevState=>({...prevState,loading:false}));
        navigate(-1);
      }).catch((error)=>{console.log(error);});
    }).catch((error)=>{console.log(error);});
  }
  const handleClearError = (event)=>{
    const field = event.target.name;
    setError(prevError=>({...prevError,[field]: null}));
  } // limpar os erros renderizados pelos inputs vazios ou inválidos
  if(!open) return null;
  return(
    <div className="popUp flex_c_c">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <h4>{datasOuter[action].title}</h4>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1,{replace:true})} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="modal_body">
          <div className="input_card flex_c_c">
            <div className="modal_avatar flex_c_c">
              {images && images.src && <img src={images.src} className="avatar" alt="fleet"/>
              || <div className="avatar flex_c_c">
              <ImageEditSvg/>
              </div>}
              <ImageCropper language={language}  handleSaveAvatar={handleSaveImg} fileName={fileName} setFileName={setFileName} clearFileName={clearFileName}/>
              </div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.name} className={chackeVal(datas.name, "input")} id="name" name="name" type="text" readOnly={states.loading}/>
               <label htmlFor="name">{texts.name[language]}</label>
               </div>
            <div className="label_error"> {error && error.name}</div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.account} className={chackeVal(datas.account, "input")} id="account" name="account" type="text" readOnly={states.loading}/>
               <label htmlFor="account">{texts.account[language]}</label>
               </div>
            <div className="label_error"> {error && error.account}</div>
          </div>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input onChange={handleChange} onFocus={handleClearError} value={datas.owner} className={chackeVal(datas.owner, "input")} id="owner" name="owner" type="text" readOnly={states.loading}/>
               <label htmlFor="owner">{texts.accountOwner[language]}</label>
               </div>
            <div className="label_error"> {error && error.owner}</div>
          </div>
           <div className="input_card flex_b_c">
            <p>{texts.paymentInstantly[language]}</p>
            <input disabled={states.loading} checked={datas.paymentInstantly} onChange={()=>setDatas(prevData=>({...prevData,paymentInstantly:!datas.paymentInstantly}))} type="checkbox" name="savethisAccount" className={`inputs ${language}`}/>
          </div>
           <div className="input_card flex_b_c">
            <p>{texts.showToThePublic[language]}</p>
            <input disabled={states.loading} checked={datas.status} onChange={()=>setDatas(prevData=>({...prevData,status:!datas.status}))} type="checkbox" name="savethisAccount" className={`inputs ${language}`}/>
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

const ImageEditSvg =()=>{
  return (<svg width="50px" className="edit_img-svg" data-name="Layer 1" viewBox="0 0 122.88 80.77"><defs></defs><title>photo-editor</title><path className="cls-1" d="M109.47,24.62l12.12,10.94a3.93,3.93,0,0,1,.29,5.53l-6.06,6.71L97.89,31.61l6-6.7a3.93,3.93,0,0,1,5.53-.29ZM59.17,47.23l13-22.53a.92.92,0,0,1,1.66.13l4.68,11.81L67.19,49.45A11.14,11.14,0,0,0,64,56.18l-.94,5.12-.34,1.86H19.27a.93.93,0,0,1-.93-.93v-4.6a.93.93,0,0,1,.93-.93l5.11-.25L29.9,42.92a.92.92,0,0,1,1.21-.51.89.89,0,0,1,.54.61l2.68,9.38h7.29l7.24-18.66a.93.93,0,0,1,1.2-.53.84.84,0,0,1,.44.37l8.67,13.65ZM11.15,0H92a11.05,11.05,0,0,1,4.26.85,11.17,11.17,0,0,1,6,6,11.05,11.05,0,0,1,.85,4.26V13c-.47.12-.93.26-1.39.42l-.09,0h0l-.08,0-.09,0h0l-.08,0-.09,0h0l-.09,0-.08,0h0l-.09,0-.08,0h0l-.09,0-.08,0h0l-.08,0-.07,0h0l-.08,0-.07,0h0l-.08,0-.07,0h0l-.08,0-.06,0h0l-.09,0-.06,0h0l-.09.05,0,0h0l-.08,0,0,0,0,0-.09,0,0,0,0,0-.08.05-.05,0,0,0-.08.05,0,0,0,0-.08.05,0,0,0,0-.08,0,0,0,0,0-.08,0,0,0,0,0-.08.05-.39.27-.08,0,0,0-.06,0-.07.06-.08.05-.08.06-.07.06-.08.06h0l-.07.06-.07.06h0l-.07.06-.07.06h0l-.37.31-.07.06h0l-.08.07a13.72,13.72,0,0,0-1.15,1.14l-.45.51V11.15A3.09,3.09,0,0,0,95,9.93a3.22,3.22,0,0,0-1.75-1.75A3.09,3.09,0,0,0,92,7.94H11.15a3.09,3.09,0,0,0-1.22.24A3.22,3.22,0,0,0,8.18,9.93a3.09,3.09,0,0,0-.24,1.22V69.62a3.12,3.12,0,0,0,.24,1.22,3.25,3.25,0,0,0,3,2H61l-.21,1.39v.18h0l0,.09v.27h0v.87l0,.08,0,.26v.58h0V78.2h0v1.16c0,.49,0,.95,0,1.4H11.15a11.19,11.19,0,0,1-10.3-6.9A11,11,0,0,1,0,69.62V11.15A11.05,11.05,0,0,1,.85,6.89,11.44,11.44,0,0,1,3.27,3.27,11.37,11.37,0,0,1,6.9.85,11,11,0,0,1,11.15,0Zm19,18.49a7.83,7.83,0,1,1-5.53,13.36l0-.06a7.82,7.82,0,0,1,0-11l.06-.05a7.78,7.78,0,0,1,5.47-2.24ZM93,73.46c-4.54,1.66-8.15,2.4-12.69,4.06-9.62,2.61-9.43,4.81-8.09-4.45L75.1,57.31h0L94.83,35l17.93,16.18L93,73.47ZM78.17,60.07,89.94,70.69,81,74c-7,2.56-6.91,4-5.32-2.94l2.5-11Z" fill="var(--border)"/></svg>);
}