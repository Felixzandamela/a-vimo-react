import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader, EmptyCard, formatNum ,Alert} from "../Utils";
import { texts } from "../texts/Texts";
import { dbPackages ,dbDeposits,dbCommissions,dbImages} from "../auth/FirebaseConfig";

const Packages = ({ language, mode}) => {
  const isMounted = useRef(true);
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handlePackageAdded = snapChat => {
      const packagesDatas = [];
      if(snapChat.exists()){
        snapChat.forEach((snapChatData)=>{
          const newPackage = snapChatData.val();
          const imageId = newPackage.id;
          dbImages.child(imageId).on("value",(snapImg)=>{
            newPackage.image = snapImg.val();
            packagesDatas.push(newPackage);
            if(snapChat.numChildren()=== packagesDatas.length){
              setPackages(packagesDatas);
            }
          });
        });
      }else{setPackages([]);}
    };
    if(mode === "admin"){
      dbPackages.once("value", handlePackageAdded);
      dbPackages.on("child_changed" || "child_added", ()=>{
        dbPackages.once("value", handlePackageAdded);
      });
    }else{
      dbPackages.orderByChild("status").equalTo(true).once("value", handlePackageAdded);
      dbPackages.orderByChild("status").equalTo(true).on("child_changed" || "child_changed", ()=>{
        dbPackages.orderByChild("status").equalTo(true).once("value", handlePackageAdded);
      });
    }
    return () => {
      setPackages([]);
      if(mode === "admin"){
        dbPackages.off("value", handlePackageAdded);
      }else{dbPackages.orderByChild("status").equalTo(true).off("value", handlePackageAdded);}
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if(packages && isMounted.current){setLoading(false);}
  },[packages]);

  return (
    <div className="">
      {loading ? (<Loader language={language} />) : (
        <div>
          {packages && packages.length > 0 ? (
            <PackagesCards language={language} packages={packages} mode={mode}/>
          ) : (<EmptyCard language={language} />)}
        </div>
      )}
    </div>
  );
};

const PackagesCards = ({ language, packages, mode }) => {
  const [alertDatas, setAlertDatas] = useState(null);
  const handleAction = (e) => {
    if(e){
      dbDeposits.orderByChild("fleet").equalTo(e).once("value", (snapChat) => {
        if (snapChat.exists()) {
          snapChat.forEach((snapChatData) => {
            dbCommissions.orderByChild("from").equalTo(snapChatData.val().id).once("value", (snapComm) => {
              if (snapComm.exists()) {
                snapComm.forEach((snapChatDataComm) => {
                  // Deletar comissões (commissions)
                  dbCommissions.child(snapChatDataComm.key).remove().then(() => {
                    // Remoção das comissões foi bem-sucedida
                  }).catch((error) => {
                    console.error("Erro ao deletar comissão: ", error);
                  });
                });
              }
            });
            // Deletar depósitos (deposits)
            dbDeposits.child(snapChatData.key).remove().then(() => {
              // Remoção do depósito foi bem-sucedida
            }).catch((error) => {console.error("Erro ao deletar depósito: ", error);});
          });
          // Deletar frota (fleet)
          removeFleet(e);
        } else {removeFleet(e);} // Se não houver depósitos associados à frota, apenas remova a frota diretamente
      });
    }
  }
  const removeFleet = (id) => {
    dbImages.child(id).remove().then(()=>{
      dbPackages.child(id).remove().then(() => {
        console.log("Frota deletada com sucesso");
        setAlertDatas(null);
      }).catch((error) => {console.error("Erro ao deletar frota: ", error);});
    }).catch((error) => {console.error("Erro ao deletar imagens da frota: ", error);});
  }

  const handleDelete =(e,n)=>{
    const alertData = {
      title:`${texts._delete[language]} ${texts.fleet[language]} ${n}`,
      text:texts.confirmDFleetTitle[language],
      dangerText:texts.confirmDFleetText[language],
      actions:{
        onOk:{
          title:texts._delete[language],
          action:e,
          type:"danger",
        }
      }
    }
    setAlertDatas(alertData);
  }
  return (
    <div className="packages_container flex_wrap">
      <Alert language={language} alertDatas={alertDatas} onOk={(e)=>handleAction(e)} onCancel={()=>setAlertDatas(null)}/>
      {packages.map(pack => (
        <div key={pack.id} className="package_wrap">
          <div className="package_card a_conatiner">
            <div className="flex_b">
              <div className="package_header_container">
               <img src={pack.image && pack.image.src} alt="fleet" />
              </div>
              <div className="pakage_header_details">
                <h3>{pack.name}</h3>
                <div className="amount">+{pack.percentage}<span>%</span></div>
                <p>
                  {`${texts.packageDetailsA[language]} ${pack.maturity} ${
                    texts.packageDetailsB[language]
                  }`}
                </p>
              </div>
            </div>
            <div className="package_body">
              <div className="flex_b">
                <div>{texts.min[language]}:</div> 
                <p>{formatNum(pack.min)}<span>MZN</span></p>
              </div>
              <div className="flex_b">
                <div>{texts.max[language]}:</div> 
                <p>{formatNum(pack.max)}<span>MZN</span></p>
              </div>
              {mode === "admin" &&
              <div className="flex_wrap">
                <Link to={`/admin/fleets/action?type=update&&id=${pack.id}`} className="a a_action_wrap">
                  <div className="a_action_li update">
                    {texts.updateTitle[language]}
                  </div>
                </Link>
                
                <div className="a_action_wrap">
                  <div onClick={()=>handleDelete(pack.id, pack.name)} className="a_action_li delete">
                    {texts._delete[language]}
                  </div>
                </div>
              </div>||
              <Link to={`/cabinet/fleets/deposit?id=${pack.id}`} className="a">
                <button className="btns main_btns">{`${texts.packageBtn[language]} `}
                  <i className="bi bi-arrow-right"></i>
                </button>
              </Link>
              }
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Packages;