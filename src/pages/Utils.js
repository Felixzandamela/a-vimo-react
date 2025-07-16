import React,{useEffect,useState, useRef} from "react";
import {texts} from "./texts/Texts";
export function getLanguage(){
  const lang = navigator.language.match(/^pt-(BR|PT|AO|MZ|CV|GW|TL|ST|GQ)$/) ? "pt-PT" :"en-US";
  return localStorage.getItem("language") || lang;
}

export const abbreviation = function(name){
  if(name){
    const first_Chars=name.split(" ").map(chars=>{return chars[0]}).filter(char=>{return char!==undefined});
    const avatar_Name = first_Chars.length >1 && first_Chars.slice(-1)!==undefined?first_Chars[0]+first_Chars.slice(-1):first_Chars[0];
    return avatar_Name.toUpperCase();
  }else{return null}
} //abreviatura de nome, exemplo: Alberto Souza retorna AS

export const getColor = () =>{
  const setHash = (b = [], length = 0,hash) => {while(length <= 2){hash = Math.floor(Math.random()*255);b.push(hash); length++;}return b;}, c = setHash();
  return {color:`rgb(${c})`,background: `rgba(${c},0.30)`}
} // gerar cor aleatória * rgb(12, 56, 255)

export const Avatar = ({avatar,color}) => {
  let colour;
  switch(typeof color){
    case "object":colour = color;break;
    case "string":colour = JSON.parse(color);break;
    default: colour = getColor();break;
  }
  let isBanned = avatar && avatar.isBanned !== undefined ? avatar.isBanned : null;
  if(!avatar){return null}
  return(
    <div className="avatar">
      {avatar.avatar && <img src={avatar.avatar}/>||
      <div className="flex_c_c" style={colour}>{abbreviation(avatar.name)}</div>}
      {isBanned && <div className="isBanned flex_c_c"><i className="bi bi-exclamation"></i></div>}
    </div>
    );
} //avatar para usuário/ se o usuário não tiver imagem de perfil retorna Abreviatura de nome e cor
// mostra o aviso quando o   usuário estever bannido 

