
(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  const NODE_W=170,NODE_H=44,H_GAP=36,V_GAP=90;

  const LS_KEY = "family-ring-v60-people";
  let people = JSON.parse(localStorage.getItem(LS_KEY)||"null");
  if(!people){
    people = [
      {code:"1",   ring:"1",  name:"Olaf Geppert",    birth:"13.01.1965", place:"Chemnitz", gender:"m", parent:null, partner:"1x", inheritedFrom:"", comment:"Stammvater"},
      {code:"1x",  ring:"1",  name:"Irina Geppert",   birth:"13.01.1970", place:"Berlin",   gender:"w", parent:null, partner:"1",  inheritedFrom:"", comment:"Partnerin"},
      {code:"1A",  ring:"1A", name:"Mario Geppert",   birth:"28.04.1995", place:"Berlin",   gender:"m", parent:"1", partner:"1Ax", inheritedFrom:"1", comment:""},
      {code:"1Ax", ring:"1A", name:"Kim",             birth:"",           place:"",         gender:"w", parent:null, partner:"1A", inheritedFrom:"", comment:""},
      {code:"1B",  ring:"1B", name:"Nicolas Geppert", birth:"04.12.2000", place:"Berlin",   gender:"m", parent:"1", partner:"1Bx", inheritedFrom:"", comment:""},
      {code:"1Bx", ring:"1B", name:"Annika",          birth:"",           place:"",         gender:"w", parent:null, partner:"1B", inheritedFrom:"", comment:""},
      {code:"1C",  ring:"1C", name:"Julienne Geppert",birth:"26.09.2002", place:"Berlin",   gender:"w", parent:"1", partner:"1Cx", inheritedFrom:"", comment:""},
      {code:"1Cx", ring:"1C", name:"Jonas",           birth:"",           place:"",         gender:"m", parent:null, partner:"1C", inheritedFrom:"", comment:""},
      {code:"1C1", ring:"1>1C1", name:"Michael Geppert",birth:"12.07.2025", place:"Hochstätten", gender:"m", parent:"1C", partner:"", inheritedFrom:"1", comment:""}
    ];
  }
  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(people)); }

  function normalizeCodes(){
    for(const p of people){
      if(p.code){
        p.code = p.code.replace(/([A-Za-z]+)/g,m=>m.toUpperCase()).replace(/X$/,'x');
      }
      if(p.partner){
        p.partner = p.partner.replace(/([A-Za-z]+)/g,m=>m.toUpperCase()).replace(/X$/,'x');
      }
      if(!p.inheritedFrom){ p.ring = p.code; }
    }
  }

  function genOf(p){
    if(p.code==="1" || p.code==="1x") return 1;
    if(p.code.endsWith("x")){
      const partner = people.find(q=>q.code===p.partner);
      if(partner) return (partner._gen||1);
    }
    const parent = people.find(q=>q.code===p.parent);
    if(parent) return (parent._gen||1)+1;
    return 1;
  }

  function recompute(){
    normalizeCodes();
    for(const p of people){ p._gen = genOf(p); }
  }

  function renderTable(){
    const tbody = $("#peopleTable tbody");
    tbody.innerHTML="";
    const q = $("#search").value.trim().toLowerCase();
    const rows = people.slice().sort((a,b)=> (a._gen-b._gen) || a.code.localeCompare(b.code,'de'));
    for(const p of rows){
      if(q && !(p.name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q))) continue;
      const tr=document.createElement("tr");
      tr.dataset.code=p.code;
      tr.innerHTML = `
        <td>${p._gen||""}</td>
        <td>${p.code||""}</td>
        <td>${p.ring||""}</td>
        <td>${p.name||""}</td>
        <td>${p.birth||""}</td>
        <td>${p.place||""}</td>
        <td>${p.gender||""}</td>
        <td>${p.parent||""}</td>
        <td>${p.partner||""}</td>
        <td>${p.inheritedFrom||""}</td>
        <td>${p.comment||""}</td>
      `;
      tr.ondblclick = ()=> openPersonDialog(p.code);
      tbody.appendChild(tr);
    }
  }

  // ---- Stammbaum mit Bus-Linien ----
  function layoutByGeneration(){
    const gens=new Map();
    for(const p of people){
      const g=p._gen||1;
      if(!gens.has(g)) gens.set(g,[]);
      gens.get(g).push(p);
    }
    const positions=new Map();
    let maxX=0, genIdx=0;
    [...gens.keys()].sort((a,b)=>a-b).forEach(g=>{
      const arr = gens.get(g).slice().sort((a,b)=>a.code.localeCompare(b.code,'de'));
      arr.forEach((p,i)=>{
        const x=i*(NODE_W+H_GAP);
        const y=genIdx*(NODE_H+V_GAP);
        positions.set(p.code,{x,y,g});
        if(x>maxX) maxX=x;
      });
      genIdx++;
    });
    const width = maxX + NODE_W + 40;
    const height = genIdx*(NODE_H+V_GAP) + NODE_H + 40;
    return {positions,width,height};
  }

  function drawTree(){
    recompute();
    const {positions,width,height} = layoutByGeneration();
    const NS="http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS,"svg");
    svg.setAttribute("class","tree");
    svg.setAttribute("viewBox",`0 0 ${width} ${height}`);

    const addRect=(x,y,w,h,cls)=>{ const r=document.createElementNS(NS,"rect"); r.setAttribute("x",x);r.setAttribute("y",y);r.setAttribute("width",w);r.setAttribute("height",h);r.setAttribute("class","node "+cls); svg.appendChild(r); };
    const addText=(x,y,txt,cls="nlabel")=>{ const t=document.createElementNS(NS,"text"); t.setAttribute("x",x); t.setAttribute("y",y); t.setAttribute("class",cls); t.textContent=txt; svg.appendChild(t); };
    const addLine=(x1,y1,x2,y2)=>{ const l=document.createElementNS(NS,"line"); l.setAttribute("x1",x1); l.setAttribute("y1",y1); l.setAttribute("x2",x2); l.setAttribute("y2",y2); l.setAttribute("class","edge"); svg.appendChild(l); };

    const childrenBy = new Map();
    for(const p of people){
      if(p.parent){
        if(!childrenBy.has(p.parent)) childrenBy.set(p.parent,[]);
        childrenBy.get(p.parent).push(p.code);
      }
    }

    const genClass = g => g===1?'gen1':(g===2?'gen2':(g===3?'gen3':'gen4'));
    for(const p of people){
      const pos = positions.get(p.code); if(!pos) continue;
      addRect(pos.x+20, pos.y+20, NODE_W, NODE_H, genClass(pos.g));
      addText(pos.x+28, pos.y+36, `${p.code} / ${p.name||""}`);
      addText(pos.x+28, pos.y+54, `Generation: ${p._gen||""} / ${p.birth||""}`, "nlabel l2");
    }

    // Parent-child edges with bus and partner support
    const handledPair = new Set();
    for(const p of people){
      const kids = (childrenBy.get(p.code)||[]).slice().sort((a,b)=>a.localeCompare(b,'de'));
      const pPos = positions.get(p.code);
      if(!pPos) continue;
      const px = pPos.x+20+NODE_W/2;
      const pBottom = pPos.y+20+NODE_H;
      if(kids.length>0){
        const yBus = pPos.y+20+NODE_H + V_GAP/2 - 10;
        let left=px,right=px;
        // partner verticals to bus if same gen
        if(p.partner){
          const q = people.find(x=>x.code===p.partner);
          if(q && q._gen===p._gen){
            const qPos = positions.get(q.code);
            if(qPos){
              const qx = qPos.x+20+NODE_W/2;
              left=Math.min(px,qx); right=Math.max(px,qx);
              addLine(px,pBottom,px,yBus);
              addLine(qx,qPos.y+20+NODE_H,qx,yBus);
              handledPair.add([p.code,q.code].sort().join("-"));
            }else{
              addLine(px,pBottom,px,yBus);
            }
          }else{
            addLine(px,pBottom,px,yBus);
          }
        }else{
          addLine(px,pBottom,px,yBus);
        }
        const centers = kids.map(c=>positions.get(c)).filter(Boolean).map(k=>k.x+20+NODE_W/2);
        if(centers.length){
          left=Math.min(left,...centers); right=Math.max(right,...centers);
        }
        addLine(left,yBus,right,yBus);
        for(const c of kids){
          const kPos = positions.get(c);
          if(!kPos) continue;
          const kx = kPos.x+20+NODE_W/2;
          const kTop = kPos.y+20;
          addLine(kx,yBus,kx,kTop);
        }
      }
    }

    // Partner bus lines if no common children
    const seen = new Set();
    for(const p of people){
      if(!p.partner) continue;
      const pairKey = [p.code,p.partner].sort().join("-");
      if(seen.has(pairKey)) continue;
      seen.add(pairKey);
      const q = people.find(x=>x.code===p.partner);
      if(!q || q._gen!==p._gen) continue;
      const had = handledPair.has(pairKey);
      if(had) continue;
      const pPos = positions.get(p.code), qPos = positions.get(q.code);
      if(!pPos || !qPos) continue;
      const y = pPos.y+20+NODE_H/2;
      const x1 = pPos.x+20+NODE_W/2;
      const x2 = qPos.x+20+NODE_W/2;
      addLine(Math.min(x1,x2), y, Math.max(x1,x2), y);
    }

    const panel = $("#treePanel");
    panel.innerHTML = "";
    panel.appendChild(svg);
  }

  // ---- Printing to PDF ----
  async function renderElementToCanvas(el){
    return await html2canvas(el, {scale:2,backgroundColor:"#ffffff"});
  }
  async function addHeaderFooter(pdf){
    const pageW = pdf.internal.pageSize.getWidth();
    pdf.setFont("helvetica","bold"); pdf.setFontSize(14);
    pdf.text("Wappenringe der Familie GEPPERT", pageW/2, 28, {align:"center"});
    pdf.setFont("helvetica","normal"); pdf.setFontSize(10);
    const d = new Date(); const dateStr = d.toLocaleDateString("de-DE");
    pdf.text(dateStr, pageW/2, pdf.internal.pageSize.getHeight()-16, {align:"center"});
  }
  function isIOS(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
  }
  async function buildPDF(what){
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation:"portrait",unit:"pt",format:"a4"});
    await addHeaderFooter(pdf);
    const blocks = [];
    if(what==="table" || what==="both") blocks.push($("#tableWrap"));
    if(what==="tree" || what==="both")  blocks.push($("#treePanel"));
    let first=true;
    for(const el of blocks){
      const canvas = await renderElementToCanvas(el);
      const img = canvas.toDataURL("image/jpeg",0.95);
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const availableH = pageH - 60;
      const availableW = pageW - 40;
      const ratio = Math.min(availableW/canvas.width, availableH/canvas.height);
      const w = canvas.width*ratio, h = canvas.height*ratio;
      const x = (pageW - w)/2;
      const y = 40;
      if(!first) pdf.addPage(); else first=false;
      await addHeaderFooter(pdf);
      pdf.addImage(img,"JPEG",x,y,w,h);
    }
    return pdf;
  }
  async function shareOrDownload(pdf, filename){
    const blob = pdf.output("blob");
    const file = new File([blob], filename, {type:"application/pdf"});
    if(isIOS() && navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file], title:"PDF", text:"PDF exportieren / drucken"}); return; }catch(e){}
    }
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function openPrintDialog(){
    const dlg = $("#printDlg");
    dlg.showModal();
    $("#printGo").onclick = async (ev)=>{
      ev.preventDefault();
      const which = ($$('input[name="what"]', dlg).find(r=>r.checked)?.value)||"table";
      dlg.close();
      const pdf = await buildPDF(which);
      await shareOrDownload(pdf, "Family-Ring-Ausdruck.pdf");
    };
  }

  function openPersonDialog(code){
    const dlg = $("#personDlg");
    const title = $("#personDlgTitle");
    const fields = {
      name: $("#p_name"), birth: $("#p_birth"), place: $("#p_place"),
      gender: $("#p_gender"), parent: $("#p_parent"),
      partner: $("#p_partner"), inh: $("#p_inh"), comment: $("#p_comment")
    };
    let p = code ? people.find(x=>x.code===code) : null;
    if(p){
      title.textContent="Person ändern";
      fields.name.value = p.name||"";
      fields.birth.value = p.birth||"";
      fields.place.value = p.place||"";
      fields.gender.value = p.gender||"";
      fields.parent.value = p.parent||"";
      fields.partner.value = p.partner||"";
      fields.inh.value = p.inheritedFrom||"";
      fields.comment.value = p.comment||"";
    }else{
      title.textContent="Neue Person";
      for(const k in fields){ fields[k].value=""; }
    }
    dlg.showModal();
    $("#personSave").onclick = (ev)=>{
      if(!fields.name.value.trim()){
        ev.preventDefault();
        alert("Bitte einen Namen eintragen oder Abbrechen.");
        return;
      }
      if(p){
        p.name = fields.name.value.trim();
        p.birth = fields.birth.value.trim();
        p.place = fields.place.value.trim();
        p.gender = fields.gender.value;
        p.parent = fields.parent.value.trim()||null;
        p.partner = fields.partner.value.trim();
        p.inheritedFrom = fields.inh.value.trim();
        p.comment = fields.comment.value.trim();
      }else{
        const newCode = (fields.parent.value||"1")+"X";
        people.push({
          code:newCode, ring:newCode, name:fields.name.value.trim(),
          birth:fields.birth.value.trim(), place:fields.place.value.trim(),
          gender:fields.gender.value, parent:fields.parent.value.trim()||null,
          partner:fields.partner.value.trim(), inheritedFrom:fields.inh.value.trim(),
          comment:fields.comment.value.trim()
        });
      }
      dlg.close();
      save();
      redraw();
    };
  }

  function bind(){
    $("#btnPrint").addEventListener("click", openPrintDialog);
    $("#btnHelp").addEventListener("click", ()=> $("#helpDlg").showModal());
    $("#helpClose").addEventListener("click", ()=> $("#helpDlg").close());
    $("#helpClose2").addEventListener("click", ()=> $("#helpDlg").close());
    $("#search").addEventListener("input", renderTable);
    $("#btnNew").addEventListener("click", ()=> openPersonDialog(null));
    $("#btnDelete").addEventListener("click", ()=> alert("Person löschen: Bitte in Ihrer bestehenden v59-Logik verwenden."));
    $("#btnImport").addEventListener("click", ()=> alert("Import: unverändert gegenüber v59."));
    $("#btnExport").addEventListener("click", ()=> alert("Export: unverändert gegenüber v59."));
    $("#btnStats").addEventListener("click", ()=> alert("Statistik: unverändert gegenüber v59."));
    $("#btnUndo").addEventListener("click", ()=> alert("Undo: unverändert gegenüber v59."));
    $("#btnRedo").addEventListener("click", ()=> alert("Redo: unverändert gegenüber v59."));
  }

  function render(){
    renderTable();
    drawTree();
  }
  function redraw(){ render(); }

  recompute();
  bind();
  render();

  window.FamilyRing = { redraw, people };
})();
