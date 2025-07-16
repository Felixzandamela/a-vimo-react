import React,{useState,useEffect,useRef} from "react";
import {useNavigate, useLocation,Link, NavLink,Outlet} from "react-router-dom";
import {texts} from "../texts/Texts";
import {MainNav,Footer} from "./Navigations";
import ReviewsIcon from './ReviewsIcon';
import {Avatar,formatDate,ellipsis,paginator,Stars,EmptyCard,Loader,Alert,Toast,toBool} from "../Utils";
import {useAuth,dbReviews,dbUsers} from '../auth/FirebaseConfig';
import {Select} from "../modals/Filter";

const Reviews =({language, mode, onChanges})=>{
  const [data, setData ]=useState(null);
  const isMounted = useRef(true);
  useEffect(()=>{
    return ()=> {isMounted.current = false;}
  },[]);
  
  
  useEffect(()=>{
    const reviewsDatas = [];
    const fecthDatas = snapChat =>{
      if(snapChat.exists()){
        snapChat.forEach((snapChatData)=>{
          let review = snapChatData.val();
          let ownerId = typeof review.owner === "object" ? review.owner.id : review.owner;
          dbUsers.child(ownerId).on("value", (snapUser)=>{
            const {name, avatar} = snapUser.val();
            const owner = {
              name:name,
              avatar:avatar,
              id:ownerId
            }
            review.owner = owner;
            reviewsDatas.push(review);
            if(snapChat.numChildren() === reviewsDatas.length && isMounted.current){
              setData(reviewsDatas);
            }
          });
        });
      }else{
        if(isMounted.current){setData([]);}
      }
    }
    if(mode === "admin"){
      dbReviews.once("value", fecthDatas);
    }else{
      dbReviews.orderByChild("revised").equalTo(true).on("value", fecthDatas);
      dbReviews.orderByChild("revised").equalTo(true).on("child_changed",()=>{
        setData(null);
        dbReviews.orderByChild("revised").equalTo(true).once("value", fecthDatas);
      });
      
    }
    return()=>{
      dbReviews.orderByChild("revised").equalTo(true).off("value", fecthDatas);
      if(mode === "admin"){
        dbReviews.off("value", fecthDatas);
      }
    }
    handleScrollTo();
  },[]);
  
  if(mode === "admin"){
    return <AdminReviews language={language} data={data}/>
  }else{
    return <Review language={language} data={data} onChanges={onChanges}/>
  }
}

