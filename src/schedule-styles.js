import {StyleSheet} from 'react-native'

export default StyleSheet.create({
 hero:{padding:16,borderWidth:1,borderColor:'#405341',borderRadius:15,backgroundColor:'#111a13',marginBottom:12},
 heroTitle:{color:'#f2f7ef',fontSize:22,fontWeight:'950',marginTop:5},
 heroStats:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:13},
 stat:{minWidth:105,flex:1,padding:10,borderWidth:1,borderColor:'#334239',borderRadius:10,backgroundColor:'#0a100c'},
 statValue:{color:'#d9efc8',fontSize:18,fontWeight:'950'},
 statLabel:{color:'#748178',fontSize:7,fontWeight:'900',letterSpacing:.8,marginTop:3},
 quickDates:{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:11},
 day:{marginTop:10,marginBottom:5},
 dayTitle:{color:'#badf97',fontSize:12,fontWeight:'950',textTransform:'uppercase',letterSpacing:1},
 dayDate:{color:'#657269',fontSize:9,fontWeight:'800',marginTop:2},
 appointment:{padding:13,marginBottom:8,borderWidth:1,borderColor:'#35443a',borderRadius:12,backgroundColor:'#0e1510'},
 appointmentTop:{flexDirection:'row',alignItems:'flex-start',gap:11},
 time:{width:54,color:'#e8f2e1',fontSize:17,fontWeight:'950'},
 title:{color:'#f0f4ed',fontSize:13,fontWeight:'900'},
 meta:{color:'#88968c',fontSize:9,fontWeight:'750',marginTop:4},
 status:{paddingHorizontal:8,paddingVertical:5,borderRadius:12,overflow:'hidden',backgroundColor:'#1d2a1e',color:'#b8ee84',fontSize:7,fontWeight:'950'},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:7,justifyContent:'flex-end',marginTop:11,paddingTop:10,borderTopWidth:1,borderTopColor:'#29342c'},
 form:{padding:13,borderWidth:1,borderColor:'#465b43',borderRadius:12,backgroundColor:'#0e1710',marginBottom:12}
})
