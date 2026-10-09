'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { ArrowUpRight, Check, ChevronLeft, Eye, EyeOff, ImagePlus, Layers, Loader2, Monitor, Redo2, RotateCcw, Send, Smartphone, Trash2, Undo2, Upload, X } from 'lucide-react';
import { CONTENT_BLOCKS, CONTENT_LIMIT, type ContentBlockKey } from '@/lib/content/blocks';
import { BLOCK_TITLES, SHIPPED_TEXT, fieldLabel } from '@/lib/content/defaults';
import { BLOCK_KEYS, changedBlocks, type EditorDocument } from '@/lib/content/editor';
import { prepareImage } from '@/lib/media/prepare-image';
import { publishContent } from './editor-actions';
import styles from './editor.module.css';

type Locale = 'he' | 'en';
type Draft = { document: EditorDocument; files: Partial<Record<Locale, File>> };
type Asset = { src: string; label: string };
type Confirmation = { kind: 'remove'; key: ContentBlockKey; field?: string } | { kind: 'discard' } | { kind: 'publish' };

function Tool({ label, children, onClick, disabled, active }: { label: string; children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} className={styles.tool} onClick={onClick} disabled={disabled}>{children}</button>;
}

export default function VisualEditor({ initial, assets, previewPath = '/admin/content/preview', publishAction = publishContent }: {
  initial: EditorDocument; assets: Asset[]; previewPath?: string; publishAction?: typeof publishContent
}) {
  const [baseline, setBaseline] = useState(initial);
  const [history, setHistory] = useState<Draft[]>([{ document: initial, files: {} }]);
  const [cursor, setCursor] = useState(0);
  const draft = history[cursor];
  const [locale, setLocale] = useState<Locale>('he');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [selected, setSelected] = useState<{ key: ContentBlockKey; field?: string }>({ key: 'home.hero', field: 'title' });
  const [preview, setPreview] = useState(false);
  const [ready, setReady] = useState(false);
  const [frameError, setFrameError] = useState(false);
  const [frameVersion, setFrameVersion] = useState(0);
  const [bounds, setBounds] = useState({ width: 800, height: 720 });
  const [library, setLibrary] = useState(false);
  const [search, setSearch] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [preparing, setPreparing] = useState(false);
  const preparation = useRef(false);
  const mounted = useRef(true);
  const busy = pending || preparing;
  const frame = useRef<HTMLIFrameElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const objectUrls = useRef<string[]>([]);
  const changed = changedBlocks(baseline, draft.document);
  const dirty = changed.length > 0 || Object.keys(draft.files).length > 0;
  const frameWidth = device === 'mobile' ? 390 : 1280;
  const scale = Math.min(1, Math.max(0.2, (bounds.width - 32) / frameWidth));
  const frameHeight = Math.max(600, (bounds.height - 32) / scale);
  const values = draft.document[selected.key][locale];
  const hidden = values._hidden === 'true';

  function edit(change: (next: Draft) => void) {
    const next: Draft = { document: structuredClone(draft.document), files: { ...draft.files } };
    change(next);
    const states = [...history.slice(0, cursor + 1), next].slice(-60);
    setHistory(states); setCursor(states.length - 1); setError(''); setMessage('');
  }
  function setField(field: string, value: string) {
    edit(next => {
      next.document[selected.key][locale][field] = value;
      if (!field.startsWith('_')) {
        if (!value.trim()) next.document[selected.key][locale][`_hide.${field}`] = 'true';
        else delete next.document[selected.key][locale][`_hide.${field}`];
      }
    });
  }
  function select(key: ContentBlockKey, field?: string) {
    setSelected({ key, field }); setLibrary(false);
  }

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => setBounds({ width: entries[0].contentRect.width, height: entries[0].contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    const guard = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.('a');
      if (anchor && !anchor.target && !window.confirm('יש שינויים שלא פורסמו. לצאת מהעורך?')) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', guard, true);
    return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', guard, true); };
  }, [dirty]);
  useEffect(() => {
    mounted.current = true;
    const urls = objectUrls.current;
    return () => { mounted.current = false; urls.forEach(url => URL.revokeObjectURL(url)); };
  }, []);
  useEffect(() => {
    const hydrated = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'softec-preview-ready') {
        setFrameError(false); setReady(true);
      }
    };
    window.addEventListener('message', hydrated);
    return () => window.removeEventListener('message', hydrated);
  }, []);
  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmation]);
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setFrameError(true), 20000);
    return () => clearTimeout(timeout);
  }, [ready, frameVersion, locale]);

  // The preview is an authenticated same-origin document, using the real page renderer.
  // Drafts only change this frame's DOM; they never write to the public database.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!ready || !doc) return;
    doc.documentElement.classList.remove('dark');
    let sheet = doc.getElementById('cms-preview-style');
    if (!sheet) { sheet = doc.createElement('style'); sheet.id = 'cms-preview-style'; doc.head.appendChild(sheet); }
    sheet.textContent = `html{scroll-behavior:smooth}body{overflow-x:hidden}.reveal,.typed-char{opacity:1!important;transform:none!important;animation:none!important}nav.fixed{display:none!important}*{caret-color:transparent}[data-cms-field]{scroll-margin-top:120px}body[data-editing=true] [data-cms-field]{cursor:pointer;outline-offset:5px}body[data-editing=true] [data-cms-field]:hover{outline:2px dashed #1683c7}body[data-editing=true] [data-selected=true]{outline:3px solid #1683c7!important;outline-offset:5px}body[data-editing=true] [data-cms-block]{position:relative}body[data-editing=true] [data-hidden=true]{opacity:.32!important;outline:2px dashed #e05252;min-height:24px}body[data-editing=true] [data-hidden=true]:empty:after{content:'${locale === 'he' ? 'הוסר' : 'Removed'}'}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;
    doc.body.dataset.editing = String(!preview);
    doc.querySelectorAll<HTMLElement>('[data-cms-block]').forEach(section => {
      const key = section.dataset.cmsBlock as ContentBlockKey;
      if (!Object.hasOwn(CONTENT_BLOCKS, key)) return;
      const data = draft.document[key][locale];
      section.dataset.hidden = String(data._hidden === 'true');
      section.style.display = preview && data._hidden === 'true' ? 'none' : '';
      section.dataset.selected = String(!selected.field && selected.key === key);
      section.querySelectorAll<HTMLElement>('[data-cms-field]').forEach(node => {
        const field = node.dataset.cmsField!;
        const value = data[field]?.trim() || SHIPPED_TEXT[key][locale][field] || '';
        if (field === 'image') {
          const img = node as HTMLImageElement;
          img.removeAttribute('srcset'); img.src = value; img.alt = data.imageAlt || SHIPPED_TEXT[key][locale].imageAlt;
        } else {
          // Preserve layout classes on the existing paragraph when replacing typed text.
          const textNode = node.querySelector('[data-cms-text],.typed-text') ?? node;
          if (textNode.textContent !== value) textNode.textContent = value;
        }
        const removed = data[`_hide.${field}`] === 'true';
        node.style.display = preview && removed ? 'none' : '';
        node.dataset.hidden = String(removed);
        node.dataset.selected = String(selected.key === key && selected.field === field);
      });
      section.querySelectorAll<HTMLDetailsElement>('[data-cms-pair]').forEach((pair, index) => {
        pair.style.display = preview && data[`_hide.${pair.dataset.cmsPair}`] === 'true' ? 'none' : '';
        pair.open = !preview || index === 0;
      });
    });
    const click = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest('a,form')) { event.preventDefault(); event.stopPropagation(); }
      if (preview) return;
      event.preventDefault(); event.stopPropagation();
      const block = target.closest<HTMLElement>('[data-cms-block]');
      const field = target.closest<HTMLElement>('[data-cms-field]');
      const key = block?.dataset.cmsBlock as ContentBlockKey;
      if (key && Object.hasOwn(CONTENT_BLOCKS, key)) select(key, field?.dataset.cmsField);
    };
    doc.addEventListener('click', click, true);
    return () => doc.removeEventListener('click', click, true);
  }, [draft, locale, preview, ready, selected]);

  useEffect(() => {
    if (!ready) return;
    const block = frame.current?.contentDocument?.querySelector<HTMLElement>(`[data-cms-block="${selected.key}"]`);
    const node = selected.field ? block?.querySelector<HTMLElement>(`[data-cms-field="${selected.field}"]`) : block;
    const win = frame.current?.contentWindow;
    if (node && win) win.scrollTo({ top: node.getBoundingClientRect().top + win.scrollY - 150, behavior: 'smooth' });
    const panel = inspector.current;
    const field = panel?.querySelector(`[data-field="${selected.field}"]`);
    if (panel && field && !panel.contains(document.activeElement)) {
      panel.scrollTop += field.getBoundingClientRect().top - panel.getBoundingClientRect().top - 110;
    }
  }, [selected, ready, device]);

  function loadFrame() {
    const doc = frame.current?.contentDocument;
    if (!doc?.querySelector('[data-cms-block]')) { setFrameError(true); return; }
    setFrameError(false); setReady(doc.documentElement.dataset.cmsReady === 'true');
  }
  async function chooseFile(file?: File) {
    if (!file || preparation.current || pending) return;
    preparation.current = true;
    setPreparing(true); setError(''); setMessage('');
    try {
      const prepared = await prepareImage(file);
      if (!mounted.current) return;
      const url = URL.createObjectURL(prepared); objectUrls.current.push(url);
      edit(next => { next.files[locale] = prepared; next.document['home.hero'][locale].image = url; delete next.document['home.hero'][locale]['_hide.image']; });
      setMessage('התמונה הוכנה להעלאה. השינוי יישמר באתר לאחר פרסום.');
    } catch (cause) {
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'לא ניתן להכין את התמונה.');
    } finally {
      preparation.current = false;
      if (mounted.current) setPreparing(false);
    }
  }
  function publish() {
    if (preparation.current || pending) return;
    setConfirmation(null); setError('');
    startTransition(async () => {
      const fd = new FormData();
      const document = structuredClone(draft.document);
      for (const l of ['he', 'en'] as const) if (draft.files[l]) {
        fd.set(`image.${l}`, draft.files[l]!); document['home.hero'][l].image = '';
      }
      fd.set('document', JSON.stringify(document)); fd.set('baseline', JSON.stringify(baseline));
      try {
        const result = await publishAction(fd);
        if (!result.ok) { setError(result.error); return; }
        setBaseline(result.document); setHistory([{ document: result.document, files: {} }]); setCursor(0);
        setMessage('השינויים פורסמו באתר');
      } catch { setError('לא ניתן לפרסם כרגע. השינויים נשארו בעורך.'); }
    });
  }
  function confirm() {
    if (confirmation?.kind === 'publish') { publish(); return; }
    if (confirmation?.kind === 'discard') {
      setHistory([{ document: baseline, files: {} }]); setCursor(0); setMessage('השינויים בוטלו');
    } else if (confirmation?.kind === 'remove') {
      const { key, field } = confirmation;
      edit(next => { next.document[key][locale][field ? `_hide.${field}` : '_hidden'] = 'true'; });
    }
    setConfirmation(null);
  }

  return <div className={styles.editor} dir="rtl">
    <div className={styles.toolbar}>
      <div className={styles.heading}><Layers size={20} /><div><h1>עורך האתר</h1><span>עמוד הבית</span></div></div>
      <div className={styles.segment} aria-label="שפת התוכן">
        {(['he', 'en'] as const).map(l => <button key={l} aria-pressed={locale === l} disabled={busy} onClick={() => { if (locale !== l) { setLocale(l); setReady(false); setFrameError(false); } }}>{l === 'he' ? 'עברית' : 'English'}</button>)}
      </div>
      <div className={styles.segment} aria-label="גודל תצוגה">
        <Tool label="מחשב" active={device === 'desktop'} onClick={() => setDevice('desktop')}><Monitor size={18} /></Tool>
        <Tool label="נייד" active={device === 'mobile'} onClick={() => setDevice('mobile')}><Smartphone size={18} /></Tool>
      </div>
      <div className={styles.history}>
        <Tool label="ביטול הפעולה האחרונה" disabled={!cursor || busy} onClick={() => setCursor(cursor - 1)}><Undo2 size={18} /></Tool>
        <Tool label="ביצוע מחדש" disabled={cursor >= history.length - 1 || busy} onClick={() => setCursor(cursor + 1)}><Redo2 size={18} /></Tool>
      </div>
      <span className={styles.saveState} data-dirty={dirty} role="status">{preparing ? 'מכין תמונה…' : pending ? 'מפרסם...' : dirty ? 'שינויים שלא פורסמו' : 'הגרסה המפורסמת'}</span>
      <Tool label={preview ? 'חזרה לעריכה' : 'תצוגה לפני פרסום'} active={preview} onClick={() => setPreview(!preview)}><Eye size={18} /></Tool>
      <a className={styles.tool} href={`/${locale}`} target="_blank" rel="noopener noreferrer" aria-label="פתיחת האתר" title="פתיחת האתר"><ArrowUpRight size={18} /></a>
      <button className={styles.publish} onClick={() => setConfirmation({ kind: 'publish' })} disabled={!dirty || busy}>{pending ? <Loader2 className={styles.spin} size={17} /> : <Send size={17} />}פרסום שינויים</button>
    </div>
    {(error || message) && <div className={styles.notice} data-error={Boolean(error)} role={error ? 'alert' : 'status'}>{error || message}<button aria-label="סגירה" onClick={() => { setError(''); setMessage(''); }}><X size={16} /></button></div>}
    <div className={styles.workspace}>
      <aside className={styles.inspector} ref={inspector} aria-label="עריכת תוכן" hidden={preview}>
        <div className={styles.sectionPicker}><label htmlFor="section">מקטע בעמוד</label><select id="section" value={selected.key} onChange={e => select(e.target.value as ContentBlockKey)}>{BLOCK_KEYS.map(key => <option key={key} value={key}>{BLOCK_TITLES[key]}{draft.document[key][locale]._hidden === 'true' ? ' (הוסר)' : ''}</option>)}</select></div>
        <div className={styles.sectionHeading}><h2>{BLOCK_TITLES[selected.key]}</h2><Tool label={hidden ? 'שחזור המקטע' : 'הסרת המקטע'} disabled={busy} onClick={() => hidden ? setField('_hidden', '') : setConfirmation({ kind: 'remove', key: selected.key })}>{hidden ? <EyeOff size={18} /> : <Eye size={18} />}</Tool></div>
        {hidden && <p className={styles.removed}>המקטע הוסר מהתצוגה בשפה זו</p>}
        <fieldset disabled={busy} className={styles.fields}>
          {CONTENT_BLOCKS[selected.key].map(field => {
            const removed = values[`_hide.${field}`] === 'true';
            const value = removed && values[field] === '' && field !== 'image' ? '' : values[field] || SHIPPED_TEXT[selected.key][locale][field];
            return <div key={field} data-field={field} className={styles.field} data-selected={selected.field === field} data-removed={removed}>
              <div className={styles.fieldHeading}><label htmlFor={`edit-${field}`}>{fieldLabel(field)}</label>
                <Tool label={`שחזור מקור: ${fieldLabel(field)}`} onClick={() => edit(next => { next.document[selected.key][locale][field] = ''; delete next.document[selected.key][locale][`_hide.${field}`]; if (field === 'image') delete next.files[locale]; })}><RotateCcw size={14} /></Tool>
                <Tool label={`${removed ? 'החזרת' : 'הסרת'} ${fieldLabel(field)}`} onClick={() => removed ? setField(`_hide.${field}`, '') : setConfirmation({ kind: 'remove', key: selected.key, field })}>{removed ? <Eye size={14} /> : <Trash2 size={14} />}</Tool>
              </div>
              {field === 'image' ? <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt={values.imageAlt || SHIPPED_TEXT[selected.key][locale].imageAlt} className={styles.image} />
                <p>JPG, PNG או WebP עד 6MB. הקטנה ודחיסה אוטומטיות תוך שמירה על היחס והשקיפות.</p>
                <div className={styles.imageActions}><label className={styles.secondary}><Upload size={15} />העלאה<input id="edit-image" aria-label="העלאת תמונה" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { chooseFile(e.target.files?.[0]); e.target.value = ''; }} /></label><button type="button" className={styles.secondary} onClick={() => setLibrary(!library)}><ImagePlus size={15} />ספריית תמונות</button></div>
                {library && <div className={styles.library}><input aria-label="חיפוש תמונה" placeholder="חיפוש לפי דגם" value={search} onChange={e => setSearch(e.target.value)} /><div className={styles.assets}>{assets.filter(asset => asset.label.toLowerCase().includes(search.toLowerCase())).map(asset => <button key={asset.src} title={asset.label} type="button" onClick={() => { edit(next => { next.document['home.hero'][locale].image = asset.src; delete next.document['home.hero'][locale]['_hide.image']; delete next.files[locale]; }); setLibrary(false); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.src} alt={asset.label} loading="lazy" /><span>{asset.label}</span>
                </button>)}</div></div>}
              </> : <textarea id={`edit-${field}`} dir={locale === 'he' ? 'rtl' : 'ltr'} value={value} rows={field === 'body' || /^a\d|b$/.test(field) ? 4 : 2} maxLength={CONTENT_LIMIT} onFocus={() => setSelected({ key: selected.key, field })} onChange={e => setField(field, e.target.value)} />}
              {removed && <span className={styles.removed}>הוסר מהאתר</span>}
            </div>;
          })}
        </fieldset>
        <div className={styles.inspectorFooter}><a href="/admin/products" target="_blank" rel="noopener noreferrer">תמונות ופרטי מוצרים<ChevronLeft size={16} /></a><button disabled={!dirty || busy} onClick={() => setConfirmation({ kind: 'discard' })}><RotateCcw size={15} />ביטול כל השינויים</button></div>
      </aside>
      <div className={styles.previewArea}>
        <div className={styles.previewBar}><span><span className={styles.liveDot} />{preview ? 'תצוגה לפני פרסום' : 'תצוגת עריכה'}</span><span dir="ltr">{device === 'mobile' ? '390' : '1280'}px · {Math.round(scale * 100)}%</span></div>
        <div className={styles.canvas} ref={canvas}>
          {!ready && <div className={styles.loading} role="status">{frameError ? <><p>התצוגה לא נטענה. ייתכן שהחיבור לחשבון פג.</p><button className={styles.secondary} onClick={() => { setFrameVersion(v => v + 1); setFrameError(false); }}>ניסיון נוסף</button><a href="/admin/login" target="_blank" rel="noopener noreferrer">כניסה לחשבון</a></> : <><Loader2 className={styles.spin} size={24} />טוען את האתר...</>}</div>}
          <div className={styles.frameSize} style={{ width: frameWidth * scale, height: frameHeight * scale, visibility: ready ? 'visible' : 'hidden' }}>
            <iframe key={`${locale}-${frameVersion}`} ref={frame} title={`תצוגת עמוד הבית - ${locale}`} src={`${previewPath}?locale=${locale}`} onLoad={loadFrame} style={{ width: frameWidth, height: frameHeight, transform: `scale(${scale})` }} />
          </div>
        </div>
      </div>
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="editor-confirm-title" onCancel={() => setConfirmation(null)} onClick={e => { if (e.target === dialog.current) setConfirmation(null); }}>
      <div className={styles.dialogHeading}><h2 id="editor-confirm-title">{confirmation?.kind === 'publish' ? 'לפרסם את השינויים?' : confirmation?.kind === 'discard' ? 'לבטל את כל השינויים?' : `להסיר ${confirmation?.kind === 'remove' && confirmation.field ? fieldLabel(confirmation.field) : 'את המקטע'}?`}</h2><Tool label="סגירה" onClick={() => setConfirmation(null)}><X size={18} /></Tool></div>
      <p>{confirmation?.kind === 'publish' ? 'העדכון יופיע באתר החי לאחר הפרסום.' : confirmation?.kind === 'discard' ? 'העורך יחזור לגרסה המפורסמת.' : `הפריט לא יוצג באתר ${locale === 'he' ? 'בעברית' : 'באנגלית'} לאחר הפרסום. המקור נשמר וניתן לשחזור.`}</p>
      {confirmation?.kind === 'publish' && <ul className={styles.changes}>{changed.map(key => <li key={key}><Check size={16} />{BLOCK_TITLES[key]}</li>)}</ul>}
      <div className={styles.dialogActions}><button className={styles.secondary} autoFocus onClick={() => setConfirmation(null)}>ביטול</button><button className={styles.publish} onClick={confirm}>{confirmation?.kind === 'publish' ? 'פרסום באתר' : confirmation?.kind === 'discard' ? 'ביטול השינויים' : 'הסרה מהתצוגה'}</button></div>
    </dialog>
  </div>;
}
