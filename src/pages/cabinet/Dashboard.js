import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, Outlet, NavLink,useParams} from "react-router-dom";
import Highcharts from "highcharts";
import {texts} from "../texts/Texts";
import {MinLoder,getLast12Months, formatNum, formatDate,getCurrentTime,ShareLink} from "../Utils";
import {currentUser} from '../auth/FirebaseConfig';
import {userDeposits, userWithdrawals,userCommissions, earnes} from "../auth/FetchDatas";

const isAuthenticated = localStorage.getItem("isAuthenticated");
const DashboardUser =({language})=>{
  const navigate = useNavigate();
  const spline = useRef(null);
  const deposits = userDeposits(language);
  const earnings = earnes(language);
  const withdrawals = userWithdrawals(language);
  const commissions = userCommissions(language);
  const datas = currentUser(false);
  
  const options = {
  chart:{
    type:"areaspline", //'spline or column
    style:{color:'currentColor',},
    backgroundColor: 'none', },
    title: {text:'' },
    credits:{enabled: false },
    accessibility:{ enabled:false},
    xAxis:{
      categories:getLast12Months(language).sliced,
      crosshair: false,
      labels:{ style:{color:"currentColor" } }
    },
    yAxis: {
      min: 0,
      className: "highcharts-color-0",
      gridLineColor:"transparent",
      labels:{ style:{color:"currentColor" } },
      title: { enabled:false, text: '',  }
    },tooltip: {
      headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
      pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' + '<td style="padding:0 color:currentColor"><b>${point.y:.2f}</b></td></tr>', // for float number {point.y:.1f}
      footerFormat: '</table>',
      shared: true,
      useHTML: true
    },
    plotOptions: {
      areaspline:{
        lineWidth: 4,
        states: {hover: { lineWidth:2 }},
        marker: {enabled: false },
      }, 
      column: {
        pointPadding: 0.2,
        borderWidth: 6,
        borderRadius: 2
      }
    },
    
    series: [
      {
        name: texts.withdrawals[language],
        data:withdrawals &&  withdrawals.dataFromTheLast12Months,
        color:'RGBA(255,17,0,0.70)',
        fillColor : {
        linearGradient : [0, 0, 0, 250],
        stops : [[0, 'RGBA(255,17,0,0.70)' ], [2, 'RGBA(255,17,0,0.01)'] ]
            },
    },          {
      name: texts.deposits[language],
      data: deposits && [...deposits.dataFromTheLast12Months],
      color:"RGB(5, 226, 126)",
      fillColor : {
        linearGradient : [0, 0, 0,  300],
        stops : [[0, 'RGB(5, 226, 126)' ], [5, 'RGBA(5, 226, 126,0.001)'] ]
     }, 
    }],
  legend: {
    enabled: false,
    itemStyle: {color: 'currentColor', fontWeight: 'bold' },
  }
    
  }
  useEffect(()=>{
    Highcharts.chart(spline.current, options);
  },[deposits, withdrawals,language]);
  
  const value = datas ? `${document.location.origin}/ref?id=${datas.id}` : "";
  return(
    <section className="a_sec m20">
      <header className="a_sec_header flex_b_c">
        <h1 className="page-title">{texts.dashboard[language]}</h1>
        <div className="flex_c_c">
          <Link to="/cabinet/dashboard/withdraw" className="a">
            <div className="a_reload withdraw flex_c_c"> <p className="a_today_text">{texts.withdrawNow[language]} </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-box-arrow-down" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1z"/>
                <path fillRule="evenodd" d="M7.646 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V5.5a.5.5 0 0 0-1 0v8.793l-2.146-2.147a.5.5 0 0 0-.708.708z"/>
              </svg>
            </div>
        </Link>
        <Link to="/cabinet/fleets" className="a">
          <div className="a_reload flex_c_c"> <p className="">{texts.depositNow[language]} </p>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-box-arrow-in-up" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1z"/>
              <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z"/>
            </svg>
          </div>
        </Link>
      </div>
    </header>
      <div className="flex_wrap a_wraps">
          <div className="a_box">
              <div className="a_conatiner flex_b">
                <div className="a_insert_box">
                  <div>{datas && formatNum(parseFloat(datas.balance).toFixed(2)) || "__"}</div>
                  <p>{texts.balanceAvailable[language]}</p>
                  <div className="a_percentage"> <span className="b_radius_3" style={{background:"RGB(5, 226, 126,0.10)", color:"RGB(5, 226, 126)"}}>100%</span> {texts.thisMonth[language]}</div>
                  </div>
                <div className="a_box_icon flex_c_c"><i className="bi bi-currency-dollar"></i></div>
              </div>
            </div>  
            <div className="a_box earnings">
              <div className="a_conatiner flex_b">
                <div className="a_insert_box">
                  <div>{earnings && formatNum(parseFloat(earnings.total).toFixed(2)) || "__"}</div>
                  <p>{texts.totalEarnings[language]}</p>
                  <div className="a_percentage"> <span style={{background:earnings &&  `RGBA(${earnings.percentageDetails.color},0.10`, color:earnings && `RGB(${earnings.percentageDetails.color})`}}> <i className={earnings && earnings.percentageDetails.arrow}></i> {earnings && earnings.percentageDetails.percentage || "__"}%</span> {earnings && texts[earnings.percentageDetails.period][language]}</div>
                </div>
                <div className="a_box_icon flex_c_c"><i className="bi bi-currency-dollar"></i></div>
              </div>
            </div>
            <div className="a_box all">
              <div className="a_conatiner flex_b">
                <div className="a_insert_box">
                  <div>{commissions && formatNum(parseFloat(commissions.total).toFixed(2)) ||"__"}</div>
                  <p>{texts.commissions[language]}</p>
                  <div className="a_percentage"> <span style={{background:commissions &&  `RGBA(${commissions.percentageDetails.color},0.10`, color:commissions && `RGB(${commissions.percentageDetails.color})`}}><i className={commissions && commissions.percentageDetails.arrow}></i> {commissions && commissions.percentageDetails.percentage || 0 }%</span>{commissions && texts[commissions.percentageDetails.period][language]}</div>
                </div>
                <div className="a_box_icon b_radius_60 flex_c_c"><i className="bi bi-link-45deg"></i></div>
              </div>
            </div>
          </div>
          <div className="flex_wrap a_wraps">
            <div className="a_width_50 a_conatiner_b">
              <div className="a_conatiner w_100 ">
                <div className="a_box_header flex_s_c m15">
                  <h3 className="title">{texts.depositAndWithdrawalHistory[language]}</h3>
                  <div className="float_menus">
                    <div className="button">  </div>
                  </div>
                </div>
                <div className="a_chart_wrap">
                  <div ref={spline} className="chart_1" id="spline"></div>
                </div>
              </div>
            </div>
          </div>
          {datas && <div className="i_card_wrap">
            <div className="i_card_link">
              <div className="flex_b_c">
                <div className="left flex_s">
                  <div className="i_icon flex_c_c br60"><i className="bi bi-link-45deg"></i></div>
                  <div className="middle">
                    <div>{texts.refLinkTitle[language]}</div>
                    <p>{texts.refLinkParaph[language]}</p>
                    <div className="flex_s">
                      <div className="ref_link">{value}</div>
                      <div className="btn_copy">
                        <ShareLink language={language} value={value} both={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      <Outlet/>
    </section>
  );
}
export default DashboardUser;