const Review =({language, data, onChanges})=>{
  const current = useAuth();
  const [states, setStates] = useState({loading:true,limitTo:5,showPaginator:true,page:1});
  const [datas,setDatas] = useState(null);
  
  useEffect(() => {
    if(data){
      setStates(prevState=>({...prevState,loading:false}));
      setDatas(paginator(data, states.page, states.limitTo));
    }
  }, [states.page, data]);
    
  return(
    <main>
      <MainNav language={language}/>
      <header className="header">
        <div className="header-container">
          <ReviewsIcon/>
          <div className="header-contents">
            <h1 className="heading">{texts.reviewsHeaderTitleA[language]} <span>{texts.reviewsHeaderTitleB[language]}</span> {texts.reviewsHeaderTitleC[language]}</h1>
            <p className="description">{texts.reviewsHeaderParagraph[language]}</p>
           <Link className="a" to="/reviews/new"> <button className="header-btn">{texts.makeAnReviews[language]}</button></Link>
          </div>
        </div>
      </header>
    <section className="flex_c_c">
      {states.loading && <Loader language={language}/>||
      <div className="sec_wrap flex_b_">
        <div className="packages_container flex_wrap">
          {datas && datas.datas.map(review=>{
            const {text, showMoreBtn} = ellipsis(review.text);
            return(<div key={review.owner.id} className="card_wrap">
              <div className="package_card a_conatiner">
                <div className="flex_s">
                  <div className="card_header_container">
                    <Avatar avatar={review.owner}/>
                  </div>
                  <div className="card_header_details">
                    <h5 className="ellipsis">{review.owner.name}</h5>
                    <Stars stars={review.stars}/>
                    <p>{formatDate(review.date, language).timeAgo}</p>
                  </div>
                </div>
                <div className="card_body">
                  <div className="comment">
                    <p className=""><i className="bi bi-quote"></i> {text} {showMoreBtn && <Link to={`/reviews/view?id=${review.owner.id}`} className="a"><span className="a_more">{texts.seeMore[language]}</span></Link>|| null}</p>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
        {states.showPaginator && (<div className="paginator flex_e_c">
          <div className="counter" >{texts.totalPages[language]}: {datas && datas.pageDetails.totalPages}</div>
            <button disabled={datas && datas.previousPage === null} onClick={()=>setPage(page-1)} className="btns flex_c_c"><i className="bi bi-chevron-double-left"></i></button>
            <div className="flex_c_c pageNumber">{datas && datas.page}</div>
            <button disabled={datas && datas.nextPage === null} onClick={()=>setPage(page+1)} className="btns flex_c_c"><i className="bi bi-chevron-double-right"></i></button>
          </div>) || null}
      </div>
      }
    </section>
    <Outlet/>
    <Footer language={language} onChanges={onChanges}/>
    </main>
  );
}

const AdminReviews = ({language, data})=>{
  const isMounted = useRef(true);
  const [states, setStates] = useState({page:1, limitTo:20, showPaginator:true, statusType:"", loading:true});
  const [error,setError]=useState({error:{text:null, stack:null}});
  const [datas,setDatas] = useState(null);
  const [items,setItems] = useState(null);
  const [reviewsToUpdate, setReviewsToUpdate] = useState([]);
  const [alertDatas, setAlertDatas] = useState(null);
  
  useEffect(()=>{
    return ()=> {isMounted.current = false;}
  },[]);
  
  useEffect(()=>{
    if(data){
      const select = toBool(states.statusType);
      const filteredData = data.filter((item)=>{
        if(states.statusType === "" && item.text !== "" || select && item.revised && item.text !== "" || !select && !item.revised && item.text !== ""){
          return true;
        }
        return false;
      });
      if(isMounted.current){setItems(filteredData);}
    }
    
  },[data,states.statusType]);
  
  useEffect(() => {
    if(items && isMounted.current){
      setStates(prevState=>({...prevState,loading:false}));
      setDatas(paginator(items, states.page, states.limitTo));
    }
  }, [states.page, items]);
  
  const handleChange = (event) => {
    const ownerID = event.target.value;
    if (event.target.checked) {
      setReviewsToUpdate(prevIds=>[...prevIds, ownerID]);
    } else {
      const updatedReview = reviewsToUpdate.filter(id => id !== ownerID);
      setReviewsToUpdate(updatedReview);
    }
  }

  const handleRevise = (action)=>{
    const alertData = {
      title:texts.updateReviews[language],
      text: action ? texts.confirmReveseReview[language] : texts.confirmUnreveseReview[language],
      dangerText: action ? texts.dangerReveseReview[language] : null,
      actions:{
        onOk:{
          title: action ? texts.makePublic[language] : texts.doNotPublish[language],
          action:action,
          type: action? null: "danger",
        }
      }
    }
    setAlertDatas(alertData);
  }
  
  const errFunc = (error, stack)=>{
    console.log(error);
    setError(prevError=>({...prevError,error:{text:error,stack:stack}}));
  }
  
  const handleAction =(action)=>{
    reviewsToUpdate.forEach((reviewId)=>{
      dbReviews.child(reviewId).update({
        revised:action
      }).then(()=>{
        errFunc(texts.reviewsUpdatedSuccessfully[language],"success");
      }).catch((error)=>{errFunc(error.message, "error");});
    });
    setAlertDatas(null);
    setReviewsToUpdate([]);
  }
  
  const newType =  texts.selected[language];
  const selected = language === "pt-PT" && reviewsToUpdate.length <= 1 ? newType.slice(0, -1) : newType;
  
  return(
    <section className="a_sec m20">
      <Toast props={error.error} onClear={()=>setError(prevError=>({...prevError,error:{text:null,stack:null}}))}/>
      <Alert language={language} alertDatas={alertDatas} onOk={(e)=>handleAction(e)} onCancel={()=>setAlertDatas(null)}/>
      <header className="a_sec_header flex_b_c">
        <h1 className="page-title">{texts.reviewsTitle[language]}{items && `(${items.length})`}</h1>
        {reviewsToUpdate && reviewsToUpdate.length > 0 && 
          <div className="a_selections_wrap flex_c_c">
            <svg onClick={()=>setReviewsToUpdate([])} className="" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
            <p>{reviewsToUpdate.length} {selected}</p>
        </div> || <Select language={language} type={"reviews"} onSelection={(v)=>setStates(prevState=>({...prevState,statusType:v}))}/>}
      </header>
      {!datas && states.loading && <Loader language={language}/> ||
        <div className="">
          {datas && datas.datas.length > 0 && 
          <div style={{maxHeight: reviewsToUpdate && reviewsToUpdate.length > 0 &&  "calc(100vh - 165px)" || "calc(100vh - 105px)"}} className="a_catalgos">
            {datas && datas.datas.map(review=>(
              <div key={review.owner.id} className="flex_s a_catalgo">
                <div className="a_catalgo_img">
                  <Avatar avatar={review.owner}/>
                </div>
                <div className="a_catalgo_body flex_b">
                  <Link to={`/admin/reviews/view?id=${review.owner.id}`} className="a">
                    <h4 className="eli">{review.owner.name}</h4>
                    <Stars stars={review.stars}/>
                    <p className="ellipsis_3_line">{review.text}</p>
                    <h5 className="a_body_time">{formatDate(review.date, language).timeAgo}</h5>
                  </Link>
                  <input checked={reviewsToUpdate.includes(review.owner.id)} value={review.owner.id} onChange={handleChange} type="checkbox" className="input_check"/>
                </div>
              </div>
            ))}
            
          {states.showPaginator && (<div className="paginator flex_e_c">
          <div className="counter" >{texts.totalPages[language]}: {datas && datas.pageDetails.totalPages}</div>
            <button disabled={datas && datas.previousPage === null} onClick={()=>setPage(page-1)} className="btns flex_c_c"><i className="bi bi-chevron-double-left"></i></button>
            <div className="flex_c_c pageNumber">{datas && datas.page}</div>
            <button disabled={datas && datas.nextPage === null} onClick={()=>setPage(page+1)} className="btns flex_c_c"><i className="bi bi-chevron-double-right"></i></button>
          </div>) || null}
          </div> || <EmptyCard language={language}/>
          }
          
          {reviewsToUpdate && reviewsToUpdate.length > 0 &&
            <div className="a_bottom a_conatiner flex_c_c">
              <button onClick={()=>handleRevise(false)} className="button btn-sg">Rejeitar</button>
              <button onClick={()=>handleRevise(true)} className="button main-btn"> Aprovar</button>
            </div>
          }
        </div>
      }
      <Outlet/>
    </section>
  );
}

export default Reviews;