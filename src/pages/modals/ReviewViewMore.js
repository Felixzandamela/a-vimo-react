import React,{useState,useEffect,useRef} from "react";
import {useNavigate, useLocation,useParams} from "react-router-dom";
import {texts} from "../texts/Texts";
import {Avatar,formatDate,Stars} from "../Utils";
import {useAuth,dbReviews,dbUsers} from '../auth/FirebaseConfig';


const ReviewViewMore =({language})=>{
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get('id');
  const [review, setReview] = useState(null);
  
  useEffect(()=>{
    dbReviews.child(id).on('value', (snapChat)=>{
      let review = snapChat.val();
      if(review.revised){
      dbUsers.child(review.owner).on("value", (snapUser)=>{
        const {name, avatar} = snapUser.val();
        const data ={
          owner:review.owner,
          name:name,
          avatar:avatar,
          stars:review.stars,
          text:review.text,
          date:review.date,
        }
        setReview(data);
      });
      }
    });
  },[id]);
  
  
  if(!review) return null;
  return(
    <div className="popUp flex_c_c">
      <div className="card_popup a_conatiner">
        <div className="modal_header flex_b_c">
          <div className="flex_s_c modal">
            <Avatar avatar={review}/>
            <div className="left">
              <h5 className="ellipsis">{review.name}</h5>  
              <Stars stars={review.stars}/>
            </div>
          </div>
          <div className="flex_b_c"><svg onClick={()=>navigate(-1, {replace:true})} className="a_close_popup" fill="currentColor" opacity="1.0" baseProfile="full" width="24" height="24" viewBox="0 0 24.00 24.00"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg></div>
        </div>
        <div className="modal_body">
          <div className="comment">
            <div className="">
              <i className="bi bi-quote"></i>
              {review.text.split("\n").map((tex, index)=>(
                <p key={index} className="review_parag">{tex}</p>
              ))}
            </div>
            <div className="time">{formatDate(review.date, language).fullDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReviewViewMore;