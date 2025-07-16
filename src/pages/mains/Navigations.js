import React,{useState,useEffect,useRef} from "react";
import {useNavigate, useLocation,Link, NavLink} from "react-router-dom";
import {texts} from "../texts/Texts";
export const MainNav = ({language})=>{
  const [open, setOpen] = useState(false);
  const [navShadow, setNavShadow] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 20) {setNavShadow(true);
      } else {setNavShadow(false);}
    };
    window.addEventListener('scroll', handleScroll);
    return () => {window.removeEventListener('scroll', handleScroll);};
  }, []);
  return( 
    <nav style={{boxShadow: navShadow && "0 0 2px 2px RGBA(0,0,0,0.1)"|| "0 0 0 0 #eee"}} className="nav flex_c_c">
      <div className="nav_wrap">
        <div className="nav-left-contents flex_b_c">
          <div className="nav-logo-card flex_s_c">
            <img width="45px" src=" https://i.imgur.com/0rqDSrd.png " alt="Logo"/>
            <div className="logo"><p> Avi<span>mo.</span></p></div>
          </div>
        </div>
        <div className="nav-center-contents flex_c_c">
          <div id="nav-menu" className={open && "navActive nav-menu" || "nav-menu"}>
            <NavLink className={({isActive})=> isActive ? "active a":"a"} to="/"><div>{texts.home[language]}</div> </NavLink>
            <NavLink className={({isActive})=> isActive ? "active a":"a"} to="/how-it-works"><div>{texts.howItWorks[language]}</div> </NavLink>
            <NavLink className={({isActive})=> isActive ? "active a":"a"} to="/reviews"><div>{texts.reviewsTitle[language]}</div> </NavLink>
            
            <NavLink className="a hide" to="/sign-up"><div className="first">{texts.signUpTitle[language]}</div> </NavLink>
            <NavLink className="a hide" to="/login"><div className="last">{texts.loginTitle[language]}</div> </NavLink>
          </div>
        </div>
        <div className="nav-right-contents flex_b_c">
          <div className="nav-menu-smaller">
            <NavLink to="/sign-up"><div>{texts.signUpTitle[language]}</div> </NavLink>
            <NavLink to="/login"><div>{texts.loginTitle[language]}</div> </NavLink>
          </div>
          <div onClick={()=>setOpen(!open)} id="nav-btn" className={open && "navActive nav-btn" || "nav-btn"}>
            <div id="btnLine1"></div>
            <div id="btnLine2"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export const Footer =({language, onChanges})=>{
  return(
    <footer className="footer flex_c_c">
    <div className="footer-container">
      <div className="footer-left-contents">
        <div className="footer-logo-wrap">
            <img height="45px" width="45px" className="logo" src="https://i.imgur.com/3znKRGu.png" alt="Logo" />
            <div className="footer-logo">{document.location.hostname}<span>.</span></div>
          </div>
        <p className="footer-slogan">{texts.footerQuote[language]}</p>
        {/*<div className="div-newsletter">
          <p className="footer-slogan">{texts.subscribeText[language]}</p>
          <button className="btns main_btns btnFullWidth">{texts.subscribe[language]}</button>
        </div>*/}
      </div>
      <div className="footer-middle-contents">
        <div className="footer-wrap">
          <div className="footer-title">{texts.footerTitleA[language]}</div>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"} to="/">
              <div className="footer-links">{texts.home[language]}</div>
            </NavLink>
             <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"} to="/how-it-works">
              <div className="footer-links">{texts.howItWorks[language]}</div>
            </NavLink>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"} to="/login">
              <div className="footer-links">{texts.loginTitle[language]}</div>
            </NavLink>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"}  to="/sign-up">
                <div className="footer-links">{texts.signUpTitle[language]}</div>
            </NavLink>
           
          </div>
          <div className="footer-wrap">
            <div className="footer-title">{texts.footerTitleB[language]}</div>
            
         <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"} to="/how-it-works">
              <div className="footer-links">{texts.howItWorks[language]}</div>
            </NavLink>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"}  to="/reviews">
              <div className="footer-links">{texts.reviewsTitle[language]}</div>
            </NavLink>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"}  to="/terms-of-conditions">
              <div className="footer-links">{texts.termsOfConditionTitle[language]}</div>
            </NavLink>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"}  to="/privacy-policy">
              <div className="footer-links">{texts.privacyPolicyTitle[language]}</div>
            </NavLink>
          </div>
        </div>
        <div className="footer-rigth-contents">
          <div className="footer-wrap-last">
            <div className="footer-title">{texts.footerTitleC[language]}</div>
            <NavLink className={({isActive})=> isActive ? "active footer-footer-links":"footer-footer-links"} to="/cabinet/support">
              <div className="footer-links">{texts.contactUsTitle[language]}</div>
            </NavLink>
            <div className="footer-links">admin@avimo.com</div>
            <a className="footer-footer-links" href="mailto:admi@avimo.com">
              <div className="footer-links">support@avimo.com</div>
            </a>
            <div className="footer-social-medias">
              <a className="fb" href=" "><i className="bi bi-facebook"></i></a>
              <a className="tg" href=" "><i className="bi bi-telegram"></i></a>
              <a className="wp" href=" "><i className="bi bi-whatsapp"></i></a>
            </div>
          </div>
        </div>
      </div>
      <FooterCopyRights language={language} onChanges={onChanges}/>
    </footer>
  );
 }
 
const FooterCopyRights = ({language, onChanges}) => {
  const [open, setOpen] = useState(false);
  const isMounted = useRef(true); // estado para verificar se o componente está montado
  const languagesList = {
    "pt-PT":{ label:{"pt-PT":"Português","en-US":"Portuguese"}, value: "pt-PT" },
    "en-US":{ label:{"pt-PT":"Inglês","en-US":"English"}, value: "en-US" }
  };
  const arraylangs = Object.values(languagesList);

  const handleChage = (event) => {
    const value = event.target.value;
    onChanges("language", value);
  };

  const toggleLanguageMenu = () => {
    setTimeout(() => {if(isMounted.current){setOpen(!open);}else{setOpen(false);}},300);
  };
  const handleToggle=()=>{if(open){toggleLanguageMenu();}}
  useEffect(() => {
    return () => {isMounted.current = false;};
  }, []);
  
  return(
    <div className="footer-copyrigths flex_c_c">
      <div className="footer-copyrigth_card flex_b"><small><Link to="/" className="a copyrigths_logo">©{document.location.hostname} S.A</Link> {new Date().getFullYear()} {texts.copyrigths[language]}</small>
        <div onMouseOut={handleToggle} onClick={toggleLanguageMenu} className={open && "active footer-language-selected" || "footer-language-selected"}>
          <div className="flex_s_c">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-translate" viewBox="0 0 16 16">
             <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286H4.545zm1.634-.736L5.5 3.956h-.049l-.679 2.022H6.18z" />
              <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm7.138 9.995c.193.301.402.583.63.846-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6.066 6.066 0 0 1-.415-.492 1.988 1.988 0 0 1-.94.31z" />
            </svg>
            <div style={{width:"100%"}} className="flex_b_c">
            <p>{languagesList[language].label[language]}</p>
             <div className="arrow"><i className="bi bi-chevron-up"></i> </div>
          </div>
          </div>
        <div className="footer-language-menu">
          <div className="langCard">
            {arraylangs.map(l=>(
           <label key={l.value}>
              <div className="flex_s_c">
                <input value={l.value} onChange={handleChage} name="selectLaguange" type="radio" checked={l.value === language} className="input_radio_menu"/>
                {l.label[language]}
              </div>
            </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}