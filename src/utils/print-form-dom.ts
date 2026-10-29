/* SIM PUSKAPA — dedicated A4 print layout.
   This module only reads the currently rendered detail page.
   It never changes approval, budget, data, or form submissions. */
const PRINT_BUTTON_ATTR = 'data-sim-print-form-button'
const FORM_SELECTOR = '.sim-modern-forms-rf, .sim-modern-forms-payment, .sim-modern-forms-pr'
const LOGO_PATH = '/images/puskapa-print-logo.png'

function norm(s: string | null | undefined): string {
  return (s || '').replace(/\s+/g, ' ').trim()
}

function safe(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function textOf(node: Element | null): string {
  return norm((node as HTMLElement | null)?.innerText || node?.textContent)
}

function findLabel(root: HTMLElement, names: string[]): HTMLElement | null {
  const wanted = names.map((n) => n.toLowerCase())
  const all = root.querySelectorAll('p, span, label, dt, strong')
  for (const node of Array.from(all)) {
    if (wanted.includes(textOf(node).toLowerCase()) && node.children.length < 2) {
      return node as HTMLElement
    }
  }
  return null
}

function findValue(root: HTMLElement, names: string[]): string {
  const label = findLabel(root, names)
  if (!label) return ''
  let current: HTMLElement = label
  for (let depth = 0; depth < 3; depth += 1) {
    const parent = current.parentElement
    if (!parent) break
    const children = Array.from(parent.children)
    const index = children.indexOf(current)
    const following = children.slice(index + 1)
      .map((el) => textOf(el)).filter(Boolean)
      .filter((value) => !/^view\b|^edit\b|^delete\b|^menu$/i.test(value))
    if (following.length && following[0].length <= 350) return following[0]
    current = parent
  }
  return ''
}

function pick(root: HTMLElement, names: string[]): string {
  return findValue(root, names) || '—'
}

function collectWorkflow(root: HTMLElement, name: string) {
  const label = findLabel(root, [name])
  if (!label) return { role: name, person: '—', status: '—', date: '' }
  let parent = label.parentElement
  for (let i = 0; parent && i < 3; i += 1) {
    const lines = (parent.innerText || '').split(/\n+/).map(norm).filter(Boolean)
    const index = lines.findIndex((x) => x.toLowerCase() === name.toLowerCase())
    if (index >= 0 && lines.length >= index + 3) {
      const remainder = lines.slice(index + 1, index + 5)
      const statusIndex = remainder.findIndex((x) =>
        /^(approved|submitted|done process|done check|checked|paid|rejected|pending|notified|verified|completed)$/i.test(x))
      return {
        role: name,
        person: remainder[0] || '—',
        status: statusIndex >= 0 ? remainder[statusIndex] : '—',
        date: statusIndex >= 0 ? (remainder[statusIndex + 1] || '') : '',
      }
    }
    parent = parent.parentElement
  }
  return { role: name, person: '—', status: '—', date: '' }
}

function formNumber(root: HTMLElement): string {
  const labels = [
    'Finance Request Code', 'Payment Request Code', 'Request Number',
    'Requisition Number', 'Advance Payment Statement Number', 'Form Number'
  ]
  const candidates = labels.map((name) => findValue(root, [name]))
  candidates.push(textOf(root))
  for (const value of candidates) {
    const match = value.match(/\b(?:RF-(?:PC|TR|PH|SC)|PR|APR|APS|APF|TE)\/[A-Z0-9-]+\/20\d{2}\/\d{2,8}\b/i)
    if (match) return match[0].replace(/\s/g, '').toUpperCase()
  }
  return ''
}

function formTitle(root: HTMLElement): string {
  const title = textOf(root.querySelector('h1')) || 'Form'
  if (!root.classList.contains('sim-modern-forms-rf')) return title

  const requisitionType = findValue(root, ['Type of Requisition Form'])
  if (!requisitionType || requisitionType === '—') return title

  return `Requisition Form (${requisitionType})`
}

function workflowHtml(root: HTMLElement): string {
  const roles = root.classList.contains('sim-modern-forms-rf')
    ? ['Requested by', 'Project Manager', 'General Manager', 'Action by']
    : ['Requested by', 'Finance Checker', 'Project Manager', 'General Manager', 'Finance Team Process']
  const found = roles.map((name) => collectWorkflow(root, name))
    .filter((row) => row.person !== '—')
  if (!found.length) return '<p class="empty">No approval information is displayed.</p>'
  return '<div class="approval">' + found.map((x) =>
    '<div class="approver"><div class="label">' + safe(x.role) +
    '</div><div class="value">' + safe(x.person) +
    '</div><div class="status">' + safe(x.status) +
    '</div><div class="date">' + safe(x.date) + '</div></div>'
  ).join('') + '</div>'
}

type PrintBudgetTable = { headings: string[]; rows: string[][]; label?: string }

function visibleElement(element: Element): boolean {
  const node = element as HTMLElement
  return node.getClientRects().length > 0 && window.getComputedStyle(node).visibility !== 'hidden'
}

function printableCell(element: Element): string {
  if (element.querySelector('input[type="checkbox"]')) return ''
  return textOf(element)
}

function compactTable(headings: string[], rows: string[][], label?: string): PrintBudgetTable | null {
  const columns = [
    /^(no|code|budget code|item number)$/i,
    /description|budget item/i,
    /^vendor category$/i,
    /^(qty|quantity)$/i,
    /^unit$/i,
    /^(total payment request|total payment|total request|total amount|total cost|total)$/i,
  ]
  let selected = columns.map((pattern) => headings.findIndex((header) => pattern.test(norm(header))))
    .filter((index) => index >= 0)
  if (!selected.some((i) => /^(total payment request|total payment|total request|total amount|total cost|total)$/i.test(headings[i]))) {
    const unitCost = headings.findIndex((h) => /^(unit cost|amount)$/i.test(norm(h)))
    if (unitCost >= 0) selected.push(unitCost)
  }
  selected = selected.filter((value, index) => selected.indexOf(value) === index)
  if (selected.length < 2) {
    selected = headings.map((header, i) => header.trim() ? i : -1).filter((i) => i >= 0).slice(0, 6)
  }
  if (selected.length < 2) return null
  const outputRows = rows.map((cells) => selected.map((index) => cells[index] || '—'))
    .filter((row) => row.some((cell) => cell !== '—' && !!cell.trim()))
  if (!outputRows.length) return null
  return {
    headings: selected.map((index) => headings[index] || 'Item'),
    rows: outputRows,
    label,
  }
}

/* SIM PUSKAPA's RF/PR/APR details use div.table-selection instead of HTML tables.
   Read each rendered column from direct row children; never scroll/copy the dashboard. */
function collectTables(root: HTMLElement): PrintBudgetTable[] {
  const collected: PrintBudgetTable[] = []
  const selections = Array.from(root.querySelectorAll('.table-container .table-selection'))
  for (const selection of selections) {
    if (!visibleElement(selection) || selection.children.length < 2) continue
    const headingRow = selection.children[0]?.firstElementChild
    const rowContainer = selection.children[1]
    if (!headingRow || !rowContainer) continue

    const headings = Array.from(headingRow.children).map(printableCell)
    if (!headings.some((text) => /description|vendor category|qty|total/i.test(text))) continue
    const data = Array.from(rowContainer.children)
      .filter((element) => element.matches('div') && visibleElement(element))
      .map((row) => Array.from(row.children).map(printableCell))
    const sectionHeader = selection.closest('.table-container')?.previousElementSibling
    const sectionCode = textOf(sectionHeader?.querySelector('span') || null)
    const sectionName = textOf(sectionHeader?.querySelector('p') || null)
    const label = [sectionCode, sectionName].filter(Boolean).join(' — ')
    const group = compactTable(headings, data, label || undefined)
    if (group) collected.push(group)
  }

  // Fallback for form types that render native table markup.
  for (const table of Array.from(root.querySelectorAll('table'))) {
    if (!visibleElement(table) || table.closest('.table-selection')) continue
    const headings = Array.from(table.querySelectorAll('thead th')).map(printableCell)
    if (!headings.some((text) => /description|vendor category|qty|total/i.test(text))) continue
    const rows = Array.from(table.querySelectorAll('tbody tr'))
      .filter(visibleElement)
      .map((row) => Array.from(row.querySelectorAll('td')).map(printableCell))
    const group = compactTable(headings, rows)
    if (group) collected.push(group)
  }
  return collected
}

function tableHtml(root: HTMLElement): string {
  const tables = collectTables(root)
  if (!tables.length) return '<p class="empty">No budget item table is visible on this form.</p>'
  return tables.map((table, n) =>
    '<div class="table-group">' + (table.label || tables.length > 1 ? '<div class="table-label">' + safe(table.label || 'Budget group ' + (n + 1)) + '</div>' : '') +
    '<table><thead><tr>' + table.headings.map((h) => '<th>' + safe(h) + '</th>').join('') +
    '</tr></thead><tbody>' + table.rows.map((row) =>
      '<tr>' + row.map((v) => '<td>' + safe(v) + '</td>').join('') + '</tr>'
    ).join('') + '</tbody></table></div>'
  ).join('')
}

function fieldHtml(label: string, value: string): string {
  return '<div class="field"><div class="label">' + safe(label) +
    '</div><div class="value">' + safe(value) + '</div></div>'
}

function documentHtml(root: HTMLElement): string {
  const mapping: Array<[string, string]> = [
    ['Additional Attachment', 'Additional Attachment'],
    ['Finance Process Attachment', 'Finance Process Attachment'],
    ['Vendor Information', 'Vendor Information'],
    ['Bank Information', 'Bank Information'],
    ['Requester Bank Information', 'Requester Bank Information'],
  ]
  const nodes = Array.from(root.querySelectorAll('button, a'))
  const used = new Set<string>()
  const docs = mapping.filter(([title, query]) => {
    if (used.has(title)) return false
    const exists = nodes.some((n) => new RegExp('view\\s+' + query, 'i').test(textOf(n)))
    if (exists) used.add(title)
    return exists
  })
  if (!docs.length) return '<p class="empty">No supporting document links are displayed.</p>'
  return '<div class="docs">' + docs.map(([title]) =>
    '<div class="doc"><span>' + safe(title) + '</span><b>Attached</b></div>'
  ).join('') + '</div><p class="small-note">Attachments are referenced only and are not embedded in this PDF.</p>'
}

function buildDocument(root: HTMLElement, number: string, title: string): string {
  const isRF = root.classList.contains('sim-modern-forms-rf')
  const logo = window.location.origin + LOGO_PATH
  const code = safe(number)
  const sections = [
    fieldHtml('Project', pick(root, ['Project'])),
    fieldHtml('Partner', pick(root, ['Partner'])),
    fieldHtml('Activity Name', pick(root, ['Activity Name', 'Activity'])),
    fieldHtml('Payment / Request Date', pick(root, ['Payment Date', 'Request Date', 'Advance Payment Date'])),
    fieldHtml(isRF ? 'Requisition Number' : 'Finance Number', number),
    fieldHtml('Vendor Type', pick(root, ['Vendor Type'])),
    fieldHtml('Vendor Category', pick(root, ['Vendor Category'])),
    fieldHtml('Vendor', pick(root, ['Vendor'])),
  ].join('')
  const transfer = findValue(root, ['Transfer Amount'])
  const total = findValue(root, ['Total Payment Requested', 'Total Request', 'Total Amount'])
  const tax = findValue(root, ['Pajak', 'Tax'])
  const amounts = (isRF
    ? [{ label: 'Total Request', value: total || transfer || '—', main: true }]
    : [
        { label: 'Transfer Amount', value: transfer || '—', main: true },
        { label: 'Total', value: total || '—', main: false },
        { label: 'Tax', value: tax || '—', main: false },
      ]).map((item) =>
    '<div class="amount"><div class="label">' + safe(item.label) +
    '</div><div class="' + (item.main ? 'big-value' : 'small-value') + '">' +
    safe(item.value) + '</div></div>'
  ).join('')
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${code.replace(/\//g, '-')}</title>
<style>
@page { size: A4 portrait; margin: 11mm 13mm; }
:root{ color-scheme:light }
* { box-sizing: border-box }
html,body{ margin:0; padding:0; background:#fff; color:#213149;
font-family:Arial, Helvetica, sans-serif; font-size:10px; line-height:1.45 }
body{ -webkit-print-color-adjust:exact; print-color-adjust:exact }
.header{ display:flex; align-items:flex-start; justify-content:space-between; gap:15px;
border-bottom:1.5px solid #edf0f5; padding-bottom:12px; margin-bottom:15px }
.brand-logo{ max-width:200px; width:auto; height:49px; object-fit:contain; object-position:left center }
.eyebrow{ color:#788599; letter-spacing:1.3px; font-size:8px; text-transform:uppercase; text-align:right }
.document-no{ font-weight:750; color:#263954; margin-top:6px; font-size:11px; text-align:right }
.main-title{ margin:0 0 3px; font-size:21px; font-weight:800; line-height:1.2; color:#1a2d48 }
.subtitle{ margin:0; color:#8390a0; font-size:9px }
.main-heading{ margin-bottom:14px; padding:12px 15px; border:1px solid #f2e0d1;
background:#fff8f2; border-radius:8px }
.section{ margin-top:13px; break-inside:avoid-page }
.budget-section{ break-inside:auto }
.section h2{ font-size:10px; font-weight:800; letter-spacing:.7px; color:#c5670e;
text-transform:uppercase; margin:0 0 9px }
.info-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px 18px }
.field{ min-width:0; padding-bottom:8px; border-bottom:1px solid #eff1f4 }
.label{ color:#7b8aa0; font-size:8.3px; font-weight:700; margin-bottom:3px }
.value{ color:#1e2f49; font-size:10.2px; font-weight:700; overflow-wrap:anywhere; white-space:normal }
.amounts{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border:1px solid #e3e9f0;
border-radius:8px; overflow:hidden; background:#fff }
.amount{ padding:12px 12px }
.amount + .amount{ border-left:1px solid #e3e9f0 }
.big-value{ font-size:17px; font-weight:800; color:#162b47; white-space:normal }
.small-value{ font-size:11.5px; font-weight:700; color:#3f5069; white-space:normal }
.approval{ display:grid; grid-template-columns:repeat(auto-fit,minmax(115px,1fr)); gap:8px }
.approver{ background:#f8fafc; padding:9px; border:1px solid #e9eef4;
border-radius:8px; min-width:0; overflow-wrap:anywhere }
.approver .value{ font-size:9.4px; margin:4px 0 }
.status{ color:#518c24; font-size:9px; font-weight:700 }
.date{ margin-top:3px; color:#8490a0; font-size:8px }
.table-group{ margin:0 0 8px }
.table-label{ color:#66758c; font-weight:700; margin:0 0 6px }
table{ width:100%; border-collapse:collapse; table-layout:fixed; font-size:8.7px }
th{ background:#f4f6f9; color:#69798e; font-size:8px; font-weight:700; text-align:left }
th,td{ border-bottom:1px solid #e9edf2; padding:7px 5px; vertical-align:top;
overflow-wrap:anywhere }
td{ color:#34445b }
thead{ display:table-header-group }
tr{ break-inside:avoid }
.bottom{ display:grid; grid-template-columns:minmax(0,1fr) 130px;
gap:16px; margin-top:14px; align-items:end; break-inside:avoid-page }
.bottom .section{ margin-top:0 }
.docs{ border:1px solid #e7ebf2; border-radius:7px; padding:2px 11px }
.doc{ display:flex; align-items:center; justify-content:space-between; gap:12px;
padding:6px 0; border-bottom:1px solid #edf0f4 }
.doc:last-child{ border-bottom:none }
.doc b{ color:#d36c0a }
.initial{ border:1px solid #d6dde8; border-radius:7px; overflow:hidden; align-self:end }
.initial-header{ background:#fff5e9; color:#c4660b; font-size:10px; font-weight:800;
border-bottom:1px solid #d6dde8; padding:7px 9px }
.initial-body{ height:60px; padding:6px; color:#78879a; font-size:8px }
.small-note{ color:#7e8999; font-size:8.2px; line-height:1.4; margin:7px 0 0 }
.footer{ border-top:1px solid #eef0f4; padding-top:7px; margin-top:12px;
font-size:8px; color:#8994a2; display:flex; justify-content:space-between }
.empty{ color:#7b8ba0; font-style:italic }
@media screen { body{ max-width:794px; margin:16px auto; padding:12px 18px;
box-shadow:0 7px 34px #d6dae0 } }
</style>
</head><body>
<header class="header"><img class="brand-logo" src="${safe(logo)}" alt="Universitas Indonesia and PUSKAPA logo">
<div><div class="eyebrow">SIM PUSKAPA / FORM DOCUMENT</div>
<div class="document-no">${code}</div></div></header>
<div class="main-heading"><h1 class="main-title">${safe(title)}</h1>
<p class="subtitle">Official form summary · Supporting documents are referenced separately</p></div>
<section class="section"><h2>Request Information</h2><div class="info-grid">${sections}</div></section>
<section class="section"><h2>Amount Summary</h2><div class="amounts">${amounts}</div></section>
<section class="section"><h2>Approval &amp; Process</h2>${workflowHtml(root)}</section>
<section class="section budget-section"><h2>Budget Items</h2>${tableHtml(root)}</section>
<div class="bottom"><section class="section"><h2>Supporting Documents</h2>${documentHtml(root)}</section>
<div class="initial"><div class="initial-header">Initial / Reviewed by</div>
<div class="initial-body">Name / initials: __________________</div></div></div>
<div class="footer"><span>Print Doc</span><span>${code}</span></div>
</body></html>`
}

export function printCurrentForm() {
  if (typeof document === 'undefined') return
  const root = document.querySelector(FORM_SELECTOR) as HTMLElement | null
  if (!root) return
  const number = formNumber(root)
  if (!number) {
    window.alert('Cannot print: the form number was not found. Please open the form detail page.')
    return
  }
  if (root.querySelector('.table-container') && collectTables(root).length === 0) {
    window.alert('Budget item rows are not ready to print. Please refresh the form and try again.')
    return
  }
  const title = formTitle(root)
  const popup = window.open('', '_blank')
  if (!popup) {
    window.alert('The print window was blocked. Allow popups and try again.')
    return
  }
  try {
    popup.document.open()
    popup.document.write(buildDocument(root, number, title))
    popup.document.close()
    popup.opener = null
  } catch (error) {
    console.error('Failed to build A4 print document:', error)
    popup.close()
    window.alert('Unable to generate the A4 print layout.')
    return
  }
  let invoked = false
  const doPrint = () => {
    if (invoked || popup.closed) return
    invoked = true
    popup.focus()
    popup.print()
  }
  const whenReady = async () => {
    const images = Array.from(popup.document.images)
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    }))
    if (popup.document.fonts?.ready) await popup.document.fonts.ready
    doPrint()
  }
  void whenReady()
}

function getRoot() {
  return document.querySelector(FORM_SELECTOR) as HTMLElement | null
}

function finished(root: HTMLElement): boolean {
  const text = norm(root.innerText).toLowerCase()
  if (root.classList.contains('sim-modern-forms-rf')) {
    return /\bapproved\b/.test(text) && !/\bpending approval\b/.test(text)
  }
  return /\bdone process\b|\bdone all process\b/.test(text)
}

function attachButton() {
  const root = getRoot()
  if (!root) return
  const log = Array.from(root.querySelectorAll('button, a'))
    .find((x) => /view log activity/i.test(textOf(x))) as HTMLElement | undefined
  if (!log) return
  const parent = log.parentElement
  if (!parent) return
  let btn = root.querySelector('[' + PRINT_BUTTON_ATTR + ']') as HTMLButtonElement | null
  if (!btn) {
    btn = document.createElement('button')
    btn.type = 'button'
    btn.setAttribute(PRINT_BUTTON_ATTR, 'true')
    btn.textContent = 'Print Form'
    btn.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border:1px solid #f47712;background:#f47712;color:white;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer'
    btn.addEventListener('click', (event) => {
      event.preventDefault()
      printCurrentForm()
    })
    parent.insertBefore(btn, log)
  }
  const visible = finished(root)
  if (btn.hidden === visible) btn.hidden = !visible
}

function initialize() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  let scheduled = false
  const update = () => {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(() => {
      scheduled = false
      attachButton()
    })
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update, { once: true })
  } else {
    update()
  }
  const observer = new MutationObserver(update)
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
}

initialize()
