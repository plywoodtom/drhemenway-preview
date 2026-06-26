/* shared: theme toggle (persisted) + submit toast + header injector */
function toggleTheme(){
  const r=document.documentElement,day=r.getAttribute('data-theme')==='day';
  r.setAttribute('data-theme',day?'dark':'day');
  const b=document.getElementById('themeBtn');if(b)b.textContent=day?'Daylight':'Dark';
  try{localStorage.setItem('tb_theme',day?'dark':'day')}catch(e){}
}
(function(){try{const t=localStorage.getItem('tb_theme');if(t){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();
window.addEventListener('DOMContentLoaded',function(){
  try{const t=localStorage.getItem('tb_theme');const b=document.getElementById('themeBtn');
    if(b&&t)b.textContent=t==='day'?'Dark':'Daylight';}catch(e){}
});
/* toast for the sample "Submit Game" */
function showToast(msg){
  let t=document.getElementById('tb-toast');
  if(!t){t=document.createElement('div');t.id='tb-toast';t.className='toast oct-12';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window.__toastT);window.__toastT=setTimeout(()=>t.classList.remove('show'),2600);
}
