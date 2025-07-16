import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, Outlet, NavLink,useParams} from "react-router-dom";
import {texts} from "../texts/Texts";
import {useAuth, dbPackages,dbGateways,dbDeposits,dbWithdrawals, dbCommissions,dbUsers,dbNotifications,dbImages} from '../auth/FirebaseConfig';
import {Avatar,MinLoder,formatNum, formatDate,getCurrentTime, expireDay, EmptyCard,Loader,ShareLink,idGenerator,Toast} from "../Utils";

const colections = (type) =>{
  const dbs = {
    deposits:dbDeposits,
    withdrawals:dbWithdrawals,
    commissions:dbCommissions
  }
   return dbs[type];
}

const Transaction = ({language,mode})=>{
  const navigate = useNavigate();
  const {type,id} = useParams();
  const isMounted = useRef(true);
  const newType = type.slice(0,-1);
  const [isLoading, setIsLoading] = useState(false);
  const [datas,setDatas] = useState(null);
  
  useEffect(()=>{
    setIsLoading(true);
    if(datas){
      setDatas(null);
    }
    const handleDatas = dataSnap =>{
      if(dataSnap.exists()){
          const transaction = dataSnap.val();
          const gatewayId = typeof transaction.paymentDetails.gateway !== "object" ? transaction.paymentDetails.gateway : transaction.paymentDetails.gateway.id;
          const ownerId = typeof transaction.owner !== "object" ? transaction.owner : transaction.owner.id;
          if(gatewayId && transaction){
            dbGateways.child(gatewayId).on("value",(snapGateway)=>{
              transaction.paymentDetails.gateway = snapGateway.val();
              dbImages.child(gatewayId).on("value",(snapImg)=>{ 
                transaction.paymentDetails.gateway.avatar = snapImg.val();
              });
              if(ownerId){
                dbUsers.child(ownerId).on("value", (snapUser) =>{
                  transaction.owner = snapUser.val();
                  if(type === "deposits"){
                    let fleetId = typeof transaction.fleet !== "object" ? transaction.fleet : transaction.fleet.id;
                    if(fleetId){
                      dbPackages.child(fleetId).on("value", (snapFleet)=>{
                        transaction.fleet = snapFleet.val();
                        setDatas(transaction);
                      });
                    }
                  }else{
                    setDatas(transaction);
                  }
                });
              }
            });
          }
      }
    }
    if(/^(deposits|withdrawals|commissions)$/i.test(type)){
      if(id && isMounted.current){
        let interator = !datas ? "value":"child_changed";
        colections(type).child(id).on(interator, handleDatas);
      }
    }else{setIsLoading(false);setDatas(null);}
    return ()=>{
      const ons = ["value","child_changed"];
      for(let k in ons){
        colections(type).child(id).off(ons[k], handleDatas);
      }
      setDatas({});
      isMounted.current = false;
    }
  },[type,id]);
  
  useEffect(()=>{
    if(datas && isMounted.current){
      setIsLoading(false);
    }
  },[datas]);
  return(
    <div className="popUp flex_c_c">
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <div className="flex_s_c modal">
            <i style={{fontSize:"1.5rem"}} className="bi bi-plus-circle"></i>
            <div className="left">
              <h5 className="ellipsis">{texts[newType][language]}</h5>
              <p className={datas && datas.status}>{datas && texts[datas.status][language]}</p>
            </div>
          </div>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1, {replace:true})} fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        {isLoading && <Loader language={language}/>||<div>
          {datas && typeof datas !== "object" && <EmptyCard language={language}/>|| <TransactionCard language={language} datas={datas} mode={mode} type={type} newType={newType}/>}
        </div>}
      </div>
    </div>
  );
}

