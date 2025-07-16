import React,{useState,useEffect,useRef} from "react";
import {useNavigate,Link} from 'react-router-dom';
import {texts} from "../texts/Texts";
import {dbReviews,useAuth,currentUser} from '../auth/FirebaseConfig';
import {chackeVal,Avatar,getCurrentTime, MinLoder} from "../Utils";

const getINegativeWords = (text)=>{
  const negativeWords  = ['ladrões','burla','burlado','burlando','burlada','burl@r','burl@r', 'burlar', 'burlão', 'burlista', 'burlador', 'burlável', 'burlas', 'burlões', 'burlistas', 'burladores', 'burláveis'];

  const arryOfNegativeWords = new RegExp("(" + negativeWords.join("|") + ")", "ig");
  return text.match(arryOfNegativeWords);
}

const MAX_STARS = 5;
const NewReview = ({language}) =>{
  const isAuth = useAuth();
  const color = localStorage.getItem('avatarColor');
  const navigate = useNavigate();
  const isMounted = useRef(true); 
  const [loading,setLoading]= useState(false);
  const user = currentUser(true);
  const [datas,setDatas]=useState({
    owner:null,
    stars:0,
    makePublic:true,
    revised:false,
    date:getCurrentTime().fullDate,
    text:"" //.replace(/\n/g, "\\n")
  });
  
  const [error,setError]=useState({stars:false,text:null});
  const fullStars = Math.floor(datas.stars);
  const emptyStars = MAX_STARS - fullStars;
  const containHtml = /<|>|<[a-z][\s\S]*>/i;
  const limitChars = 500;
  const handleStarClick = (index) => {
  const staring = ()=>{setDatas(prevData=>({...prevData,stars:index}));}
    index <= fullStars ? staring() : staring();
 };
 
 useEffect(()=>{
    if(isAuth){
      dbReviews.child(isAuth.uid).on('value', (snapChat)=>{
        let review = snapChat.val();
        setDatas(prevData=>({...prevData,
          owner:review.owner,
          stars:review.stars,
          makePublic:true,
          revised:review.revised,
          text:review.text
        }));
      });
    }
  },[isAuth]);
  
  useEffect(()=>{
    setDatas(prevData=>({...prevData,revised:!getINegativeWords(datas.text)}))
  },[datas.text]);
  const handleClearError = (event)=>{
    const field = event.target.name;
    setError(prevError=>({...prevError,[field]: null}));
  } // limpar os erros renderizados pelos inputs vazios ou inválidos
  
  const handleReviewTextChange=(event)=>{
    const {name,value}=event.target;
    if(value.length <= limitChars){
      setDatas(prevData=>({...prevData,[name]:value}));
      setError(prevError=>({...prevError,[name]:null}));
    }
    event.target.style.height = 'auto';
    event.target.style.height = (event.target.scrollHeight) + 'px';
  }
  
  const handleSubmit=(event) => {
    const errors = [];
    event.preventDefault();
    if(datas.text.length < 50){ setError(prevError=>({...prevError, text:texts.errorReviewText[language]})); errors.push(1);}
    if(datas.text.match(containHtml)){setError(prevError=>({...prevError, text:texts.containHtml[language]}));errors.push(1);}
    if(datas.stars<1){ setError(prevError=>({...prevError,stars:true})); stopShake(); errors.push(1);}
    if(!errors.length > 0){setLoading(true);handlePublicReview();}
  }
  
  async function handlePublicReview(){
    try{
      dbReviews.child(isAuth.uid).set(datas);
    }catch(error){
      console.log(error);
    }finally{
      setLoading(false);
      navigate(-1,{replace:true});
    }
  }
  
  const stopShake =()=>{setTimeout(()=>{
    if(isMounted.current){setError(prevError=>({...prevError,stars:false}));}},300)}
  useEffect(() => {
    return () => {isMounted.current = false;};
  }, []);
  const  emojis = ["bi bi-emoji-neutral","bi bi-emoji-angry", "bi bi-emoji-frown", "bi bi-emoji-expressionless", "bi bi-emoji-smile", "bi bi-emoji-heart-eyes"];
  const colorsArray = ["","red","orange", "lightblue","lightgreen","gold"];
  
  return(
    <div className="popUp flex_c_c">
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <div className="flex_s_c modal">
            {user && <Avatar avatar={user} color={color}/>}
            <div className="left">
              <h5 className="ellipsis">{user && user.name}</h5>  
              <p className="modal_parag" style={{fontSize:"0.8em"}}>{texts.newReviewTitle[language]}</p>
            </div>
          </div>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1, {replace:true})} className="a_aside_close" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="modal_body">
          <div className="ratings_humor flex_c_c"><i style={{color:colorsArray[datas.stars]}} className={emojis[datas.stars]}></i></div>
          <div className={error.stars && "flex_c_c shakes stars_new_review" || "flex_c_c stars_new_review"}>
            {[...Array(fullStars)].map((_, index) => (<i key={index} onClick={() => handleStarClick(index + 1)} className="bi bi-star-fill reviews_stars" ></i>))}
            {[...Array(emptyStars)].map((_, index) => (<i key={index + fullStars} onClick={() => handleStarClick(index + fullStars + 1)} className="bi bi-star-fill"></i>))}
          </div>
          <div className="input_card">
            <div className="input_wrap_textarea">
              <textarea maxLength="500" id="text" name="text" value={datas.text} rows="1" className={chackeVal(datas.text, "textarea")} onChange={handleReviewTextChange} onFocus={handleClearError} readOnly={loading}></textarea>
              <label htmlFor="text">{texts.reviewLabel[language]}</label>
              <small className="flex_e_c">{datas.text.length}/{limitChars}</small>
              </div>
            <div className="label_error"> {error && error.text}</div>
          </div>
          <div className="input_card">
            <button disabled={loading} className="btns main_btns">{loading && <MinLoder/> || texts.makePublic[language]}</button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}

export default NewReview;