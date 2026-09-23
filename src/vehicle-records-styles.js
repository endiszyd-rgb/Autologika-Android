import {StyleSheet} from 'react-native'

export default StyleSheet.create({
 grid:{flexDirection:'row',flexWrap:'wrap',gap:11},
 card:{width:'49%',minWidth:290,padding:15,borderWidth:1,borderColor:'#35443a',borderRadius:14,backgroundColor:'#101612',shadowColor:'#000',shadowOpacity:.22,shadowRadius:9,elevation:4},
 cardTop:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:10},
 plate:{color:'#f2f7ef',fontSize:21,fontWeight:'950',letterSpacing:.9},
 car:{color:'#c4dfa9',fontSize:12,fontWeight:'850',marginTop:4},
 status:{paddingHorizontal:8,paddingVertical:5,borderRadius:12,overflow:'hidden',backgroundColor:'#1c2a1c',color:'#b8f07b',fontSize:8,fontWeight:'900'},
 owner:{marginTop:11,paddingTop:10,borderTopWidth:1,borderTopColor:'#2d3931',color:'#aab7ad',fontSize:10,fontWeight:'750'},
 metrics:{flexDirection:'row',gap:7,marginTop:11},
 metric:{flex:1,minHeight:48,justifyContent:'center',padding:8,borderWidth:1,borderColor:'#2f3b33',borderRadius:9,backgroundColor:'#0a100c'},
 metricValue:{color:'#edf4e9',fontSize:14,fontWeight:'900'},
 metricLabel:{color:'#68766d',fontSize:7,fontWeight:'900',letterSpacing:.7,marginTop:2},
 actions:{flexDirection:'row',justifyContent:'flex-end',gap:7,marginTop:12},
 profileHero:{padding:16,marginBottom:12,borderWidth:1,borderColor:'#4b6246',borderRadius:14,backgroundColor:'#121c14'},
 profilePlate:{color:'#f5f9f2',fontSize:30,fontWeight:'950',letterSpacing:1.2},
 profileCar:{color:'#c7e6ad',fontSize:16,fontWeight:'850',marginTop:5},
 profileFacts:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:13},
 fact:{minWidth:120,flex:1,padding:10,borderWidth:1,borderColor:'#35453a',borderRadius:9,backgroundColor:'#0b110d'},
 factLabel:{color:'#6f7e74',fontSize:7,fontWeight:'900',letterSpacing:.8},
 factValue:{color:'#e7eee3',fontSize:11,fontWeight:'850',marginTop:4},
 contact:{padding:13,marginBottom:12,borderWidth:1,borderColor:'#35443a',borderRadius:11,backgroundColor:'#0d140f'},
 contactHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
 history:{paddingVertical:11,borderBottomWidth:1,borderBottomColor:'#29342c',flexDirection:'row',alignItems:'center',gap:10},
 historyStatus:{color:'#a9d97f',fontSize:8,fontWeight:'900'},
 newOrder:{padding:13,marginBottom:12,borderWidth:1,borderColor:'#536a49',borderRadius:11,backgroundColor:'#111a13'}
})
