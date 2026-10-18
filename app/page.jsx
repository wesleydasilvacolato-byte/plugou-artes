
'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@supabase/supabase-js';
const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const PLACE={logo_x:0.66,logo_y:0.83,logo_w:0.28,logo_h:0.12};
const validFile=f=>f&&['image/png','image/jpeg','image/webp'].includes(f.type)&&f.size<=12*1024*1024;
const extension=f=>f.type==='image/png'?'png':f.type==='image/webp'?'webp':'jpg';
const bucketArt='plugou-artes',bucketLogo='plugou-logos',bucketPop='plugou-popups';
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Card({art,src,category,admin,download,edit,toggle,loading}){return <article className="tile">
 {src?<img className="artimg" src={src} alt={art.title}/>:<div className="placeholder">Imagem indisponível</div>}
 <div className="tile-content"><strong>{art.title}</strong><small>{category||'Acervo Plugou'} · {art.width} × {art.height} px</small>
 {admin&&<span className={'tag '+(!art.published?'disabled':'')}>{art.published?'Publicada':'Oculta'}</span>}
 <div className="actions">{admin?<><button className="outline" onClick={edit}>Editar</button><button className="outline" onClick={toggle}>{art.published?'Ocultar':'Publicar'}</button></>:<button className="button" disabled={loading} onClick={download}>{loading?'Gerando arquivo...':'↓ Baixar arte'}</button>}</div></div>
 </article>}
