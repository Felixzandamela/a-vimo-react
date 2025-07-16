import React,{useState, useEffect,useRef} from "react";
import {Link,useNavigate, Outlet, NavLink,useParams} from "react-router-dom";
import Highcharts from "highcharts";
import {texts} from "../texts/Texts";
import {MinLoder,getLast12Months, formatNum, formatDate,getCurrentTime, statusIcons, EmptyCard,handleScrollTo,ShareLink} from "../Utils";
import {userDeposits, userWithdrawals,userCommissions,getUsers,FleetsDatas} from "../auth/FetchDatas";

const DashboardAdmin =({language})=>{
  const navigate = useNavigate();
  const spline = useRef(null);
  const deposits = userDeposits(language,"admin");
  const withdrawals = userWithdrawals(language,"admin");
  const commissions = userCommissions(language,"admin");
  const allUsers = getUsers(language,"totalUsers");
  const admins = getUsers(language,"administrators");
  const bannedUsers = getUsers(language,"bannedUsers");
  const fleets = FleetsDatas();
  
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
    },
    
    tooltip: {
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
  
  return(
    <section className="a_sec m20">
      <header className="a_sec_header flex_b_c">
        <h1 className="page-title">{texts.dashboard[language]}</h1>
        <div className="flex_c_c">
          <div className="a_today flex_b_c a_conatiner"><p className="a_today_text">Quinta, 01/08</p><i className="bi bi-calendar"></i></div>
          <Link to="/cabinet/fleets" className="a">
            <div className="a_reload flex_c_c"> <p className="">{texts.depositNow[language]} </p>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
              </svg>
            </div>
          </Link>
        </div>
      </header>
      
      <div className="flex_wrap a_wraps">
        <div className="a_box">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{deposits && formatNum(parseFloat(deposits.total).toFixed(2))}</div>
              <p>{texts.deposits[language]}</p>
              <div className="a_percentage"> <span style={{background:deposits &&  `RGBA(${deposits.percentageDetails.color},0.10`, color:deposits && `RGB(${deposits.percentageDetails.color})`}}> <i className={deposits && deposits.percentageDetails.arrow}></i> {deposits && deposits.percentageDetails.percentage }%</span> {deposits && texts[deposits.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon flex_c_c"><i className="bi bi-currency-dollar"></i></div>
          </div>
        </div> 
        <div className="a_box withdrawals">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{withdrawals && formatNum(parseFloat(withdrawals.total).toFixed(2))}</div>
              <p>{texts.withdrawals[language]}</p>
              <div className="a_percentage"> <span style={{background:withdrawals &&  `RGBA(${withdrawals.percentageDetails.color},0.10`, color:withdrawals && `RGB(${withdrawals.percentageDetails.color})`}}> <i className={withdrawals && withdrawals.percentageDetails.arrow}></i> {withdrawals && withdrawals.percentageDetails.percentage }%</span> {withdrawals && texts[withdrawals.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon flex_c_c"><i className="bi bi-currency-dollar"></i></div>
          </div>
        </div>
        <div className="a_box all">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{commissions && formatNum(parseFloat(commissions.total).toFixed(2))}</div>
              <p>{texts.commissions[language]}</p>
              <div className="a_percentage"> <span style={{background:commissions &&  `RGBA(${commissions.percentageDetails.color},0.10`, color:commissions && `RGB(${commissions.percentageDetails.color})`}}><i className={commissions && commissions.percentageDetails.arrow}></i> {commissions && commissions.percentageDetails.percentage || 0 }%</span>{commissions && texts[commissions.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon  flex_c_c"><i className="bi bi-link-45deg"></i></div>
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
      <div className="flex_wrap a_wraps">
        <div className="a_box all">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{allUsers && formatNum(allUsers.total) }</div>
              <p>{allUsers && texts[allUsers.percentageDetails.field][language]}</p>
              <div className="a_percentage"> <span style={{background:allUsers &&  `RGBA(${allUsers.percentageDetails.color},0.10`, color:allUsers && `RGB(${allUsers.percentageDetails.color})`}}><i className={allUsers && allUsers.percentageDetails.arrow}></i> {allUsers && allUsers.percentageDetails.percentage || 0 }%</span>{allUsers && texts[allUsers.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon  flex_c_c"><i className="bi bi-people"></i></div>
          </div>
        </div>
        <div className="a_box admins">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{admins && formatNum(admins.total)}</div>
              <p>{admins && texts[admins.percentageDetails.field][language]}</p>
              <div className="a_percentage"> <span style={{background:admins &&  `RGBA(${admins.percentageDetails.color},0.10`, color:admins && `RGB(${admins.percentageDetails.color})`}}><i className={admins && admins.percentageDetails.arrow}></i> {admins && admins.percentageDetails.percentage || 0 }%</span>{admins && texts[admins.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon flex_c_c"><i className="bi bi-people"></i></div>
          </div>
        </div>
        <div className="a_box banned">
          <div className="a_conatiner flex_b">
            <div className="a_insert_box">
              <div>{bannedUsers && formatNum(bannedUsers.total)}</div>
              <p>{bannedUsers && texts[bannedUsers.percentageDetails.field][language]}</p>
              <div className="a_percentage"> <span style={{background:bannedUsers &&  `RGBA(${bannedUsers.percentageDetails.color},0.10`, color:bannedUsers && `RGB(${bannedUsers.percentageDetails.color})`}}><i className={bannedUsers && bannedUsers.percentageDetails.arrow}></i> {bannedUsers && bannedUsers.percentageDetails.percentage || 0 }%</span>{bannedUsers && texts[bannedUsers.percentageDetails.period][language]}</div>
            </div>
            <div className="a_box_icon  flex_c_c"><i className="bi bi-people"></i></div>
          </div>
        </div>
      </div>
      <div className="flex_wrap a_wraps">
        <div className="a_width_50 a_conatiner_b">
          <div className="a_conatiner w_100 ">
            <div className="a_box_header flex_s_c m15">
              <h3 className="title">Receita</h3>
              <div className="float_menus">
                <div className="button">  </div>
              </div>
            </div>
            <div className="chart_1" id="splin"></div>
          </div>
        </div>
        <div className="a_width_50 a_packages">
          <div className="a_conatiner">
            <div className="a_box_header flex_b_c w_100">
              <h3 className="title">{texts.fleet[language]}s({fleets && fleets.total})</h3>
              <div className="flex_s_c status_pack">
                <div className="active">{texts.active[language]} {fleets && fleets.active} </div>
                <div className="disabled">{texts.inactive[language]} {fleets && fleets.inactive}</div>
              </div>
            </div>
            <div className="prog_wrapper">
              {fleets && fleets.datas && fleets.datas.map(item =>(
              <div key={item.id} className="flex_b_c prog_card m10">
                <div className="prog_names">
                  <h5>{item.name}</h5>
                  <p className="prog_amount">{formatNum(item.amount)}MZN</p>
                </div>
                <div className="prog_container">
                  <div  style={{background: `conic-gradient(var(--main-color) ${item.percentage * 3.6}deg, RGBA(60, 173, 241,0.20) ${item.percentage * 3.5}deg)`}} className="prog_circle">
                    <div className="prog_values">{parseFloat(item.percentage).toFixed(2)}%</div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        </div>                      
      </div>
      <Outlet/>
    </section>
  );
}

export default DashboardAdmin;