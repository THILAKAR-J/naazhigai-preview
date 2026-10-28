const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(process.argv[2]);const port=+process.argv[3]||8080;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);let p=path.join(root,u);if(u.endsWith('/'))p=path.join(p,'index.html');
 if(!fs.existsSync(p)){r.writeHead(404,{'content-type':'text/html'});return r.end(fs.readFileSync(path.join(root,'404.html')));}
 r.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r);}).listen(port,()=>console.log('serving',root,port));
