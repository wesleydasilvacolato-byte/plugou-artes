
'use client';
import {useState,useEffect,useRef,useCallback} from 'react';
import {createClient} from '@supabase/supabase-js';

const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const now=()=>Date.now();
const initialPlace={logo_x:0.67,logo_y:0.84,logo_w:0.27,logo_h:0.11};
const emptyArt={id:'',title:'',description:'',category_id:'',published:true,...initialPlace};
const first=(text)=>String(text||'').slice(0,1).toUpperCase();
function Field({title,children}){return <label className="field"><span>{title}</span>{children}</label>}
function moneyDate(s){return s?new Date(s).toLocaleDateString('pt-BR'):'â€”'}
async function remoteImage(bucket,path){const {data,error}=await db.storage.from(bucket).createSignedUrl(path,120);if(error||!data)throw Error('NÃ£o foi possÃ­vel obter imagem privada');const response=await fetch(data.signedUrl);if(!response.ok)throw Error('Erro ao buscar imagem');return response.blob()}
async function imagePreview(bucket,path){const {data,error}=await db.storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;return data.signedUrl}
function validateFile(file){if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('Use imagem PNG, JPEG ou WebP de atÃ© 12 MB.')}
function fileExt(file){return file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}
function App(){
 const [user,setUser]=useState(null),[profile,setProfile]=us¶»§q«^