import React, {useState,useEffect, useRef} from "react";
import {useNavigate,useHistory, useLocation,Link, useParams} from "react-router-dom";
import {formatNum, formatDate, expireDay, MinLoder,Loader,getCurrentTime, idGenerator, chackeVal} from "../Utils";
import {currentUser, useAuth, dbUsers,dbGateways,dbPaymentMethods,dbWithdrawals, dbDeposits,dbImages} from '../auth/FirebaseConfig';
import {texts} from "../texts/Texts";

const NewWithdrawal =({language})=>{
  const user = currentUser(false);
  const navigate = useNavigate();
  const isAuth = useAuth();
  const isMounted = useRef(true);
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  
  const [transactions, setTransactions] = useState(null);
  const [myPaymentMethods, setMyPaymentMethods]=useState(null);
  const [states, setStates] = useState({stage:2,loading:false,toggle:false,showSave:null});
  const [gateways, setGateways] = useState(null);
  const [newWithdrawal, setNewWithdrawal] = useState(null);
  const [datas,setDatas] = useState({id:`B2C-${idGenerator()}`, amount:0.00,account:"",gateway:"",paymethod:"", saveAccount:false});
  const [error,setError] = useState({amount:null,account:null, gateway:null });
 
  useEffect(()=>{
    const handleAddGateways = snapChat => {
      const getewaysDatas = [];
      snapChat.forEach((snapChatData)=>{
        const newGeteway = snapChatData.val();
        dbImages.child(newGeteway.id).on("value",(snapImg)=>{
          newGeteway.avatar = snapImg.val();
          getewaysDatas.push(newGeteway);
          if(newGeteway){
            setDatas(prevData=>({...prevData,gateway:getewaysDatas[0].id, paymethod:getewaysDatas[0]}));
          }
          if(snapChat.numChildren() === getewaysDatas.length){
            setGateways(getewaysDatas);
          }
        });
      });
    }
    
    const depositDatas =[];
    const handleDeposits =(snapChat)=>{
      const newDeposit = snapChat.val();
      depositDatas.push(newDeposit);
      setTransactions([...depositDatas]);
    }
   
    const myPaymentMethodsDatas = [];
    const handleMyPaymentMethods = (snapChat) => {
      const newPayment = snapChat.val();
      myPaymentMethodsDatas.push(newPayment);
      setMyPaymentMethods([...myPaymentMethodsDatas]);
    };
    
    dbGateways.orderByChild("status").equalTo(true).once('value', handleAddGateways);
    if(isAuth){
      dbDeposits.orderByChild('owner').equalTo(isAuth.uid).on('child_added', handleDeposits);
      dbPaymentMethods.orderByChild('owner').equalTo(isAuth.uid).on('child_added', handleMyPaymentMethods);
    }
    return () => {
      dbGateways.orderByChild("status").equalTo(true).once('value', handleAddGateways);
    };
  },[id,isAuth]);
  
  class NewWithdraw{
    constructor(datas, owner){
      this.id = datas.id;
      this.owner = owner.id;
      this.amount = !datas.amount ? 0 :  parseFloat(datas.amount);
      this.fees =  Math.round(this.amount * (6 / 100));
      this.totalReceivable = (this.amount - this.fees).toFixed(2);
      this.status = "Pending";
      this.paymentDetails = {
        account:datas.account,
        gateway: datas.gateway
      };
      this.date = getCurrentTime().fullDate;
    }
  }
  
  useEffect(()=>{
    if(gateways){
      const gatewayNam = gateways.filter((item)=>{
        if(item.id === datas.gateway){return true}
      });
      setDatas(prevData=>({...prevData,paymethod:gatewayNam[0]}))
    }
  },[datas.gateway,gateways]);
 
  useEffect(()=>{
    if(user){setNewWithdrawal(new NewWithdraw(datas, user));}
    return()=>setNewWithdrawal({});
  },[datas, user]);
  
  useEffect(()=>{
    if(datas.account.length >= 5){
      if(myPaymentMethods){
        const mpd = myPaymentMethods.filter((item)=>{
          if(item.account.toLowerCase().indexOf(datas.account.toLowerCase())===-1 ){return false;}
          return true;
        });
        setStates(prevState=>({...prevState,showSave:mpd}));
      }else{setStates(prevState=>({...prevState,showSave:[]}));}
    }
  },[datas.account])
  
  const checkAmount = ()=>{
    const errors = new Array();
    if(datas.amount < 50){errors.push(texts.unspecifiedBalance[language])}
    if(datas.amount > user.balance){errors.push(`${texts.lowBalance[language]} ${formatNum(datas.amount)} MT`);}
    return errors || null;
  }
  const checkAccount = ()=>{
    let hasDeposited;
    if(transactions){
      const hasDep = transactions.filter((elem)=>{
        if(elem.status === "Inprogress" && elem.paymentDetails.account === datas.account && elem.owner === newWithdrawal.owner  || elem.status === "Completed" && elem.paymentDetails.account === datas.account && elem.owner === newWithdrawal.owner){return true}
      });
      hasDeposited = hasDep;
    }
    const errors = new Array();
    if(datas.paymethod.name === "M-pesa" && !datas.account.match(/^8[45]\d{7}$/)){errors.push(texts.invalidMpesaAccount[language]);}
    if(datas.paymethod.name === "E-mola" && !datas.account.match(/^8[67]\d{7}$/)){errors.push(texts.invalidEmolaAccount[language]);}
    if(!hasDeposited || hasDeposited.length === 0){errors.push(texts.noDepositsMadeWith[language]);}
    return errors || null
  }
  
  const navigateTo = (stack,reason,error)=>{
    console.log(error);
    navigate(`/cabinet/dashboard/message?type=${stack}&field=withdrawal&reason=${reason ? reason : ""}`,{replace:true});
  }
  
  const throwErr = (field, error)=>{
    if(error.length <= 0 && isMounted){
      setStates(prevState=>({...prevState,loading:true}));
      setTimeout(()=>{
        setStates(prevState=>({...prevState,loading:false}));
        if(states.stage <= 2) {
          setStates(prevState=>({...prevState,stage:states.stage+1}));
        }else{
          setStates(prevState=>({...prevState,loading:true}));
         if(user.isBanned){
            navigateTo("error","contact-support","This user is bunned");
          }else{
            dbWithdrawals.child(newWithdrawal.id).set(newWithdrawal).then(()=>{
              let balance = dbUsers.child(newWithdrawal.owner).child('balance');
              balance.transaction((currentBalance)=>{
                return currentBalance - newWithdrawal.amount;
              }).then(()=>{
                if(datas.saveAccount){
                  const sda ={
                    owner: newWithdrawal.owner,
                    id:idGenerator(24),
                    account: datas.account,
                    gateway: datas.gateway
                  }
                  dbPaymentMethods.child(sda.id).set(sda).then(()=>{
                    setStates(prevState=>({...prevState,loading:false}));
                    navigateTo("success",null,"new payment method added");
                  }).catch((error)=>{navigateTo("error","contact-support",error);});
                }else{
                  setStates(prevState=>({...prevState,loading:false}));
                  navigateTo("success",null,"balance updated");
                }
              }).catch((error)=>{navigateTo("error", "contact-support", error);});
            }).catch((error)=>{navigateTo("error","contact-support",error);});
          }
        }
      },1000);
    }else{setError(prevErr=>({...prevErr,[field]:error[0]}));}
  }
  
  const handleSubmit=(e)=>{
    e.preventDefault();
    let error;
    switch(states.stage){
      case 2: error = checkAmount();
      throwErr("amount", error);
      break;
      case 3: error = checkAccount();
      throwErr("account", error);
      break;
      default: console.log(null);
    }
  }
  
  const handleChange=(event)=>{
    const {name, value} = event.target;
    setDatas(prevData=>({...prevData,[name]:value}));
  }
  const handleClearError = (event)=>{
    const field = event.target.name; setError(prevError=>({...prevError,[field]:null}));
  }
  
  const handleToggle =()=>{
    setTimeout(() => {
      if(isMounted.current) { // verificando se o componente ainda está montado
        setStates(prevState=>({...prevState,toggle:!states.toggle}));
      }
    }, 500);
  }
  
  useEffect(() => {
    return () => {isMounted.current = false;}
  }, []);
  
  if(!user) return null;
  return(
    <div className="popUp flex_c_c">
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <h4>{states.stage === 2 ? texts.newWithdrawalTitle[language] : states.stage === 3 ? texts.payMethodTitle[language] : "Thank you"}</h4>
          <div className="flex_b_c"><svg disabled={states.loading} onClick={()=>navigate(-1,{replace:true})} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <div className="modal_body">
          <div className="form_stages flex_c_c">
            <div className="active stage-circle flex_c_c br60">1</div>
            <div className={states.stage > 1 ? "active stage-bar" : "stage-bar"}></div>
            <div disabled={states.loading} className={states.stage > 2 ? "active stage-circle flex_c_c br60":"stage-circle flex_c_c br60"}>2</div>
            <div className={states.stage > 2 ? "active stage-bar" : "stage-bar"}></div>
            <div disabled={states.loading} className="stage-circle flex_c_c br60">3</div>
          </div>
          <form className={states.stage === 2 && "active newDepositForms" || "newDepositForms"} onSubmit={handleSubmit}>
          <div className="input_card">
            <div className="input_wrap flex_b_c">
              <input autoFocus={true} onChange={handleChange} onFocus={handleClearError} name="amount" value={datas.amount}  step="0.01" className={`${chackeVal(datas.amount, "input")} amountInput`} id="number" type="number" readOnly={states.loading}/>
                <label htmlFor="number">{texts.amount[language]}</label>
              <div className="input_left_box flex_c_c">MZN</div>
            </div>
            <div className="label_error"> {error && error.amount}</div>
          </div>
          <div className="extra flex_b_c">{texts.fee[language]}<p className="amount">{newWithdrawal && formatNum(newWithdrawal.fees) || "___ "}<span></span></p></div>
          <div className="extra flex_b_c">{texts.totalToReceive[language]} <p className="amount">{newWithdrawal &&  formatNum(newWithdrawal.totalReceivable) || "___ "} MZN</p></div>
          <div className="input_card">
            <button disabled={states.loading} className="btns main_btns">{states.loading && <MinLoder/> || texts._continue[language]}</button>
          </div>
          </form>
          {states.stage === 3 && !gateways && <Loader language={language}/> ||
          <form className={states.stage === 3 && "active newDepositForms" || "newDepositForms"} onSubmit={handleSubmit}>
            <div className="container-gateways flex_wrap">
              {gateways && gateways.map((g, index) => (
              <div key={g.id} className="wrap-radio-card">
                <input disabled={states.loading} onChange={handleChange} type="radio" id={g.id} name="gateway" value={g.id} checked={datas.gateway === g.id}/>
                <label className="" htmlFor={g.id}>
                  <div className="i-radio-card flex_c_c">
                    <h5>{g.name}</h5>
                    <div className="radio-img-wrap">
                      <img className="radio-img" src={g.avatar && g.avatar.src} alt={g.id}/>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
          <div className="input_card">
            <div className="input_wrap accountnumber flex_b_c">
              <div  className="input_right_box flex_c_c">258</div>
              <input disabled={states.loading} name="account" value={datas.account} onChange={handleChange} onFocus={handleClearError} type="number" className={`${chackeVal(datas.account, "input")} accountnumber`}/>
              <label htmlFor="tel">{texts.accountNumberTitle[language]}</label>
              {myPaymentMethods && myPaymentMethods.length > 0 && <div onClick={handleToggle} className="input_left_box flex_c_c">
                <i style={{transform:`rotate(${states.toggle && 180||0}deg)`}} className="bi bi-chevron-down dropdownIcon"></i>
                {states.toggle &&
                  <div style={{display:states.toggle && "inline" || "none"}} className="a_c_menu a_conatiner br4-a">
                    {myPaymentMethods.map(elem=>(
                      <div onClick={()=>setDatas(prevData=>({...prevData,gateway:elem.gateway,account:elem.account}))} key={elem.id} className={`${elem.account === datas.account && "active"} pdd6_10 flex_s_c`}>{elem.account}</div>
                    ))}
                  </div>
                }
              </div>}
            </div>
            <div className="label_error"> {error && error.account}</div>
          </div>
          {states.showSave && states.showSave.length <= 0  ? <div className="input_card flex_b_c">
            <p>{texts.saveThisAccountTitle[language]}</p>
            <input disabled={states.loading} checked={datas.saveAccount} onChange={()=>setDatas(prevData=>({...prevData,saveAccount:!datas.saveAccount}))} type="checkbox" name="savethisAccount" className={`inputs ${language}`}/>
          </div>: ""}
          <div className="input_card">
            <button disabled={states.loading} className="btns main_btns">{states.loading && <MinLoder/> || texts._continue[language]}</button>
          </div>
        </form>
        }
        </div>
      </div>
    </div>
  );
}

export default NewWithdrawal;