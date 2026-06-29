import { Suspense } from 'react'
import AddSupplementForm from './AddSupplementForm'

function FormSkeleton() {
  return (
    <div style={{background:'var(--surface)',minHeight:'100dvh',maxWidth:430,margin:'0 auto',paddingBottom:40}}>
      <div style={{position:'sticky',top:0,zIndex:100,background:'var(--surface)',padding:'calc(env(safe-area-inset-top,0px) + 12px) 20px 12px',borderBottom:'1px solid var(--border)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:'var(--card)',animation:'pulse 2s infinite'}}></div>
        <div style={{flex:1,height:24,borderRadius:8,background:'var(--card)',animation:'pulse 2s infinite'}}></div>
        <div style={{width:80,height:36,borderRadius:12,background:'var(--card)',animation:'pulse 2s infinite'}}></div>
      </div>
    </div>
  )
}

export default function AddSupplementPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <AddSupplementForm />
    </Suspense>
  )
}
