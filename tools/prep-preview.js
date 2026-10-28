// The preview host wraps the entry page in its own document skeleton, so strip ours from index.html.
const fs=require('fs');const f=process.argv[2]+'/index.html';let s=fs.readFileSync(f,'utf8');
s=s.replace(/^<!doctype html>\n<html lang="[a-z]+"><head><meta charset="utf-8"><meta name="viewport"[^>]*>/,'').replace('</head><body>','').replace(/<\/body><\/html>\n?$/,'');
const short=s.includes('lang="ta" hreflang')||/<title>[^<]*நாழிகை/.test(s)?(/<title>[^<]*நாழிகை/.test(s)?'நாழிகை தமிழ் காலண்டர்':'Naazhigai Tamil Calendar'):'Naazhigai Tamil Calendar';
s=s.replace(/<title>[^<]*<\/title>/,'<title>'+short+'</title>');
fs.writeFileSync(f,s);console.log('prepared',f,s.slice(0,60));
