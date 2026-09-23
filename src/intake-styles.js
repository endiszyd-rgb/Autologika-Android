import {StyleSheet} from 'react-native'

export default StyleSheet.create({
 modeHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:14,marginBottom:12},
 lead:{color:'#e8f0e5',fontSize:17,fontWeight:'900',marginTop:4},
 modeLabels:{flexDirection:'row',justifyContent:'space-around',marginTop:-5,marginBottom:10},
 modeLabel:{color:'#59665e',fontSize:8,fontWeight:'900',letterSpacing:1},
 modeLabelOn:{color:'#b8f07b'},
 selector:{padding:13,borderWidth:1,borderColor:'#34443a',borderRadius:13,backgroundColor:'#0a100c'},
 results:{gap:7},
 vehicle:{minHeight:76,flexDirection:'row',alignItems:'center',gap:12,padding:11,borderWidth:1,borderColor:'#334139',borderRadius:11,backgroundColor:'#111813'},
 vehiclePressed:{borderColor:'#9bd866',backgroundColor:'#172119'},
 vehicleMark:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#1d2a20',borderWidth:1,borderColor:'#425443'},
 vehicleMarkText:{color:'#b8f07b',fontSize:12,fontWeight:'950'},
 plate:{color:'#f2f6ef',fontSize:16,fontWeight:'950',letterSpacing:.7},
 owner:{color:'#7f8e84',fontSize:9,fontWeight:'700',marginTop:4},
 selectArrow:{color:'#b8f07b',fontSize:28,fontWeight:'500'},
 selected:{padding:16,borderWidth:1,borderColor:'#5e784f',borderRadius:13,backgroundColor:'#111a13',shadowColor:'#9bd866',shadowOpacity:.1,shadowRadius:10,elevation:3},
 selectedTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 selectedPlate:{color:'#f4f8f1',fontSize:27,fontWeight:'950',letterSpacing:1,marginTop:4},
 selectedName:{color:'#c9e7b2',fontSize:15,fontWeight:'850',marginTop:8,marginBottom:4},
 orderBlock:{marginTop:18,paddingTop:17,borderTopWidth:1,borderTopColor:'#304037'}
})