const TransactionCard = ({language,datas,mode,type,newType}) =>{
  const isMounted = useRef(true);
  const [confirm,setConfirm] = useState(null);
  const [values, setValues] = useState({amount:0});
  const [error,setError]=useState({amount:null, error:{text:null, stack:null}});
  const [updateDeposit, setUpdateDeposit] = useState(null);
  const shows = {
    Completed:null,
    Pending:texts[`${type}InQueueWarn`][language],
    Inprogress:type !== "deposits" ? null : texts.confirmedDepositWarn[language],
    Rejected:texts.rejectedPaymentWarn[language],
    Voided:texts.voidedPaymentWarn[language]
  }
  const getParags = (a,n) => {
    const h = {
      Process: texts.ProcessParag[n][language],
      Confirm: `${texts.ConfirmParag[language][0]} ${datas.amount} ${texts.ConfirmParag[language][1]}`,
      Reject: `${texts.RejectParag[language]} ${texts[n][language]}`,
      Void: texts.voidParag[n][language]
    }
    return h[a];
  }
  const handleConfirm = (a,s,n)=>{
    const popUpText = {
      title: `${texts[a][language]} ${texts[newType][language].toLowerCase()}`,
      parag: getParags(a,n),
      status: s,
      btn: texts[a][language]
    }
    if(isMounted.current){
      setConfirm(popUpText);
    }
  }
  
  class NewDeposit{
    constructor(amount){
      this.amount = !amount ? 0 : parseFloat(amount);
      this.income = (amount * (datas.fleet.percentage /100));
      this.totalIncome = this.amount + this.income;
      this.status = "Inprogress";
      this.date = getCurrentTime().fullDate;
      this.expireAt = expireDay(datas.fleet.maturity);
    }
  }
  
  useEffect(()=>{
    if(datas){
      setValues(prevVal=>({...prevVal,amount:datas.amount}));
    }
    return()=>{setValues({});}
  },[datas]);
  useEffect(()=>{
    if(values.amount && type === "deposits"){
      setUpdateDeposit(new NewDeposit(values.amount));
    }
    return()=>{setUpdateDeposit({});}
  },[values.amount]);
  
  const handleChange = (event)=>{
    const {name, value} = event.target;
    setValues(prevVal=>({...prevVal,[name]:value}));
  }
  
  const handleAlert = (message,stack,notification) =>{
    setError(prevErr=>({...prevErr,error:{text:message,stack:stack}}));
    setConfirm(null);
    console.log(message);
    if(notification){
      const newNotification = {
        type:notification.type,
        id:idGenerator(22),
        owner: notification.owner,
        link:`/cabinet/transactions/${notification.transactionType? notification.transactionType : type}/view/${notification.id}`,
        seen:false,
        date:getCurrentTime().fullDate
      }
      dbNotifications.child(newNotification.owner).child('data').transaction((currentNotifications) => {
        if(currentNotifications){
          const recentNotifications = currentNotifications.slice(-29);
          recentNotifications.push(newNotification);
          return recentNotifications;
        }else{
          return[newNotification];
        }
      }).catch((error)=>console.log(error));
    }
  }
  
  const getSuccesMsg = (n) =>{
    return `${texts[newType][language]} ${texts[n][language]}`
  }
  
  const updateBalance = (amount,ownerId,log,n)=>{
    let balance = dbUsers.child(ownerId).child('balance');
    balance.transaction((currentBalance)=>{
      return currentBalance + parseFloat(amount);
    }).then(()=>{
      handleAlert(getSuccesMsg(log),"success",n);
    }).catch((error)=>{handleAlert(error.message,"error",null)});
  }
  
  const handleAction = () => {
    switch(confirm.status){
      case "Completed":
        if(type === "deposits" && datas.status === "Inprogress" && formatDate(datas.expireAt, language).secondsLength >= 0){
          dbDeposits.child(datas.id).update({
            status:"Completed"
          }).then(()=>{
            updateBalance(datas.totalIncome, datas.owner.id,"CompletedSuccessfully",null);
          }).catch((error)=>{handleAlert(error.message,"error",null)});
        }else{handleAlert(texts.actionNotAllowed[language],"error",null);}
        
        if(type === "withdrawals"){
          if(datas.paymentDetails.gateway.paymentInstantly){
            // add api function of to pay Instantly
          }else{
            dbWithdrawals.child(datas.id).update({
              status:"Completed"
            }).then(()=>{
              handleAlert(getSuccesMsg("CompletedSuccessfully"),"success",null);
            }).catch((error)=>{handleAlert(error.message,"error",null)});
          }
        }
       
        if(type === "commissions"){
          dbDeposits.child(datas.from).on("value",(snapDep)=>{
            if(snapDep.exists()){
              let deposit = snapDep.val();
              let depositStatus = deposit.status;
              if(/^(Completed|Inprogress)$/i.test(depositStatus)){
                dbCommissions.child(datas.id).update({
                  status:"Completed"
                }).then(()=>{
                  updateBalance(datas.amount, datas.owner.id,"commissionAdded",{id:datas.id,owner:datas.owner.id, type:"financialComission"});
                }).catch((error)=>{handleAlert(error.message,"error",null)});
              }
            }else{handleAlert(texts.actionNotAllowed[language],"error",null);}
          });
        }
      break;
      case "Inprogress":
        if(type === "deposits"){
          dbDeposits.child(datas.id).update(updateDeposit).then(()=>{
            dbCommissions.orderByChild("from").equalTo(datas.id).on("value",snapCom =>{
              if(snapCom.exists()){
                snapCom.forEach((snapData)=>{
                  let commission = snapData.val();
                  let {id,owner,status,totalReceivable} = commission;
                  if(id && !/^(Completed|Voided)$/i.test(status)){
                    dbCommissions.child(id).update({status:"Completed"}).then(()=>{
                      updateBalance(totalReceivable, owner,"commissionAdded",{id:id,owner:owner, transactionType:"commissions", type:"financialComission"});
                    }).catch((error)=>{handleAlert(error.message,"error",null)});
                  }else{handleAlert(getSuccesMsg("confirmedSuccessfully"), "success",null);}
                });
              }else{handleAlert(getSuccesMsg("confirmedSuccessfully"), "success",null);}
            });
          }).catch((error)=>{handleAlert(error.message,"error",null)});
        }else{handleAlert(texts.actionNotAllowed[language],"error",null);}
      break;
      case "Rejected":
        colections(type).child(datas.id).update({
          status:"Rejected"
        }).then(()=>{
          handleAlert(getSuccesMsg("RejectedSuccessfully"), "success",{id:datas.id,owner:datas.owner.id, type:"hasBeenRejected"});
        }).catch((error)=>{handleAlert(error.message,"error",null)});
      break;
      case "Voided":
        if(/^(withdrawals|commissions)$/i.test(type)){
          colections(type).child(datas.id).update({status:"Voided"}).then(()=>{
            if(type === "withdrawals"){
              updateBalance(datas.amount, datas.owner.id,"VoidedSuccessfully", {id:datas.id,owner:datas.owner.id,type:"hasVoided"});
            }else{
              handleAlert(getSuccesMsg("VoidedSuccessfully"), "success",{id:datas.id,owner:datas.owner.id,type:"hasVoided"});
            }
          }).catch((error)=>{handleAlert(error.message,"error",null)});
        }
        if(type === "deposits"){
          dbDeposits.child(datas.id).update({
            status:"Voided"
          }).then(()=>{  
            dbCommissions.orderByChild("from").equalTo(datas.id).on("value", (snapCom)=>{
              if(snapCom.exists()){
                snapCom.forEach((snapData)=>{
                  let commission = snapData.val();
                  let {id,owner} = commission;
                  if(id){
                    dbCommissions.child(id).update({status:"Voided"}).then(()=>{
                      handleAlert(getSuccesMsg("VoidedSuccessfully"), "success",{id:datas.id,owner:owner,type:"hasVoided"});
                    }).catch((error)=>{handleAlert(error.message,"error",null)});
                  }
                });
              }else{handleAlert(getSuccesMsg("VoidedSuccessfully"), "success",{id:datas.id,owner:datas.owner.id,type:"hasVoided"});}
            });
          }).catch((error)=>{handleAlert(error.message,"error",null)});
        }
        break;
      default:
      setConfirm(null);
      break;
    }
  }
  
  const isPaymentInstantly =  datas && !/^(Completed|Inprogress|Voided)$/i.test(datas.status) && mode !== "admin" && !datas.paymentDetails.gateway.paymentInstantly && type === "deposits";
  return(
    <div className="modal_body">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <div className="flex_c_c">
        <div className="m_gateway flex_c_c">
          <img style={{width:"26px",marginRight:"10px"}} src={datas && datas.paymentDetails.gateway.avatar && datas.paymentDetails.gateway.avatar.src} className=""/>
          <p>{datas && datas.paymentDetails.gateway.name}</p>
        </div>
      </div>
      {mode === "admin" && <div className="flex_c_c pdd10_a">
        <small style={{marginRight:"10px"}}>{datas && datas.paymentDetails.account}</small>
       {datas && <ShareLink value={datas.paymentDetails.account} language={language}/>}
      </div>
      }
      {datas && shows[datas.status] && mode !== "admin" && <div className="warning_box">
        <div className="warning_wrap flex_s">
          <i className="bi bi-exclamation-square"></i>
          <p>{datas && shows[datas.status]}</p>
        </div>
      </div>}
      {isPaymentInstantly && <div className="m_payments_gateways_wrap">
        <div className="m_payments_gateways">
          <p><b>1.</b> {texts.guideManualPaymentA[language]}</p>
          <div className="flex_b_c pdd10_t_b">
            <div className=""><b>{texts.account[language]}:</b> {datas && datas.paymentDetails.gateway.account}</div>
            <ShareLink language={language} value={datas.paymentDetails.gateway.account} />
          </div>
          <div className="flex_b_c">
            <div className="pdd5_t"><b>{texts.amount[language]}</b> {datas && parseFloat(datas.amount).toFixed(2)}</div>
            <ShareLink language={language} value={datas.amount}/>
          </div>
          <div className=""><b>{texts.name[language]}:</b> {datas && datas.paymentDetails.gateway.owner}</div>
          
          <p className="pdd10_t_b"><b>2.</b> {texts.guideManualPaymentB[language]} <Link to="/cabinet/support" className="a a_link_main">Chat</Link></p>
          <div className="g_warning flex_s">
             <i className="bi bi-exclamation-square"></i>
            <div>
              <h4>{texts.important[language]}</h4>
              <p>{texts.guideManualPaymentNote[language]}</p>
            </div>
          </div>
        </div>
      </div>
      }
      <div className="extra flex_b_c"><div>{texts.amount[language]} </div> <p className="amount">{datas && formatNum(parseFloat(datas.amount).toFixed(2))} MZN</p></div>
      {type === "deposits" && <div>
        <div className="extra flex_b_c"><div>{texts.totalIncome[language]} </div> <p className="amount">{datas && formatNum(parseFloat(datas.totalIncome).toFixed(2))} MZN</p></div>
          <div className="extra flex_b_c"><div>{texts.fleet[language]} </div> <p>{datas && datas.fleet.name}</p></div>
          <div className="extra flex_b_c"><div>{texts.maturityDate[language]} </div> <p> {datas && formatDate(datas.expireAt, language).fullDate}</p></div>
        </div>
        ||<div>
          <div className="extra flex_b_c"><div>{texts.fee[language]}</div> <p className="amount">{datas && formatNum(parseFloat(datas.fees).toFixed(3))} MZN</p></div>
          <div className="extra flex_b_c"><div>{datas && datas.status !== "Completed" && texts.totalToReceive[language] || texts.totalReceived[language]} </div> <p className="amount">{datas && formatNum(parseFloat(datas.totalReceivable).toFixed(2))} MZN</p></div>
        </div>
      }
      <div className="extra flex_b_c"><div>{texts.createdAt[language]} </div> <p> {datas && formatDate(datas.date, language).fullDate}<span></span></p></div>
      <div className="flex_b_c id">ID<div className="flex_b_c"> <p>{datas && datas.id}</p> {datas && <ShareLink language={language} value={datas.id}/>}</div></div>
      {mode !== "admin" && 
        <div>
          {datas && datas.status === "Rejected" && !isPaymentInstantly && <div className="input_card">
            <button className="btns main_btns">{texts.tryAgain[language]}</button>
          </div>}
          {datas && /^(Rejected|Voided)$/i.test(datas.status) && <div className="input_card">
            <Link to="/cabinet/support" className='a'>
              <button className="btns contactsup">{texts.contactSupport[language]}</button>
            </Link>
          </div>}
        </div>
        ||<div>
        {type === "commissions" && datas && <Link to={`/admin/transactions/deposits?owner=&id=${datas.from}`} className="a a_link_main t_link flex_e_c">{texts.viewSource[language]}</Link>}
          <Link to={`/admin/users?id=${datas && datas.owner.id}`} className="a transaction_owner_details flex_s">
            <div className="transaction_owner_avatar">
             {datas && <Avatar avatar={datas.owner}/>}
            </div>
            <div className="left_t_details">
              <h4>{datas && datas.owner.name}</h4>
              <p className="">ID: {datas && datas.owner.id}</p>
            </div>
          </Link>
          
          {confirm && 
            <div className="transaction_action">
              <div className="transaction_action_wrap">
                <div className="flex_b_c">
                  <h3>{confirm.title}</h3>
                  <svg onClick={()=>setConfirm(null)} fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                </div>
                <div className="warning_box_2">
                  <div className="warning_important_wrap flex_s">
                    <i className="bi bi-exclamation-square"></i>
                    <p>{confirm.parag}</p>
                  </div>
                </div>
                {type === "deposits" && /^(Inprogress)$/i.test(confirm.status) && <form className="pdd10_t_b">
                  <div className="flex_b_c">
                    <div>{texts.amount[language]}</div>
                    <div className="min_input_amount">
                      <input onChange={handleChange} value={values.amount} name="amount" className="input" type="number"/>
                    </div>
                  </div>
                </form>}
                <div className="flex_e a_transaction_btns">
                  <button onClick={()=>setConfirm(null)} className="btn cancel">{texts.cancel[language]}</button>
                  <button onClick={()=>handleAction()} className={`btn ${confirm.status}`}>{confirm.btn}</button>
                </div>
              </div>
            </div>
            ||<div>
              {datas && <ActionsBtns type={type} datas={datas} onAction={(a,s)=>handleConfirm(a,s,newType)} language={language}/>}
            </div>
          }
        </div>
      }
    </div>
  );
}