export const idGenerator = (length)=>{
  const size = length ? length:16;
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", id = "";
  for(var i=0; i < size; i++) {id += characters[Math.floor(Math.random()*characters.length)];}
  return id;
}
export function formatNum (number, float){
  let num = float ? parseFloat(number || 0).toFixed(2) : number || 0;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function formatNumber (number){
  const unitsNames = ['',' Mil',' M',' B',' T',' Q',' Q',' S',' S',' O',' N',' D']; 
  const units = Math.floor(Math.log10(Math.abs(number)) / 3);
  const order = Math.max(0, Math.min(units, unitsNames.length -1 ));
  const suffix = unitsNames[order]; 
  return number < 100000 ? formatNum(number) : (number / Math.pow(10, order * 3)) + suffix;
} // format number, exemple: 100,000, ou 1000000000 = 1B


export const Counter = ({number}) => {
  const isMounted = useRef(true);
  const [nj,setN]=useState(0);
  let nun = 0;
  useEffect(()=>{
    let a = setInterval(() => {
      if (nun >= number) {
        if(isMounted.current){setN(number); clearInterval(a);}
      } else {nun++;
      if(isMounted.current){setN(nun);}}
    },0.2);
    return () => {isMounted.current = false;};
  },[]);
  return(<div className="number">{formatNum(nj)}</div>);
};

export const handleScrollTo =()=>{
  window.scrollTo(0,0)
}

export const organizeDatas = (datas, language) => {
  const datesMap = {};
  datas.forEach(data => {
    const formattedDate = formatDate(data.date, language).onlyDate;
    if (!datesMap[formattedDate]) {
      datesMap[formattedDate] = [];
    }
    datesMap[formattedDate].push(data);
  });
  const organizedData = Object.keys(datesMap).map((date, data )=> {
    return {
      date:date,
      datas: datesMap[date]
    }
  })
  return organizedData;
}// organize Datas by date


export function paginator(items, page, limit, language, organize){ 
  var page = page || 1, pageSize = limit || 50, offset = (page - 1) * pageSize, pageDatas = items.slice(offset).slice(0, pageSize), totalPages = Math.ceil(items.length / pageSize);
  return {
    page: page,
    previousPage: page - 1 ? page - 1 : null,
    nextPage: (totalPages > page) ? page + 1 : null,
    datas: organize ? organizeDatas(pageDatas, language) : pageDatas,
    pageDetails:{
      offset: items.length > 0 ? offset + 1 : 0,
      skipped: offset + pageDatas.length,
      total: items.length, 
      totalPages: totalPages,
    }
  }  
} // pagination datas

export const ThisWeek = function(language) {
  const current = new Date()
  var week = [], dates = []; 
  current.setDate((current.getDate() - current.getDay()));
  for(var i = 0; i < 7; i++){
    week.push(new Date(current)); 
    current.setDate(current.getDate() +1);
  }
  for(let i in week){
    const month = week[i].toLocaleString(language,{month:'long'});
    const capitalizeMonth = month.charAt(0).toUpperCase() + month.slice(1);
    let dd = capitalizeMonth+", "+joinZero(week[i].getDate())+" "+week[i].getFullYear()
    dates.push(dd)
  }
  return dates
}//Função pra obter dias da semana atual

export const Percentage = function(totalThisWeek,totalThisMonth, total, fieldIcon,field){
  let period, quantity, Value;
  if(totalThisWeek === 0){
    period = "thisMonth";
    quantity = parseFloat((totalThisMonth*100) / total).toFixed(2);
    Value = totalThisMonth;
    
  }else{
    period = "thisWeek";
    quantity =parseFloat((totalThisWeek*100) / total).toFixed(2);
    Value = totalThisWeek;
  }
  let percents = isNaN(quantity) ? 0 : quantity; 
  return{
    total:!Value ? 0 : Value,
    period:period,
    fieldIcon: fieldIcon,
    field:field,
    percentage: percents,
    color:percents > 0 ? "5, 226, 126" : "255,17,0",
    arrow:percents > 0 ? "bi bi-arrow-up":"bi bi-arrow-down"
  }
} // Função para calcular a porcentagem de um valor

export const getLast12Months = (language)=>{
  var date = new Date();
  var mms = date.getMonth()+1;
  var yyyy = date.getFullYear();
  function previousMonths(language) {
    if (mms > 0) {mms--;} else {mms = 11;yyyy--;}
    const month = new Date(yyyy,mms).toLocaleString(language,{ month: 'long' });
    const capitalizeMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return { mm: capitalizeMonth, year: yyyy };
  }
  let y = 0,  arrOfFull = [] ,arrOfSliced=[];
  while(y < 12){
    let lastMonths = previousMonths(language);
    var MonthAndYear = [lastMonths.mm,lastMonths.year].join(" ");
    arrOfSliced.push(MonthAndYear.slice(0,3));
    arrOfFull.push(MonthAndYear);
    y++
  }
  return {
    full:arrOfFull.reverse(), sliced:arrOfSliced.reverse()
  }
} // Função para obter os últimos 12 meses

export const getYearlyChartdatas = (datas,language, type)=>{
  const arr = new Array();
  const lastMonths = getLast12Months(language).full;
  for(var i = 0; i < lastMonths.length; i++){
    var MonthAndYear = lastMonths[i];
    let totalInThisMonth = 0;
    for(let d in datas){
      var day = formatDate(datas[d].date, language).onlyMonthAndYear;
      if(type === "users"){
        if(day === MonthAndYear){
          totalInThisMonth++
        }
      }else{
        if(datas[d].status === "Inprogress" && day === MonthAndYear || datas[d].status === "Completed" && day ===  MonthAndYear){
          totalInThisMonth += datas[d].amount;
        }
      }
    }
    arr.push(totalInThisMonth);
  }
  return arr;
} // Função para obter os dados anuais


const runningDays = function (date){
  const time = (new Date()).getTime() - date.getTime(); 
  return{
    days: Math.floor(time/ 1000/60/60/24),
    minutes:Math.floor(time/1000/60),
    seconds:Math.floor(time/ 1000)} 
}// contar dias passados específicando o dia 

const timeAgo=(date, language) => {
  let ms = (new Date()).getTime() - date.getTime(), seconds=Math.floor(ms/1000), minutes=Math.floor(seconds/60), hours=Math.floor(minutes/60), days=Math.floor(hours/24), months=Math.floor(days/30), years=Math.floor(months/12); 
  let runningTime=ms === 0 || seconds < 60 ? {time: seconds, unit:0} : minutes < 60 ? {time: minutes, unit:1} : hours < 24 ? {time : hours, unit:2} : days < 30 ? {time : days, unit:3} : months < 12 ? {time:months, unit:4} : {time: years, unit:5};
  let currentTimeUnits=runningTime.time > 1 && runningTime.unit === 4 &&  language === "pt-PT" ? "meses" : runningTime.time > 1 ? texts.timeUnits[language][runningTime.unit]+"s": texts.timeUnits[language][runningTime.unit];
  return runningTime.unit < 1 ? texts.timeUnits[language][0] : [runningTime.time, currentTimeUnits, texts.ago[language]].join(" ");
}

export const formatDate=(d) =>{
  const locales =["pt-PT","en-US"];
  const dataTime = d ? d : getCurrentTime();
  const language = getLanguage();
  const date=new Date(0,dataTime[0]), monthName=date.toLocaleString(language||locales[0],{month:'long'});
  const capitalizeMonth=monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const dateToTimer=`${date.toLocaleString(locales[1],{month:'long'})}, ${[dataTime[1], dataTime[2], dataTime[3]].join(' ')}`;
  let runnintime=runningDays(new Date(dateToTimer));
  
  return{
    fullDate:`${capitalizeMonth}, ${[dataTime[1], dataTime[2],dataTime[3]].join(' ')}`,
    onlyDate:`${capitalizeMonth}, ${[dataTime[1], dataTime[2]].join(' ')}`,
    onlyMonthAndYear:`${[capitalizeMonth, dataTime[2]].join(' ')}`,
    timeAgo:timeAgo(new Date(dateToTimer),language),
    daysLength: runnintime.days,
    minutesLength: runnintime.minutes,
    secondsLength: runnintime.seconds
  }
}// formating date to view 

function joinZero(number){return(number < 10 ? "0" + number : number).toString();}

export const getCurrentTime = ()=>{
  const today = new Date();
  let now = [today.getHours(),today.getMinutes(),today.getSeconds()]; 
  let dd = joinZero(today.getDate()), mm = today.getMonth(), yyyy = today.getFullYear();  
  let currentTime = (t=[])=>{for(let i in now){t.push(joinZero(now[i]))} return t.join(":");}
  return{
    fullDate:[mm, dd, yyyy, currentTime()],
    onlyTime:currentTime(),
    onlyDate:[mm, dd, yyyy],
    onlyMonthAndYear: mm + " "+ yyyy
  }
}// get current time and date

export const expireDay=(duration)=> {
  var date=new Date();   
  Date.prototype.addDays=function(days){   
    let day = new Date(this.valueOf()); day.setDate(date.getDate()+ days);
    return [day.getMonth(), joinZero(day.getDate()), day.getFullYear(), getCurrentTime().onlyTime]
  }
  return date.addDays(duration)
}// get future date by assigning a value of dates

export const sortByDays = (a,b) =>{
  if (formatDate(a.date).secondsLength < formatDate(b.date).secondsLength)
     return -1;
  if (formatDate(a.date).secondsLength  > formatDate(b.date).secondsLength)
    return 1;
  return 0;
}// sort datas by days length;



export const authErros = [
  {name: "auth/user-not-found",target: "userNotFound",stack:"error"},
  {name:"auth/network-request-failed",target:"networkRequestFailed",stack:"networkfailed"},
  {name:"auth/email-already-in-use",target:"emailAlreadyInUse", stack:"error"},
  {name: "auth/weak-password",target:"weakPassword", stack:"warning"},
  {name: "auth/invalid-email",target:"invalidEmail", stack:"error"},
  {name: "auth/wrong-password",target:"wrongPassword", stack:"error"},
  {name: "auth/too-many-requests",target:"tooManyRequests", stack:"error"},
  {name: "auth/requires-recent-login",target:"requiresRecentLogin",stack:"error"}
];// firebase errors fallback


const toastIcons ={
  "success":{icon:"bi bi-check-circle", color:"var(--success-color)"},
  "error":{icon:"bi bi-x-circle", color:"var(--error-color)"},
  "warning":{icon:"bi bi-exclamation-circle",color:"var(--warning-color)"},
  "networkfailed":{icon:"bi bi-wifi-off", color:"var(--error-color)"}
}

export const Toast = ({props, onClear}) => {
  useEffect(()=>{
    if(props.text){setTimeout(()=>{onClear();},5000);}
  },[props]);
  if(!props.text || !props.stack){return null}
  return(
    <div className="box_toast flex_c_c">
      <div className="toast">
        <div className="toast_card flex_s_c">
       <i style={{color:toastIcons[props.stack].color}} className={toastIcons[props.stack].icon}></i> <p>{props.text}</p>
        <div className="toast_bar_wrap"><div className="toast_bar"></div></div>
      </div>
      </div>
    </div>
  );
}


const sharTexts = {
  shareText:{"pt-PT":"Tenho uma oportunidade incrível para te apresentar!\nRecentemente, descobri uma plataforma inovadora que permite ganhar dinheiro investindo na indústria avícola. Imagine só, poder lucrar com um setor que sempre esteve em alta e é essencial para a economia global.\n\nAlém de tornar o investimento acessível a todos, independentemente do tamanho da carteira, ela também fornece todo o suporte e conhecimento necessário para que você possa tomar decisões informadas e lucrativas.\n\nNão perca a chance de fazer parte dessa plataforma de investimento avícola revolucionária. Juntos, podemos aproveitar as oportunidades e construir um futuro financeiramente sólido. Venha fazer parte dessa equipe e ganhar dinheiro investindo no mercado avícola.\n\nRegistra se com o link abaixo.", 
    "en-US":"I have an incredible opportunity to present to you!\n\nI recently discovered an innovative platform that allows you to make money by investing in the poultry industry.  Just imagine, being able to profit from a sector that has always been on the rise and is essential for the global economy.\n\nIn addition to making investing accessible to everyone, regardless of portfolio size, it also provides all the support and knowledge necessary so you can make informed and profitable decisions.\n\nDon't miss your chance to be part of this revolutionary poultry investment platform.  Together, we can seize opportunities and build a financially solid future.  Come be part of this team and make money investing in the poultry market.\nRegister with the link below."}
}


export const ShareLink = ({language,value,both,text}) =>{
  const [error, setError] = useState(false);
  if(!value){return false}
  function copyValue() {
    if(both){
      if(!window.navigator.share){copyNow();}
      else{
        navigator.share({
          title:texts.gretings[language],
          text:sharTexts.shareText[language],
          url:value
        }).then(()=>{console.log("Successfully done");
        }).catch((error)=>{console.log(error);copyNow();});
      }
    }else{copyNow();}
  }
  function copyNow(){
    var range=document.createRange();
    range.selectNode(document.getElementById("valueToCopyPaste"));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    setError(!error);
    setTimeout(()=>{
      setError(false); 
    },1000);
  }
  return(
    <div style={{marginLeft:"0px"}} onClick={()=>copyValue()} className={`${text && "pdd6-15"} flex_e_c`}>
      {text && <div style={{marginRight:"10px"}}>{text}</div> || ""}
      {!error && <div>
        {both && <i style={{fontSize:"1.3em"}} className="bi bi-link-45deg"></i>||<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-copy" viewBox="0 0 16 16"><path fillRule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/></svg>}
        </div>||<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-check-lg" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/></svg>
      }
      <div onClick={()=>copyValue()} className="valueToCopyPaste" id="valueToCopyPaste">{value}</div>
    </div>
  );
}

export const Exclamation =()=>{return (<div className="pg_10 flex_c_c"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="red" className="bi bi-exclamation-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg></div>);}

export const chackeVal = (val,type)=>{
  return !val ? type : type+" valid";
}
export const ellipsis =(t)=> {return{text:t.length > 130 ? t.slice(0, 140)+"...":t, showMoreBtn:t.length >140}}
export const PasswordViewer = ({toggle, onToggle})=>{
  return(
    <div onClick={onToggle} className="password_eye flex_c_c">
      {!toggle && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/> <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>
        ||
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
          <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
          <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/> <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
        </svg>
      }
    </div>
  );
}

export const Stars = ({stars})=>{
  const MAX_STARS = 5;
  const fullStars = Math.floor(stars);
  const emptyStars = MAX_STARS - fullStars;
  return(
    <div className="flex_s card_stars">
      {[...Array(fullStars)].map((_, index) => (<i key={index} className="bi bi-star-fill filled" ></i>))}
      {[...Array(emptyStars)].map((_, index) => (<i key={index + fullStars}  className="bi bi-star-fill"></i>))}
    </div>
  );
}

export const statusIcons = {
  Pending:"bi bi-circle",
  Inprogress:"bi bi-clock",
  Completed:"bi bi-check-circle",
  Rejected:"bi bi-slash-circle",
  Voided:"bi bi-arrow-left-circle"
}

export const Pagination=({datas, handlePage, language})=>{
  if(!datas || datas.length < 1) return null;
  return(
    <div className="paginator flex_e_c">
      <div className="counter" >{texts.totalPages[language]}: {datas && datas.pageDetails.totalPages}</div>
      <button disabled={datas && datas.previousPage === null} onClick={()=>handlePage("previous")} className="btns flex_c_c"><i className="bi bi-chevron-double-left"></i></button>
      <div className="flex_c_c pageNumber">{datas && datas.page}</div>
      <button disabled={datas && datas.nextPage === null} onClick={()=>handlePage("next")} className="btns flex_c_c"><i className="bi bi-chevron-double-right"></i></button>
    </div>
  );
}
export const EmptyCard = ({language})=>{
  return(
    <div className="flex_c_c empty_card">
      <i className="bi bi-search"></i>
      <p>{texts.nothingWasFound[language]}</p>
    </div>
  );
}
export const MinLoder=()=>{return <div className="min_loader"><div/><div/><div/></div>} // btn loader
export const Loader = ({language})=>{
  return(
    <div className="loader_card flex_c_c"> 
      <p className="loader_heading">{texts.loadingMsg[language]}</p>
       <div className="loader_box">
        <span className="loader_bar"></span>
      </div>
    </div> 
  );
}

function setDefaultVals(obj) {
  const defaultValues = {
    header: obj.header !== undefined ? obj.header : true,
    title: obj.title !== undefined ? obj.title : "Alert",
    text: obj.text !== undefined ? obj.text : "Hi!",
    dangerText: obj.dangerText !== undefined ? obj.dangerText : null,
    actions: {
      onOk: {
        title: (obj.actions && obj.actions.onOk && obj.actions.onOk.title) || "OK",
        action: (obj.actions && obj.actions.onOk && obj.actions.onOk.action)|| null,
        type: (obj.actions && obj.actions.onOk && obj.actions.onOk.type) || "default",
        show: obj.actions && obj.actions.onOk.show !== undefined ? obj.actions.onOk.show : true
      },
      onCancel: {
        title: (obj.actions && obj.actions.onCancel && obj.actions.onCancel.title) ||  "cancel",
        action: (obj.actions && obj.actions.onCancel && obj.actions.onCancel.action)|| null,
        type: (obj.actions && obj.actions.onCancel && obj.actions.onCancel.type) || "default",
        show: obj.actions && obj.actions.onCancel && obj.actions.onCancel.show  !== undefined ? obj.actions.onCancel.show : true
      }
    }
  };
  return defaultValues;
};


export const Alert =({language, alertDatas, onOk, onCancel}) =>{
  const [datas, setDatas] = useState(null);
  useEffect(()=>{
    if(alertDatas){
      const items = setDefaultVals(alertDatas);
      setDatas(items);
    }
    return()=>{setDatas([]);}
  },[alertDatas]);
  
  if(!datas || typeof datas === "object" && datas.length === 0) return null;
  let id = datas &&  datas.actions.onOk.action;
  
  return(
    <div className="a_alert flex_c_c">
      <div className="a_alert_container a_conatiner">
        {datas && datas.header &&<div className="a_alert_header">
           {datas && datas.title &&<h3>{datas && datas.title}</h3>}
        </div>
        }
        <div className="a_alert_body">
          <p>{datas && datas.text}</p>
          {datas && datas.dangerText && <div className="a_alert_warning flex_s">
            <i className="bi bi-exclamation-square"></i>
            <p>{datas && datas.dangerText} </p>
          </div>}
        </div>
        <div className="a_alert_btns flex_e_c">
          {datas && datas.actions.onCancel.show && <div className="a_alert_btn_wrap">
            <button onClick={onCancel} className="a_alert_btn_cancel">{datas && texts[datas.actions.onCancel.title][language]}</button>
          </div>}
          {datas && datas.actions.onOk.show && <div className="a_alert_btn_wrap">
            <button onClick={()=>onOk(id)} className={`a_alert_btn_continue ${datas && datas.actions.onOk.type}`}>{datas && datas.actions.onOk.title}</button>
          </div>}
        </div> 
      </div>
    </div>
  );
}

export const toBool = (string) =>{
  switch(string){
    case "true":
      return true;
    break;
    case "false":
      return false;
    break;
    default:
      return "";
    break;
  }
}



export function useFileName(initialFileName) {
  const [fileName, setFileName] = useState(initialFileName);
  const handleFileChange = (newFileName) => {
    setFileName(newFileName);
  };
  const clearFileName = () => {
    setFileName(null);
  };
  return [fileName, handleFileChange,clearFileName];
}