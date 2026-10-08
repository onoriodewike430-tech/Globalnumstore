const express = require('express');
const crypto = require('crypto');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'GlobalNumDemo123!';
const sessions = new Set();

app.post('/api/admin/login', (req,res)=>{
  const {username,password} = req.body || {};
  if(username !== ADMIN_USER || password !== ADMIN_PASSWORD) return res.status(401).json({ok:false,message:'Invalid username or password'});
  const token = crypto.randomBytes(24).toString('hex');
  sessions.add(token);
  res.json({ok:true,token});
});

app.get('/api/admin/me',(req,res)=>{
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!sessions.has(token)) return res.status(401).json({ok:false});
  res.json({ok:true,username:ADMIN_USER});
});

app.post('/api/admin/logout',(req,res)=>{
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  sessions.delete(token); res.json({ok:true});
});

app.get('/api/admin/health',(req,res)=>res.json({ok:true,mode:'local-demo',providerMode:process.env.PROVIDER_MODE||'mock'}));

// Provider fulfillment foundation.
// Default mode is MOCK so no real number is purchased accidentally.
// For production, replace the adapter with an authorized provider's documented API,
// keep the API key server-side, and only fulfill orders after verified payment.
function providerHeaders(){
  return { 'Content-Type':'application/json', ...(process.env.PROVIDER_API_KEY ? {'Authorization':`Bearer ${process.env.PROVIDER_API_KEY}`} : {}) };
}

async function fulfillWithProvider({countryCode, countryName}){
  const mode=(process.env.PROVIDER_MODE||'mock').toLowerCase();
  if(mode==='mock'){
    const demo = `+${countryCode || '000'}-DEMO-${Math.floor(100000+Math.random()*900000)}`;
    return {ok:true,mode:'mock',number:demo,status:'Demo number only'};
  }
  if(mode!=='http') throw new Error('Unsupported PROVIDER_MODE');
  if(!process.env.PROVIDER_BASE_URL || !process.env.PROVIDER_API_KEY) throw new Error('Provider is not configured');
  const response=await fetch(`${process.env.PROVIDER_BASE_URL.replace(/\/$/,'')}/numbers`,{
    method:'POST',headers:providerHeaders(),body:JSON.stringify({countryCode,countryName})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.message||`Provider returned HTTP ${response.status}`);
  return {ok:true,mode:'http',provider:data};
}

app.post('/api/admin/provider/fulfill', async (req,res)=>{
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/,'');
  if(!sessions.has(token)) return res.status(401).json({ok:false,message:'Admin login required'});
  const {countryCode,countryName}=req.body||{};
  if(!countryCode || !countryName) return res.status(400).json({ok:false,message:'Country is required'});
  try{
    const result=await fulfillWithProvider({countryCode,countryName});
    res.json(result);
  }catch(err){
    res.status(502).json({ok:false,message:err.message});
  }
});
app.get('/',(req,res)=>res.sendFile(path.join(__dirname,'admin-login.html')));

const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`GlobalNum local demo running at http://localhost:${port}`));