const ActionsBtns = ({type, datas, onAction, language})=>{
  const showBtns =!/^(Completed|Voided|Inprogress)$/i.test(datas.status);
  const toInprogress = type === "deposits" && datas.status === "Pending";
  const Ismature = type === "deposits" && datas.status === "Inprogress" && formatDate(datas.expireAt, language).secondsLength >= 0;
  const btnsArray = [
    {value: toInprogress ? "Confirm" : "Process", action: toInprogress ? "Inprogress" : "Completed", icon:"bi bi-check-circle"},
    {value: "Reject",action:"Rejected",icon:"bi bi-slash-circle"},
    {value: "Void",action:"Voided",icon:"bi bi-arrow-left-circle"}
  ];
  return(
    <div style={{width:"100%"}}>
      {Ismature &&
        <div className="transaction_action_menu flex_wrap">
          <div onClick={()=>onAction("Process","Completed")} className="a_action_wrap">
            <div className={`a_action_li Completed`}><i className="bi bi-check-circle"></i> {texts.Process[language]}</div>
          </div>
        </div>
        ||
        <div>
          {showBtns &&
            <div className="transaction_action_menu flex_wrap">
              {btnsArray.map(item =>(
                <div onClick={()=>onAction(item.value,item.action)} key={item.value} className="a_action_wrap">
                  <div className={`a_action_li ${item.action}`}><i className={item.icon}></i> {texts[item.value][language]}</div>
                </div>
              ))}
            </div>
          }
        </div>
      }
    </div>
  );
}

export default Transaction;