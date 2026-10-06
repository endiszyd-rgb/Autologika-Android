import React,{useEffect,useRef,useState} from 'react'
import {AccessibilityInfo,ActivityIndicator,Animated,Pressable,StyleSheet,Text,View} from 'react-native'

const STATUS={
 PRZYJETE:{label:'Przyjęte',tone:'info'},
 DIAGNOZA:{label:'Diagnoza',tone:'warning'},
 AKCEPTACJA:{label:'Akceptacja',tone:'violet'},
 NAPRAWA:{label:'Naprawa',tone:'active'},
 GOTOWE:{label:'Gotowe',tone:'success'},
 WYDANE:{label:'Wydane',tone:'neutral'},
 PLAN:{label:'Plan',tone:'info'},
 PLANOWANA:{label:'Planowana',tone:'info'},
 POTWIERDZONY:{label:'Potwierdzony',tone:'active'},
 POTWIERDZONA:{label:'Potwierdzona',tone:'active'},
 W_TRAKCIE:{label:'W trakcie',tone:'warning'},
 ZAKONCZONY:{label:'Zakończony',tone:'success'},
 ZAKONCZONA:{label:'Zakończona',tone:'success'},
 ANULOWANY:{label:'Anulowany',tone:'danger'},
 ANULOWANA:{label:'Anulowana',tone:'danger'}
}

const TONES={
 info:{bg:'#142131',border:'#41668b',text:'#a9d5ff',dot:'#78a7ff'},
 warning:{bg:'#2a2111',border:'#765b2e',text:'#f1cf7d',dot:'#e7bd57'},
 violet:{bg:'#24172a',border:'#65406e',text:'#e7b4f4',dot:'#d895f0'},
 active:{bg:'#10251f',border:'#326b5c',text:'#a7e8d6',dot:'#72d4bd'},
 success:{bg:'#172614',border:'#4f7337',text:'#c8f2a2',dot:'#a9eb6d'},
 danger:{bg:'#2b1716',border:'#79443f',text:'#f2aaa2',dot:'#e07167'},
 neutral:{bg:'#1a201c',border:'#465048',text:'#b7c1ba',dot:'#91a09a'}
}

export function useReducedMotion(){
 const[reduced,setReduced]=useState(false)
 useEffect(()=>{let alive=true;AccessibilityInfo.isReduceMotionEnabled().then(value=>alive&&setReduced(value)).catch(()=>{});const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);return()=>{alive=false;subscription?.remove?.()}},[])
 return reduced
}

export function PageTransition({children,style}){
 const reduced=useReducedMotion(),progress=useRef(new Animated.Value(0)).current
 useEffect(()=>{if(reduced){progress.setValue(1);return}Animated.timing(progress,{toValue:1,duration:220,useNativeDriver:true}).start()},[progress,reduced])
 return <Animated.View style={[ui.page,style,{opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[8,0]})}]}]}>{children}</Animated.View>
}

export function StatusBadge({value,label,compact=false}){
 const key=String(value||'').toUpperCase(),meta=STATUS[key]||{label:label||key.replaceAll('_',' ')||'Brak statusu',tone:'neutral'},tone=TONES[meta.tone]
 return <View accessibilityLabel={`Status: ${label||meta.label}`} style={[ui.badge,{backgroundColor:tone.bg,borderColor:tone.border},compact&&ui.badgeCompact]}><View style={[ui.dot,{backgroundColor:tone.dot}]}/><Text numberOfLines={1} style={[ui.badgeText,{color:tone.text}]}>{label||meta.label}</Text></View>
}

export function LoadingState({label='Ładowanie danych warsztatu…',compact=false}){
 const glow=useRef(new Animated.Value(.3)).current,reduced=useReducedMotion()
 useEffect(()=>{if(reduced){glow.setValue(.65);return}const loop=Animated.loop(Animated.sequence([Animated.timing(glow,{toValue:1,duration:700,useNativeDriver:true}),Animated.timing(glow,{toValue:.3,duration:700,useNativeDriver:true})]));loop.start();return()=>loop.stop()},[glow,reduced])
 return <View accessibilityRole="progressbar" accessibilityLabel={label} style={[ui.loading,compact&&ui.loadingCompact]}><ActivityIndicator color="#b9ef79" size={compact?'small':'large'}/><Text style={ui.loadingTitle}>{label}</Text><Animated.View style={[ui.skeleton,{opacity:glow}]}/><Animated.View style={[ui.skeleton,ui.skeletonShort,{opacity:glow}]}/></View>
}

export function FeedbackToast({notice,onClose}){
 const progress=useRef(new Animated.Value(0)).current,reduced=useReducedMotion()
 useEffect(()=>{if(!notice)return;progress.setValue(reduced?1:0);if(!reduced)Animated.spring(progress,{toValue:1,useNativeDriver:true,speed:22,bounciness:3}).start();const timer=setTimeout(onClose,notice.duration||4200);return()=>clearTimeout(timer)},[notice,onClose,progress,reduced])
 if(!notice)return null
 const tone=TONES[notice.tone]||TONES.info
 return <Animated.View accessibilityLiveRegion="polite" style={[ui.toast,{borderColor:tone.border,opacity:progress,transform:[{translateY:progress.interpolate({inputRange:[0,1],outputRange:[24,0]})}]}]}><View style={[ui.toastMark,{backgroundColor:tone.dot}]}/><View style={ui.toastCopy}><Text style={ui.toastTitle}>{notice.title||'Autologika'}</Text><Text style={ui.toastMessage}>{notice.message}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Zamknij komunikat" onPress={onClose} style={ui.close}><Text style={ui.closeText}>×</Text></Pressable></Animated.View>
}

const ui=StyleSheet.create({
 page:{width:'100%'},
 badge:{maxWidth:150,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:6,borderWidth:1,borderRadius:20},badgeCompact:{paddingHorizontal:7,paddingVertical:4},dot:{width:6,height:6,borderRadius:3},badgeText:{fontSize:8,fontWeight:'900',letterSpacing:.35},
 loading:{minHeight:190,alignItems:'center',justifyContent:'center',padding:24,borderWidth:1,borderColor:'#334238',borderRadius:14,backgroundColor:'#101612'},loadingCompact:{minHeight:120},loadingTitle:{marginTop:12,color:'#c7d1c8',fontSize:11,fontWeight:'800'},skeleton:{width:'70%',height:7,marginTop:18,borderRadius:5,backgroundColor:'#4b6048'},skeletonShort:{width:'45%',marginTop:8},
 toast:{position:'absolute',zIndex:1000,left:18,right:18,bottom:22,maxWidth:620,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:11,padding:13,borderWidth:1,borderRadius:13,backgroundColor:'#101712',shadowColor:'#000',shadowOpacity:.55,shadowRadius:18,elevation:24},toastMark:{width:8,height:34,borderRadius:4},toastCopy:{flex:1},toastTitle:{color:'#eff5ec',fontSize:11,fontWeight:'900'},toastMessage:{color:'#aeb9b0',fontSize:10,lineHeight:15,marginTop:3},close:{width:32,height:32,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#3d4a41',borderRadius:9,backgroundColor:'#18201a'},closeText:{color:'#d7e1d8',fontSize:21,lineHeight:23}
})
