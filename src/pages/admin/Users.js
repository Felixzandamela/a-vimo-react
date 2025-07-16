import React,{useEffect,useState,useRef} from "react";
import {Link,useNavigate, Outlet, NavLink,useParams} from "react-router-dom";
import {texts} from "../texts/Texts";
import {getUsers} from "../auth/FetchDatas";
import {Avatar,Alert,Toast,MinLoder,paginator, formatNum, formatDate,getCurrentTime, idGenerator, statusIcons, Pagination, EmptyCard,Loader,toBool} from "../Utils";
import {Search,Select} from "../modals/Filter";
import {dbUsers,dbNotifications} from '../auth/FirebaseConfig';

const Users = ({language}) =>{
  const isMounted = useRef(true);
  const searchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(searchParams.entries());
  const {id} = params;
  const [error,setError]=useState({error:{text:null, stack:null}});
  const [alertDatas, setAlertDatas] = useState(null);
  const [list, setList] = useState(null);
  const [states, setStates] = useState({page:1,dateType:"",dataId:"",statusType:"", name:"", isLoader:true,limitTo:20, statusBan:null});
  const [datas,setDatas] = useState(null);
  const allUsers = getUsers(language,"totalUsers");
  useEffect(()=>{
    if(id && isMounted.current){setStates(prevState=>({...prevState,dataId:id}));}
  },[id]);
  useEffect(()=>{
    if(allUsers){
      setStates(prevState=>({...prevState,isLoader:false}));
      const filteredData = allUsers.datas.filter((item) => {
        if(states.name !== "" && item.name.toLowerCase().indexOf(states.name.toLowerCase()) >=0 || states.name === ""){
          if ((states.dateType === "today" && formatDate(getCurrentTime().fullDate, language).onlyDate === formatDate(item.date, language).onlyDate) || (states.dateType === "month" && formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(item.date, language).onlyMonthAndYear) || states.dateType === ""){
            if (states.statusType === "" ||  !toBool(states.statusType) && !item.isBanned || toBool(states.statusType) && item.isBanned) {
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
  },[allUsers,states.statusType, states.dateType,states.name]);
  
  useEffect(()=>{
    if(list){setDatas(paginator(list, states.page, states.limitTo, language));}
  },[list, states.page,language]); // paginar os dados filtrados
  
  
  const handleBann =(k,n,id)=>{
    setStates(prevState=>({...prevState,statusBan: !k? true : false}));
    let actionTitle = !k? texts.ban[language] : texts.reactivate[language];
    const alertData = {
      title: !k? `${texts.ban[language]} ${n}` : `${texts.reactivate[language]} ${n}`,
      text:`${texts.confirmsUser[language][0]} ${actionTitle.toLowerCase()} ${texts.confirmsUser[language][1]}`,
      dangerText:!k? texts.dangerBanUser[language] : null,
      actions:{
        onOk:{
          title:actionTitle,
          action:id,
          type:!k ? "danger" : null,
        }
      }
    }
    setAlertDatas(alertData);
  }
  
  const done = (message,stack)=>{
    if(message){
      console.log(message)
      setError(prevError=>({...prevError,error:{text:message,stack:stack}}));
      setAlertDatas(null);
    }
  }//set toast error and messages action
  
  const handleAction = (e) =>{
    let isBannedStatus = dbUsers.child(e).child('isBanned');
    const newNotification = {
      type:"",
      id:idGenerator(22),
      owner:e,
      link:`/cabinet`,
      seen:false,
      date:getCurrentTime().fullDate
    }
    let statusBan = undefined;    
    isBannedStatus.transaction((currentIsBanVal)=>{
      statusBan = !currentIsBanVal; 
      return !currentIsBanVal;
    }).then(()=>{
      newNotification.type = statusBan ? "hasBeenBanned":"hasBeenReactivated";
      const action = states.statusBan ? texts.banned[language] : texts.reactivated[language];
      let successUpdate = `${texts.userUpdatedSuccessfully[language][0]} ${action} ${texts.userUpdatedSuccessfully[language][1]}`;
      dbNotifications.child(newNotification.owner).child('data').transaction((currentNotifications) => {
        if(currentNotifications){
          const recentNotifications = currentNotifications.slice(-29);
          recentNotifications.push(newNotification);
          return recentNotifications;
        }else{
          return[newNotification];
        }
      }).then(()=>{
        done(successUpdate.toLowerCase(),"success");
      }).catch((error)=>{done(error.message,"error");});
    }).catch((error)=>{done(error.message,"error");});
  }
  
  const title = texts.users[language].slice(0, -1);
  return(
    <section className="a_sec">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <Alert language={language} alertDatas={alertDatas} onOk={(e)=>handleAction(e)} onCancel={()=>setAlertDatas(null)}/>
      <header className="a_sec_header">
        <div className="a_sec_header_wrap flex_b_c">
          <h1 className="page-title">Users</h1>
          <div className="a_selection_wrap flex_wrap">
            <Search language={language} onChange={(e)=>setStates(prevState=>({...prevState,name:e}))}/>
            <Search language={language} type={"dataId"} onChange={(e)=>setStates(prevState=>({...prevState,dataId:e}))}/>
            <Select language={language} type={"date"} onSelection={(v)=>setStates(prevState=>({...prevState, dateType:v}))}/> 
            <Select language={language} type={"userStatus"} onSelection={(v)=>setStates(prevState=>({...prevState,statusType:v}))}/>
          </div>
        </div>
      </header>
      <div className="a_container_table">
        <div className="a_table_card a_conatiner">
          <div className="a_table_wrap">
            <div className="a_table">
              <div className="theader flex_b_c">
                <div className="a_col user">{title}</div>
                <div className="a_col_150">{texts.date[language]}</div>
                 <div className="a_col_150">{texts.balance[language]}</div>
                <div className="a_col status">Admin</div>
                <div className="a_col_actions"></div>
              </div>
              <div className="tbody">
                {datas && datas.datas.map(item=>(
                  <div key={item.id} className="row_body flex_b_c">
                  <div className="a_col user flex_s_c"> 
                 
                  <div  className="a_table_avatar">
                    <Avatar avatar={item} /></div>
                  <div>
                  <p className="ellipsis name">{item.name}</p>
                  <p className="ellipsis">{item.email}</p>
                  </div>
                  </div>
                  <div className="a_col_150">{formatDate(item.date,language).onlyDate}</div>
                  <div className="a_col_150">{formatNum(item.balance)} MZN</div>
                  <div className="a_col status"><p className={`a_status ${item.isAdmin && "reactive"}`}> {texts.yesAndNot[language][item.isAdmin ? 0 : 1] } </p></div>
                  <div className="a_col_actions">
                    <div className="flex_c_c btn_circle">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                      </svg>
                       <div className="a_c_menu a_conatiner br4-a"> 
                        <Link to={`/admin/transactions/deposits?owner=${item.id}&id=`} className="a pdd6_10 flex_s_c"> <i className="bi bi-box-arrow-in-up"></i>{texts.deposits[language]}</Link>
                        <Link to={`/admin/transactions/withdrawals?owner=${item.id}&id=`} className="a pdd6_10 flex_s_c"> <i className="bi bi-box-arrow-down"></i>{texts.withdrawals[language]}</Link>
                         <Link to={`/admin/transactions/commissions?owner=${item.id}&id=`} className="a pdd6_10 flex_s_c"> <i className="bi bi-link-45deg"></i>{texts.commissions[language]}</Link>
                          <Link to={`/admin/support/chat/${item.id}`} className="a pdd6_10 flex_s_c ellipsis"> <i className="bi bi-chat-right-text"></i>{texts.sendMessage[language]}</Link>
                        <div onClick={()=>handleBann(item.isBanned, item.name,item.id)} className={`${!item.isBanned ? "ban": "reactive"} pdd6_10 flex_b_c`}>
                          <p  className="flex_s_c"> <i className={`bi ${!item.isBanned ? "bi-person-slash" : "bi-person-check"}`}> </i> {!item.isBanned && texts.ban[language] || texts.reactivate[language]}</p>
                        </div>
                         <div className="ban pdd6_10 flex_s_c"> <i className="bi bi-trash"> </i>Deletar</div>
                      </div>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {list && list.length > 0 && <Pagination datas={datas} handlePage={(p)=>setStates(prevState=>({...prevState,page:p}))} language={language}/>}
   
    </section>
  );
}
export default Users;