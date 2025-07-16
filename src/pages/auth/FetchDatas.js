import React,{useState, useEffect,useRef} from "react";
import {useAuth,dbPackages,dbGateways,dbDeposits,dbWithdrawals, dbCommissions, dbUsers, dbChats,dbImages} from './FirebaseConfig';
import {getCurrentTime,getYearlyChartdatas,formatDate,ThisWeek,Percentage, sortByDays, getColor} from "../Utils";

class CardBalance{
  constructor(datas,field,language){
    this.field = field;
    this.datas = datas;
    this.getTotals = function(){
      let total = 0, totalThisWeek = 0, totalThisMonth = 0, percentageDetails, dataFromTheLast12Months;
      const fieldsIcon ={
        deposits: "bi bi-currency-dollar",
        withdrawals:"bi bi-currency-dollar",
        commissions:"bi bi-link-45deg"
      }
      let weekDays = ThisWeek(language);
      
      for(let i in datas){
        if(datas[i].status === "Inprogress" || datas[i].status === "Completed"){
          total+= datas[i].amount;
          for(let h in weekDays){
            if(formatDate(datas[i].date, language).onlyDate === weekDays[h]){
              totalThisWeek += datas[i].amount;
            }
          }
          if(formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(datas[i].date,language).onlyMonthAndYear){
            totalThisMonth+= datas[i].amount;
          }
        }
      }
      const icon = fieldsIcon[this.field];
      percentageDetails = Percentage(totalThisWeek, totalThisMonth, total, icon, field);
      dataFromTheLast12Months = getYearlyChartdatas(datas,language);
      return{
        datas: this.datas.sort(sortByDays),
        field: this.field,
        total: total,
        percentageDetails,
        dataFromTheLast12Months
      }
    }
  }
} // Classe para calcular o saldo e detalhes semanais, mensais e anuais


export function userDeposits(language,mode){
  const current = useAuth();
  const [items, setItems] = useState(null);
  const [datas, setDatas] = useState(null);
  
  useEffect(() => {
  if(current){
    const fetchData = dataSnapshot => {
      const newDatas = [];
      if(dataSnapshot.exists()){
        dataSnapshot.forEach((childSnapshot) => {
          const newSnapChat = childSnapshot.val();
          const fetchFleetDetails = async (fleetId) => {
            const fleetSnapshot = await dbPackages.child(fleetId).once('value');
            return fleetSnapshot.val();
          };
          fetchFleetDetails(newSnapChat.fleet).then(fleetDetails => {
            newSnapChat.fleet = fleetDetails;
            const fetchGatewayDetails = async (gatewayId) => {
              const gatewaySnapshot = await dbGateways.child(gatewayId).once('value');
              return gatewaySnapshot.val();
            };
            fetchGatewayDetails(newSnapChat.paymentDetails.gateway).then(gatewayDetails => {
              newSnapChat.paymentDetails.gateway = gatewayDetails;
              newDatas.push(newSnapChat);
              // Verifica se todos os depósitos foram processados antes de atualizar o estado
              if (dataSnapshot.numChildren() === newDatas.length) {
                setDatas(newDatas);
              }
            });
          });
        });
      }else{setDatas([]);}
    };
    if(mode === "admin"){
      dbDeposits.once("value", fetchData);
    }else{
      dbDeposits.orderByChild('owner').equalTo(current.uid).once("value", fetchData);
    }
      return () => {
        if(mode === "admin"){
          dbDeposits.off("value",fetchData);
        }else{
          dbDeposits.orderByChild('owner').equalTo(current.uid).off("value", fetchData);
        }
      }
    }
  },[current]);
  useEffect(() => {
    if(datas){
      const balance = new CardBalance(datas, "deposits", language).getTotals();
      setItems(balance);
   }
   return ()=> setItems({});
  }, [datas]);
  return items;
}


