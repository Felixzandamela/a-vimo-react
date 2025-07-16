import React, {useState,useEffect, useRef} from "react";
import {useNavigate,useLocation,Outlet,Redirect,Link, NavLink} from "react-router-dom";
import {texts} from "../texts/Texts";
import {Avatar, Alert, idGenerator, MinLoder,ShareLink,formatDate,getCurrentTime, Toast, formatNum,useFileName} from "../Utils";
import {currentUser,useAuth,dbUsers,signOut,dbImages} from '../auth/FirebaseConfig';
import Notifications from "../modals/Notifications";
import {ImageCropper} from "../modals/ImageTools";

const Layout = ({props, mode, onChanges}) =>{
  const color = localStorage.getItem('avatarColor');
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = useAuth();
  const isMounted = useRef(true);
  const datas = currentUser(true);
  const [states, setStates]=useState({
    openAside:false,openProfile:false, searchs:null,loading:false,
  });
  const [error,setError] = useState(null);
  const [fileName, setFileName,clearFileName] = useFileName(null);
  useEffect(() => {
    if (isAuth) {
      dbUsers.child(isAuth.uid).child("online").set("online").catch((error) => { console.log(error) });
    }// Atualiza o status para 'online' quando o usuário está autenticado
  return () => {
    const updateOffline = async () => {
      try {
        const lastSeen = getCurrentTime().fullDate;
        await dbUsers.child(isAuth.uid).child("online").set(lastSeen);
      } catch (error) {console.log(error);}
    };
    if(isAuth && isAuth.uid !== null){updateOffline();}
  }
}, [isAuth]); 

  const menuList = {
    languages: [
      { label:{"pt-PT":"Português","en-US":"Portuguese"}, value: "pt-PT" },
      { label:{"pt-PT":"Inglês","en-US":"English"}, value: "en-US" }
    ],
    themes: [
      { label:{"pt-PT":"Dia","en-US":"Day"}, value: "light" },
      { label:{"pt-PT":"Noite","en-US":"Night"}, value: "dark" }
    ],
    links:[
      {label:{"pt-PT":"Depósitos","en-US":"Deposits"}, value:"/cabinet/transactions/deposits"},
      {label:{"pt-PT":"Saques","en-US":"Withdrawals"}, value:"/cabinet/transactions/withdrawals"}, 
      {label:{"pt-PT":"Painel",'en-US':"Dashboard"}, value:"/cabinet/dashboard"}
    ]
  }
  
  const handleToggle =(event)=>{
   if(isMounted.current){
      setTimeout(()=>setStates(prevState=>({...prevState,[event]:!states[event]})),200);
    }
  }
  
  function filtrarLinksPorLabel(links, termo) {
    return links.filter(link => {
      return link.label["pt-PT"].toLowerCase().indexOf(termo.toLowerCase()) ===-1 || link.label["en-US"].toLowerCase().indexOf(termo.toLowerCase()) ===-1;
    });
  }
  const handleSearch = (event)=>{
    const value = event.target.value;
    const resultado = filtrarLinksPorLabel(menuList.links, value);
    setStates(prevState=>({...prevState,searchs:resultado}));
  }

  useEffect(()=>{
    const isAdminAreaOrIsCabinetArea = /^(\/admin|\/cabinet)$/i.test(location.pathname);
    if(isAdminAreaOrIsCabinetArea){
     navigate(`${location.pathname}/dashboard`, {replace: true});
    }//navigate to /admi/dashboard | /cabinet/dashboard if pathname match /admin or /cabinet.
  },[location.pathname]);
  useEffect(()=>{
    if(datas){
      if(mode === "admin" && !datas.isAdmin){
        navigate("/cabinet/dashboard");
      }
    }
  },[datas,mode]);
  const handleSaveAvatar = (img)=>{
    setStates(prevState=>({...prevState,loading:true}));
    dbImages.child(datas.id).update({src: img}).then(()=>{
      setStates(prevState=>({...prevState,loading:false}));
      clearFileName();
    }).catch((error)=>{
      console.log(error);
    });
  }
  const [alertDatas, setAlertDatas] = useState(null);
  function handleAction(){
    const lastSeen = getCurrentTime().fullDate;
    if(isAuth){
      dbUsers.child(isAuth.uid).child("online").set(lastSeen).then(()=>{
        handleSignOut();
      }).catch(()=>{console.log(error);});
    }else{handleSignOut();}
  }
  
  const handleSignOut = async function(){
    try{
      await signOut();
      localStorage.setItem("isAuthenticated", "");
      navigate("/login", {replace:true});
    }catch(error){console.log(error);}
  }
  
  const handleLogOut =(e,n)=>{
    const alertData = {
      title:texts.logout[props.language],
      text:texts.confirmLogOut[props.language],
      actions:{
        onOk:{
          title:texts.logout[props.language],
          type:"danger"
        }
      }
    }
    setAlertDatas(alertData);
  }
  const handleChanges = (event)=>{
    const value = event.target.checked ? "shrunken" : "";
    onChanges("shrunken",value); 
  }
  const link = datas ? `${document.location.origin}/ref?id=${datas.id}` : "";
  let path = mode === "admin" ? "cabinet":"admin"
  return(
    <main className={`a_main ${props.theme} ${states.openAside && "aside_active"} ${props.shrunken} flex_b`}>
      <aside className="a_aside shrunke">
        <div className="a_aside_box">
          <div className="a_aside_logo flex_b_c">
            <Link to="/" className="a flex_s_c">
              <div className="flex_c_c a_logo">
                <img height="40px" width="40px" src="https://i.imgur.com/3znKRGu.png" alt="Logo" />
              </div>
              <div className="a_aside_logo_text">Localhost</div>
            </Link>
          </div>
          <div className="a_aside_scroll">
            <Aside language={props.language} mode={mode} logOut={()=>handleLogOut()} toggle={()=>handleToggle("openAside")}/>
            {/*mode== "cabinet" && datas && <div className="pdd10_a m5-a">
            <div className="a_aside_card br6-a pdd10_a">
              <div style={{fontSize:"4rem"}}>
                <i className="bi bi-link-45deg"></i>
              </div>
              <p className="pdd10_t_b">{texts.refLinkParaph[props.language]}</p>
              <button className="white-btn br4-a"> <ShareLink language={props.language} value={link} both={true} text={texts.InvitesAfriend[props.language]}/> </button>
            </div>
          </div>*/}
          </div>
          <div className="a_shrunken_box flex_b_c">
          <div className="a_shrunken_box_title m5-l-r">{texts.shrunken[props.language]}</div>
          <div className="flex_c_c pdd5_l_r">
            <input onChange={handleChanges} className="a_inputs" checked={props.shrunken === "shrunken"} type="checkbox"/>
          </div>
        </div>
        </div>
      </aside>
      <section className="a_sec_admin flex_wrap">
        <section className="a_width_72">
          <Alert language={props.language} alertDatas={alertDatas} onOk={(e)=>handleAction(e)} onCancel={()=>setAlertDatas(null)}/>
          <nav className="a_nav flex_c_c">
            <div className="a_nav_wrap flex_b_c">
              <div className="a_nav-item a_ni1">
                <div className="flex_s_c">
                  <div className="a_btn_Nav" onClick={()=>handleToggle("openAside")}><div></div><div></div><div></div></div>
                  <div className="a_nav-item">
                    <div className="flex_c_c a_search_card a_conatiner">
                      <input onChange={handleSearch} id="search" placeholder="Pesquisar" type="search"/>
                      <i className="bi bi-search"> </i>
                      {states.searchs && 
                        <div className="a_search_list a_c_menu a_conatiner br4-a">
                          {states.searchs.map((item,k)=>(<div onClick={()=>navigate(item.value)} key={k} className="pdd6_10 flex_s_c">{item.label[props.language]} </div>))}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex_c_c a_nav-item">
                <div className="btn_circle marg5-l-r flex_c_c br60">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16"><path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"/></svg>
                  <div className="a_c_menu a_conatiner br4-a">
                    {menuList.languages.map(l=>(<div onClick={()=>onChanges("language", l.value)} key={l.value} className={` ${l.value === props.language && "active"} pdd6_10 flex_s_c`}>{l.label[props.language]}</div>))}
                  </div>
                </div>
                <div className="btn_circle marg5-l-r flex_c_c br60">
                  {props.theme === "dark" && 
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-sun" viewBox="0 0 16 16"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/></svg> ||
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-moon" viewBox="0 0 16 16"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278M4.858 1.311A7.27 7.27 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.32 7.32 0 0 0 5.205-2.162q-.506.063-1.029.063c-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286"/></svg>
                  }
                  <div className="a_c_menu a_conatiner br4-a">
                    {menuList.themes.map((l, index)=>(<div key={index} onClick={()=>onChanges("theme", l.value)} className={`${l.value === props.theme && "active"} pdd6_10`}>{l.label[props.language]}</div>))}
                  </div>
                </div>
                <Notifications language={props.language}/>
                <div onClick={()=>handleToggle("openProfile")} className="avatar marg5-l flex_c_c br60">
                  {datas && <Avatar avatar={datas} color={color}/>}
                </div>
              </div>
            </div>
          </nav>
          <Outlet/>
        </section>
        <section style={{display: states.openProfile && "inline" || "none"}} className="a_width_28 a_sec_profile">
          <div className="a_conatiner">
            <div className="a_header_profile flex_b_c">
              <div onClick={()=>handleToggle("openProfile")} className="a_back_btn flex_c_c">
                <svg fill="currentColor" opacity="1.0" baseProfile="full" width="26" height="26" viewBox="0 0 24.00 24.00"><path d="M20 11v2H7.99l5.505 5.505-1.414 1.414L4.16 12l7.92-7.92 1.414 1.415L7.99 11H20z" /></svg>
              </div>
              <div onClick={()=>handleToggle("openProfile")} className="pro-btns flex_c_c">
                <Link to="/cabinet/dashboard/withdraw" className="a"><button className="button withdrawals-btn">{texts.withdrawNow[props.language]}</button></Link>
                <Link to="/cabinet/packages" className="a"><button className="button deposits_btn">{texts.depositNow[props.language]}</button></Link>
              </div>
            </div>
            <div className="a_profile_wrap">
              <div className="a_avatar_card flex_c_c">
                <div className="avatar_box">
                  {datas && <Avatar avatar={datas}/>}
                  <ImageCropper language={props.language} handleSaveAvatar={handleSaveAvatar} fileName={fileName} setFileName={setFileName} clearFileName={clearFileName}/>
                </div>
                <div className="a_profile_name flex_c_c">{datas && datas.name} <Link to="/cabinet/dashboard/update?field=name" className="a a_edit_name"><i className="bi bi-pen-fill"></i></Link></div>
                {datas && datas.isAdmin && <Link style={{color:"var(--main-color)"}} to={`/${path}`}>{path}</Link>}
              </div>
              <div className="balance-card-o">
                <div className="a_balance-card">
                  <div className="title">{texts.balanceAvailable[props.language]}</div>
                  <p>MZN {datas && datas.balance && parseFloat(formatNum(datas.balance)).toFixed(2) || 0.00 }</p>
                </div>
              </div>
              <div className="a_prof_box">
                <div className="a_prof_box_title">{texts.userInfos[props.language]}</div>
                <div className="flex_s a_activity system">
                  <div className="flex_c_c a_activity_icon"><i className="bi bi-envelope"></i></div>
                  <div className="">
                    <p>{texts.emailAddress[props.language]}</p>
                    <div className="a_activity_p">{datas && datas.email}</div>
                  </div>
                </div>
                <div className="flex_s a_activity system">
                  <div className="flex_c_c a_activity_icon br60"><i className="bi bi-telephone"></i></div>
                  <div style={{width:"100%"}} className="flex_b">
                    <div className="">
                      <p>{texts.phoneNumber[props.language]}</p>
                      <div className="a_activity_p">{datas && datas.phoneNumber && datas.phoneNumber || texts.notProvidedYet[props.language]}</div>
                    </div>
                    <div className="btn_circle br60 flex_c_c"><Link to="/cabinet/dashboard/update?field=phoneNumber" className="a editNameBtn"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="" viewBox="0 0 16 16"><path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001z"/></svg></Link></div>
                  </div>
                </div>
                <div className="flex_s a_activity create">
                  <div className="flex_c_c a_activity_icon"><i className="bi bi-calendar2-date"></i></div>
                  <div className="">
                    <p>{texts.memberSince[props.language]}</p>
                    <div className="a_activity_p">{datas && formatDate(datas.date, props.language).fullDate}</div>
                  </div>
                </div>
                <div className="flex_s a_activity delete">
                  <div className="flex_c_c a_activity_icon"><i className="bi bi-geo-alt"></i></div>
                  <div className="">
                    <p>{texts.location[props.language]}</p>
                    <div className="a_activity_p">{datas && datas.location}</div>
                  </div>
                </div>
                <div className="flex_s a_activity update">
                  <div className="flex_c_c a_activity_icon"><i className="bi bi-fingerprint"></i></div>
                  <div className="">
                    <p>{texts.ProfileID[props.language]}</p>
                    <div className="a_activity_p flex_b_c">
                      <div>{datas && datas.id}</div>
                      {datas && <div className="pdd10-l"><ShareLink language={props.language} value={datas.id} both={false} text={null}/></div>}
                    </div>
                  </div>
                </div>
                <div className="a_prof_box">
                  <div className="flex_b_c a_prof_box_title">
                    <div className="">{texts.settings[props.language]}</div>
                    <div className="flex_c_c"></div>
                  </div>
                  <Link onClick={()=>handleToggle("openProfile")} to="/cabinet/dashboard/update?field=password" className="a">
                    <div className="flex_s center a_activity update">
                      <div className="flex_c_c"><i className="bi bi bi-lock"></i></div>
                      <div className="pdd10-l">
                        <p>{texts.changePassword[props.language]}</p>
                      </div>
                    </div>
                  </Link>
                  <div onClick={handleLogOut} className="flex_s center a_activity delete">
                    <div className="flex_c_c"><i className="bi bi-box-arrow-right"></i></div>
                    <div className="pdd10-l"><p>{texts.logout[props.language]}</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const Aside = ({language, mode, logOut, toggle})=>{
  const defaultAsideLinks = [
    {
      title: texts.dashboard[language],
      link: `/${mode}/dashboard` ,
      icon: "bi bi-grid"
    },{
      title: texts.support[language],
      link: `/${mode}/support`,
      icon: "bi bi-headset"
    },{
      title: texts.deposits[language],
      link: `/${mode}/transactions/deposits`,
      icon: "bi bi-box-arrow-in-up"
    },{
      title: texts.withdrawals[language],
      link: `/${mode}/transactions/withdrawals`,
      icon: "bi bi-box-arrow-down"
    },{
      title: texts.commissions[language],
      link: `/${mode}/transactions/commissions`,
      icon: "bi bi-link-45deg"
    },{
      title: `${texts.fleet[language]}s`,
      link: `/${mode}/fleets`,
      icon: "bi bi-box"
    }
  ];
  const adminAsideLinks = [
    {
      title: texts.paymentGateways[language],
      link: "/admin/payments-gateways",
      icon: "bi bi-credit-card"
    },{
      title: texts.users[language],
      link: "/admin/users",
      icon: "bi bi-people"
    },{
      title: texts.reviewsTitle[language],
      link: "/admin/reviews",
      icon: "bi bi-chat-square-quote"
    }
  ];
  const asideLinks = mode !== "admin" ? defaultAsideLinks : [...defaultAsideLinks,...adminAsideLinks];
  return(
    <div onClick={toggle} className="a_aside_wrap">
      {asideLinks.map(item=>(
        <NavLink key={idGenerator(6)} className={({isActive})=> isActive ? "a  a_active":"a"} to={item.link}>
          <div className="a_aside_items">
            <div className="flex_b_c a_btn">
              <div className="flex_c_c"><i className={item.icon}> </i><p>{item.title}</p></div>
            </div>
          </div> 
        </NavLink>
      ))}
      <div onClick={()=>logOut()} className="a_aside_items">
        <div className="flex_b_c a_btn">
          <div className="flex_c_c"><i className="bi bi-box-arrow-right"> </i><p>{texts.logout[language]}</p></div>
        </div>
      </div>
    </div>
  );
}

export default Layout;