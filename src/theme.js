export const theme={
 colors:{
  canvas:'#09090B',canvasRaised:'#0E0D10',surface:'rgba(24,21,25,0.94)',surfaceHigh:'#201B20',surfaceHighest:'#292228',
  outline:'#40343B',outlineSoft:'#2D252A',text:'#F7F2F4',textMuted:'#AAA0A5',textDim:'#766D72',
  primary:'#FF4651',primaryStrong:'#E52532',primarySoft:'#FFB3B8',primaryContainer:'#3A171D',onPrimary:'#FFFFFF',
  success:'#55D889',warning:'#F3BE5B',danger:'#FF6B65',info:'#70B6FF',violet:'#C38CFF'
 },
 radius:{sm:10,md:16,lg:22,xl:28,pill:999},
 space:{xs:6,sm:10,md:16,lg:22,xl:30},
 shadow:{shadowColor:'#000',shadowOpacity:.42,shadowRadius:18,shadowOffset:{width:0,height:10},elevation:12}
}

export const glass={backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.outline}
export const touchTarget={minHeight:48,minWidth:48}