export function userWithdrawals(language,mode){
  const current = useAuth();
  const [items, setItems] = useState(null);
  const [datas, setDatas] = useState(null);
  useEffect(() => {
    const fetchData = dataSnapshot => {
      const newDatas = [];
      if(dataSnapshot.exists()){
        dataSnapshot.forEach((childSnapshot) => {
          const newSnapChat = childSnapshot.val();
          const fetchGatewayDetails = async (gatewayId) => {
            const gatewaySnapshot = await dbGateways.child(gatewayId).once('value');
            return gatewaySnapshot.val();
          };
          fetchGatewayDetails(newSnapChat.paymentDetails.gateway).then(gatewayDetails => {
            newSnapChat.paymentDetails.gateway = gatewayDetails;
            newDatas.push(newSnapChat);
            // Verifica se todos os depósitos foram processados antes de atualizar o estado
            if (dataSnapshot.numChildren() === newDatas.length) {
              setDatas(newDatas);
            }
          });
        });
      }else{setDatas([]);}
    };
      if(mode === "admin"){
        dbWithdrawals.once("value", fetchData);
      }else{
        if(current){
          dbWithdrawals.orderByChild('owner').equalTo(current.uid).once("value", fetchData);
        }
      }
      return () => {
        if(mode === "admin"){
          dbWithdrawals.off("value",fetchData);
      }else{
        if(current){
          dbWithdrawals.orderByChild('owner').equalTo(current.uid).off("value", fetchData);
        }
      }
    }
  },[current]);

  useEffect(() => {
    if(datas){
      const balance = new CardBalance(datas, "withdrawals", language).getTotals();
      setItems(balance);
    }
    return()=> setItems({});
  }, [datas]);
  return items;
}

export function userCommissions(language,mode){
  const current = useAuth();
  const [items, setItems] = useState(null);
  const [datas, setDatas] = useState(null);
  useEffect(() => {
    if(current){
      const fetchData = dataSnapshot => {
        const newDatas = [];
        if(dataSnapshot.exists()){
          dataSnapshot.forEach((childSnapshot) => {
            const newSnapChat = childSnapshot.val();
           
            const fetchGatewayDetails = async (gatewayId) => {
              const gatewaySnapshot = await dbGateways.child(gatewayId).once('value');
              return gatewaySnapshot.val();
            };
            fetchGatewayDetails(newSnapChat.paymentDetails.gateway).then((gatewayDetails)=> {
              newSnapChat.paymentDetails.gateway = gatewayDetails;
              newDatas.push(newSnapChat);
              // Verifica se todos os depósitos foram processados antes de atualizar o estado
              if (dataSnapshot.numChildren() === newDatas.length) {
                setDatas(newDatas);
              }
            });
          });
        }else{setDatas([]);}
      };
      if(mode === "admin"){
        dbCommissions.once("value", fetchData) 
      }else{
        dbCommissions.orderByChild('owner').equalTo(current.uid).once("value", fetchData);
      }
      return () => {
        if(mode === "admin"){
          dbCommissions.off("value",fetchData);
        }else{
          dbCommissions.orderByChild('owner').equalTo(current.uid).off("value", fetchData);
        }
      }
    }
  },[current]);

  useEffect(() => {
    if(datas){
      const balance = new CardBalance(datas, "commissions", language).getTotals();
      setItems(balance);
   }
  }, [datas]);
  return items;
}


export const earnes =(language)=>{
  let field = "totalEarnings";
  const deposits = userDeposits(language);
  const commissions = userCommissions(language);
  let total = 0, totalThisWeek = 0, totalThisMonth = 0, percentageDetails, dataFromTheLast12Months;
    const fieldsIcon ={
      totalEarnings: "bi bi-currency-dollar"
    }
    const weekDays = ThisWeek(language);
   
    if(deposits){
     for(let d in deposits.datas){
        if(deposits.datas[d].status === "Completed"){
          total+= deposits.datas[d].income;
          for(let h in weekDays){
            if(formatDate(deposits.datas[d].date, language).onlyDate === weekDays[h]){
              totalThisWeek += deposits.datas[d].income;
            }
          }
          if(formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(deposits.datas[d].date,language).onlyMonthAndYear){
            totalThisMonth+= deposits.datas[d].income;
          }
        }
      }
    }
    if(commissions){
      for(let c in commissions.datas){
        if(commissions.datas[c].status === "Completed"){
          total+= commissions.datas[c].amount;
          for(let h in weekDays){
            if(formatDate(commissions.datas[c].date, language).onlyDate === weekDays[h]){
              totalThisWeek += commissions.datas[c].amount;
            }
          }
          if(formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(commissions.datas[c].date,language).onlyMonthAndYear){
            totalThisMonth+= commissions.datas[c].amount;
          }
        }
      }
    }
    
    percentageDetails = Percentage(totalThisWeek, totalThisMonth, total,fieldsIcon.totalEarnings,field);
    //dataFromTheLast12Months = getYearlyChartdatas(datas,language);
  
    return {
      datas: [],
      field: field,
      total: total,
      percentageDetails,
      //dataFromTheLast12Months
    }
}


