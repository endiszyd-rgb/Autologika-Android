export const PHONE_MAX=599
export const TABLET_MAX=899

export function layoutMode(width){
  const value=Number(width)||0
  if(value<=PHONE_MAX)return 'phone'
  if(value<=TABLET_MAX)return 'tablet'
  return 'desktop'
}

export function responsiveColumns(width,{phone=1,tablet=2,desktop=3}={}){
  const mode=layoutMode(width)
  return mode==='phone'?phone:mode==='tablet'?tablet:desktop
}