export default function Page(){
 const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[section,setSection]=useState('Visão geral');
 const [arts,setArts]=useState([]),[categories,setCategories]=useState([]),[people,setPeople]=useState([]),[popups,setPopups]=useState([]),[previews,setPreviews]=useState({}),[logoUrl,setLogoUrl]=useState(''),[downloads,setDownloads]=useState(0);
 const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[draft,setDraft]=useState(null),[draftFile,setDraftFile]=useState(null),[draftImage,setDraftImage]=useState(''),[dims,setDims]=useState({width:1080,height:1350});
 const [newCat,setNewCat]=useState(''),[newName,setNewName]=useState(''),[newEmail,setNewEmail]=useState(''),[newCompany,setNewCompany]=useState(''),[credential,setCredential]=useState(null);
 const [newPop,setNewPop]=useState({title:'',body:''}),[popFile,setPopFile]=useState(null),[shownPop,setShownPop]=useState(null),[exporting,setExporting]=useState('');
 const admin=profile?.role==='admin';
 const fail=e=>{setError(e?.message||'Não foi possível concluir a operação.');setMessage('')};
 const ok=m=>{setMessage(m);setError('')};
 useEffect(()=>{let alive=true;supabase.auth.getUser().then(({data})=>{if(alive){setUser(data.user||null);setLoaded(true)}}).catch(fail);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{if(alive){setUser(session?.user||null);setLoaded(true)}});
  return()=>{alive=false;subscription.unsubscribe()}},[]);
 const signed=async(bucket,path)=>{if(!path)return '';const {data,error}=await supabase.storage.from(bucket).createSignedUrl(path,3600);if(error)throw error;return data.signedUrl};
 const refresh=useCallback(async id=>{
  const {data:p,error:ep}=await supabase.from('profiles').select('*').eq('id',id).maybeSingle();
  if(ep)throw ep;
  if(!p?.active){await supabase.auth.signOut();setProfile(null);throw Error('Acesso não ativado. Solicite liberação ao administrador.')}
  setProfile(p);
  const [c,a,n]=await Promise.all([supabase.from('categories').select('*').order('sort_order'),supabase.from('arts').select('*').order('created_at',{ascending:false}),supabase.from('popups').select('*').order('created_at',{ascending:false})]);
  for(const x of [c,a,n])if(x.error)throw x.error;
  setCategories(c.data||[]);setArts(a.data||[]);setPopups(n.data||[]);
  const urls={};await Promise.all((a.data||[]).map(async art=>{try{urls[art.id]=await signed(bucketArt,art.image_path)}catch{}}));setPreviews(urls);
  try{setLogoUrl(await signed(bucketLogo,p.logo_path))}catch{setLogoUrl('')}
  if(p.role==='admin'){
   const [users,result]=await Promise.all([supabase.from('profiles').select('id,full_name,company,role,active,last_seen,created_at').order('created_at',{ascending:false}),supabase.from('downloads').select('id',{count:'exact',head:true})]);
   if(users.error)throw users.error;setPeople(users.data||[]);setDownloads(result.count||0);
  }
  if(p.role!=='admin'){const active=(n.data||[]).find(x=>x.active&&(!x.starts_at||new Date(x.starts_at)<=new Date())&&(!x.ends_at||new Date(x.ends_at)>=new Date())&&!sessionStorage.getItem('plugou-popup-'+x.id));
   if(active){let img='';try{img=await signed(bucketPop,active.image_path)}catch{}setShownPop({...active,img})}}
 },[]);
 useEffect(()=>{if(user?.id)refresh(user.id).catch(fail);else{setProfile(null);setArts([])}},[user?.id,refresh]);
 useEffect(()=>{if(!user?.id||!profile?.active)return;const tick=()=>supabase.from('profiles').update({last_seen:new Date().toISOString()}).eq('id',user.id).then(()=>{});tick();const timer=setInterval(tick,60000);return()=>clearInterval(timer)},[user?.id,profile?.active]);
 async function act(callback,success){setBusy(true);setError('');try{await callback();await refresh(user.id);if(success)ok(success)}catch(e){fail(e)}finally{setBusy(false)}}
 async function login(e){e.preventDefault();setBusy(true);setError('');const {error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)fail(new Error('E-mail ou senha inválidos.'));setBusy(false)}
 async function logout(){await supabase.auth.signOut();setProfile(null);setSection('Visão geral')}
 async function saveLogo(e){const file=e.target.files?.[0];if(!file)return;
  await act(async()=>{if(!validFile(file))throw Error('Escolha um PNG, JPEG ou WebP de até 12 MB.');
   const path=user.id+'/'+crypto.randomUUID()+'.'+extension(file);
   const {error:upload}=await supabase.storage.from(bucketLogo).upload(path,file,{contentType:file.type});
   if(upload)throw upload;
   const {error:db}=await supabase.from('profiles').update({logo_path:path}).eq('id',user.id);if(db)throw db;
  },'Logotipo salvo. As próximas artes terão sua marca.');e.target.value=''}
 async function privateBlob(bucket,path){const url=await signed(bucket,path);const response=await fetch(url);if(!response.ok)throw Error('Falha ao carregar imagem');return response.blob()}
 async function download(art){setExporting(art.id);setError('');
  try{
   if(!profile.logo_path)throw Error('Cadastre o logotipo da loja em Configurações antes de baixar.');
   const [a,b]=await Promise.all([privateBlob(bucketArt,art.image_path),privateBlob(bucketLogo,profile.logo_path)]);
   const [background,logo]=await Promise.all([createImageBitmap(a),createImageBitmap(b)]);
   const canvas=document.createElement('canvas');canvas.width=background.width;canvas.height=background.height;
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Navegador sem suporte a canvas');
   ctx.drawImage(background,0,0);
   const x=background.width*art.logo_x,y=background.height*art.logo_y,rw=background.width*art.logo_w,rh=background.height*art.logo_h;
   const ratio=Math.min(rw/logo.width,rh/logo.height);const w=logo.width*ratio,h=logo.height*ratio;
   ctx.drawImage(logo,x+(rw-w)/2,y+(rh-h)/2,w,h);
   const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));
   background.close();logo.close();if(!png)throw Error('Não foi possível gerar PNG');
   const url=URL.createObjectURL(png),link=document.createElement('a');link.href=url;
   link.download='plugou-'+art.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'-')+'.png';
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
   await supabase.from('downloads').insert({reseller_id:user.id,art_id:art.id});ok('Arte baixada em PNG, com seu logotipo proporcional.');
  }catch(e){fail(e)}finally{setExporting('')}
 }
 const startDraft=art=>{setDraft(art?{...art}:{title:'',description:'',category_id:categories[0]?.id||'',published:true,...PLACE});setDraftFile(null);setDims({width:art?.width||1080,height:art?.height||1350});setDraftImage(art?previews[art.id]||'':'')};
 function chooseArt(e){const file=e.target.files?.[0];if(!file)return;if(!validFile(file)){fail(new Error('Use imagem PNG, JPEG ou WebP de até 12 MB.'));return}setDraftFile(file);
  const url=URL.createObjectURL(file);setDraftImage(url);const image=new Image();image.onload=()=>setDims({width:image.naturalWidth,height:image.naturalHeight});image.src=url}
 async function saveArt(){await act(async()=>{
   if(!draft.title.trim()||!draft.category_id)throw Error('Informe título e categoria.');
   if(!draft.id&&!draftFile)throw Error('Selecione uma imagem para a arte.');
   let path=draft.image_path;
   if(draftFile){path=crypto.randomUUID()+'.'+extension(draftFile);const {error}=await supabase.storage.from(bucketArt).upload(path,draftFile,{contentType:draftFile.type});if(error)throw error}
   const item={title:draft.title.trim(),description:draft.description||'',category_id:draft.category_id,published:draft.published,image_path:path,width:dims.width,height:dims.height,logo_x:draft.logo_x,logo_y:draft.logo_y,logo_w:draft.logo_w,logo_h:draft.logo_h,updated_at:new Date().toISOString()};
   const {error}=draft.id?await supabase.from('arts').update(item).eq('id',draft.id):await supabase.from('arts').insert({...item,created_by:user.id});
   if(error)throw error;setDraft(null);
  },'Arte salva com sucesso.')}
 function position(e){const bounds=e.currentTarget.getBoundingClientRect(),x=(e.clientX-bounds.left)/bounds.width,y=(e.clientY-bounds.top)/bounds.height;setDraft(v=>({...v,logo_x:Math.max(0,Math.min(1-v.logo_w,x-v.logo_w/2)),logo_y:Math.max(0,Math.min(1-v.logo_h,y-v.logo_h/2))}))}
 async function addCat(){await act(async()=>{if(!newCat.trim())throw Error('Informe o nome da categoria.');const {error}=await supabase.from('categories').insert({name:newCat.trim()});if(error)throw error;setNewCat('')},'Categoria adicionada.')}
 async function flip(table,id,field,value){await act(async()=>{const {error}=await supabase.from(table).update({[field]:value}).eq('id',id);if(error)throw error},'Alteração salva.')}
 async function manageUser(action,payload){await act(async()=>{const {data,error}=await supabase.functions.invoke('plugou-admin-users',{body:{action,...payload}});if(error)throw error;if(data?.error)throw Error(data.error);
  if(data?.password)setCredential({email:action==='create'?payload.email:'Senha temporária',password:data.password});
  if(action==='create'){setNewName('');setNewEmail('');setNewCompany('')}
 },'Operação concluída.')}
 async function publishPopup(){await act(async()=>{if(!newPop.title.trim())throw Error('Digite um título.');
  let path=null;if(popFile){if(!validFile(popFile))throw Error('Imagem inválida');path=crypto.randomUUID()+'.'+extension(popFile);const {error}=await supabase.storage.from(bucketPop).upload(path,popFile,{contentType:popFile.type});if(error)throw error}
  const {error}=await supabase.from('popups').insert({title:newPop.title.trim(),body:newPop.body,image_path:path});if(error)throw error;setNewPop({title:'',body:''});setPopFile(null)
 },'Comunicado publicado.')}
 const available=arts.filter(x=>admin||x.published).filter(x=>!category||x.category_id===category).filter(x=>x.title.toLowerCase().includes(query.toLowerCase()));
 const online=people.filter(p=>p.active&&p.role==='revendedor'&&p.last_seen&&Date.now()-new Date(p.last_seen).getTime()<120000).length;
 const navigation=admin?['Visão geral','Acervo de artes','Revendedores','Categorias','Comunicados','Configurações']:['Visão geral','Acervo de artes','Configurações'];
 if(!loaded)return <div className="center">Carregando Plugou Artes...</div>;
 if(!user||!profile)return <div className="login">
  <div className="login-hero"><div className="brand">plugou<span>.</span></div><div><small>PORTAL EXCLUSIVO DE REVENDEDORES</small><h1>Sua próxima arte está aqui.</h1><p>Encontre materiais oficiais, personalize com a marca da sua loja e compartilhe.</p></div><strong>CONECTADOS PELO DESIGN</strong></div>
  <form className="login-box" onSubmit={login}><p className="overline">ÁREA EXCLUSIVA</p><h2>Bem-vindo de volta.</h2><p className="muted">Entre para acessar seu acervo.</p>
   <Field label="E-mail"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></Field>
   <Field label="Senha"><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></Field>
   {error&&<p className="alert">{error}</p>}<button className="button full" disabled={busy}>{busy?'Entrando...':'Entrar no portal →'}</button><p className="muted centertext">Acessos liberados exclusivamente pela Plugou.</p>
  </form></div>;
 return <div className="shell"><aside className="sidebar"><div className="brand">plugou<span>.</span><small>PORTAL DE ARTES</small></div><nav>{navigation.map(n=><button key={n} className={'navitem '+(section===n?'current':'')} onClick={()=>{setSection(n);setError('');setMessage('')}}>{n}</button>)}</nav><div className="sideend"><strong>{profile.company||profile.full_name}</strong><small>{admin?'Administrador':'Revendedor'}</small><button className="outline" onClick={logout}>Sair da conta</button></div></aside>
 <div className="workspace"><header className="top"><div><h2>{section}</h2><span>{admin?'Painel administrativo':'Painel do revendedor'} · Plugou Artes</span></div><div className="topuser"><div className="avatar">{profile.full_name?.[0]?.toUpperCase()}</div><strong>{profile.full_name}</strong></div></header>
 <main className="content">{error&&<div className="alert">{error}</div>}{message&&<div className="notice">{message}</div>}
 {section==='Visão geral'&&<><div className="hero"><div><small>PLUGOU ARTES</small><h1>{admin?'Central de criação e resultados.':'Pronto para a próxima divulgação?'}</h1><p>{admin?'Gerencie as artes, os comunicados e os acessos de revendedores.':'Escolha uma arte e baixe com sua marca aplicada automaticamente.'}</p><button className="outline" onClick={()=>setSection('Acervo de artes')}>Explorar acervo →</button></div><div className="hero-decoration">↗</div></div>
 <div className="stats">{(admin?[['Artes publicadas',arts.filter(a=>a.published).length],['Revendedores',people.filter(p=>p.role==='revendedor').length],['Online agora',online],['Downloads',downloads]]:[['Artes publicadas',arts.length],['Categorias',categories.length],['Meu logotipo',profile.logo_path?'Pronto':'Pendente']]).map(([label,value])=><div className="stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
 {!profile.logo_path&&<div className="hint">Seu logotipo ainda não foi cadastrado. <button className="link" onClick={()=>setSection('Configurações')}>Configurar agora →</button></div>}
 <section className="panel"><div className="heading"><div><h3>Últimas artes</h3><p className="muted">Novidades no acervo oficial</p></div><button className="outline" onClick={()=>setSection('Acervo de artes')}>Ver todas</button></div><div className="cards">{available.slice(0,3).map(a=><Card key={a.id} art={a} src={previews[a.id]} category={categories.find(c=>c.id===a.category_id)?.name} admin={admin} edit={()=>startDraft(a)} toggle={()=>flip('arts',a.id,'published',!a.published)} download={()=>download(a)} loading={exporting===a.id}/>)}</div>{!arts.length&&<p className="muted">Nenhuma arte cadastrada ainda.</p>}</section></>}
 {section==='Acervo de artes'&&<><div className="heading"><div><h2>Biblioteca de artes</h2><p className="muted">Materiais oficiais para sua divulgação</p></div>{admin&&<button className="button" onClick={()=>startDraft(null)}>+ Nova arte</button>}</div><div className="filters"><input placeholder="Pesquisar arte..." value={query} onChange={e=>setQuery(e.target.value)}/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="cards">{available.map(a=><Card key={a.id} art={a} src={previews[a.id]} category={categories.find(c=>c.id===a.category_id)?.name} admin={admin} edit={()=>startDraft(a)} toggle={()=>flip('arts',a.id,'published',!a.published)} download={()=>download(a)} loading={exporting===a.id}/>)}</div>{!available.length&&<div className="hint">Nenhuma arte encontrada.</div>}</>}
 {section==='Configurações'&&<div className="two"><section className="panel"><h3>Logotipo da sua loja</h3><p className="muted">Recomendamos um arquivo PNG transparente, para manter sua identidade com a máxima qualidade.</p><div className="logo-preview">{logoUrl?<img src={logoUrl} alt="Logotipo da loja"/>:<span className="muted">Nenhum logotipo cadastrado</span>}</div><Field label="Carregar logotipo (até 12 MB)"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={saveLogo} disabled={busy}/></Field><div className="hint">O arquivo é privado e somente sua loja poderá utilizá-lo nos downloads.</div></section><section className="panel"><h3>Dados do acesso</h3><p><strong>{profile.full_name}</strong></p><p className="muted">{profile.company||'Loja não informada'}</p><p className="muted">E-mail: {user.email}</p><p className="muted">Perfil: {admin?'Administrador':'Revendedor'}</p><button className="outline" onClick={logout}>Encerrar sessão</button></section></div>}
 {admin&&section==='Revendedores'&&<><div className="two"><section className="panel"><h3>Novo revendedor</h3><Field label="Nome do responsável"><input value={newName} onChange={e=>setNewName(e.target.value)}/></Field><Field label="E-mail"><input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/></Field><Field label="Loja"><input value={newCompany} onChange={e=>setNewCompany(e.target.value)}/></Field><button className="button" disabled={busy} onClick={()=>manageUser('create',{full_name:newName,email:newEmail,company:newCompany})}>Criar acesso</button><p className="muted">Uma senha temporária será exibida uma vez, após o cadastro.</p></section><section className="panel"><h3>Atividade</h3><div className="stats compact"><div className="stat"><span>Revendedores</span><strong>{people.filter(p=>p.role==='revendedor').length}</strong></div><div className="stat"><span>Online agora</span><strong>{online}</strong></div></div><div className="hint">Online: presença detectada nos últimos dois minutos.</div></section></div><section className="panel"><h3>Contas cadastradas</h3><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Loja</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{people.filter(p=>p.role==='revendedor').map(p=><tr key={p.id}><td>{p.full_name}</td><td>{p.company||'—'}</td><td><span className={'tag '+(!p.active?'disabled':'')}>{p.active?'Ativa':'Inativa'}</span></td><td><div className="actions"><button className="outline" onClick={()=>manageUser('reset',{id:p.id})}>Nova senha</button><button className="outline" onClick={()=>manageUser('edit',{id:p.id,active:!p.active})}>{p.active?'Desativar':'Ativar'}</button></div></td></tr>)}</tbody></table></div></section></>}
 {admin&&section==='Categorias'&&<div className="two"><section className="panel"><h3>Adicionar categoria</h3><Field label="Nome"><input value={newCat} onChange={e=>setNewCat(e.target.value)}/></Field><button className="button" disabled={busy} onClick={addCat}>+ Criar categoria</button></section><section className="panel"><h3>Categorias disponíveis</h3>{categories.map(c=><div className="listrow" key={c.id}><div><strong>{c.name}</strong><small>{c.active?'Ativa':'Desativada'}</small></div><button className="outline" onClick={()=>flip('categories',c.id,'active',!c.active)}>{c.active?'Ocultar':'Ativar'}</button></div>)}</section></div>}
 {admin&&section==='Comunicados'&&<div className="two"><section className="panel"><h3>Criar comunicado</h3><Field label="Título"><input value={newPop.title} onChange={e=>setNewPop(p=>({...p,title:e.target.value}))}/></Field><Field label="Mensagem"><textarea rows={4} value={newPop.body} onChange={e=>setNewPop(p=>({...p,body:e.target.value}))}/></Field><Field label="Imagem opcional"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPopFile(e.target.files?.[0]||null)}/></Field><button className="button" disabled={busy} onClick={publishPopup}>Publicar comunicado</button></section><section className="panel"><h3>Comunicados publicados</h3>{popups.map(p=><div className="listrow" key={p.id}><div><strong>{p.title}</strong><small>{p.body}</small></div><button className="outline" onClick={()=>flip('popups',p.id,'active',!p.active)}>{p.active?'Ocultar':'Ativar'}</button></div>)}</section></div>}
 </main></div>
 {draft&&<div className="overlay"><div className="dialog"><div className="heading"><h3>{draft.id?'Editar arte':'Adicionar arte'}</h3><button className="outline" onClick={()=>setDraft(null)}>Fechar ×</button></div><div className="two">
 <div><Field label="Título"><input value={draft.title} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}/></Field><Field label="Descrição"><textarea rows={3} value={draft.description||''} onChange={e=>setDraft(v=>({...v,description:e.target.value}))}/></Field><Field label="Categoria"><select value={draft.category_id} onChange={e=>setDraft(v=>({...v,category_id:e.target.value}))}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Field label="Imagem"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseArt}/></Field><label className="check"><input type="checkbox" checked={draft.published} onChange={e=>setDraft(v=>({...v,published:e.target.checked}))}/> Publicar para os revendedores</label></div>
 <div><div className="position" onClick={position}>{draftImage?<img src={draftImage} alt="Posição do logotipo"/>:<div className="placeholder">Selecione a imagem</div>}<div className="position-box" style={{left:100*draft.logo_x+'%',top:100*draft.logo_y+'%',width:100*draft.logo_w+'%',height:100*draft.logo_h+'%'}}>LOGO DA LOJA</div></div><p className="muted">Clique na arte para definir a área do logotipo.</p></div>
 </div><div className="two sliders"><Field label={'Largura do logotipo: '+Math.round(100*draft.logo_w)+'%'}><input type="range" min="6" max="65" value={Math.round(100*draft.logo_w)} onChange={e=>{const w=+e.target.value/100;setDraft(v=>({...v,logo_w:w,logo_x:Math.min(v.logo_x,1-w)}))}}/></Field><Field label={'Altura do logotipo: '+Math.round(100*draft.logo_h)+'%'}><input type="range" min="5" max="50" value={Math.round(100*draft.logo_h)} onChange={e=>{const h=+e.target.value/100;setDraft(v=>({...v,logo_h:h,logo_y:Math.min(v.logo_y,1-h)}))}}/></Field></div>
 <div className="actions right"><button className="outline" onClick={()=>setDraft(null)}>Cancelar</button><button className="button" disabled={busy} onClick={saveArt}>Salvar arte</button></div></div></div>}
 {shownPop&&<div className="overlay" onClick={()=>{sessionStorage.setItem('plugou-popup-'+shownPop.id,'1');setShownPop(null)}}><div className="dialog small" onClick={e=>e.stopPropagation()}>{shownPop.img&&<img src={shownPop.img} style={{maxWidth:'100%',maxHeight:360,objectFit:'contain'}} alt="Comunicado"/>}<h2>{shownPop.title}</h2><p>{shownPop.body}</p><button className="button" onClick={()=>{sessionStorage.setItem('plugou-popup-'+shownPop.id,'1');setShownPop(null)}}>Entendi</button></div></div>}
 {credential&&<div className="overlay"><div className="dialog small"><h3>Credenciais temporárias</h3><p className="hint">Copie e entregue por um canal seguro. A senha não será exibida novamente depois de fechar.</p><Field label="Conta"><input readOnly value={credential.email}/></Field><Field label="Senha"><input readOnly value={credential.password}/></Field><div className="actions"><button className="outline" onClick={()=>navigator.clipboard.writeText(credential.email+'\nSenha: '+credential.password)}>Copiar</button><button className="button" onClick={()=>setCredential(null)}>Fechar</button></div></div></div>}
 </div>;
}