class CardUsers{
  constructor(datas,field,language){
    this.field = field;
    this.datas = datas;
    this.getTotals = function(){
      let total = 0, totalThisWeek = 0, totalThisMonth = 0, percentageDetails, dataFromTheLast12Months;
      let weekDays = ThisWeek(language);
      const icon = "bi bi-people";
      
      for(let i in datas){
        total++
        for(let h in weekDays){
          if(formatDate(datas[i].date, language).onlyDate === weekDays[h]){
            totalThisWeek++;
          }
        }
        if(formatDate(getCurrentTime().fullDate, language).onlyMonthAndYear === formatDate(datas[i].date,language).onlyMonthAndYear){
          totalThisMonth++;
        }
      }
      percentageDetails = Percentage(totalThisWeek, totalThisMonth, total, icon,field);
      dataFromTheLast12Months = getYearlyChartdatas(datas,language,"users");
  
      return{
        datas: this.datas.sort(sortByDays),
        field: this.field,
        total: total,
        percentageDetails,
        dataFromTheLast12Months
      }
    }
  }
} // Classe para calcular o saldo e detalhes semanais, mensais e anuais


export function getUsers(language,type){
  const [items, setItems] = useState(null);
  const [datas, setDatas] = useState(null);
  let dataType = type === undefined || null ? "totalUsers" : type;
  useEffect(() => {
    const fetchData = dataSnapshot => {
      const newDatas = [];
      if(dataSnapshot.exists()){
        dataSnapshot.forEach((childSnapshot) => {
          const newSnapChat = childSnapshot.val();
          newDatas.push(newSnapChat);
          if(dataSnapshot.numChildren() === newDatas.length) {
            setDatas(newDatas);
          }
        });
      }else{setDatas([]);}
    };
    switch(type){
      case "administrators":
        dbUsers.orderByChild("isAdmin").equalTo(true).once("value", fetchData);
      break;
      case "bannedUsers":
        dbUsers.orderByChild("isBanned").equalTo(true).once("value", fetchData);
      break;
      default:
        dbUsers.once("value", fetchData);
      break;
    }
    return () =>{ 
      dbUsers.off("value",fetchData);
    }
  },[]);

  useEffect(() => {
    if(datas){
      const balance = new CardUsers(datas, dataType, language).getTotals();
      setItems(balance);
    }
    return()=> setItems({});
  }, [datas]);

  return items;
}

export const FleetsDatas = () => {
  const [datas, setDatas] = useState(null);
  useEffect(() => {
    const fetchData = (dataSnapshot) => {
      const newDatas = [];
      if (dataSnapshot.exists()) {
        let total = 0, active = 0, inactive = 0;
        dataSnapshot.forEach((childSnapshot) => {
          const newSnapChat = childSnapshot.val();
          let amount = 0;
          if(!newSnapChat.status){inactive++;}else{active++;}
          dbDeposits.orderByChild("fleet").equalTo(newSnapChat.id).once("value", (deposits) => {
            if (deposits.exists()) {
              deposits.forEach((snapChatData) => {
                const dp = snapChatData.val();
                if (dp.status === "Completed" || dp.status === "Inprogress") {
                  amount += parseFloat(dp.amount); // Correção: usar "+=" para acumular o valor corretamente
                  total += parseFloat(dp.amount); // Atualiza o total com cada depósito válido
                }
              });
            }
            newDatas.push({
              id: newSnapChat.id,
              name: newSnapChat.name,
              amount: amount,
              percentage:0
            })
            if (dataSnapshot.numChildren() === newDatas.length) {
              const fleets ={
                total: newDatas.length,
                active:active,
                inactive:inactive,
                datas:newDatas
              }
              for(let j in newDatas){
                newDatas[j].percentage =  (newDatas[j].amount*100) / total;
              }
              setDatas(fleets);
            }
          });
        });
      } else {
        setDatas([]);
      }
    };
    dbPackages.once("value", fetchData);
    return () => {
      dbPackages.off("value", fetchData);
    };
  },[]);
  return datas;
}