import {StyleSheet} from 'react-native'

export default StyleSheet.create({
 grid:{flexDirection:'row',flexWrap:'wrap',gap:11},
 card:{width:'49%',minWidth:290,padding:15,borderWidth:1,borderColor:'#35443a',borderRadius:14,backgroundColor:'#101612',shadowColor:'#000',shadowOpacity:.22,shadowRadius:9,elevation:4},
 cardTop:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},
 name:{color:'#f2f7ef',fontSize:18,fontWeight:'950'},
 company:{color:'#9bc975',fontSize:10,fontWeight:'850',marginTop:4},
 status:{paddingHorizontal:8,paddingVertical:5,borderRadius:12,overflow:'hidden',backgroundColor:'#1c2a1c',color:'#b8f07b',fontSize:8,fontWeight:'900'},
 contact:{marginTop:11,paddingTop:10,borderTopWidth:1,borderTopColor:'#2d3931',color:'#aab7ad',fontSize:10,fontWeight:'750'},
 metrics:{flexDirection:'row',gap:7,marginTop:11},
 metric:{flex:1,minHeight:48,justifyContent:'center',padding:8,borderWidth:1,borderColor:'#2f3b33',borderRadius:9,backgroundColor:'#0a100c'},
 metricValue:{color:'#edf4e9',fontSize:14,fontWeight:'900'},
 metricLabel:{color:'#68766d',fontSize:7,fontWeight:'900',letterSpacing:.7,marginTop:2},
 actions:{flexDirection:'row',justifyContent:'flex-end',gap:7,marginTop:12},
 hero:{padding:16,marginBottom:12,borderWidth:1,borderColor:'#4b6246',borderRadius:14,backgroundColor:'#121c14'},
 heroName:{color:'#f5f9f2',fontSize:25,fontWeight:'950'},
 heroCompany:{color:'#c7e6ad',fontSize:13,fontWeight:'850',marginTop:5},
 facts:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:13},
 fact:{minWidth:110,flex:1,padding:10,borderWidth:1,borderColor:'#35453a',borderRadius:9,backgroundColor:'#0b110d'},
 factLabel:{color:'#6f7e74',fontSize:7,fontWeight:'900',letterSpacing:.8},
 factValue:{color:'#e7eee3',fontSize:11,fontWeight:'850',marginTop:4},
 vehicle:{padding:12,marginBottom:8,borderWidth:1,borderColor:'#334039',borderRadius:10,backgroundColor:'#0c120e'},
 vehiclePlate:{color:'#f0f6ec',fontSize:15,fontWeight:'950',letterSpacing:.7},
 history:{paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#29342c',flexDirection:'row',alignItems:'center',gap:10},
 historyStatus:{color:'#a9d97f',fontSize:8,fontWeight:'900'}
})
