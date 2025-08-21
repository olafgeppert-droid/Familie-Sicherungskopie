
/* Family-Ring v71 — Print fix + version label (no other behavior changed)
   - Opens print dialog (if not present, injects it)
   - On confirm: builds a print DOM with header (wappen.jpeg left/right), selected content (table OR tree), and footer (date)
   - Creates PDF via html2pdf; on iOS tries Web Share with PDF file, else opens PDF in new tab or triggers download
   - Sets statusline text to 'Family-Ring v71'
   - Exposes openPrintDialog() globally so existing UI wiring keeps working
*/

(function(){
  'use strict';

  const VERSION = 'Family-Ring v71';

  function setVersionBadge(){
    const el = document.getElementById('statusline');
    if (el) el.textContent = VERSION;
  }

  function isIOS(){
    const ua = navigator.userAgent || '';
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadOS13 = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return iOS || iPadOS13;
  }

  // ensure dialog exists or inject it (unobtrusive)
  function ensurePrintDialog(){
    let dlg = document.getElementById('dlgPrint');
    if (dlg) return dlg;

    dlg = document.createElement('dialog');
    dlg.id = 'dlgPrint';
    dlg.innerHTML = `
      <form method="dialog" style="min-width: 360px; padding: 14px 18px; max-width: 92vw;">
        <h3 style="margin-top:0;">Drucken</h3>
        <p style="margin: 8px 0 12px 0;">Was möchtest du drucken?</p>
        <label style="display:block; margin:6px 0;">
          <input type="radio" name="prnTarget" value="table" checked> Tabelle
        </label>
        <label style="display:block; margin:6px 0;">
          <input type="radio" name="prnTarget" value="tree"> Stammbaum
        </label>
        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px;">
          <button type="reset">Abbrechen</button>
          <button id="dlgPrintOk" value="ok">OK</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    return dlg;
  }

  // Try best-effort to locate table and tree containers
  function findTableElement(){
    const selectors = [
      '#peopleTableWrapper', '#peopleTable', 'table#people', 'table#persons', 'section#tableSection table', 'table.data-table'
    ];
    for (const sel of selectors){
      const el = document.querySelector(sel);
      if (el) return el.tagName.toLowerCase()==='table'? el.closest('div')||el : el;
    }
    // fallback: first table
    return document.querySelector('table');
  }
  function findTreeElement(){
    const selectors = ['#treeContainer', '#treeSvg', 'svg#stammbaum', 'svg.family-tree', '#stammbaum'];
    for (const sel of selectors){
      const el = document.querySelector(sel);
      if (el) return el;
    }
    // fallback: first svg
    return document.querySelector('svg');
  }

  function buildPrintableDOM(which){
    // wrapper
    const wrap = document.createElement('div');
    wrap.style.padding = '12mm';
    wrap.style.fontFamily = 'system-ui, Segoe UI, Roboto, sans-serif';

    // header with wappen.jpeg left and right
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.marginBottom = '8mm';

    const mkWappen = ()=>{
      const img = document.createElement('img');
      img.src = 'wappen.jpeg'; // file provided by user
      img.alt = 'Wappen';
      img.style.width = '22mm';
      img.style.height = '22mm';
      img.style.objectFit = 'contain';
      return img;
    };
    const left = mkWappen();
    const right = mkWappen();
    const title = document.createElement('div');
    title.textContent = 'Wappenringe der Familie GEPPERT';
    title.style.fontSize = '18pt';
    title.style.fontWeight = '700';
    title.style.textAlign = 'center';
    title.style.flex = '1';
    title.style.margin = '0 10mm';

    header.appendChild(left);
    header.appendChild(title);
    header.appendChild(right);
    wrap.appendChild(header);

    // content
    const content = document.createElement('div');
    content.style.minHeight = '120mm';
    if (which === 'table'){
      const src = findTableElement();
      if (!src) throw new Error('Tabellenbereich nicht gefunden');
      content.appendChild(src.cloneNode(true));
    } else {
      const src = findTreeElement();
      if (!src) throw new Error('Stammbaum nicht gefunden');
      content.appendChild(src.cloneNode(true));
    }
    wrap.appendChild(content);

    // footer with date
    const footer = document.createElement('div');
    footer.style.marginTop = '10mm';
    footer.style.textAlign = 'right';
    footer.style.fontSize = '9pt';
    const dt = new Date();
    const pad = n=>String(n).padStart(2,'0');
    const formatted = `${pad(dt.getDate())}.${pad(dt.getMonth()+1)}.${dt.getFullYear()}`;
    footer.textContent = `Stand: ${formatted}`;
    wrap.appendChild(footer);

    return wrap;
  }

  async function toPdfBlob(element){
    if (typeof html2pdf === 'undefined'){
      throw new Error('html2pdf.js nicht geladen');
    }
    const opt = {
      margin:       [10,10,12,10],
      filename:     'Wappenringe.pdf',
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    // Use the promise chain API to get the jsPDF instance
    const worker = html2pdf().set(opt).from(element);
    const pdf = await worker.toPdf().get('pdf');
    const blob = pdf.output('blob');
    return blob;
  }

  async function shareOrOpen(blob){
    try {
      const file = new File([blob], 'Wappenringe.pdf', { type: 'application/pdf' });
      if (isIOS() && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share){
        await navigator.share({ files: [file], title: 'Wappenringe', text: 'PDF-Export' });
        return;
      }
    } catch (e){
      // fallback to open
    }
    // fallback: open blob URL in new tab (user kann drucken/teilen)
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (!w){
      // as last resort, trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Wappenringe.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 5000);
    }
  }

  async function doPrint(which){
    try {
      const printable = buildPrintableDOM(which);
      // Put it offscreen to allow resource load (wappen) before raster
      printable.style.position = 'fixed';
      printable.style.left = '-10000px';
      printable.style.top = '0';
      document.body.appendChild(printable);

      // wait a tick for layout
      await new Promise(r=>setTimeout(r, 50));

      const blob = await toPdfBlob(printable);
      await shareOrOpen(blob);
    } catch (err){
      console.error('Drucken fehlgeschlagen:', err);
      alert('Drucken fehlgeschlagen: ' + (err && err.message ? err.message : err));
    } finally {
      // cleanup temp DOM
      const tmp = document.querySelectorAll('body > div[style*="-10000px"]');
      tmp.forEach(n=>n.remove());
    }
  }

  function openPrintDialog(){
    const dlg = ensurePrintDialog();
    try { dlg.showModal(); } catch(_){ dlg.open = true; }
    const okBtn = dlg.querySelector('#dlgPrintOk');
    const handler = async (ev)=>{
      ev.preventDefault();
      const choice = dlg.querySelector('input[name="prnTarget"]:checked')?.value || 'table';
      try { dlg.close(); } catch(_){ dlg.open = false; }
      await doPrint(choice);
      okBtn.removeEventListener('click', handler);
    };
    okBtn.addEventListener('click', handler);
    // allow ESC or reset to close
    dlg.addEventListener('close', ()=>{
      okBtn.removeEventListener('click', handler);
    }, { once:true });
  }

  // Expose globally (keep existing button wiring)
  window.openPrintDialog = openPrintDialog;

  // Auto-wire a button if present
  document.addEventListener('DOMContentLoaded', ()=>{
    setVersionBadge();
    const btn = document.getElementById('btnPrint');
    if (btn && !btn._v71Bound){
      btn.addEventListener('click', (e)=>{ e.preventDefault(); openPrintDialog(); });
      btn._v71Bound = true;
    }
  });

})();
