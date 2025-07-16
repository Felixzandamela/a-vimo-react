import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, Outlet, NavLink,useParams} from "react-router-dom";
import {texts} from "../texts/Texts";
import {dbPackages,dbGateways,dbDeposits,dbWithdrawals, dbCommissions} from '../auth/FirebaseConfig';
import {MinLoder,paginator, formatNum, formatDate,getCurrentTime, statusIcons, Pagination, EmptyCard,Loader,ShareLink} from "../Utils";
import {Search,Select} from "../modals/Filter";
import {userDeposits, userWithdrawals,userCommissions} from "../auth/FetchDatas";

const Transactions =({language,mode})=>{
  const navigate = useNavigate();
  const {type}=useParams();
  return(<TransactionsCard type={type} language={language} mode={mode}/>);
}

const TransactionsCard = ({type,language,mode})=>{
  const searchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(searchParams.entries());
  const {owner,id} = params
  const [transactions, setTransactions] = useState(null);
  const [list, setList] = useState(null);
  const [states, setStates] = useState({page:1,dateType:"",statusType:"", userId:"" ,dataId:"", isLoader:true,limitTo:20});
  const [datas,setDatas] = useState(null);
  const isMounted = useRef(true);
  const userDeposit = userDeposits(language,mode);
  const userWithdrawal = userWithdrawals(language,mode);
  const userCommission = userCommissions(language,mode);
  
  useEffect(()=>{
    if(owner && isMounted){setStates(prevState=>({...prevState,userId:owner}));}
    if(id && isMounted){setStates(prevState=>({...prevState,dataId:id}));}
    return()=>{isMounted.current = false;}
  },[owner,id]);
  
  useEffect(()=>{
    setTransactions(null);
    if(type === "deposits" && userDeposit){setTransactions(userDeposit.datas);}
    if(type === "withdrawals" && userWithdrawal){setTransactions(userWithdrawal.datas);}
    if(type === "commissions" && userCommission){setTransactions(userCommission.datas);}
  },[type, userDeposit,userWithdrawal,userCommission,dbWithdrawals]);
  
  useEffect(()=>{
    setList([]);
    if(transactions){
      setStates(prevState=>({...prevState,isLoader:false}));
      const filteredData = transactions.filter((item) => {
        if(states.userId === item.owner || states.userId === ""){
          if ((states.dateType === "today" && formatDate(getCurrentTime().fullDate, language).onlyDate === formatDate(item.date, language).onlyDate) || (states.dateType === "month" && formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(item.date, language).onlyMonthAndYear) || states.dateType === ""){
            if (states.statusType === "" ||  states.statusType === item.status) {
              if(states.dataId === item.id || states.dataId === ""){
                return true; // O item atende aos critérios de data e status 
              }
            }
          }
        }
        return false; // O item não atende aos critérios especificados
      });
      setList(filteredData);
    } 
  },[states.dateType,states.userId, states.dataId,states.statusType,transactions]);
 
  useEffect(()=>{
    if(list){setDatas(paginator(list, states.page, states.limitTo, language, true));}
  },[list, states.page,language]); // paginar os dados filtrados
  
  useEffect(()=>{
    setTimeout(()=>{
      if(!list || list && list.length <= 0 && isMounted.current){
        setStates(prevState=>({...prevState,isLoader:false}));
      }
    },10000);
    
    return()=>{isMounted.current = false}
  },[]); // Se 2 minuntos passar sem retonar dados limpa o loading e alerta que os dados não foram encontrados
  
  const handlePage =(event)=>{
    switch(event){
      case "next": setStates(prevState=>({...prevState,page:states.page+1})); break;
      case "previous": setStates(prevState=>({...prevState,page:states.page -1}));break;
      default:setStates(prevState=>({...prevState,page:1})); break;
    }
  }
  const newType = type.slice(0, -1);
  const locationPath = mode === "admin"? "admin":"cabinet";
  let uid = localStorage.getItem("isAuthenticated");
  const value = `${document.location.origin}/ref?id=${uid? uid : null}`;
  
  return(
    <section  className="a_sec">
      <header className="a_sec_header">
        <div className="a_sec_header_wrap flex_b_c">
        <h1 className="page-title">{texts[type][language]}({list && list.length})</h1>
        <div className="a_selection_wrap flex_wrap">
        {mode === "admin" && <Search language={language} type={"userId"} onChange={(e)=>setStates(prevState=>({...prevState,userId:e}))}/>}
        {mode === "admin" && <Search language={language} type={"dataId"} onChange={(e)=>setStates(prevState=>({...prevState,dataId:e}))}/>}
        <Select language={language} type={"date"} onSelection={(v)=>setStates(prevState=>({...prevState, dateType:v}))}/> 
        <Select language={language} type={"transactions"} onSelection={(v)=>setStates(prevState=>({...prevState,statusType:v}))}/>
          {type === "deposits" && mode !== "admin" && <Link to="/cabinet/fleets" className="a plus-fixed">
            <div className="a_reload flex_c_c"> <p className="">{texts.depositNow[language]} </p>
              <div className="btn_plus flex_c_c"><i className="bi bi-plus-lg"></i> </div> 
            </div>
          </Link>}
          {type === "withdrawals" && mode !== "admin" && <Link to="/cabinet/transactions/withdrawals/new-withdraw" className="a plus-fixed">
            <div className="a_reload  flex_c_c"> <p className="">{texts.withdrawNow[language]} </p>
              <div className="btn_plus flex_c_c"><i className="bi bi-plus-lg"></i> </div> 
            </div>
          </Link>}
           {type === "commissions" && mode !== "admin" && <div className="plus-fixed">
            <div className="a_reload  flex_c_c">
              <div className="btn_plus flex_c_c"><ShareLink language={language} value={value} type={"both"}/></div> 
            </div>
          </div>}
          </div>
        </div>
      </header>
      {states.isLoader && <Loader language={language}/> || 
      <div>{list && list.length > 0 ? (
        <div className="transactions_conteiner">
          <div className="transactions_wrap a_conatiner">
            {datas && datas.datas.map((transaction, n)=>(
            <div key={n} className="">
              <div className="dateOf">{transaction.date}</div>
              {transaction.datas.map(item=>{
                const isMatured = type === "deposits" && mode === "admin" && item.status === "Inprogress" && formatDate(item.expireAt, language).secondsLength >= 0;
                return(
                  <NavLink className={({isActive})=> isActive ? "a active":"a"} key={item.id} to={`/${locationPath}/transactions/${type}/view/${item.id}`} className="a">
                    <div className={`transaction_wrap ${isMatured && "Matured" || item.status}`}>
                      <div className="transaction_card">
                        <div className="transaction_header flex_b_c">
                          <div className="left flex_s_c">
                            <i className={statusIcons[item.status]}></i>
                            <div>
                              <div className="top">{texts[newType][language]}</div>
                              <p className={isMatured && "Matured" || item.status}>{texts[isMatured && "Matured" || item.status][language]}</p>
                            </div>
                          </div>
                        <div className="right flex_e_c">
                          <div>
                            <div className="top">{formatNum(parseFloat(item.amount).toFixed(2))} MZN</div>
                            <p>{item.paymentDetails.gateway.name}</p>
                          </div>
                          <i className="bi bi-chevron-down"></i>
                        </div>
                        </div>
                      </div>
                    </div>
                  </NavLink>
                )})}
              </div>
            ))}
          </div>
        </div>
      ) : <EmptyCard language={language}/> }
      </div>
      }
      {list && list.length > 0 && <Pagination datas={datas} handlePage={handlePage} language={language}/>}
      <Outlet/>
    </section>
  );
}
export default Transactions;