import React, {useState,useEffect,useRef} from "react";
import {BrowserRouter,Routes,Route,useNavigate,useLocation,Outlet,Redirect,Link, NavLink} from "react-router-dom";
import {getLanguage,Avatar,getColor} from "./pages/Utils";
import NotFoundPage from "./pages/404-page";
import Layout from "./pages/cabinet/Layout";
import DashboardUser from "./pages/cabinet/Dashboard";
import Transactions from "./pages/cabinet/Transactions";
import Transaction from "./pages/modals/Transaction";
import NewWithdrawal from "./pages/cabinet/NewWithdrawal";
import {Fleets,FleetModal} from "./pages/cabinet/Fleets";
import UpdatesUserModal from "./pages/modals/UpdatesUserModal";
import NewDeposit from "./pages/cabinet/NewDeposit";
import Thanks from "./pages/modals/Thanks";
import Home from "./pages/mains/Home";
import {TermsOfConditions,PrivacyPolicy,HowItWorks} from "./pages/mains/TermsOfConditions";

import Reviews from "./pages/mains/Reviews";
import NewReview from "./pages/mains/NewReview";
import ReviewViewMore from "./pages/modals/ReviewViewMore";


import Login from "./pages/auth/Login";
import {SignUp,Reference} from "./pages/auth/SignUp";
import {RequestResetPassword,ResetPassword} from "./pages/auth/ResetPassword";

import DashboardAdmin from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import SupportChat from "./pages/admin/Support";
import Chat from "./pages/admin/Chat";
import {Gateways,GatewayModal} from "./pages/admin/Gateways";
import "./style.css";
import "./admin.css";

const App = ()=>{
  const [states, setStates] = useState({
    language: getLanguage(),
    theme:localStorage.getItem('theme'),
    shrunken:localStorage.getItem('shrunken'),
  });
  localStorage.setItem('avatarColor', JSON.stringify(getColor()));
  const onChanges = (item,value)=>{
    setStates(prevState=>({...prevState,[item]:value}));
    localStorage.setItem(item,value);
  }
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main/>}>
        <Route index element={<Home language={states.language} onChanges={onChanges}/>}/>
        <Route path="terms-of-conditions" element={<TermsOfConditions language={states.language} onChanges={onChanges}/>}/>
        <Route path="privacy-policy" element={<PrivacyPolicy language={states.language} onChanges={onChanges}/>}/>
        <Route path="how-it-works" element={<HowItWorks language={states.language} onChanges={onChanges}/>}/>
          <Route path="reviews" element={<Reviews language={states.language} onChanges={onChanges}/>}>
            <Route path="new" element={<CheckAuth><NewReview language={states.language}/></CheckAuth>}/>
            <Route path="view" element={<ReviewViewMore language={states.language}/>}/>
          </Route>
          <Route path="cabinet" element={<CheckAuth><Layout props={states} mode={"cabinet"} onChanges={onChanges}/></CheckAuth>}>
            <Route path="dashboard" element={<DashboardUser language={states.language}/>}>
              <Route path="message" element={<Thanks language={states.language}/>}/>
              <Route path="withdraw" element={<NewWithdrawal language={states.language} />}/>
              <Route path="update" element={<UpdatesUserModal language={states.language}/>}/>
            </Route>
            <Route path="transactions/:type" element={<Transactions language={states.language}/>}>
              <Route path="message" element={<Thanks language={states.language}/>}/>
              <Route path="new-withdraw" element={<NewWithdrawal language={states.language} />}/>
              <Route path="view/:id" element={<Transaction language={states.language}/>}/>
            </Route>
            <Route path="fleets" element={<Fleets language={states.language}/>}>
              <Route path="deposit" element={<NewDeposit language={states.language}/>}/>
              <Route path="message" element={<Thanks language={states.language}/>}/>
            </Route>
            <Route path="support" element={<Chat language={states.language}/>}/>
          </Route>
        </Route>
        <Route path="message" element={<Thanks language={states.language}/>}/>
        <Route path="login" element={<Login language={states.language}/>}/>
        <Route path="ref" element={<Reference language={states.language}/>}/>
        <Route path="Sign-up" element={<SignUp language={states.language}/>}/>
        <Route path="request-reset-password" element={<RequestResetPassword language={states.language}/>}/>
        <Route path="reset-password/:id" element={<ResetPassword language={states.language}/>}/>
        <Route path="admin" element={<CheckAuth><Layout props={states} mode={"admin"} onChanges={onChanges}/></CheckAuth>}>
          <Route index element={<DashboardAdmin language={states.language}/>}/>
          <Route path="dashboard" element={<DashboardAdmin language={states.language}/>}/>
          <Route path="users" element={<Users language={states.language}/>}>
            <Route path="view" element={<ReviewViewMore language={states.language}/>}/>
          </Route>
          
          <Route path="reviews" element={<Reviews language={states.language} mode="admin"/>}>
            <Route path="view" element={<ReviewViewMore language={states.language}/>}/>
          </Route>
          <Route path="support" element={<SupportChat language={states.language}/>}>
            <Route path="chat/:id" element={<Chat language={states.language}/>}/>
          </Route>
          <Route path="fleets" element={<Fleets language={states.language} mode={"admin"}/>}>
            <Route path="action" element={<FleetModal language={states.language}/>}/>
          </Route>
          <Route path="payments-gateways" element={<Gateways language={states.language}/>}>
            <Route path="action" element={<GatewayModal language={states.language}/>}/>
          </Route>
          <Route path="transactions/:type" element={<Transactions language={states.language} mode={"admin"}/>}>
            <Route path="view/:id" element={<Transaction language={states.language} mode={"admin"}/>}/>
          </Route>
        </Route>  
        <Route path="*" element={<NotFoundPage language={states.language}/>}/>
      </Routes>    
    </BrowserRouter>
  );
}
export default App;

const Main = () =>{
  const [scrollToTop, setScrollToTop]= useState(false);
  useEffect(() => {
    const handleScroll = () => {if(window.pageYOffset > window.outerHeight) {setScrollToTop(true);} else {setScrollToTop(false);}};
    window.addEventListener('scroll', handleScroll);
    return () => {window.removeEventListener('scroll', handleScroll);};
  }, []);
  const handleScrollTo =()=>{window.scrollTo(0,0)}
  return(
    <main>
      <Outlet/>
      <div onClick={handleScrollTo} className={scrollToTop && "active scrollToTop flex_c_c" || "inActive scrollToTop flex_c_c"}><i className="bi bi-arrow-up"></i></div>
    </main>
  );
}

const CheckAuth = ({children})=>{
  const location=useLocation();
  const navigate=useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated");
  useEffect(()=>{
    if(!isAuthenticated && location.pathname !=="/login"){
      localStorage.setItem("lastNavigation", location.pathname);
      navigate("/login", {replace:true});
    }
  },[location.pathname,isAuthenticated]);
  return <div>{children}</div>;
}