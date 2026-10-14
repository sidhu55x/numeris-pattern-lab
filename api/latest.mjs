import {fetchLatest} from '../scripts/live-data.mjs';
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Use GET'});
 try{return res.status(200).json(await fetchLatest())}catch(e){return res.status(502).json({error:`Refresh failed: ${e.message}. Existing results have been kept.`})}
}
