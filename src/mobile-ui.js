import React,{useEffect,useRef,useState} from 'react'
import {AccessibilityInfo,ActivityIndicator,Animated,Pressable,StyleSheet,Text,View} from 'react-native'

const STATUS={
 PRZYJETE:{label:'Przyjęte',tone:'info'},
 DIAGNOZA:{label:'Diagnoza',tone:'warning'},
 WYCENA:{label:'Wycena',tone:'warning'},
 AKCEPTACJA:{label:'Akceptacja',tone:'violet'},
 NAPRAWA:{label:'Naprawa',tone:'active'},
 QC_NAPRAWY:{label:'QC naprawy',tone:'active'},
 PLATNOSC:{label:'Płatność',tone:'info'},
 QC_WYDANIA:{label:'QC wydania',tone:'active'},
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
 ANULOWANA:{label:'Anulowana',tone:'danger'},
 PENDING:{label:'Oczekuje',tone:'warning'},
 APPROVED:{label:'Zaakceptowana',tone:'success'},
 DECLINED:{label:'Odrzucona',tone:'danger'},
 EXPIRED:{label:'Wygasła',tone:'neutral'},
 SUPERSEDED:{label:'Zastąpiona',tone:'neutral'}
}

const TONES={
 info:{bg:'#142131',border:'#41668b',text:'#a9d5ff',dot:'#78a7ff'},
 warning:{bg:'#2a2111',border:'#765b2e',text:'#f1cf7d',dot:'#e7bd57'},
 violet:{bg:'#24172a',border:'#65406e',text:'#e7b4f4',dot:'#d895f0'},
 active:{bg:'#10251f',border:'#326b5c',text:'#a7e8d6',dot:'#72d4bd'},
 success:{bg:'#172614',border:'#4f7337',text:'#c8f2a2',dot:'#FF4651'},
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
 return <View accessibilityRole="progressbar" accessibilityLabel={label} style={[ui.loading,compact&&ui.loadingCompact]}><ActivityIndicator color="#FF4651" size={compact?'small':'large'}/><Text style={ui.loadingTitle}>{label}</Text><Animated.View style={[ui.skeleton,{opacity:glow}]}/><Animated.View style={[ui.skeleton,ui.skeletonShort,{opacity:glow}]}/></View>
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
 badge:{maxWidth:170,alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:10,paddingVertical:7,borderWidth:1,borderRadius:999},badgeCompact:{paddingHorizontal:8,paddingVertical:5},dot:{width:7,height:7,borderRadius:4},badgeText:{fontSize:9,fontWeight:'900',letterSpacing:.35},
 loading:{minHeight:190,alignItems:'center',justifyContent:'center',padding:24,borderWidth:1,borderColor:'#493840',borderRadius:20,backgroundColor:'rgba(24,21,25,.94)',shadowColor:'#000',shadowOpacity:.3,shadowRadius:14,elevation:8},loadingCompact:{minHeight:120},loadingTitle:{marginTop:14,color:'#D5CBCF',fontSize:12,fontWeight:'800'},skeleton:{width:'70%',height:7,marginTop:20,borderRadius:5,backgroundColor:'#6F3B45'},skeletonShort:{width:'45%',marginTop:9},
 toast:{position:'absolute',zIndex:1000,left:18,right:18,bottom:22,maxWidth:620,alignSelf:'center',flexDirection:'row',alignItems:'center',gap:12,padding:15,borderWidth:1,borderRadius:18,backgroundColor:'rgba(28,23,27,.98)',shadowColor:'#000',shadowOpacity:.58,shadowRadius:20,shadowOffset:{width:0,height:10},elevation:24},toastMark:{width:7,height:38,borderRadius:4},toastCopy:{flex:1},toastTitle:{color:'#F7F2F4',fontSize:12,fontWeight:'900'},toastMessage:{color:'#C8BDC2',fontSize:11,lineHeight:17,marginTop:3},close:{width:38,height:38,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#4B3A42',borderRadius:12,backgroundColor:'#241D22'},closeText:{color:'#E6DCE0',fontSize:22,lineHeight:24}
})
