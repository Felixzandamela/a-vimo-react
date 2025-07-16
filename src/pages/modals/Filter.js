import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, useParams} from "react-router-dom";
import {texts} from "../texts/Texts";

export const Select = ({language, type, onSelection})=>{
  const [openSelection,setOpenSelection]= useState(false);
  const [selected, setSelected] = useState({value:"",index:0});
  const isMounted = useRef(true); 
  const dt ={ 
    transactions:[
    {"pt-PT":"Todos", "en-US":"All", value:""},
    {"pt-PT":"Pendente","en-US":"Pending", value:"Pending"},
    {"pt-PT":"Concluído","en-US":"Completed", value:"Completed"},
    {"pt-PT":"Em andamento","en-US":"In progress", value:"Inprogress"},
    {"pt-PT":"Rejeitado","en-US":"Rejected", value:"Rejected"},
    {"pt-PT":"Anulado","en-US":"Voided", value:"Voided"},
    ],
    reviews: [
    {"pt-PT":"Todos", "en-US":"All", value:""},
    {"pt-PT":"Revisado","en-US":"Revised", value:true},
    {"pt-PT":"Não revisado","en-US":"Unrevised", value:false}
    ],
    date:[
      {"pt-PT":"Todo tempo", "en-US":"All time", value:""},
      {"pt-PT":"Hoje","en-US":"Today", value:"today"},
      {"pt-PT":"Este mês","en-US":"This month", value:"month"}
    ],
    userStatus:[
      {"pt-PT":"Todos", "en-US":"All", value:""},
      {"pt-PT":"Banidos","en-US":"Banned", value:true},
      {"pt-PT":"Não banidos","en-US":"Unbanned", value:false},
    ]
  };
  const handleToggle =()=>{
    setTimeout(() => {
      if(isMounted.current) { // verificando se o componente ainda está montado
        setOpenSelection(!openSelection);
      }
    }, 300);
  }
  const handleTog = ()=>{if(openSelection){handleToggle();}}
  const handleChage = (event,index) => {
    const value = event.target.value;
    setSelected(prev=>({...prev,value:value,index:index}));
    onSelection(value);
  }
  useEffect(() => {
    return () => {isMounted.current = (false);};
  },[]);
  return(
    <div className="a_selection">
    <div onMouseOut={handleTog} onClick={handleToggle} className="selection a_conatiner">
      <div className="flex_b_c selected_wrap">
        <div className="flex_b_c">
          <i className="bi bi-circle"></i>
        <p className="selected ellipsis">{dt[type][selected.index][language]}</p>
        </div>
        <i style={{transform:`rotate(${openSelection && 180||0}deg)`}} className="bi bi-chevron-down arrow"></i>
      </div>
      <div style={{display: openSelection && "inline" || "none"}} className="selection_card a_conatiner">
        {dt[type].map((ty,index)=>(
        <label key={ty.value}>
          <div className="flex_s_c">
            <input value={ty.value} onChange={(event)=>handleChage(event, index)} checked={ty.value === selected.value} name="filterByDate" type="radio" className="input_radio_menu"/>
            {ty[language]}
          </div>
        </label>
        ))}
      </div>
    </div>
    </div>
  );
}

export const Search = ({language, type, onChange})=>{
  const [value, setValue] = useState("");
  const handleChage=(event)=>{setValue(event.target.value);}
  useEffect(()=>{onChange(value);},[value]);
  
  let placeholder;
  switch(type){
    case "dataId":placeholder = texts.searchByDataId[language]; break;
    case "userId":placeholder = texts.searchByUserId[language];break;
    default:placeholder = texts.search[language];break;
  }
  return(
    <div className="a_selection">
      <div  className="selection a_conatiner">
        <div className="flex_b_c selected_wrap">
          <div className="flex_b_c">
            <i className="bi bi-search"> </i>
            <input onChange={handleChage} value={value} placeholder={placeholder} type="text" className="a_transactions_search"></input>
          </div>
        </div>
      </div>
    </div>
  );
};